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
            <p className="text-2xl font-bold text-green-700">R$ 0</p>
            <p className="text-xs text-muted-foreground">Valor Aprovado Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-700">0</p>
            <p className="text-xs text-muted-foreground">Aguardando Análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700">0</p>
            <p className="text-xs text-muted-foreground">Vencimento Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-700">0</p>
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
          <Button className="w-full justify-start" variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Pagamentos em Lote
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Pagamentos
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Relatório de Fluxo de Caixa
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Relatório de Pagamentos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};