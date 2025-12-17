import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RequestFilters, FilterState } from './RequestFilters';
import { SecureFileLink } from '@/components/ui/secure-file-link';
import { RequestTimeline } from './RequestTimeline';
import { 
  CheckCircle, XCircle, Clock, FileText, Building2, Calendar, 
  DollarSign, Eye, AlertTriangle, CheckCheck, History
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

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
  empresa_id?: string;
}

const statusOptions = [
  { value: 'Aguardando aprovação do gestor', label: 'Aguardando Gestor' },
  { value: 'Em análise financeira', label: 'Em Análise Financeira' },
  { value: 'Aprovada', label: 'Aprovada' },
  { value: 'Pagamento programado', label: 'Pagamento Programado' },
  { value: 'Pago', label: 'Pago' },
  { value: 'Rejeitada pelo gestor', label: 'Rejeitada pelo Gestor' },
  { value: 'Rejeitada pelo financeiro', label: 'Rejeitada pelo Financeiro' },
];

export function RequestManagementEnhanced() {
  const { user } = useAuth();
  const { primaryRole } = useUserRole();
  const { toast } = useToast();
  
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingRequest, setViewingRequest] = useState<Solicitacao | null>(null);
  const [actionRequest, setActionRequest] = useState<Solicitacao | null>(null);
  const [comentario, setComentario] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject'>('approve');
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    sortBy: 'data_vencimento',
    sortOrder: 'asc',
  });

  const fetchSolicitacoes = async () => {
    setLoading(true);
    try {
      let query = supabase.from('solicitacoes_nf').select('*');

      if (primaryRole === 'gestor') {
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
    if (!user) return;
    
    fetchSolicitacoes();

    const channel = supabase
      .channel('solicitacoes-changes-enhanced')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'solicitacoes_nf' },
        () => fetchSolicitacoes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, primaryRole]);

  // Filter and sort solicitacoes
  const filteredSolicitacoes = useMemo(() => {
    let result = [...solicitacoes];

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(s => 
        s.numero_nf.toLowerCase().includes(searchLower) ||
        s.nome_fornecedor.toLowerCase().includes(searchLower) ||
        s.nome_solicitante.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(s => s.status === filters.status);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'data_vencimento':
          comparison = new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
          break;
        case 'valor_total':
          comparison = a.valor_total - b.valor_total;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [solicitacoes, filters]);

  // Get selectable requests (only pending ones based on role)
  const selectableRequests = useMemo(() => {
    return filteredSolicitacoes.filter(s => {
      if (primaryRole === 'gestor') {
        return s.status === 'Aguardando aprovação do gestor';
      }
      if (primaryRole === 'financeiro' || primaryRole === 'admin') {
        return s.status === 'Em análise financeira';
      }
      return false;
    });
  }, [filteredSolicitacoes, primaryRole]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableRequests.map(s => s.id)));
    }
  };

  const handleBatchAction = async () => {
    if (selectedIds.size === 0) return;
    
    setActionLoading(true);
    try {
      const updates = Array.from(selectedIds).map(async (id) => {
        let updateData: Record<string, unknown> = {};
        
        if (batchAction === 'approve') {
          if (primaryRole === 'gestor') {
            updateData = {
              status: 'Em análise financeira',
              comentario_gestor: comentario || 'Aprovado em lote',
              data_aprovacao_gestor: new Date().toISOString(),
            };
          } else {
            updateData = {
              status: 'Aprovada',
              comentario_financeiro: comentario || 'Aprovado em lote',
              data_analise_financeira: new Date().toISOString(),
            };
          }
        } else {
          if (primaryRole === 'gestor') {
            updateData = {
              status: 'Rejeitada pelo gestor',
              comentario_gestor: comentario,
            };
          } else {
            updateData = {
              status: 'Rejeitada pelo financeiro',
              comentario_financeiro: comentario,
            };
          }
        }

        return supabase
          .from('solicitacoes_nf')
          .update(updateData)
          .eq('id', id);
      });

      await Promise.all(updates);
      
      toast({
        title: 'Sucesso',
        description: `${selectedIds.size} solicitações ${batchAction === 'approve' ? 'aprovadas' : 'rejeitadas'} com sucesso!`,
      });
      
      setSelectedIds(new Set());
      setComentario('');
      setBatchDialogOpen(false);
      await fetchSolicitacoes();
    } catch (error) {
      console.error('Erro na ação em lote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar as solicitações.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !comentario.trim()) {
      toast({
        title: 'Atenção',
        description: 'Adicione um comentário para rejeitar.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      let updateData: Record<string, unknown> = {};
      
      if (action === 'approve') {
        if (primaryRole === 'gestor') {
          updateData = {
            status: 'Em análise financeira',
            comentario_gestor: comentario,
            data_aprovacao_gestor: new Date().toISOString(),
          };
        } else {
          updateData = {
            status: 'Aprovada',
            comentario_financeiro: comentario,
            data_analise_financeira: new Date().toISOString(),
          };
        }
      } else {
        if (primaryRole === 'gestor') {
          updateData = {
            status: 'Rejeitada pelo gestor',
            comentario_gestor: comentario,
          };
        } else {
          updateData = {
            status: 'Rejeitada pelo financeiro',
            comentario_financeiro: comentario,
          };
        }
      }

      const { error } = await supabase
        .from('solicitacoes_nf')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Solicitação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso!`,
      });
      
      setActionRequest(null);
      setComentario('');
      await fetchSolicitacoes();
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: typeof Clock; color: string }> = {
      'Aguardando aprovação do gestor': { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      'Em análise financeira': { variant: 'default', icon: Clock, color: 'text-blue-600' },
      'Aprovada': { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      'Pagamento programado': { variant: 'default', icon: Clock, color: 'text-purple-600' },
      'Pago': { variant: 'default', icon: CheckCircle, color: 'text-green-700' },
      'Rejeitada pelo gestor': { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      'Rejeitada pelo financeiro': { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
    };

    const config = statusConfig[status] || statusConfig['Aguardando aprovação do gestor'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getUrgencyIndicator = (dataVencimento: string) => {
    const daysUntilDue = differenceInDays(new Date(dataVencimento), new Date());
    
    if (daysUntilDue < 0) {
      return <Badge variant="destructive" className="text-xs">Vencido</Badge>;
    }
    if (daysUntilDue <= 3) {
      return <Badge variant="destructive" className="text-xs bg-orange-500">Urgente ({daysUntilDue}d)</Badge>;
    }
    if (daysUntilDue <= 7) {
      return <Badge variant="secondary" className="text-xs text-amber-600">Em breve ({daysUntilDue}d)</Badge>;
    }
    return null;
  };

  const canTakeAction = (status: string) => {
    if (primaryRole === 'gestor') {
      return status === 'Aguardando aprovação do gestor';
    }
    if (primaryRole === 'financeiro' || primaryRole === 'admin') {
      return status === 'Em análise financeira' || status === 'Aprovada' || status === 'Pagamento programado';
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Batch Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Gerenciamento de Solicitações</h2>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedIds.size} selecionadas</Badge>
            <Button
              size="sm"
              onClick={() => {
                setBatchAction('approve');
                setBatchDialogOpen(true);
              }}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Aprovar Selecionadas
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setBatchAction('reject');
                setBatchDialogOpen(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar Selecionadas
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <RequestFilters
        filters={filters}
        onFiltersChange={setFilters}
        statusOptions={statusOptions}
        totalCount={solicitacoes.length}
        filteredCount={filteredSolicitacoes.length}
      />

      {/* Select All */}
      {selectableRequests.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectedIds.size === selectableRequests.length && selectableRequests.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Selecionar todas as pendentes ({selectableRequests.length})
          </span>
        </div>
      )}

      {/* Request Cards */}
      <div className="grid gap-4">
        {filteredSolicitacoes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredSolicitacoes.map((solicitacao) => {
            const isSelectable = selectableRequests.some(s => s.id === solicitacao.id);
            const isSelected = selectedIds.has(solicitacao.id);
            
            return (
              <Card 
                key={solicitacao.id} 
                className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader className="bg-muted/50 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {isSelectable && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(solicitacao.id)}
                        />
                      )}
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5" />
                          NF {solicitacao.numero_nf}
                          {getUrgencyIndicator(solicitacao.data_vencimento)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {solicitacao.nome_solicitante}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(solicitacao.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{solicitacao.nome_fornecedor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold text-primary">
                        R$ {Number(solicitacao.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Venc: {format(new Date(solicitacao.data_vencimento), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>

                  {/* Comments */}
                  {solicitacao.comentario_gestor && (
                    <div className="p-2 bg-muted rounded text-sm mb-2">
                      <span className="font-medium">Gestor:</span> {solicitacao.comentario_gestor}
                    </div>
                  )}
                  {solicitacao.comentario_financeiro && (
                    <div className="p-2 bg-muted rounded text-sm mb-2">
                      <span className="font-medium">Financeiro:</span> {solicitacao.comentario_financeiro}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingRequest(solicitacao)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    
                    {canTakeAction(solicitacao.status) && (
                      <Button
                        size="sm"
                        onClick={() => setActionRequest(solicitacao)}
                      >
                        Avaliar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Single Action Dialog */}
      <Dialog open={!!actionRequest} onOpenChange={() => { setActionRequest(null); setComentario(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Solicitação</DialogTitle>
            <DialogDescription>
              NF {actionRequest?.numero_nf} - {actionRequest?.nome_fornecedor}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Comentário (obrigatório para rejeição)</Label>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Adicione um comentário..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setActionRequest(null); setComentario(''); }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => actionRequest && handleSingleAction(actionRequest.id, 'reject')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
            <Button
              disabled={actionLoading}
              onClick={() => actionRequest && handleSingleAction(actionRequest.id, 'approve')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Action Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {batchAction === 'approve' ? 'Aprovar' : 'Rejeitar'} {selectedIds.size} Solicitações
            </DialogTitle>
            <DialogDescription>
              Esta ação será aplicada a todas as solicitações selecionadas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {batchAction === 'reject' && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">
                  Comentário obrigatório para rejeição
                </span>
              </div>
            )}
            
            <div>
              <Label>Comentário</Label>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={batchAction === 'approve' ? 'Opcional...' : 'Obrigatório...'}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={batchAction === 'approve' ? 'default' : 'destructive'}
              disabled={actionLoading || (batchAction === 'reject' && !comentario.trim())}
              onClick={handleBatchAction}
            >
              {actionLoading ? 'Processando...' : (
                batchAction === 'approve' ? 'Aprovar Todas' : 'Rejeitar Todas'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              NF {viewingRequest?.numero_nf}
            </DialogTitle>
          </DialogHeader>
          
          {viewingRequest && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">Status:</span>
                {getStatusBadge(viewingRequest.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Solicitante</p>
                  <p className="font-medium">{viewingRequest.nome_solicitante}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{viewingRequest.nome_fornecedor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{viewingRequest.cnpj_fornecedor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-lg text-primary">
                    R$ {Number(viewingRequest.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emissão</p>
                  <p className="font-medium">{format(new Date(viewingRequest.data_emissao), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{format(new Date(viewingRequest.data_vencimento), 'dd/MM/yyyy')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Produto/Serviço</p>
                <p className="font-medium">{viewingRequest.produto_servico}</p>
              </div>

              {viewingRequest.banco && (
                <div className="space-y-2">
                  <h4 className="font-semibold border-b pb-2">Dados Bancários</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Banco</p>
                      <p className="font-medium">{viewingRequest.banco}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Agência</p>
                      <p className="font-medium">{viewingRequest.agencia}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conta</p>
                      <p className="font-medium">{viewingRequest.conta_corrente}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PIX</p>
                      <p className="font-medium">{viewingRequest.chave_pix}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <SecureFileLink 
                  filePath={viewingRequest.arquivo_nf_url} 
                  label="Ver NF" 
                />
                <SecureFileLink 
                  filePath={viewingRequest.arquivo_boleto_url} 
                  label="Ver Boleto" 
                />
              </div>

              {/* Histórico / Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold border-b pb-2 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Status
                </h4>
                <RequestTimeline solicitacaoId={viewingRequest.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
