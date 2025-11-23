import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Calendar, DollarSign, Building2, Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Request {
  id: string;
  numero_nf: string;
  nome_fornecedor: string;
  cnpj_fornecedor: string;
  valor_total: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
  data_envio: string;
  empresa_id: string;
  produto_servico: string;
  forma_pagamento: string | null;
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
  comentario_gestor?: string;
  comentario_financeiro?: string;
  created_at: string;
}

interface Company {
  id: string;
  nome: string;
}

interface MyRequestsProps {
  userId: string;
  onBack: () => void;
}

const statusConfig = {
  "Aguardando aprovação do gestor": {
    label: "Aguardando Gestor",
    icon: Clock,
    variant: "secondary" as const,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  "Em análise financeira": {
    label: "Em Análise",
    icon: AlertCircle,
    variant: "default" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  "Aprovada": {
    label: "Aprovada",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  "Pagamento programado": {
    label: "Pagamento Programado",
    icon: Clock,
    variant: "default" as const,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  "Pago": {
    label: "Pago",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  "Rejeitada pelo gestor": {
    label: "Rejeitada pelo Gestor",
    icon: XCircle,
    variant: "destructive" as const,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  "Rejeitada pelo financeiro": {
    label: "Rejeitada pelo Financeiro",
    icon: XCircle,
    variant: "destructive" as const,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};

export const MyRequests = ({ userId, onBack }: MyRequestsProps) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewingRequest, setViewingRequest] = useState<Request | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('my-requests-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'solicitacoes_nf',
          filter: `solicitante_id=eq.${userId}`
        },
        () => {
          console.log('Minha solicitação atualizada - refazendo fetch');
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // Buscar solicitações do usuário
      const { data: requestsData, error: requestsError } = await supabase
        .from("solicitacoes_nf")
        .select("*")
        .eq("solicitante_id", userId)
        .order("data_envio", { ascending: false });

      if (requestsError) throw requestsError;

      // Buscar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from("empresas")
        .select("id, nome");

      if (companiesError) throw companiesError;

      // Criar mapa de empresas
      const companiesMap: Record<string, Company> = {};
      companiesData?.forEach((company) => {
        companiesMap[company.id] = company;
      });

      setRequests(requestsData || []);
      setCompanies(companiesMap);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      toast({
        title: "Erro ao carregar solicitações",
        description: "Não foi possível carregar suas solicitações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta solicitação? Esta ação será registrada no log do sistema.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('solicitacoes_nf')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('Solicitação excluída com sucesso, refazendo fetch');
      await fetchRequests();

      toast({
        title: "Sucesso",
        description: "Solicitação excluída com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a solicitação",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig["Aguardando aprovação do gestor"];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    const config = getStatusConfig(selectedRequest.status);
    const StatusIcon = config.icon;

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button onClick={() => setSelectedRequest(null)} variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Button>
            <h1 className="text-3xl font-bold">Detalhes da Solicitação</h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nota Fiscal: {selectedRequest.numero_nf}</CardTitle>
                <Badge variant={config.variant} className={`${config.bgColor} ${config.color} border-0`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações da Empresa */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações da Empresa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{companies[selectedRequest.empresa_id]?.nome || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Informações do Fornecedor */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Fornecedor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedRequest.nome_fornecedor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{selectedRequest.cnpj_fornecedor}</p>
                  </div>
                </div>
              </div>

              {/* Informações da Nota Fiscal */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Nota Fiscal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número da NF</p>
                    <p className="font-medium">{selectedRequest.numero_nf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produto/Serviço</p>
                    <p className="font-medium">{selectedRequest.produto_servico}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Emissão</p>
                    <p className="font-medium">{formatDate(selectedRequest.data_emissao)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                    <p className="font-medium">{formatDate(selectedRequest.data_vencimento)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium text-lg">{formatCurrency(Number(selectedRequest.valor_total))}</p>
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento */}
              {selectedRequest.forma_pagamento && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Forma de Pagamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Método</p>
                      <p className="font-medium">{selectedRequest.forma_pagamento}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Histórico
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Enviado em:</span>
                    <span className="font-medium">{formatDate(selectedRequest.data_envio)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o status das suas solicitações de pagamento
          </p>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-muted-foreground">
                Você ainda não criou nenhuma solicitação de pagamento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Solicitações ({requests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NF</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => {
                      const config = getStatusConfig(request.status);
                      const StatusIcon = config.icon;

                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.numero_nf}</TableCell>
                          <TableCell>{request.nome_fornecedor}</TableCell>
                          <TableCell>{companies[request.empresa_id]?.nome || "N/A"}</TableCell>
                          <TableCell>{formatCurrency(Number(request.valor_total))}</TableCell>
                          <TableCell>{formatDate(request.data_vencimento)}</TableCell>
                          <TableCell>
                            <Badge variant={config.variant} className={`${config.bgColor} ${config.color} border-0`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingRequest(request)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </Button>
                              {request.status === 'Aguardando aprovação do gestor' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRequest(request.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

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
                  <Badge variant={getStatusConfig(viewingRequest.status).variant}>
                    {getStatusConfig(viewingRequest.status).label}
                  </Badge>
                </div>

                {/* Informações da Empresa */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Informações da Empresa</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Empresa:</span>
                      <p className="font-medium">{companies[viewingRequest.empresa_id]?.nome || "N/A"}</p>
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
                      <p className="font-medium">{formatDate(viewingRequest.data_emissao)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Data de Vencimento:</span>
                      <p className="font-medium">{formatDate(viewingRequest.data_vencimento)}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Valor Total:</span>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(Number(viewingRequest.valor_total))}</p>
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
                      {viewingRequest.cnpj_cpf_titular && (
                        <div>
                          <span className="text-sm text-muted-foreground">CPF/CNPJ:</span>
                          <p className="font-medium">{viewingRequest.cnpj_cpf_titular}</p>
                        </div>
                      )}
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
    </div>
  );
};
