import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  requiresPasswordChange: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  requiresPasswordChange: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
    console.log('Auth useEffect iniciando...');
    let mounted = true;
    
    // Timeout para garantir que não fique carregando forever
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log('Timeout atingido, parando loading');
        setLoading(false);
      }
    }, 5000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(timeout);
        
        // Check password change requirement
        if (session?.user) {
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('requires_password_change, active')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              setRequiresPasswordChange(profile.requires_password_change);
              
              // Sign out inactive users
              if (!profile.active) {
                await supabase.auth.signOut();
              }
            }
          }, 0);
        } else {
          setRequiresPasswordChange(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        console.log('Getting session:', session, error);
        if (error) {
          console.error('Erro ao obter sessão:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(timeout);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Erro ao obter sessão:', error);
        setLoading(false);
        clearTimeout(timeout);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, requiresPasswordChange, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};