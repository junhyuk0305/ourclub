import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ListChecks, PlayCircle, CalendarCheck } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

// 세션 관리 영역(세션 목록 · 출석기록 생성 · 출석 인정)의 공통 헤더 + 탭 내비게이션.
// 세 페이지가 동일한 제목/탭을 공유해 "전체 세션 관리" 하나로 묶인 것처럼 보이게 한다.
export function SessionTabs() {
  const { pathname } = useLocation();
  const { adminClubId } = useAdmin();
  const [pending, setPending] = useState(0);

  // 출석 인정 대기 건수 — 탭 배지로 노출(가벼운 head count 한 번)
  useEffect(() => {
    if (!adminClubId) return;
    let cancelled = false;
    supabase
      .from('attendance_excuse_requests')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', adminClubId)
      .eq('status', '대기')
      .then(({ count }) => { if (!cancelled) setPending(count ?? 0); });
    return () => { cancelled = true; };
  }, [adminClubId, pathname]);

  const tabs = [
    {
      label: '세션 목록',
      path: '/admin/sessions',
      icon: ListChecks,
      active: pathname === '/admin/sessions' || (pathname.startsWith('/admin/sessions/') && pathname !== '/admin/sessions/new'),
    },
    {
      label: '출석기록 생성',
      path: '/admin/sessions/new',
      icon: PlayCircle,
      active: pathname === '/admin/sessions/new',
    },
    {
      label: '출석 인정 관리',
      path: '/admin/attendance-excuses',
      icon: CalendarCheck,
      active: pathname.startsWith('/admin/attendance-excuses'),
      badge: pending,
    },
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-sand-200 pb-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-brand mb-1">세션 관리</p>
        <h2 className="text-3xl font-black text-ink">전체 세션 관리</h2>
        <p className="text-sand-500 font-bold text-sm mt-1">출석 세션 생성 · 기록 확인 · 출석 인정을 한곳에서 관리합니다.</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <Link
              key={t.path}
              to={t.path}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-ctl font-bold text-sm transition-all ${
                t.active
                  ? 'btn-grad text-white shadow-btn'
                  : 'bg-white border border-sand-300 text-sand-500 hover:bg-sand-50 hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2.5} />
              {t.label}
              {t.badge ? (
                <span className={`ml-0.5 min-w-[1.25rem] text-center px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                  t.active ? 'bg-white/25 text-white' : 'bg-brand text-white'
                }`}>
                  {t.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
