import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface GestorDashboardProps {
  onViewPendingApprovals: () => void;
  onViewAllRequests: () => void;
  userId: string;
}

export const GestorDashboard = ({ onViewPendingApprovals, onViewAllRequests, userId }: GestorDashboardProps) => {
  const navigate = useNavigate();
  const [statusCounts, setStatusCounts] = useState({
    aguardando: 0,
    aprovadas: 0,
    rejeitadas: 0,
    total: 0
  });

  useEffect(() => {
    const fetchStatusCounts = async () => {
      // Buscar empresa_id do gestor através de user_roles
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('empresa_id')
        .eq('user_id', userId)
        .eq('role', 'gestor')
        .maybeSingle();

      let query = supabase
        .from('solicitacoes_nf')
        .select('status');

      // Se tiver empresa_id associada, filtrar por empresa
      if (userRoleData?.empresa_id) {
        query = query.eq('empresa_id', userRoleData.empresa_id);
      }

      const { data, error } = await query;

      if (!error && data) {
        const counts = {
          aguardando: data.filter(s => s.status === 'Aguardando aprovação do gestor').length,
          aprovadas: data.filter(s => s.status === 'Em análise financeira' || s.status === 'Aprovada' || s.status === 'Pagamento programado' || s.status === 'Pago').length,
          rejeitadas: data.filter(s => s.status === 'Rejeitada pelo gestor').length,
          total: data.length
        };
        setStatusCounts(counts);
      }
    };

    fetchStatusCounts();

    const channel = supabase
      .channel('gestor-dashboard-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solicitacoes_nf'
      }, () => {
        console.log('Dashboard Gestor - solicitação atualizada');
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
        {/* Pendências de Aprovação */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-orange-200 bg-orange-50" onClick={onViewPendingApprovals}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="h-5 w-5" />
              Pendências de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600">
              Solicitações aguardando sua aprovação como gestor
            </p>
            <Button variant="outline" className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100">
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
            <p className="text-muted-foreground">
              Visualizar todas as solicitações do seu setor
            </p>
            <Button variant="outline" className="mt-3">
              Ver Todas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-700">{statusCounts.aguardando}</p>
            <p className="text-xs text-muted-foreground">Aguardando Aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700">{statusCounts.aprovadas}</p>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-700">{statusCounts.rejeitadas}</p>
            <p className="text-xs text-muted-foreground">Rejeitadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{statusCounts.total}</p>
            <p className="text-xs text-muted-foreground">Total do Setor</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/gestor/manage-team')}>
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Time
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Solicitações em Lote
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Relatório de Aprovações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};