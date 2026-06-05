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

interface AdminMembership {
  /** club_members.id — 마스터 폴백 동아리는 멤버십이 없어 null */
  membershipId: string | null;
  club: AdminClub;
}

interface AdminContextValue {
  adminClub: AdminClub | null;
  adminClubId: string | null;
  membershipId: string | null;
  /** 운영 중인(또는 마스터 폴백) 동아리 전체 — 전환 드롭다운용 */
  adminClubs: AdminClub[];
  /** 현재 활성 동아리 id */
  activeClubId: string | null;
  /** 활성 동아리 전환(목록에 없는 id는 무시) */
  setActiveClub: (id: string) => void;
  isAdmin: boolean;
  hasPendingRequest: boolean;
  loading: boolean;
  refreshClub: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const ACTIVE_CLUB_KEY = 'oc.activeClubId';

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isMaster } = useAuth();
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [activeClubId, setActiveClubIdState] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);

  // 저장된 활성 동아리가 여전히 유효하면 사용, 아니면 첫 동아리로 폴백(+영속 갱신)
  const resolveActiveId = (ids: string[]): string | null => {
    if (ids.length === 0) return null;
    const stored = localStorage.getItem(ACTIVE_CLUB_KEY);
    if (stored && ids.includes(stored)) return stored;
    localStorage.setItem(ACTIVE_CLUB_KEY, ids[0]);
    return ids[0];
  };

  const fetchAdminClub = async () => {
    if (!user) {
      setMemberships([]);
      setActiveClubIdState(null);
      setHasPendingRequest(false);
      setLoading(false);
      return;
    }

    // 1) 운영진 멤버십 전부 로드 — 다중 동아리 운영 지원
    const { data: mems } = await supabase
      .from('club_members')
      .select('id, clubs(*)')
      .eq('user_id', user.id)
      .eq('role', '운영진')
      .eq('status', '활동중')
      .order('joined_at', { ascending: true });

    const list: AdminMembership[] = (mems ?? [])
      .filter((m) => m.clubs)
      .map((m) => ({ membershipId: m.id, club: m.clubs as unknown as AdminClub }));

    if (list.length > 0) {
      setMemberships(list);
      setActiveClubIdState(resolveActiveId(list.map((m) => m.club.id)));
      setHasPendingRequest(false);
      setLoading(false);
      return;
    }

    // 2) 운영진 클럽이 없는 마스터: 첫 동아리로 폴백(단일, 전환 없음)
    if (isMaster) {
      const { data } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1);
      const club = (data?.[0] as AdminClub) ?? null;
      setMemberships(club ? [{ membershipId: null, club }] : []);
      setActiveClubIdState(club?.id ?? null);
      setLoading(false);
      return;
    }

    // 3) 일반 사용자: 승인 대기 중인 신청 확인
    setMemberships([]);
    setActiveClubIdState(null);
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

  const setActiveClub = (id: string) => {
    if (!memberships.some((m) => m.club.id === id)) return;
    localStorage.setItem(ACTIVE_CLUB_KEY, id);
    setActiveClubIdState(id);
  };

  // 활성 멤버십 도출(저장값이 어긋나면 첫 동아리로 폴백)
  const active = memberships.find((m) => m.club.id === activeClubId) ?? memberships[0] ?? null;
  const adminClub = active?.club ?? null;

  return (
    <AdminContext.Provider value={{
      adminClub,
      adminClubId: adminClub?.id ?? null,
      membershipId: active?.membershipId ?? null,
      adminClubs: memberships.map((m) => m.club),
      activeClubId,
      setActiveClub,
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
