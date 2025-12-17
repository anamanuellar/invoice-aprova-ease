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
  initialized: boolean;
  error: string | null;
  refetch: () => void;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  
  // Use user.id as stable dependency
  const userId = user?.id;

  useEffect(() => {
    // Reset when no user
    if (!userId) {
      setUserRoles([]);
      setInitialized(!authLoading);
      setError(null);
      return;
    }

    // Don't fetch while auth is still loading
    if (authLoading) {
      return;
    }

    let cancelled = false;

    const fetchRoles = async () => {
      try {
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('role, empresa_id')
          .eq('user_id', userId);

        if (cancelled) return;

        if (fetchError) throw fetchError;

        setUserRoles(data || []);
      } catch (err) {
        if (cancelled) return;
        console.error('Erro ao buscar roles do usuário:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        if (!cancelled) {
          setInitialized(true);
        }
      }
    };

    fetchRoles();

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading, fetchCount]);

  const refetch = () => {
    setInitialized(false);
    setFetchCount(c => c + 1);
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.some(userRole => userRole.role === role);
  };

  const hasRoleInCompany = (role: UserRole, empresaId?: string): boolean => {
    return userRoles.some(userRole => 
      userRole.role === role && 
      (userRole.empresa_id === empresaId || userRole.empresa_id === null)
    );
  };

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

  // Loading: auth loading OR (user exists but roles not initialized)
  const isLoading = authLoading || (!!userId && !initialized);

  return {
    userRoles,
    primaryRole: getPrimaryRole(),
    hasRole,
    hasRoleInCompany,
    loading: isLoading,
    initialized,
    error,
    refetch
  };
};