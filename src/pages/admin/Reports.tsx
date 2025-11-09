import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, BarChart3, TrendingUp, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("last30days");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [reportData, setReportData] = useState({
    totalSolicitacoes: 0,
    aprovadas: 0,
    rejeitadas: 0,
    pendentes: 0,
    valorTotal: "R$ 0,00",
    tempoMedioAprovacao: "0 dias"
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  const fetchReportData = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_nf')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular estatísticas
      const total = data?.length || 0;
      const aprovadas = data?.filter(s => s.status === 'Aprovada').length || 0;
      const rejeitadas = data?.filter(s => 
        s.status === 'Rejeitada pelo gestor' || s.status === 'Rejeitada pelo financeiro'
      ).length || 0;
      const pendentes = data?.filter(s => 
        s.status === 'Aguardando aprovação do gestor' || s.status === 'Em análise financeira'
      ).length || 0;
      
      const valorTotal = data?.reduce((acc, s) => acc + Number(s.valor_total || 0), 0) || 0;

      setReportData({
        totalSolicitacoes: total,
        aprovadas,
        rejeitadas,
        pendentes,
        valorTotal: `R$ ${valorTotal.toFixed(2)}`,
        tempoMedioAprovacao: "2.5 dias" // Calcular baseado em datas reais
      });

      // Pegar últimas 10 solicitações
      setRecentRequests(data?.slice(0, 10).map(s => ({
        id: s.numero_nf,
        fornecedor: s.nome_fornecedor,
        valor: `R$ ${Number(s.valor_total).toFixed(2)}`,
        status: s.status,
        data: s.created_at
      })) || []);
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do relatório.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchReportData();

    // Configurar realtime updates
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'solicitacoes_nf' },
        () => fetchReportData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPeriod, selectedCompany]);

  const getStatusColor = (status: string) => {
    if (status === 'Aprovada') return "bg-green-100 text-green-800";
    if (status === 'Pago') return "bg-green-200 text-green-900";
    if (status === 'Pagamento programado') return "bg-purple-100 text-purple-800";
    if (status.includes('Rejeitada')) return "bg-red-100 text-red-800";
    if (status === 'Em análise financeira') return "bg-blue-100 text-blue-800";
    if (status === 'Aguardando aprovação do gestor') return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
              <p className="text-muted-foreground">Acompanhe métricas e performance do sistema</p>
            </div>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="last90days">Últimos 90 dias</SelectItem>
                  <SelectItem value="thisyear">Este ano</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  <SelectItem value="empresa-abc">Empresa ABC</SelectItem>
                  <SelectItem value="empresa-xyz">Empresa XYZ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{reportData.totalSolicitacoes}</div>
                  <p className="text-xs text-muted-foreground">Total Solicitações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{reportData.aprovadas}</div>
                  <p className="text-xs text-muted-foreground">Aprovadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{reportData.rejeitadas}</div>
                  <p className="text-xs text-muted-foreground">Rejeitadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{reportData.pendentes}</div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <div className="text-lg font-bold text-green-600">{reportData.valorTotal}</div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <div className="text-lg font-bold">{reportData.tempoMedioAprovacao}</div>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Requests */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Solicitações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">{request.fornecedor}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{request.valor}</div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Indicadores de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">87%</div>
                <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">2.1</div>
                <p className="text-sm text-muted-foreground">Dias Médio de Processamento</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">95%</div>
                <p className="text-sm text-muted-foreground">Satisfação dos Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}