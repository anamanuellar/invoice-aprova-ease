import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, FileText, Building2, Calendar, DollarSign } from 'lucide-react';
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
}

export const RequestManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSolicitacoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes_nf')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { error } = await supabase
        .from('solicitacoes_nf')
        .update({
          status: 'Em análise financeira',
          comentario_gestor: comentario,
          data_aprovacao_gestor: new Date().toISOString(),
        })
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
      const { error } = await supabase
        .from('solicitacoes_nf')
        .update({
          status: 'Rejeitada',
          comentario_gestor: comentario,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Solicitação rejeitada.',
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
      'Rejeitada': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
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

                {solicitacao.status === 'Aguardando aprovação do gestor' && (
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};