import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SolicitanteDashboardProps {
  onNewRequest: () => void;
  onViewRequests: () => void;
  userId: string;
}

export const SolicitanteDashboard = ({ onNewRequest, onViewRequests, userId }: SolicitanteDashboardProps) => {
  const [statusCounts, setStatusCounts] = useState({
    aguardando: 0,
    emAnalise: 0,
    aprovada: 0,
    rejeitada: 0
  });

  useEffect(() => {
    const fetchStatusCounts = async () => {
      const { data, error } = await supabase
        .from('solicitacoes_nf')
        .select('status')
        .eq('solicitante_id', userId);

      if (!error && data) {
        const counts = {
          aguardando: data.filter(s => s.status === 'Aguardando aprovação do gestor').length,
          emAnalise: data.filter(s => s.status === 'Em análise financeira').length,
          aprovada: data.filter(s => s.status === 'Aprovada' || s.status === 'Pagamento programado' || s.status === 'Pago').length,
          rejeitada: data.filter(s => s.status === 'Rejeitada pelo gestor' || s.status === 'Rejeitada pelo financeiro').length
        };
        setStatusCounts(counts);
      }
    };

    fetchStatusCounts();

    const channel = supabase
      .channel('solicitante-dashboard-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solicitacoes_nf',
        filter: `solicitante_id=eq.${userId}`
      }, () => {
        console.log('Dashboard Solicitante - solicitação atualizada');
        fetchStatusCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
                <p className="text-2xl font-bold text-yellow-800">{statusCounts.aguardando}</p>
                <p className="text-xs text-yellow-600">Aguardando aprovação</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">{statusCounts.emAnalise}</p>
                <p className="text-xs text-blue-600">Em análise financeira</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">{statusCounts.aprovada}</p>
                <p className="text-xs text-green-600">Aprovadas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-800">{statusCounts.rejeitada}</p>
                <p className="text-xs text-red-600">Rejeitadas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};