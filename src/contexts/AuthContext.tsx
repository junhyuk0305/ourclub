import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  university: string | null;
  major: string | null;
  skills: string[] | null;
  resume_url: string | null;
  portfolio_url: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isMaster: boolean;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
        console.log("AuthContext: Fetching profile for user ID:", userId); // ADDED
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("AuthContext: Error fetching profile:", error.message); // ADDED
    }
    setProfile(data ?? null);
  };

  const checkMasterStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('global_admins')
        .select('id')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("AuthContext: Error checking master status:", error.message);
      }
      setIsMaster(!!data);
    } catch (err) {
      console.error("AuthContext: Exception checking master status:", err);
      setIsMaster(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    if (session?.user) {
        console.log("AuthContext: Initial session found. User ID:", session.user.id); // MODIFIED
        fetchProfile(session.user.id);
        checkMasterStatus(session.user.id);
        setLoading(false);
      }
      else {
        console.log("AuthContext: No initial user session found."); // MODIFIED
        setIsMaster(false);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log("AuthContext: Auth state changed. User ID:", session.user.id); // ADDED
        fetchProfile(session.user.id);
        checkMasterStatus(session.user.id);
      }
      else {
        console.log("AuthContext: Auth state changed. User logged out."); // ADDED
        setProfile(null);
        setIsMaster(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isMaster, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용 가능합니다.');
  return ctx;
}
