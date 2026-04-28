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
  membershipId: string | null;   // club_members.id — 세션 생성 등에 필요
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
      console.log("AdminContext: No user logged in, cannot fetch admin club."); // ADDED
      setLoading(false);
      return;
    }

    console.log("AdminContext: Attempting to fetch admin club for user ID:", user.id, "isMaster:", isMaster); // ADDED

    if (isMaster) {
      // 마스터 계정: 모든 동아리 조회, 첫 번째 동아리로 초기화
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .limit(1);

      if (error) {
        console.error("AdminContext: Error fetching first club for master:", error.message); // ADDED
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setAdminClub(data[0] as AdminClub);
        setMembershipId(null); // 수정됨: 가짜 ID 대신 null 처리
        console.log("AdminContext: Master user initialized with club:", data[0].name); // ADDED
      } else {
        setAdminClub(null);
        setMembershipId(null);
        console.log("AdminContext: No clubs found for master user"); // ADDED
      }
    } else {
      // 일반 운영진: 본인이 운영진인 동아리 조회
      const { data, error } = await supabase
        .from('club_members')
        .select('id, clubs(*)')
        .eq('user_id', user.id)
        .eq('role', '운영진')
        .eq('status', '활동중')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("AdminContext: Error fetching admin club:", error.message); // ADDED
      }

      if (data) {
        setMembershipId(data.id);
        setAdminClub(data.clubs as unknown as AdminClub);
        console.log("AdminContext: Admin club found:", data.clubs?.name, "Club ID:", data.clubs?.id); // ADDED
      } else {
        setMembershipId(null);
        setAdminClub(null);
        console.log("AdminContext: No admin club found for user ID:", user.id); // ADDED
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchAdminClub();
  }, [user, isMaster]);

  useEffect(() => {
    if (adminClub?.id) {
      console.log("Admin user is logged in for club ID:", adminClub.id, "and club name:", adminClub?.name);
    } else {
      console.log("Admin user not detected.");
    }
  }, [adminClub?.id, adminClub]);

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
