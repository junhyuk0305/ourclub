import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, CheckCircle, X, ChevronRight, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCorp } from '../../contexts/CorpContext';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

interface AlertItem {
  id: string;
  club_id: string;
  clubs: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    is_certified: boolean;
    recruitments: { id: string; status: string; deadline: string | null }[];
  };
}

function useAlertNotifications(userId: string | undefined) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!userId) { setAlerts([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('club_alerts')
      .select('id, club_id, clubs(id, name, slug, logo_url, is_certified, recruitments(id, status, deadline))')
      .eq('user_id', userId);
    setAlerts((data as unknown as AlertItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [userId]);

  return { alerts, loading, refetch: fetch };
}

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function useUserNotifications(userId: string | undefined) {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const fetch = async () => {
    if (!userId) { setItems([]); return; }
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setItems((data as NotificationItem[]) ?? []);
  };

  useEffect(() => { fetch(); }, [userId]);
  // push 구독이 없어, 탭 복귀 시 다시 불러와 새 알림/읽음 상태를 마이페이지와 동기화
  useEffect(() => {
    const onFocus = () => fetch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userId]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return { items, markRead };
}

const NAV_LINKS = [
  { to: '/clubs',   label: '동아리 찾기' },
  { to: '/b2b',     label: '기업 라운지' },
  { to: '/stories', label: '동아리 스토리' },
];

export const Header = () => {
  const [bellOpen, setBellOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { isCorpUser } = useCorp();
  const { alerts, loading: alertLoading } = useAlertNotifications(user?.id);
  const { items: notifications, markRead } = useUserNotifications(user?.id);

  const activeAlerts = alerts.filter(a => {
    const recs = Array.isArray(a.clubs?.recruitments) ? a.clubs.recruitments : [];
    return recs.some(r => ['진행중'].includes(r.status));
  });
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const dotVisible = activeAlerts.length > 0 || unreadCount > 0;

  // 페이지 이동 시 모바일 드로어 닫기 + 맨 위로 스크롤
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 드로어 열릴 때 body scroll lock
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // 벨 드롭다운 바깥 클릭 닫기
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  // ESC로 드로어 닫기
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  return (
    <>
      <header className="h-16 border-b border-black flex items-center justify-between px-6 bg-white sticky top-0 z-50">
        {/* 로고 */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
          <span className="font-black text-2xl tracking-tighter ml-1">OURCLUB</span>
        </Link>

        {/* 데스크톱 내비 */}
        <nav className="hidden md:flex gap-8 text-sm font-bold">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `transition-colors ${isActive ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'hover:text-orange-500'}`
            }>{label}</NavLink>
          ))}
        </nav>

        {/* 우측 액션 영역 */}
        <div className="flex gap-2 items-center">
          {user ? (
            <>
              <Link to="/mypage" className="hidden lg:block px-3 py-2 text-sm font-bold text-gray-600 hover:text-orange-500 transition-colors">
                학생 마이페이지
              </Link>
              {!isAdmin && !isCorpUser && (
                <Link to="/club-setup" className="hidden lg:block px-3 py-2 text-sm font-bold text-gray-600 hover:text-orange-500 transition-colors">
                  동아리 운영하기
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" className="hidden lg:block px-3 py-2 text-sm font-bold text-gray-600 hover:text-orange-500 transition-colors">
                  운영진 워크스페이스
                </Link>
              )}
              {isCorpUser && (
                <Link to="/corp/dashboard" className="hidden lg:block px-3 py-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors">
                  기업 비즈니스 센터
                </Link>
              )}
              <div className="hidden lg:block w-px h-4 bg-gray-300 mx-2" />

              {/* 벨 버튼 + 드롭다운 */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setBellOpen(v => !v)}
                  className="p-2 hover:bg-orange-500 border border-transparent hover:border-black transition-colors relative"
                  title="알림"
                >
                  <Bell className="w-5 h-5" />
                  {dotVisible && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-white" />
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black bg-gray-50">
                      <span className="font-black text-sm">알림</span>
                      <button onClick={() => setBellOpen(false)} className="p-1 hover:bg-gray-200 rounded transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* 서비스 알림 (등록 심사 결과 등) */}
                      {notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => { markRead(n.id); setBellOpen(false); if (n.link && n.link.startsWith('/') && !n.link.startsWith('//')) navigate(n.link); }}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 text-left ${!n.is_read ? 'bg-orange-50/60' : ''}`}
                        >
                          <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-orange-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm">{n.title}</p>
                            {n.body && <p className="text-xs font-bold text-gray-500 mt-0.5 break-words">{n.body}</p>}
                          </div>
                        </button>
                      ))}

                      {/* 모집 알림 */}
                      {alertLoading ? (
                        notifications.length === 0 && (
                          <div className="px-4 py-6 text-center text-sm font-bold text-gray-400">불러오는 중...</div>
                        )
                      ) : activeAlerts.length > 0 ? (
                        activeAlerts.map(a => {
                          const recs = Array.isArray(a.clubs?.recruitments) ? a.clubs.recruitments : [];
                          const activeRec = recs.find(r => ['진행중'].includes(r.status));
                          const dDay = activeRec?.deadline
                            ? Math.ceil((new Date(activeRec.deadline).getTime() - Date.now()) / 86400000)
                            : null;
                          return (
                            <button
                              key={a.id}
                              onClick={() => { setBellOpen(false); navigate(`/clubs/${a.clubs.slug}/recruit`); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 text-left"
                            >
                              {a.clubs.logo_url ? (
                                <img src={a.clubs.logo_url} alt={a.clubs.name} className="w-9 h-9 rounded-full object-cover border border-black shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-orange-500 border border-black flex items-center justify-center font-black text-black text-sm shrink-0">
                                  {a.clubs.name[0]}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-sm truncate">{a.clubs.name}</span>
                                  {a.clubs.is_certified && <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                                </div>
                                <p className="text-xs font-bold text-orange-500 mt-0.5">
                                  🔔 모집 시작{dDay !== null && dDay >= 0 ? ` · D-${dDay}` : ''}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                            </button>
                          );
                        })
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 flex flex-col items-center gap-2">
                          <Bell className="w-8 h-8 text-gray-200" />
                          <p className="text-sm font-bold text-gray-400 text-center">새 알림이 없습니다</p>
                          <p className="text-xs font-medium text-gray-400 text-center">동아리 목록에서 ♥를 눌러 모집 알림을 설정하세요</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="border-t border-black px-4 py-3 bg-gray-50">
                      <Link to="/clubs" onClick={() => setBellOpen(false)}
                        className="text-xs font-black text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1">
                        동아리 전체보기 <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="hidden md:block px-5 py-2 border-2 border-black text-sm font-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none ml-2">
              로그인 / 가입
            </Link>
          )}

          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 border border-transparent hover:border-black hover:bg-orange-500 transition-colors"
            aria-label="메뉴 열기"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 모바일 드로어 오버레이 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 모바일 드로어 */}
      <div className={`fixed top-16 right-0 bottom-0 w-72 bg-white border-l-2 border-black z-40 flex flex-col transform transition-transform duration-200 md:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* 내비 링크 */}
        <nav className="flex flex-col border-b border-black">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-6 py-4 font-bold text-base border-b border-gray-100 flex items-center justify-between transition-colors ${isActive ? 'text-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`
              }
            >
              {label}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </NavLink>
          ))}
        </nav>

        {/* 유저 영역 */}
        <div className="flex flex-col p-4 gap-2">
          {user ? (
            <>
              <Link to="/mypage" className="px-4 py-3 font-bold text-sm border border-black hover:bg-gray-50 transition-colors flex items-center justify-between">
                학생 마이페이지 <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              {!isAdmin && !isCorpUser && (
                <Link to="/club-setup" className="px-4 py-3 font-bold text-sm border border-black hover:bg-gray-50 transition-colors flex items-center justify-between">
                  동아리 운영하기 <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" className="px-4 py-3 font-bold text-sm border border-black hover:bg-gray-50 transition-colors flex items-center justify-between">
                  운영진 워크스페이스 <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              )}
              {isCorpUser && (
                <Link to="/corp/dashboard" className="px-4 py-3 font-bold text-sm border border-purple-400 text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-between">
                  기업 비즈니스 센터 <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </>
          ) : (
            <Link to="/login" className="w-full px-4 py-3 border-2 border-black font-black text-sm text-center bg-black text-white hover:bg-orange-500 hover:text-black hover:border-black transition-colors shadow-[3px_3px_0px_0px_rgba(249,115,22,1)]">
              로그인 / 가입
            </Link>
          )}
        </div>

        {/* 하단 브랜드 */}
        <div className="mt-auto px-6 py-4 border-t border-black">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 border border-black" />
            <span className="font-black text-sm tracking-tighter text-gray-400">OURCLUB</span>
          </div>
        </div>
      </div>
    </>
  );
};
