import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SolicitanteDashboardProps {
  onNewRequest: () => void;
  onViewRequests: () => void;
}

export const SolicitanteDashboard = ({ onNewRequest, onViewRequests }: SolicitanteDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nova Solicitação */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onNewRequest}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Criar uma nova solicitação de pagamento de nota fiscal
            </p>
          </CardContent>
        </Card>

        {/* Minhas Solicitações */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewRequests}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Minhas Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Visualizar e acompanhar suas solicitações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status das Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Solicitações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Aguardando</p>
                <p className="text-xs text-yellow-600">Aprovação do gestor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Em Análise</p>
                <p className="text-xs text-blue-600">Financeira</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Aprovada</p>
                <p className="text-xs text-green-600">Pronto para pagamento</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Rejeitada</p>
                <p className="text-xs text-red-600">Verificar comentários</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};