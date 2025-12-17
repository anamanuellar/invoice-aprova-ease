import { useState, useEffect, useCallback, useRef } from 'react';
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
  refetch: () => Promise<void>;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const fetchUserRoles = useCallback(async () => {
    if (!user) {
      setUserRoles([]);
      setInitialized(true);
      return;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current && lastUserIdRef.current === user.id) {
      return;
    }

    try {
      fetchingRef.current = true;
      lastUserIdRef.current = user.id;
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
      fetchingRef.current = false;
      setInitialized(true);
    }
  }, [user]);

  useEffect(() => {
    // Reset when user changes (logout)
    if (!user && lastUserIdRef.current) {
      setUserRoles([]);
      setInitialized(false);
      lastUserIdRef.current = null;
      return;
    }

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // No user after auth loaded = no roles needed
    if (!user) {
      setUserRoles([]);
      setInitialized(true);
      return;
    }

    // User changed or first load
    if (lastUserIdRef.current !== user.id) {
      setInitialized(false);
      fetchUserRoles();
    }
  }, [user, authLoading, fetchUserRoles]);

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

  // Loading is true if: auth is loading OR (user exists but roles not initialized yet)
  const isLoading = authLoading || (!!user && !initialized);

  return {
    userRoles,
    primaryRole: getPrimaryRole(),
    hasRole,
    hasRoleInCompany,
    loading: isLoading,
    initialized,
    error,
    refetch: fetchUserRoles
  };
};