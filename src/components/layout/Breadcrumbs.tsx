import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/solicitacao/nova': 'Nova Solicitação',
  '/minhas-solicitacoes': 'Minhas Solicitações',
  '/gerenciar-solicitacoes': 'Gerenciar Solicitações',
  '/admin/users': 'Usuários',
  '/admin/manage-users': 'Gerenciar Usuários',
  '/admin/companies': 'Empresas',
  '/admin/reports': 'Relatórios',
  '/admin/settings': 'Configurações',
  '/admin/add-user': 'Adicionar Usuário',
  '/admin/permissions': 'Permissões',
  '/admin/backup': 'Backup',
  '/admin/notifications': 'Notificações',
  '/financeiro/approve-batch': 'Aprovação em Lote',
  '/financeiro/schedule-payments': 'Agendar Pagamentos',
  '/financeiro/cash-flow': 'Fluxo de Caixa',
  '/financeiro/payments-report': 'Relatório de Pagamentos',
  '/gestor/manage-team': 'Gerenciar Time',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Generate breadcrumbs from current route if not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [{ label: 'Início', href: '/' }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = routeLabels[currentPath] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      result.push({
        label,
        href: index === paths.length - 1 ? undefined : currentPath,
      });
    });
    
    return result;
  })();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
          )}
          {index === 0 && (
            <Home className="h-4 w-4 mr-1" />
          )}
          {item.href ? (
            <Link 
              to={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
