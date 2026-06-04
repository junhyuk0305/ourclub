import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader, ClipboardList, Users, Building2, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MasterLayout } from './MasterLayout';

const PENDING_STATUSES = ['검토대기', '검토중', '보완요청'];

// 심사 SLA 기준 (일): 14일 이내 정상, 14~21 임박, 21 초과
function slaInfo(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days > 21) return { days, label: '초과', color: 'bg-red-100 text-red-700 border-red-300' };
  if (days >= 14) return { days, label: '임박', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
  return { days, label: '정상', color: 'bg-gray-100 text-gray-600 border-gray-300' };
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
    { label: '등록 심사 대기', value: pending.length, icon: ClipboardList, to: '/master/registrations', accent: 'text-black' },
    { label: 'SLA 초과', value: overdue, icon: AlertTriangle, to: '/master/registrations', accent: overdue > 0 ? 'text-red-600' : 'text-black' },
    { label: '합류 신청 대기', value: joinPending, icon: Users, to: '/master/join-requests', accent: 'text-black' },
    { label: '전체 동아리', value: clubTotal, sub: `인증 ${clubCertified}`, icon: Building2, to: '/master/clubs', accent: 'text-black' },
  ];

  return (
    <MasterLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-black mb-1">운영 대시보드</h1>
          <p className="font-bold text-gray-500">서비스 전반의 심사 큐와 동아리 현황을 한눈에 봅니다.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : (
          <>
            {/* 지표 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(({ label, value, sub, icon: Icon, to, accent }) => (
                <Link
                  key={label}
                  to={to}
                  className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-gray-400">
                    <Icon className="w-5 h-5" />
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <span className={`text-3xl font-black ${accent}`}>{value}</span>
                  <span className="text-sm font-bold text-gray-500">
                    {label}{sub ? <span className="text-gray-400"> · {sub}</span> : null}
                  </span>
                </Link>
              ))}
            </div>

            {/* 등록 심사 대기 큐 */}
            <div className="bg-white border-2 border-black">
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-50">
                <h2 className="font-black">등록 심사 대기 큐</h2>
                <Link to="/master/registrations" className="text-xs font-black text-gray-500 hover:text-orange-500 flex items-center gap-1">
                  전체 심사 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {pending.length === 0 ? (
                <p className="px-6 py-10 text-center font-bold text-gray-400 text-sm">처리할 신청이 없습니다. 👍</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pending.map(r => {
                    const sla = slaInfo(r.created_at);
                    return (
                      <Link
                        key={r.id}
                        to="/master/registrations"
                        className="flex items-center gap-3 px-6 py-3 hover:bg-orange-50 transition-colors"
                      >
                        <span className="font-black text-sm flex-1 truncate">{r.club_name}</span>
                        <span className="text-xs font-bold text-gray-500">{r.status}</span>
                        <span className="text-xs font-bold text-gray-400 w-12 text-right">D+{sla.days}</span>
                        <span className={`text-xs font-black px-2 py-0.5 border ${sla.color}`}>{sla.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MasterLayout>
  );
}
