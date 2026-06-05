import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDate } from '../../../lib/format';

// ──────────────────────────────────────────
// Phase 4: 출결 이력 탭
// ──────────────────────────────────────────
interface ExcuseRow {
  id: string;
  excuse_date: string;
  reason_category: string;
  status: string;
  reviewer_note: string | null;
}

export default function AttendanceHistorySection() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<{ clubName: string; rate: number; records: any[] }[]>([]);
  const [excuses, setExcuses] = useState<ExcuseRow[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    // club_members → attendances → sessions 순서로 조회
    supabase
      .from('club_members')
      .select('id, generation, clubs ( name )')
      .eq('user_id', user.id)
      .then(async ({ data: memberships }) => {
        if (!memberships || memberships.length === 0) {
          setFetching(false); return;
        }

        const memberIds = memberships.map((m: any) => m.id);

        const [result, excuseRes] = await Promise.all([
          Promise.all(
            memberships.map(async (m: any) => {
              const { data: records } = await supabase
                .from('attendances')
                .select('status, recorded_at, sessions ( title )')
                .eq('member_id', m.id)
                .order('recorded_at', { ascending: false });

              const list = records ?? [];
              // 공결(출석 인정)은 분자 제외 → 출석률 = 출석 / 전체
              const attended = list.filter(r => r.status === '출석').length;
              const rate = list.length > 0 ? Math.round((attended / list.length) * 100) : 0;

              return {
                clubName: `${m.clubs?.name ?? '—'} ${m.generation ?? ''}`.trim(),
                rate,
                records: list,
              };
            })
          ),
          supabase
            .from('attendance_excuse_requests')
            .select('id, excuse_date, reason_category, status, reviewer_note')
            .in('member_id', memberIds)
            .order('created_at', { ascending: false }),
        ]);

        setGroups(result);
        setExcuses((excuseRes.data ?? []) as ExcuseRow[]);
        setFetching(false);
      });
  }, [user]);

  const statusColor: Record<string, string> = {
    '출석': 'text-green-600',
    '지각': 'text-yellow-600',
    '결석': 'text-red-500',
    '공결': 'text-blue-600',
  };

  const excuseBadge: Record<string, string> = {
    '대기': 'bg-amber-100 text-amber-700 border-amber-300',
    '승인': 'bg-green-100 text-green-700 border-green-300',
    '반려': 'bg-red-100 text-red-700 border-red-300',
    '취소': 'bg-gray-100 text-gray-500 border-gray-300',
  };

  return (
    <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-orange-500" /> 활동 및 출결
      </h3>

      {!fetching && excuses.length > 0 && (
        <div className="mb-8 border border-gray-200 p-4">
          <p className="font-black text-sm mb-3">출석 인정 신청 내역</p>
          <div className="flex flex-col gap-2">
            {excuses.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2 flex-wrap text-sm">
                <div className="flex items-center gap-2 font-bold text-gray-600">
                  <span>{formatDate(e.excuse_date + 'T00:00:00')}</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs">{e.reason_category}</span>
                  {e.status === '반려' && e.reviewer_note && (
                    <span className="text-xs text-red-500">· {e.reviewer_note}</span>
                  )}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 border font-bold ${excuseBadge[e.status] ?? ''}`}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-bold border-2 border-dashed border-gray-300 flex flex-col items-center gap-4">
          <p>소속된 동아리가 없습니다.</p>
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-black text-sm border border-black hover:bg-orange-500 hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            동아리 찾아보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map(g => (
            <div key={g.clubName}>
              <div className="flex justify-between items-end border-b-2 border-black pb-2 px-2 mb-4">
                <div className="font-bold text-gray-500">{g.clubName}</div>
                <div className="font-black text-xl text-orange-500">출석률 {g.rate}%</div>
              </div>

              {g.records.length === 0 ? (
                <p className="text-gray-400 font-bold text-sm text-center py-4">
                  출결 내역이 없습니다.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-100 border-b-2 border-black font-black">
                    <tr>
                      <th className="p-3">일자</th>
                      <th className="p-3">세션명</th>
                      <th className="p-3 text-right">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-bold">
                    {g.records.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-500">
                          {formatDate(r.recorded_at)}
                        </td>
                        <td className="p-3">{(r.sessions as any)?.title ?? '—'}</td>
                        <td className={`p-3 text-right font-black ${statusColor[r.status] ?? ''}`}>
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
