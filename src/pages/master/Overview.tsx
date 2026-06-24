import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Users, Building2, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

const PENDING_STATUSES = ['검토대기', '검토중', '보완요청'];

// 심사 SLA 기준 (일): 14일 이내 정상, 14~21 임박, 21 초과
function slaInfo(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days > 21) return { days, label: '초과', color: 'bg-bad-bg text-bad-fg' };
  if (days >= 14) return { days, label: '임박', color: 'bg-warn-bg text-warn-fg' };
  return { days, label: '정상', color: 'bg-off-bg text-off-fg' };
}

interface PendingReg {
  id: string;
  club_name: string;
  status: string;
  created_at: string;
}

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingReg[]>([]);
  const [joinPending, setJoinPending] = useState(0);
  const [clubTotal, setClubTotal] = useState(0);
  const [clubCertified, setClubCertified] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [regRes, joinRes, clubsRes] = await Promise.all([
        supabase
          .from('club_registration_requests')
          .select('id, club_name, status, created_at')
          .in('status', PENDING_STATUSES)
          .order('created_at', { ascending: true }),
        supabase
          .from('club_join_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', '대기중'),
        supabase
          .from('clubs')
          .select('is_certified'),
      ]);

      setPending((regRes.data as PendingReg[]) ?? []);
      setJoinPending(joinRes.count ?? 0);
      const clubs = (clubsRes.data as { is_certified: boolean }[]) ?? [];
      setClubTotal(clubs.length);
      setClubCertified(clubs.filter(c => c.is_certified).length);
      setLoading(false);
    };
    load();
  }, []);

  const overdue = pending.filter(r => slaInfo(r.created_at).days > 21).length;

  const stats = [
    { label: '등록 심사 대기', value: pending.length, icon: ClipboardList, to: '/master/registrations', accent: 'text-ink' },
    { label: 'SLA 초과', value: overdue, icon: AlertTriangle, to: '/master/registrations', accent: overdue > 0 ? 'text-bad-fg' : 'text-ink' },
    { label: '합류 신청 대기', value: joinPending, icon: Users, to: '/master/join-requests', accent: 'text-ink' },
    { label: '전체 동아리', value: clubTotal, sub: `인증 ${clubCertified}`, icon: Building2, to: '/master/clubs', accent: 'text-ink' },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-black text-ink mb-1">운영 대시보드</h1>
          <p className="font-bold text-sand-500">서비스 전반의 심사 큐와 동아리 현황을 한눈에 봅니다.</p>
        </div>

        {loading ? (
          <LoadingScreen />
        ) : (
          <>
            {/* 지표 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(({ label, value, sub, icon: Icon, to, accent }) => (
                <Link
                  key={label}
                  to={to}
                  className="bg-white border border-sand-200 rounded-card p-5 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-sand-400">
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                    <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <span className={`text-3xl font-black ${accent}`}>{value}</span>
                  <span className="text-sm font-bold text-sand-500">
                    {label}{sub ? <span className="text-sand-400"> · {sub}</span> : null}
                  </span>
                </Link>
              ))}
            </div>

            {/* 등록 심사 대기 큐 */}
            <div className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200 bg-sand-50">
                <h2 className="font-black text-ink">등록 심사 대기 큐</h2>
                <Link to="/master/registrations" className="text-xs font-black text-sand-500 hover:text-brand flex items-center gap-1">
                  전체 심사 <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                </Link>
              </div>
              {pending.length === 0 ? (
                <p className="px-6 py-10 text-center font-bold text-sand-400 text-sm">처리할 신청이 없습니다. 👍</p>
              ) : (
                <div className="divide-y divide-sand-200">
                  {pending.map(r => {
                    const sla = slaInfo(r.created_at);
                    return (
                      <Link
                        key={r.id}
                        to="/master/registrations"
                        className="flex items-center gap-3 px-6 py-3 hover:bg-sand-50 transition-colors"
                      >
                        <span className="font-black text-sm text-ink flex-1 truncate">{r.club_name}</span>
                        <span className="text-xs font-bold text-sand-500">{r.status}</span>
                        <span className="text-xs font-bold text-sand-400 w-12 text-right">D+{sla.days}</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-ctl ${sla.color}`}>{sla.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
