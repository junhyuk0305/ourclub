import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, Loader, ChevronRight, Edit3, Download, Trash2, AlertTriangle, MinusCircle, X } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll } from '../../lib/fetchAll';
import { downloadExcel } from '../../lib/excel';
import { formatDate } from '../../lib/format';

interface SessionWithCounts {
  id: string;
  title: string;
  attendance_code: string;
  session_date: string | null;
  expires_at: string | null;
  created_at: string;
  target_generations: string[] | null;
  target_count: number;
  attended_count: number;
}

const fmtDate = (s: string | null) =>
  s ? formatDate(s + 'T00:00:00') : null;

export default function AttendanceList() {
  const { adminClubId } = useAdmin();
  const [sessions, setSessions] = useState<SessionWithCounts[]>([]);
  const [fetching, setFetching] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [genFilter, setGenFilter] = useState<string>('');
  const [generations, setGenerations] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SessionWithCounts | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);

  useEffect(() => {
    if (!adminClubId) return;
    loadSessions(adminClubId);
  }, [adminClubId]);

  const loadSessions = async (clubId: string) => {
    setFetching(true);
    const { data } = await fetchAll<SessionWithCounts>((from, to) => supabase
      .from('sessions_with_counts')
      .select('id, title, attendance_code, session_date, expires_at, created_at, target_generations, target_count, attended_count')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .range(from, to));
    const rows = (data ?? []) as SessionWithCounts[];
    setSessions(rows);
    // unique generations across sessions
    const gens = new Set<string>();
    rows.forEach(r => r.target_generations?.forEach(g => gens.add(g)));
    setGenerations(Array.from(gens).sort());
    setFetching(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    const { error } = await supabase.from('sessions').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error.message);
      return;
    }
    setSessions(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const filtered = sessions.filter(s => {
    const refDate = s.session_date ?? s.created_at.split('T')[0];
    if (dateFrom && refDate < dateFrom) return false;
    if (dateTo && refDate > dateTo) return false;
    if (genFilter && !(s.target_generations ?? []).includes(genFilter)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-5xl flex flex-col gap-6">
            <div className="border-b border-black pb-6">
              <h2 className="text-4xl font-black mb-2">전체 세션 관리</h2>
              <p className="text-gray-500 font-bold">과거 세션 기록과 출석 통계를 한눈에 확인합니다.</p>
            </div>

            {/* 필터 */}
            <div className="bg-white border border-black p-4 flex flex-wrap items-end gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="p-2 border border-black font-bold text-sm outline-none focus:border-orange-500"
                />
                <span className="font-black text-gray-400">~</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="p-2 border border-black font-bold text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <select
                  value={genFilter}
                  onChange={e => setGenFilter(e.target.value)}
                  className="p-2 border border-black font-bold text-sm outline-none focus:border-orange-500 bg-white cursor-pointer"
                >
                  <option value="">모든 기수</option>
                  {generations.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              {(dateFrom || dateTo || genFilter) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setGenFilter(''); }}
                  className="text-xs font-black text-orange-500 hover:underline"
                >
                  필터 초기화
                </button>
              )}
              <button
                onClick={() => setDeleteMode(v => !v)}
                disabled={filtered.length === 0 && !deleteMode}
                className={`ml-auto px-3 py-2 border border-black font-black text-sm flex items-center gap-1 disabled:opacity-50 ${
                  deleteMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white hover:bg-gray-100'
                }`}
              >
                {deleteMode ? <><X className="w-4 h-4" /> 삭제 모드 종료</> : <><Trash2 className="w-4 h-4" /> 세션 삭제</>}
              </button>
              <button
                onClick={async () => {
                  const rows = filtered.map(s => {
                    const rate = s.target_count > 0 ? Math.round(s.attended_count / s.target_count * 100) : 0;
                    return {
                      '일자': s.session_date ?? s.created_at.split('T')[0],
                      '활동 기수': (s.target_generations ?? []).join(', '),
                      '세션 이름': s.title,
                      '대상자 수': s.target_count,
                      '출석자 수': s.attended_count,
                      '출석률 (%)': rate,
                      '출석 코드': s.attendance_code,
                    };
                  });
                  await downloadExcel(rows, '세션출석통계', '세션');
                }}
                disabled={filtered.length === 0}
                className="px-3 py-2 border border-black bg-white hover:bg-gray-100 font-black text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> 엑셀 다운로드
              </button>
            </div>

            {/* 리스트 */}
            <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {fetching ? (
                <div className="flex justify-center py-16">
                  <Loader className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Edit3 className="w-10 h-10 text-gray-200" />
                  <p className="font-bold text-gray-400">
                    {sessions.length === 0 ? '아직 생성된 세션이 없습니다.' : '필터에 해당하는 세션이 없습니다.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-sm">
                      {deleteMode && <th className="p-4 font-black w-10"></th>}
                      <th className="p-4 font-black">일자</th>
                      <th className="p-4 font-black">활동 기수</th>
                      <th className="p-4 font-black">세션 이름</th>
                      <th className="p-4 font-black">출석 현황</th>
                      <th className="p-4 font-black w-32"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map(s => {
                      const rate = s.target_count > 0 ? Math.round(s.attended_count / s.target_count * 100) : 0;
                      const isActive = s.expires_at && new Date(s.expires_at) > new Date();
                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          {deleteMode && (
                            <td className="p-4">
                              <button
                                onClick={() => { setDeleteError(''); setDeleteTarget(s); }}
                                title="세션 삭제"
                                aria-label="세션 삭제"
                                className="text-red-500 hover:text-red-700"
                              >
                                <MinusCircle className="w-6 h-6 fill-red-500 text-white" />
                              </button>
                            </td>
                          )}
                          <td className="p-4 font-bold text-sm">
                            {fmtDate(s.session_date) ?? formatDate(s.created_at)}
                          </td>
                          <td className="p-4 text-sm">
                            {s.target_generations && s.target_generations.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {s.target_generations.map(g => (
                                  <span key={g} className="px-2 py-0.5 bg-gray-100 border border-gray-300 font-bold text-xs">{g}</span>
                                ))}
                              </div>
                            ) : <span className="text-gray-400 font-bold text-xs">미지정</span>}
                          </td>
                          <td className="p-4 font-black">
                            {s.title}
                            {isActive && (
                              <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white font-black text-xs">LIVE</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-[120px] h-2.5 bg-gray-200 border border-gray-300">
                                <div className="h-full bg-orange-500" style={{ width: `${rate}%` }} />
                              </div>
                              <span className="font-black text-sm whitespace-nowrap">
                                {rate}% <span className="text-gray-400 font-bold text-xs">({s.attended_count}/{s.target_count})</span>
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Link
                              to={`/admin/sessions/${s.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-black bg-white font-black text-xs hover:bg-orange-500 hover:text-white"
                            >
                              상세보기 <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-7 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-7 h-7 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-2xl font-black mb-1">세션 삭제</h2>
                <p className="text-gray-600 font-bold text-sm">
                  <strong className="text-black">"{deleteTarget.title}"</strong> 세션을 삭제합니다.<br />
                  대상자 목록과 출석 기록이 모두 함께 삭제되며 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            {deleteError && (
              <p className="bg-red-50 border-2 border-red-500 px-3 py-2 text-red-700 font-bold text-sm">
                삭제 실패: {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white font-black border-2 border-black hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <Loader className="w-4 h-4 animate-spin" />}
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
