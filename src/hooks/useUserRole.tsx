import { useState, useEffect, useRef } from 'react';
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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const useUserRole = (): UseUserRoleReturn => {
  const { user, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const retryCountRef = useRef(0);
  
  const userId = user?.id;

  useEffect(() => {
    // Reset when no user
    if (!userId) {
      setUserRoles([]);
      setInitialized(!authLoading);
      setError(null);
      retryCountRef.current = 0;
      return;
    }

    // Don't fetch while auth is still loading
    if (authLoading) {
      return;
    }

    let cancelled = false;
    let retryTimeout: NodeJS.Timeout | null = null;

    const fetchRoles = async () => {
      try {
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('role, empresa_id')
          .eq('user_id', userId);

        if (cancelled) return;

        if (fetchError) throw fetchError;

        // If no roles found and we haven't exceeded retries, try again
        if ((!data || data.length === 0) && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          retryTimeout = setTimeout(() => {
            if (!cancelled) {
              fetchRoles();
            }
          }, RETRY_DELAY);
          return;
        }

        setUserRoles(data || []);
        setInitialized(true);
      } catch (err) {
        if (cancelled) return;
        
        // Retry on error
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          retryTimeout = setTimeout(() => {
            if (!cancelled) {
              fetchRoles();
            }
          }, RETRY_DELAY);
          return;
        }
        
        console.error('Erro ao buscar roles do usuário:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setInitialized(true);
      }
    };

    fetchRoles();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [userId, authLoading, fetchCount]);

  const refetch = () => {
    retryCountRef.current = 0;
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