import { useState, useEffect, useCallback } from 'react';
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
  const { user, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = useCallback(async () => {
    if (!user) {
      setUserRoles([]);
      setLoading(false);
      return;
    }

    try {
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
  }, [user]);

  useEffect(() => {
    let mounted = true;

    // Se auth ainda está carregando, aguarda
    if (authLoading) {
      return;
    }

    // Se não tem user, para o loading
    if (!user) {
      if (mounted) {
        setUserRoles([]);
        setLoading(false);
      }
      return;
    }

    // Buscar roles
    const loadRoles = async () => {
      if (mounted) setLoading(true);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('role, empresa_id')
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;
        
        if (mounted) {
          setUserRoles(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar roles do usuário:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
          setLoading(false);
        }
      }
    };

    loadRoles();

    // Timeout de segurança de 5 segundos
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log('useUserRole: timeout de segurança atingido');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [user, authLoading]);

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