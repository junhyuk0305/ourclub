import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface AdminClub {
  id: string;
  slug: string;
  name: string;
  type: string;
  theme_color: string;
  one_line_desc: string | null;
  description: string | null;
  logo_url: string | null;
  location: string | null;
  recruit_fee: number | null;
  instagram_url: string | null;
  notion_url: string | null;
  kakao_url: string | null;
  is_certified: boolean;
}

interface AdminContextValue {
  adminClub: AdminClub | null;
  adminClubId: string | null;
  membershipId: string | null;
  isAdmin: boolean;
  loading: boolean;
  refreshClub: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isMaster } = useAuth();
  const [adminClub, setAdminClub] = useState<AdminClub | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminClub = async () => {
    if (!user) {
      setAdminClub(null);
      setMembershipId(null);
      setLoading(false);
      return;
    }

    if (isMaster) {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .limit(1);

      console.log('[AdminContext] isMaster=true, clubs query:', { data, error });
      if (error || !data || data.length === 0) {
        setAdminClub(null);
        setMembershipId(null);
      } else {
        setAdminClub(data[0] as AdminClub);
        setMembershipId(null);
      }
    } else {
      const { data, error } = await supabase
        .from('club_members')
        .select('id, clubs(*)')
        .eq('user_id', user.id)
        .eq('role', '운영진')
        .eq('status', '활동중')
        .limit(1)
        .maybeSingle();

      console.log('[AdminContext] isMaster=false, user.id:', user.id);
      console.log('[AdminContext] club_members query:', { data, error });
      if (error || !data) {
        setMembershipId(null);
        setAdminClub(null);
      } else {
        setMembershipId(data.id);
        setAdminClub(data.clubs as unknown as AdminClub);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchAdminClub();
    // user?.id 기준 비교: TOKEN_REFRESHED로 user 객체 참조만 바뀔 때 재실행 방지
  }, [user?.id, isMaster]);

  const refreshClub = async () => {
    await fetchAdminClub();
  };

  return (
    <AdminContext.Provider value={{
      adminClub,
      adminClubId: adminClub?.id ?? null,
      membershipId,
      isAdmin: !!adminClub,
      loading,
      refreshClub,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin은 AdminProvider 내부에서만 사용 가능합니다.');
  return ctx;
}
