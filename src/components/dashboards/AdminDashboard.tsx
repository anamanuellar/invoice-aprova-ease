import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Users, 
  Building2, 
  Shield, 
  BarChart3, 
  FileText,
  UserPlus,
  Database,
  Bell,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  onViewRequests?: () => void;
}

export const AdminDashboard = ({ onViewRequests }: AdminDashboardProps) => {
  const navigate = useNavigate();
  const [usersCount, setUsersCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [todayRequestsCount, setTodayRequestsCount] = useState(0);

  // Fetch initial counts
  const fetchCounts = async () => {
    // Count users from profiles
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profilesCount !== null) setUsersCount(profilesCount);

    // Count companies
    const { count: empresasCount } = await supabase
      .from('empresas')
      .select('*', { count: 'exact', head: true });
    
    if (empresasCount !== null) setCompaniesCount(empresasCount);

    // Count today's requests
    const today = new Date().toISOString().split('T')[0];
    const { count: requestsCount } = await supabase
      .from('solicitacoes_nf')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    if (requestsCount !== null) setTodayRequestsCount(requestsCount);
  };

  useEffect(() => {
    fetchCounts();

    // Set up real-time subscriptions
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchCounts()
      )
      .subscribe();

    const empresasChannel = supabase
      .channel('empresas-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'empresas' },
        () => fetchCounts()
      )
      .subscribe();

    const solicitacoesChannel = supabase
      .channel('solicitacoes-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'solicitacoes_nf' },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(empresasChannel);
      supabase.removeChannel(solicitacoesChannel);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Navegação Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-purple-200 bg-purple-50" onClick={() => navigate('/admin/users')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Users className="h-5 w-5" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-600 text-sm">
              Gerenciar usuários e permissões
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200 bg-blue-50" onClick={() => navigate('/admin/companies')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Building2 className="h-5 w-5" />
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600 text-sm">
              Gerenciar empresas e setores
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-green-200 bg-green-50" onClick={() => navigate('/admin/reports')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <BarChart3 className="h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 text-sm">
              Relatórios e analytics
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-gray-200 bg-gray-50" onClick={() => navigate('/admin/settings')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Settings className="h-5 w-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              Configurações do sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-700">{usersCount}</p>
            <p className="text-xs text-muted-foreground">Usuários Ativos</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewRequests}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{todayRequestsCount}</p>
            <p className="text-xs text-muted-foreground">Solicitações Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700">{companiesCount}</p>
            <p className="text-xs text-muted-foreground">Empresas Cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-700">100%</p>
            <p className="text-xs text-muted-foreground">Sistema Online</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Administrativas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Administrativas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button className="justify-start" variant="outline" onClick={() => navigate('/admin/add-user')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Novo Usuário
          </Button>
          <Button className="justify-start" variant="outline" onClick={() => navigate('/admin/permissions')}>
            <Shield className="h-4 w-4 mr-2" />
            Gerenciar Permissões
          </Button>
          <Button className="justify-start" variant="outline" onClick={() => navigate('/admin/backup')}>
            <Database className="h-4 w-4 mr-2" />
            Backup do Sistema
          </Button>
          <Button className="justify-start" variant="outline" onClick={() => navigate('/admin/notifications')}>
            <Bell className="h-4 w-4 mr-2" />
            Configurar Notificações
          </Button>
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span>Sistema iniciado com sucesso</span>
              <span className="text-xs text-muted-foreground">Agora</span>
            </div>
            <div className="text-center text-muted-foreground py-4">
              Nenhuma atividade recente
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};