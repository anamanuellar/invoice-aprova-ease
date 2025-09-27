import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserWithRoles {
  id: string;
  name: string;
  email: string;
  created_at: string;
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
          created_at
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
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          name: userData.name
        },
        email_confirm: true
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('Usuário não foi criado');

      // Create user roles
      const rolePromises = userData.roles.map(role => 
        supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: role as any,
            empresa_id: userData.empresaId || null
          })
      );

      await Promise.all(rolePromises);

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