import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, FileText, Building2, Calendar, DollarSign, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Solicitacao {
  id: string;
  numero_nf: string;
  nome_fornecedor: string;
  cnpj_fornecedor: string;
  valor_total: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
  nome_solicitante: string;
  produto_servico: string;
  comentario_gestor?: string;
  comentario_financeiro?: string;
  created_at: string;
  nome_titular_conta?: string;
  banco?: string;
  agencia?: string;
  conta_corrente?: string;
  chave_pix?: string;
  cnpj_cpf_titular?: string;
  justificativa_vencimento_antecipado?: string;
  justificativa_divergencia_titular?: string;
  arquivo_nf_url?: string;
  arquivo_boleto_url?: string;
}

export const RequestManagement = () => {
  const { user } = useAuth();
  const { primaryRole } = useUserRole();
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<Solicitacao | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [comentario, setComentario] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSolicitacoes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('solicitacoes_nf')
        .select('*');

      // Gestores veem apenas solicitações do seu centro de custo
      if (primaryRole === 'gestor') {
        // Buscar o centro de custo do gestor
        const { data: userRoleData } = await supabase
          .from('user_roles')
          .select('empresa_id')
          .eq('user_id', user?.id)
          .eq('role', 'gestor')
          .single();

        if (userRoleData?.empresa_id) {
          query = query.eq('empresa_id', userRoleData.empresa_id);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as solicitações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();

    const channel = supabase
      .channel('solicitacoes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'solicitacoes_nf' },
        () => fetchSolicitacoes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      let updateData: any = {};
      
      if (primaryRole === 'gestor') {
        // Gestor aprova e envia para análise financeira
        updateData = {
          status: 'Em análise financeira',
          comentario_gestor: comentario,
          data_aprovacao_gestor: new Date().toISOString(),
        };
      } else if (primaryRole === 'financeiro' || primaryRole === 'admin') {
        // Financeiro aprova e marca como aprovada
        updateData = {
          status: 'Aprovada',
          comentario_financeiro: comentario,
          data_analise_financeira: new Date().toISOString(),
        };
      }

      const { error } = await supabase
        .from('solicitacoes_nf')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Solicitação aprovada com sucesso!',
      });
      setSelectedRequest(null);
      setComentario('');
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedulePayment = async (id: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('solicitacoes_nf')
        .update({
          status: 'Pagamento programado',
          comentario_financeiro: comentario || 'Pagamento agendado',
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Pagamento programado com sucesso!',
      });
      setSelectedRequest(null);
      setComentario('');
    } catch (error) {
      console.error('Erro ao programar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível programar o pagamento.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('solicitacoes_nf')
        .update({
          status: 'Pago',
          comentario_financeiro: comentario || 'Pagamento realizado',
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Pagamento registrado com sucesso!',
      });
      setSelectedRequest(null);
      setComentario('');
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!comentario.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, adicione um comentário explicando a rejeição.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      // Determinar o campo de comentário correto baseado no role
      const updateData: any = {
        status: 'Rejeitada pelo gestor',
      };

      if (primaryRole === 'gestor') {
        updateData.comentario_gestor = comentario;
      } else if (primaryRole === 'financeiro' || primaryRole === 'admin') {
        updateData.comentario_financeiro = comentario;
        updateData.status = 'Rejeitada pelo financeiro';
      }

      const { error } = await supabase
        .from('solicitacoes_nf')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Solicitação rejeitada e devolvida ao solicitante.',
      });
      setSelectedRequest(null);
      setComentario('');
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Aguardando aprovação do gestor': { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      'Em análise financeira': { variant: 'default' as const, icon: Clock, color: 'text-blue-600' },
      'Aprovada': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'Pagamento programado': { variant: 'default' as const, icon: Clock, color: 'text-purple-600' },
      'Pago': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-700' },
      'Rejeitada pelo gestor': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      'Rejeitada pelo financeiro': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Aguardando aprovação do gestor'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando solicitações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciamento de Solicitações</h2>
        <Badge variant="outline">{solicitacoes.length} solicitações</Badge>
      </div>

      <div className="grid gap-4">
        {solicitacoes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          solicitacoes.map((solicitacao) => (
            <Card key={solicitacao.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      NF {solicitacao.numero_nf}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Solicitante: {solicitacao.nome_solicitante}
                    </p>
                  </div>
                  {getStatusBadge(solicitacao.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Fornecedor:</span>
                      <span>{solicitacao.nome_fornecedor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">CNPJ:</span>
                      <span>{solicitacao.cnpj_fornecedor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Valor:</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {Number(solicitacao.valor_total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Emissão:</span>
                      <span>{format(new Date(solicitacao.data_emissao), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Vencimento:</span>
                      <span>{format(new Date(solicitacao.data_vencimento), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Produto/Serviço:</span>
                      <span>{solicitacao.produto_servico}</span>
                    </div>
                  </div>
                </div>

                {solicitacao.comentario_gestor && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Comentário do Gestor:</p>
                    <p className="text-sm text-muted-foreground">{solicitacao.comentario_gestor}</p>
                  </div>
                )}

                {solicitacao.comentario_financeiro && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Comentário Financeiro:</p>
                    <p className="text-sm text-muted-foreground">{solicitacao.comentario_financeiro}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => setViewingRequest(solicitacao)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes Completos
                  </Button>
                </div>

                {(solicitacao.status === 'Aguardando aprovação do gestor' || 
                  solicitacao.status === 'Em análise financeira') && (
                  <div className="mt-4 space-y-3">
                    {selectedRequest === solicitacao.id && (
                      <div className="space-y-2">
                        <Label htmlFor={`comentario-${solicitacao.id}`}>
                          Comentário (opcional para aprovação, obrigatório para rejeição)
                        </Label>
                        <Textarea
                          id={`comentario-${solicitacao.id}`}
                          placeholder="Adicione um comentário sobre sua decisão..."
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      {selectedRequest !== solicitacao.id ? (
                        <Button
                          onClick={() => setSelectedRequest(solicitacao.id)}
                          variant="outline"
                          className="w-full"
                        >
                          Avaliar Solicitação
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleApprove(solicitacao.id)}
                            disabled={actionLoading}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {actionLoading ? 'Aprovando...' : 'Aprovar'}
                          </Button>
                          <Button
                            onClick={() => handleReject(solicitacao.id)}
                            disabled={actionLoading}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {actionLoading ? 'Rejeitando...' : 'Rejeitar'}
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRequest(null);
                              setComentario('');
                            }}
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações de Pagamento para Financeiro/Admin */}
                {(primaryRole === 'financeiro' || primaryRole === 'admin') && 
                 (solicitacao.status === 'Aprovada' || solicitacao.status === 'Pagamento programado') && (
                  <div className="mt-4 space-y-3">
                    {selectedRequest === solicitacao.id && (
                      <div className="space-y-2">
                        <Label htmlFor={`comentario-pagamento-${solicitacao.id}`}>
                          Comentário (opcional)
                        </Label>
                        <Textarea
                          id={`comentario-pagamento-${solicitacao.id}`}
                          placeholder="Adicione informações sobre o pagamento..."
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                          rows={2}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      {selectedRequest !== solicitacao.id ? (
                        <Button
                          onClick={() => setSelectedRequest(solicitacao.id)}
                          variant="outline"
                          className="w-full"
                        >
                          Gerenciar Pagamento
                        </Button>
                      ) : (
                        <>
                          {solicitacao.status === 'Aprovada' && (
                            <Button
                              onClick={() => handleSchedulePayment(solicitacao.id)}
                              disabled={actionLoading}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              {actionLoading ? 'Agendando...' : 'Agendar Pagamento'}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleMarkAsPaid(solicitacao.id)}
                            disabled={actionLoading}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {actionLoading ? 'Registrando...' : 'Marcar como Pago'}
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRequest(null);
                              setComentario('');
                            }}
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Visualização Completa */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da Solicitação - NF {viewingRequest?.numero_nf}
            </DialogTitle>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">Status:</span>
                {getStatusBadge(viewingRequest.status)}
              </div>

              {/* Informações do Solicitante */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Informações do Solicitante</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <p className="font-medium">{viewingRequest.nome_solicitante}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Data de Envio:</span>
                    <p className="font-medium">{format(new Date(viewingRequest.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>

              {/* Informações do Fornecedor */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Informações do Fornecedor</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <p className="font-medium">{viewingRequest.nome_fornecedor}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">CNPJ:</span>
                    <p className="font-medium">{viewingRequest.cnpj_fornecedor}</p>
                  </div>
                </div>
              </div>

              {/* Informações da Nota Fiscal */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Informações da Nota Fiscal</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Número NF:</span>
                    <p className="font-medium">{viewingRequest.numero_nf}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Produto/Serviço:</span>
                    <p className="font-medium">{viewingRequest.produto_servico}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Data de Emissão:</span>
                    <p className="font-medium">{format(new Date(viewingRequest.data_emissao), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Data de Vencimento:</span>
                    <p className="font-medium">{format(new Date(viewingRequest.data_vencimento), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">Valor Total:</span>
                    <p className="text-2xl font-bold text-primary">R$ {Number(viewingRequest.valor_total).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Informações Bancárias */}
              {viewingRequest.nome_titular_conta && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Informações Bancárias</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Titular:</span>
                      <p className="font-medium">{viewingRequest.nome_titular_conta}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">CPF/CNPJ:</span>
                      <p className="font-medium">{viewingRequest.cnpj_cpf_titular}</p>
                    </div>
                    {viewingRequest.banco && (
                      <div>
                        <span className="text-sm text-muted-foreground">Banco:</span>
                        <p className="font-medium">{viewingRequest.banco}</p>
                      </div>
                    )}
                    {viewingRequest.agencia && (
                      <div>
                        <span className="text-sm text-muted-foreground">Agência:</span>
                        <p className="font-medium">{viewingRequest.agencia}</p>
                      </div>
                    )}
                    {viewingRequest.conta_corrente && (
                      <div>
                        <span className="text-sm text-muted-foreground">Conta:</span>
                        <p className="font-medium">{viewingRequest.conta_corrente}</p>
                      </div>
                    )}
                    {viewingRequest.chave_pix && (
                      <div>
                        <span className="text-sm text-muted-foreground">Chave PIX:</span>
                        <p className="font-medium">{viewingRequest.chave_pix}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Justificativas */}
              {viewingRequest.justificativa_vencimento_antecipado && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Justificativa - Vencimento Antecipado</h3>
                  <p className="text-sm p-3 bg-muted/50 rounded">{viewingRequest.justificativa_vencimento_antecipado}</p>
                </div>
              )}

              {viewingRequest.justificativa_divergencia_titular && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Justificativa - Divergência de Titular</h3>
                  <p className="text-sm p-3 bg-muted/50 rounded">{viewingRequest.justificativa_divergencia_titular}</p>
                </div>
              )}

              {/* Comentários */}
              {viewingRequest.comentario_gestor && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Comentário do Gestor</h3>
                  <p className="text-sm p-3 bg-muted/50 rounded">{viewingRequest.comentario_gestor}</p>
                </div>
              )}

              {viewingRequest.comentario_financeiro && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Comentário do Financeiro</h3>
                  <p className="text-sm p-3 bg-muted/50 rounded">{viewingRequest.comentario_financeiro}</p>
                </div>
              )}

              {/* Arquivos */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Arquivos Anexados</h3>
                <div className="flex gap-2">
                  {viewingRequest.arquivo_nf_url && (
                    <Button variant="outline" asChild>
                      <a href={viewingRequest.arquivo_nf_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Nota Fiscal
                      </a>
                    </Button>
                  )}
                  {viewingRequest.arquivo_boleto_url && (
                    <Button variant="outline" asChild>
                      <a href={viewingRequest.arquivo_boleto_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Boleto
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};