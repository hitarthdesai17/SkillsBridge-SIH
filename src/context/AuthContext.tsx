'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useTransition } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setSession(session);
            setUser(session.user);
          } else if (typeof document !== 'undefined' && document.cookie.includes('sb-demo-session=true')) {
            const demoUser: any = {
              id: 'demo_user_01',
              email: 'demo@skillbridge.local',
              user_metadata: { full_name: 'Demo Candidate' }
            };
            setUser(demoUser);
          } else {
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          if (typeof document !== 'undefined' && document.cookie.includes('sb-demo-session=true')) {
            const demoUser: any = {
              id: 'demo_user_01',
              email: 'demo@skillbridge.local',
              user_metadata: { full_name: 'Demo Candidate' }
            };
            setUser(demoUser);
          }
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
          startTransition(() => {
            router.refresh();
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut().catch(() => {});
      if (typeof document !== 'undefined') {
        document.cookie = 'sb-demo-session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('candidate_profile_data');
        localStorage.removeItem('candidate_profile_id');
      }
      setUser(null);
      setSession(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
