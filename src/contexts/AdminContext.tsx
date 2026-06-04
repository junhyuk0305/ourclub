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
  hasPendingRequest: boolean;
  loading: boolean;
  refreshClub: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isMaster } = useAuth();
  const [adminClub, setAdminClub] = useState<AdminClub | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAdminClub = async () => {
    if (!user) {
      setAdminClub(null);
      setMembershipId(null);
      setHasPendingRequest(false);
      setLoading(false);
      return;
    }

    if (isMaster) {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .limit(1);

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

      if (error || !data) {
        setMembershipId(null);
        setAdminClub(null);

        // 승인 대기 중인 신청이 있는지 확인
        const { data: reg } = await supabase
          .from('club_registration_requests')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['검토대기', '검토중', '보완요청'])
          .maybeSingle();

        if (reg) {
          setHasPendingRequest(true);
        } else {
          const { data: join } = await supabase
            .from('club_join_requests')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', '대기중')
            .maybeSingle();
          setHasPendingRequest(!!join);
        }
      } else {
        setMembershipId(data.id);
        setAdminClub(data.clubs as unknown as AdminClub);
        setHasPendingRequest(false);
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
      hasPendingRequest,
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
