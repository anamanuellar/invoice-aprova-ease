import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { RequestManagementEnhanced } from '@/components/requests/RequestManagementEnhanced';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ManageRequestsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
    // Only allow gestor, financeiro, admin
    if (!roleLoading && primaryRole && !['gestor', 'financeiro', 'admin'].includes(primaryRole)) {
      navigate('/');
    }
  }, [user, authLoading, primaryRole, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Gerenciar Solicitações" />
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <RequestManagementEnhanced />
      </div>
    </div>
  );
}
