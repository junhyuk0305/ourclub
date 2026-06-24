import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  birthdate: string | null;
  academic_status: string | null;
  terms_agreed_at: string | null;
  privacy_agreed_at: string | null;
}

// Google OAuth 가입은 메타데이터 주입이 안 되므로, 리다이렉트 전에 동의 시각을 잠시 보관한다.
const PENDING_CONSENT_KEY = 'ourclub_pending_consent';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isMaster: boolean;
  isProfileComplete: boolean;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  /* 이미 로드된 사용자 id — 같은 사용자에 대한 SIGNED_IN 재발생(탭 포커스 복귀 등)을 식별해
     불필요한 setUser/프로필 재조회로 인한 전역 리렌더(=화면 새로고침 체감)를 막는다. */
  const loadedUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
    return data ?? null;
  };

  /* 회원가입 동의 기록 backfill.
     이메일 가입은 동의 시각이 auth 메타데이터에, Google 가입은 localStorage에 임시 보관된다.
     프로필에 동의 시각이 아직 없고 출처가 있으면 본인 행을 UPDATE 한다. (가입 이전 회원은 그대로 둠) */
  const ensureConsentRecorded = async (u: User, prof: Profile | null) => {
    if (!prof || prof.terms_agreed_at) return;
    const meta = u.user_metadata as { terms_agreed_at?: string; privacy_agreed_at?: string } | undefined;
    let termsAt = meta?.terms_agreed_at;
    let privacyAt = meta?.privacy_agreed_at;
    if (!termsAt) {
      const pending = localStorage.getItem(PENDING_CONSENT_KEY);
      if (pending) {
        try {
          const p = JSON.parse(pending) as { terms_agreed_at?: string; privacy_agreed_at?: string };
          termsAt = p.terms_agreed_at;
          privacyAt = p.privacy_agreed_at;
        } catch { /* 손상된 값 무시 */ }
      }
    }
    if (!termsAt) return;
    const { data } = await supabase
      .from('profiles')
      .update({ terms_agreed_at: termsAt, privacy_agreed_at: privacyAt ?? termsAt })
      .eq('id', u.id)
      .select('*')
      .single();
    if (data) {
      setProfile(data);
      localStorage.removeItem(PENDING_CONSENT_KEY); // 성공 시에만 정리 (실패 시 다음 로그인에 재시도)
    }
  };

  const checkMasterStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('global_admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      setIsMaster(!!data);
    } catch {
      setIsMaster(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // 세션은 항상 업데이트 (JWT 토큰 갱신 반영)
      setSession(s);

      if (event === 'TOKEN_REFRESHED') {
        // 토큰 갱신만 일어난 경우: user 객체를 교체하지 않음
        // → AdminContext 등 user에 의존하는 effect가 재실행되지 않음
        return;
      }

      const newId = s?.user?.id ?? null;
      // 이미 로드된 동일 사용자에 대한 SIGNED_IN 재발생(탭 포커스 복귀 등)은 무시:
      // user/profile/isMaster 를 그대로 유지해 전역 리렌더(화면 새로고침 체감)를 막는다.
      // 실제 로그인/계정 전환(newId 변경)·로그아웃(null)은 정상 처리.
      if (newId && newId === loadedUserIdRef.current) return;
      loadedUserIdRef.current = newId;

      setUser(s?.user ?? null);

      if (s?.user) {
        const u = s.user;
        Promise.all([fetchProfile(u.id), checkMasterStatus(u.id)])
          .then(([prof]) => ensureConsentRecorded(u, prof))
          .finally(() => setLoading(false));
      } else {
        setProfile(null);
        setIsMaster(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    // 회원가입 화면에서 필수 동의를 받은 시점 = 가입 요청 시각으로 동의 기록.
    // 메타데이터에 저장해 두면 이메일 인증 완료 후 첫 로그인 때 profiles로 backfill 된다.
    const consentAt = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, terms_agreed_at: consentAt, privacy_agreed_at: consentAt } },
    });
    // 이메일 인증이 켜져 있으면 session이 비어있음 → 메일 확인 안내 필요
    return { error: error?.message ?? null, needsConfirmation: !error && !data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async (redirectPath: string = '/mypage') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) return { error: error.message };
    await supabase.auth.signOut();
    return { error: null };
  };

  // 필수 프로필 완성 여부 (대학교·전공·학적상태·전화번호·생년월일)
  const isProfileComplete = !!(
    profile?.university &&
    profile?.major &&
    profile?.academic_status &&
    profile?.phone &&
    profile?.birthdate
  );

  return (
    <AuthContext.Provider value={{ session, user, profile, isMaster, isProfileComplete, loading, signUp, signIn, signInWithGoogle, signOut, refreshProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용 가능합니다.');
  return ctx;
}
