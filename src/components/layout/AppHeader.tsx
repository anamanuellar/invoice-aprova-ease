import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from './Breadcrumbs';
import { LogOut } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBreadcrumbs?: boolean;
}

export function AppHeader({ title, showBreadcrumbs = true }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const { primaryRole } = useUserRole();

  const getRoleLabel = (role: string | null) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      financeiro: 'Financeiro',
      gestor: 'Gestor',
      solicitante: 'Solicitante',
    };
    return role ? labels[role] || role : '';
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        {showBreadcrumbs && <Breadcrumbs className="mb-2" />}
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {title || 'Sistema de Solicitação de Pagamentos'}
            </h1>
            {user && (
              <p className="text-muted-foreground text-sm mt-1">
                {user.user_metadata?.name || user.email}
                {primaryRole && (
                  <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {getRoleLabel(primaryRole)}
                  </span>
                )}
              </p>
            )}
          </div>
          
          {user && (
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
