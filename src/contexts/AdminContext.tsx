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
  const { user } = useAuth();
  const [adminClub, setAdminClub] = useState<AdminClub | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminClub = async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('club_members')
      .select('id, clubs(*)')
      .eq('user_id', user.id)
      .eq('role', '운영진')
      .eq('status', '활동중')
      .limit(1)
      .maybeSingle();

    if (data) {
      setMembershipId(data.id);
      setAdminClub(data.clubs as unknown as AdminClub);
    } else {
      setMembershipId(null);
      setAdminClub(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchAdminClub();
  }, [user]);

  useEffect(() => {
    if (adminClubId) {
      console.log("Admin user is logged in for club ID:", adminClubId, "and club name:", adminClub?.name);
    } else {
      console.log("Admin user not detected.");
    }
  }, [adminClubId, adminClub]);

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
