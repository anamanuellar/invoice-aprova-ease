import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'solicitante' | 'gestor' | 'financeiro' | 'admin';

interface UserRoleData {
  role: UserRole;
  empresa_id: string | null;
}

interface UseUserRoleReturn {
  userRoles: UserRoleData[];
  primaryRole: UserRole | null;
  hasRole: (role: UserRole) => boolean;
  hasRoleInCompany: (role: UserRole, empresaId?: string) => boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = async () => {
    if (!user) {
      setUserRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_roles')
        .select('role, empresa_id')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      setUserRoles(data || []);
    } catch (err) {
      console.error('Erro ao buscar roles do usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    return userRoles.some(userRole => userRole.role === role);
  };

  const hasRoleInCompany = (role: UserRole, empresaId?: string): boolean => {
    return userRoles.some(userRole => 
      userRole.role === role && 
      (userRole.empresa_id === empresaId || userRole.empresa_id === null)
    );
  };

  // Determina o role primário (prioridade: admin > financeiro > gestor > solicitante)
  const getPrimaryRole = (): UserRole | null => {
    if (userRoles.length === 0) return null;
    
    const rolePriority: Record<UserRole, number> = {
      'admin': 4,
      'financeiro': 3,
      'gestor': 2,
      'solicitante': 1
    };

    const sortedRoles = userRoles
      .map(ur => ur.role)
      .sort((a, b) => rolePriority[b] - rolePriority[a]);

    return sortedRoles[0] || null;
  };

  return {
    userRoles,
    primaryRole: getPrimaryRole(),
    hasRole,
    hasRoleInCompany,
    loading,
    error,
    refetch: fetchUserRoles
  };
};