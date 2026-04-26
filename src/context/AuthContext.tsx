'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/app';

type AuthContextType = {
  session:     Session | null;
  user:        User | null;
  profile:     Profile | null;
  agencyId:    string | null;
  loading:     boolean;
  signOut:     () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = createBrowserSupabaseClient();
  const [session, setSession]   = useState<Session | null>(null);
  const [user,    setUser]      = useState<User | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);

  const agencyId = profile?.agency_id ?? null;

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data as Profile);
      } catch (err) {
        console.error('[ASAS] Profile fetch failed — forcing signout for security:', err);
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) console.error('[ASAS] Session error:', error);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('[ASAS] Failed to get session:', err);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('[ASAS] Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, agencyId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

