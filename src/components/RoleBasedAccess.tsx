import { ReactNode } from 'react';
import { useUserRole, UserRole } from '@/hooks/useUserRole';

interface RoleBasedAccessProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean; // Se true, usuário deve ter TODOS os roles. Se false, apenas UM dos roles
}

export const RoleBasedAccess = ({ 
  allowedRoles, 
  children, 
  fallback = null,
  requireAll = false 
}: RoleBasedAccessProps) => {
  const { hasRole, loading } = useUserRole();

  if (loading) {
    return <div>Carregando permissões...</div>;
  }

  const hasAccess = requireAll 
    ? allowedRoles.every(role => hasRole(role))
    : allowedRoles.some(role => hasRole(role));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Componente para ações condicionais baseadas em role
interface RoleBasedButtonProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  fallbackText?: string;
}

export const RoleBasedButton = ({ 
  allowedRoles, 
  children, 
  onClick, 
  className = "",
  fallbackText = "Sem permissão"
}: RoleBasedButtonProps) => {
  const { hasRole } = useUserRole();
  
  const hasAccess = allowedRoles.some(role => hasRole(role));
  
  if (!hasAccess) {
    return (
      <div className={`opacity-50 cursor-not-allowed ${className}`} title={fallbackText}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
};