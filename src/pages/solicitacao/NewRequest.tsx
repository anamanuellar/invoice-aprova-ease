import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import InvoiceWizard from '@/components/invoice/InvoiceWizard';
import { AppHeader } from '@/components/layout/AppHeader';

export default function NewRequest() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

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
      <AppHeader title="Nova Solicitação" />
      <InvoiceWizard
        user={user}
        onSuccess={() => navigate('/')}
        onBack={() => navigate('/')}
      />
    </div>
  );
}
