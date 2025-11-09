import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  BarChart3 
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FinanceiroDashboardProps {
  onViewPendingAnalysis: () => void;
  onViewAllRequests: () => void;
  onViewReports: () => void;
}

export const FinanceiroDashboard = ({ 
  onViewPendingAnalysis, 
  onViewAllRequests, 
  onViewReports 
}: FinanceiroDashboardProps) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    valorAprovadoHoje: 0,
    aguardandoAnalise: 0,
    vencimentoHoje: 0,
    emAtraso: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      const hoje = new Date().toISOString().split('T')[0];

      // Buscar todas as solicitações
      const { data, error } = await supabase
        .from('solicitacoes_nf')
        .select('status, valor_total, data_vencimento, data_aprovacao_gestor');

      if (!error && data) {
        const valorAprovadoHoje = data
          .filter(s => {
            const dataAprovacao = s.data_aprovacao_gestor ? s.data_aprovacao_gestor.split('T')[0] : null;
            return dataAprovacao === hoje && (s.status === 'Aprovada' || s.status === 'Pagamento programado' || s.status === 'Pago');
          })
          .reduce((sum, s) => sum + Number(s.valor_total || 0), 0);

        const aguardandoAnalise = data.filter(s => s.status === 'Em análise financeira').length;
        
        const vencimentoHoje = data.filter(s => s.data_vencimento === hoje && s.status !== 'Pago').length;
        
        const emAtraso = data.filter(s => {
          const vencimento = new Date(s.data_vencimento);
          const agora = new Date();
          return vencimento < agora && s.status !== 'Pago' && s.status !== 'Rejeitada pelo gestor' && s.status !== 'Rejeitada pelo financeiro';
        }).length;

        setMetrics({
          valorAprovadoHoje,
          aguardandoAnalise,
          vencimentoHoje,
          emAtraso
        });
      }
    };

    fetchMetrics();

    const channel = supabase
      .channel('financeiro-dashboard-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solicitacoes_nf'
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Análise Financeira */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200 bg-blue-50" onClick={onViewPendingAnalysis}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5" />
              Análise Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600 text-sm mb-3">
              Solicitações aguardando análise financeira
            </p>
            <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              Ver Pendências
            </Button>
          </CardContent>
        </Card>

        {/* Todas as Solicitações */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewAllRequests}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Todas as Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-3">
              Visualizar todas as solicitações do sistema
            </p>
            <Button variant="outline">
              Ver Todas
            </Button>
          </CardContent>
        </Card>

        {/* Relatórios */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewReports}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-3">
              Relatórios financeiros e estatísticas
            </p>
            <Button variant="outline">
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Financeiras */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700">
              R$ {metrics.valorAprovadoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Valor Aprovado Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-700">{metrics.aguardandoAnalise}</p>
            <p className="text-xs text-muted-foreground">Aguardando Análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{metrics.vencimentoHoje}</p>
            <p className="text-xs text-muted-foreground">Vencimento Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-700">{metrics.emAtraso}</p>
            <p className="text-xs text-muted-foreground">Em Atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Financeiras */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Financeiras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate('/financeiro/approve-batch')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Pagamentos em Lote
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate('/financeiro/schedule-payments')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Pagamentos
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate('/financeiro/cash-flow')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Relatório de Fluxo de Caixa
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => navigate('/financeiro/payments-report')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Relatório de Pagamentos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};