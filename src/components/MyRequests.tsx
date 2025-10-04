import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Calendar, DollarSign, Building2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
  "Rejeitada": {
    label: "Rejeitada",
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
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Ver detalhes
                            </Button>
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
      </div>
    </div>
  );
};
