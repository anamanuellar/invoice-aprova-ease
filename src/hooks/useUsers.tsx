import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserWithRoles {
  id: string;
  name: string;
  email: string;
  created_at: string;
  active: boolean;
  roles: Array<{
    role: string;
    empresa_id: string | null;
  }>;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users from profiles table with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          email,
          created_at,
          active
        `);

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, empresa_id');

      if (rolesError) throw rolesError;

      // Combine users with their roles
      const usersWithRoles: UserWithRoles[] = profiles?.map(profile => ({
        id: profile.user_id,
        name: profile.name,
        email: profile.email,
        created_at: profile.created_at,
        active: profile.active,
        roles: userRoles?.filter(role => role.user_id === profile.user_id) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    name: string;
    roles: string[];
    empresaId?: string;
  }) => {
    try {
      // Get the current session to pass the auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Call the Edge Function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          userRoles: userData.roles,
          empresaId: userData.empresaId || null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Usuário criado com sucesso",
        description: `${userData.name} foi adicionado ao sistema.`,
      });

      // Refresh users list
      await fetchUsers();
      
      return { success: true };
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser
  };
};