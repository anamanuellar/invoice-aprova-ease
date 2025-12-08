import { useState, useEffect, createContext, useContext, useRef } from 'react';
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
  const initialCheckDone = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    // Timeout para garantir que não fique carregando forever
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('Timeout atingido, parando loading');
        setLoading(false);
      }
    }, 5000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        // Evitar processamento se já temos a mesma sessão
        if (event === 'INITIAL_SESSION' && initialCheckDone.current) {
          return;
        }
        
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        clearTimeout(timeout);
        
        // Check password change requirement only on sign in or initial session
        if (newSession?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('requires_password_change, active')
            .eq('user_id', newSession.user.id)
            .single();
          
          if (profile && mounted) {
            setRequiresPasswordChange(profile.requires_password_change);
            
            // Sign out inactive users
            if (!profile.active) {
              await supabase.auth.signOut();
            }
          }
        } else if (!newSession) {
          setRequiresPasswordChange(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: existingSession }, error }) => {
        if (!mounted) return;
        initialCheckDone.current = true;
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
        }
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
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