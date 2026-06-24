import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDate } from '../../../lib/format';
import { attendanceRate } from '../../../lib/attendanceRate';

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

export default function AttendanceHistorySection({ refreshKey }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<{ clubName: string; rate: number | null; records: any[] }[]>([]);
  const [excuses, setExcuses] = useState<ExcuseRow[]>([]);
  const [fetching, setFetching] = useState(true);
  // 동아리별 보기 필터 (소속 동아리 2개 이상일 때만 노출)
  const [selectedClub, setSelectedClub] = useState<string>('all');

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
              const [{ data: records }, { data: targets }] = await Promise.all([
                supabase
                  .from('attendances')
                  .select('status, recorded_at, session_id, sessions ( title )')
                  .eq('member_id', m.id)
                  .order('recorded_at', { ascending: false }),
                supabase
                  .from('session_targets')
                  .select('session_id')
                  .eq('member_id', m.id),
              ]);

              const list = records ?? [];
              // 운영진 명단과 동일 기준(session_targets 분모, '출석' 분자)으로 통일
              const targetIds = (targets ?? []).map((t: any) => t.session_id);
              const attendedIds = list.filter(r => r.status === '출석').map((r: any) => r.session_id);
              const rate = attendanceRate(targetIds, attendedIds);

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
  }, [user, refreshKey]);

  const statusColor: Record<string, string> = {
    '출석': 'text-ok-fg',
    '지각': 'text-warn-fg',
    '결석': 'text-bad-fg',
    '공결': 'text-info-fg',
  };

  const excuseBadge: Record<string, string> = {
    '대기': 'bg-warn-bg text-warn-fg',
    '승인': 'bg-ok-bg text-ok-fg',
    '반려': 'bg-bad-bg text-bad-fg',
    '취소': 'bg-off-bg text-off-fg',
  };

  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-8">
      <h3 className="text-2xl font-black text-ink mb-6 flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-brand" strokeWidth={2.5} /> 활동 및 출결
      </h3>

      {!fetching && excuses.length > 0 && (
        <div className="mb-8 border border-sand-200 rounded-card p-4">
          <p className="font-black text-sm text-ink mb-3">출석 인정 신청 내역</p>
          <div className="flex flex-col gap-2">
            {excuses.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2 flex-wrap text-sm">
                <div className="flex items-center gap-2 font-bold text-sand-600">
                  <span>{formatDate(e.excuse_date + 'T00:00:00')}</span>
                  <span className="px-1.5 py-0.5 bg-sand-100 text-sand-500 text-xs rounded-ctl">{e.reason_category}</span>
                  {e.status === '반려' && e.reviewer_note && (
                    <span className="text-xs text-bad-fg">· {e.reviewer_note}</span>
                  )}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-ctl font-bold ${excuseBadge[e.status] ?? ''}`}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-sand-400" /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-sand-500 font-bold border border-dashed border-sand-300 rounded-card flex flex-col items-center gap-4">
          <p>소속된 동아리가 없습니다.</p>
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 px-6 py-2.5 btn-grad text-white rounded-ctl font-bold text-sm shadow-btn hover:-translate-y-0.5 transition-all"
          >
            동아리 찾아보기 <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.length > 1 && (
            <div className="flex flex-wrap gap-2 -mt-2">
              {[{ key: 'all', label: '전체' }, ...groups.map(g => ({ key: g.clubName, label: g.clubName }))].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedClub(opt.key)}
                  className={`px-4 py-2 text-sm font-bold rounded-ctl transition-colors ${
                    selectedClub === opt.key
                      ? 'btn-grad text-white shadow-btn'
                      : 'bg-white text-sand-600 border border-sand-200 hover:bg-sand-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {(selectedClub === 'all' ? groups : groups.filter(g => g.clubName === selectedClub)).map(g => (
            <div key={g.clubName}>
              <div className="flex justify-between items-end border-b border-sand-200 pb-2 px-2 mb-4">
                <div className="font-bold text-sand-500">{g.clubName}</div>
                <div className="font-black text-xl text-brand">출석률 {g.rate != null ? `${g.rate}%` : '—'}</div>
              </div>

              {g.records.length === 0 ? (
                <p className="text-sand-400 font-bold text-sm text-center py-4">
                  출결 내역이 없습니다.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-sand-50 text-sand-500 border-b border-sand-200 font-black">
                    <tr>
                      <th className="p-3">일자</th>
                      <th className="p-3">세션명</th>
                      <th className="p-3 text-right">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200 font-bold">
                    {g.records.map((r, i) => (
                      <tr key={i} className="hover:bg-sand-50">
                        <td className="p-3 text-sand-500">
                          {formatDate(r.recorded_at)}
                        </td>
                        <td className="p-3 text-ink">{(r.sessions as any)?.title ?? '—'}</td>
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
