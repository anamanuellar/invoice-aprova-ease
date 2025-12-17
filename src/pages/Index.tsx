import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthForm from "@/components/AuthForm";
import { SolicitanteDashboard } from "@/components/dashboards/SolicitanteDashboard";
import { GestorDashboard } from "@/components/dashboards/GestorDashboard";
import { FinanceiroDashboard } from "@/components/dashboards/FinanceiroDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { RoleBasedAccess } from "@/components/RoleBasedAccess";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, requiresPasswordChange } = useAuth();
  const { primaryRole, loading: roleLoading, initialized: rolesInitialized } = useUserRole();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (!loading && user && requiresPasswordChange) {
      setShowPasswordDialog(true);
    }
  }, [user, loading, requiresPasswordChange]);

  // Show loading while auth or roles are loading
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {loading ? "Verificando autenticação..." : "Carregando permissões..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Check if user has any role assigned
  if (!primaryRole) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Sistema de Solicitação de Pagamentos
            </h1>
            <Button onClick={signOut} variant="outline">
              Sair
            </Button>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não possui nenhum papel (role) atribuído no sistema.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com o administrador para receber as permissões adequadas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (!user) return null;
    
    switch (primaryRole) {
      case 'admin':
        return <AdminDashboard onViewRequests={() => navigate('/gerenciar-solicitacoes')} />;
      
      case 'financeiro':
        return (
          <FinanceiroDashboard
            onViewPendingAnalysis={() => navigate('/gerenciar-solicitacoes')}
            onViewAllRequests={() => navigate('/gerenciar-solicitacoes')}
            onViewReports={() => navigate('/financeiro/payments-report')}
          />
        );
      
      case 'gestor':
        return (
          <GestorDashboard
            userId={user.id}
            onViewPendingApprovals={() => navigate('/gerenciar-solicitacoes')}
            onViewAllRequests={() => navigate('/gerenciar-solicitacoes')}
          />
        );
      
      case 'solicitante':
      default:
        return (
          <SolicitanteDashboard
            userId={user.id}
            onNewRequest={() => navigate('/solicitacao/nova')}
            onViewRequests={() => navigate('/minhas-solicitacoes')}
          />
        );
    }
  };

  // Show main dashboard for authenticated users
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Sistema de Solicitação de Pagamentos
            </h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo, {user?.user_metadata?.name || user?.email}
              <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {primaryRole?.charAt(0).toUpperCase() + primaryRole?.slice(1)}
              </span>
            </p>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {renderDashboard()}

          {/* Show "Como Funciona" section only for solicitantes */}
          <RoleBasedAccess allowedRoles={['solicitante']}>
            <Card>
              <CardHeader>
                <CardTitle>Como Funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold mb-1">Criar Solicitação</h3>
                    <p className="text-sm text-muted-foreground">Preencha os dados da nota fiscal</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-yellow-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold mb-1">Aprovação do Gestor</h3>
                    <p className="text-sm text-muted-foreground">Aguarda aprovação do gestor responsável</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold mb-1">Análise Financeira</h3>
                    <p className="text-sm text-muted-foreground">Revisão e validação pelo financeiro</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-600 font-bold">4</span>
                    </div>
                    <h3 className="font-semibold mb-1">Pagamento</h3>
                    <p className="text-sm text-muted-foreground">Processamento do pagamento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RoleBasedAccess>
        </div>
      </div>
      
      <ChangePasswordDialog 
        open={showPasswordDialog} 
        onSuccess={() => {
          setShowPasswordDialog(false);
          window.location.reload();
        }} 
      />
    </div>
  );
};

export default Index;