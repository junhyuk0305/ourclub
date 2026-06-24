import { useEffect, useMemo, useState } from 'react';
import { Loader, CalendarDays, List, Check, X, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { SessionTabs } from '../../components/admin/SessionTabs';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll } from '../../lib/fetchAll';
import { formatDate } from '../../lib/format';

const REASONS = ['개인 일정', '병가', '교내 일정', '자격증 시험', '가족 행사', '기타'];
type ReqStatus = '대기' | '승인' | '반려' | '취소';

interface ExcuseReq {
  id: string;
  member_id: string;
  session_id: string | null;
  excuse_date: string;
  reason_category: string;
  detail: string | null;
  file_url: string | null;
  status: ReqStatus;
  reviewer_note: string | null;
  created_at: string;
  memberName: string;
  generation: string | null;
  sessionTitle: string | null;
}

const STATUS_BADGE: Record<ReqStatus, string> = {
  '대기': 'bg-warn-bg text-warn-fg',
  '승인': 'bg-ok-bg text-ok-fg',
  '반려': 'bg-bad-bg text-bad-fg',
  '취소': 'bg-off-bg text-off-fg',
};
const DOT_COLOR: Record<ReqStatus, string> = {
  '대기': 'bg-warn-fg',
  '승인': 'bg-ok-fg',
  '반려': 'bg-bad-fg',
  '취소': 'bg-off-fg',
};

export default function AttendanceExcuses() {
  const { adminClubId } = useAdmin();
  const { user } = useAuth();
  const [reqs, setReqs] = useState<ExcuseReq[]>([]);
  const [fetching, setFetching] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<'전체' | ReqStatus>('전체');
  const [reasonFilter, setReasonFilter] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [toast, setToast] = useState('');

  // 달력
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClubId) return;
    load();
  }, [adminClubId]);

  const load = async () => {
    setFetching(true);
    const { data } = await fetchAll<any>((from, to) => supabase
      .from('attendance_excuse_requests')
      .select('id, member_id, session_id, excuse_date, reason_category, detail, file_url, status, reviewer_note, created_at, club_members ( generation, profiles ( name ) ), sessions ( title )')
      .eq('club_id', adminClubId)
      .order('created_at', { ascending: false })
      .range(from, to));

    const list: ExcuseReq[] = ((data ?? []) as any[]).map(r => ({
      id: r.id,
      member_id: r.member_id,
      session_id: r.session_id,
      excuse_date: r.excuse_date,
      reason_category: r.reason_category,
      detail: r.detail,
      file_url: r.file_url,
      status: r.status,
      reviewer_note: r.reviewer_note,
      created_at: r.created_at,
      memberName: r.club_members?.profiles?.name ?? '—',
      generation: r.club_members?.generation ?? null,
      sessionTitle: r.sessions?.title ?? null,
    }));
    setReqs(list);
    setFetching(false);
  };

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const approve = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc('approve_excuse_request', { p_request_id: id, p_note: null });
    setBusyId(null);
    if (error) { showToast('승인 처리에 실패했습니다.'); return; }
    showToast('출석 인정이 승인되었습니다.');
    load();
  };

  const reject = async (id: string) => {
    if (!rejectNote.trim()) { showToast('반려 사유를 입력해주세요.'); return; }
    setBusyId(id);
    const { error } = await supabase
      .from('attendance_excuse_requests')
      .update({ status: '반려', reviewer_note: rejectNote.trim(), reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    setBusyId(null);
    if (error) { showToast('반려 처리에 실패했습니다.'); return; }
    setRejectId(null); setRejectNote('');
    showToast('신청이 반려되었습니다.');
    load();
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: reqs.length, 대기: 0, 승인: 0, 반려: 0, 취소: 0 };
    reqs.forEach(r => { c[r.status]++; });
    return c;
  }, [reqs]);

  const filtered = useMemo(() => reqs.filter(r => {
    if (statusFilter !== '전체' && r.status !== statusFilter) return false;
    if (reasonFilter && r.reason_category !== reasonFilter) return false;
    if (search && !r.memberName.includes(search.trim())) return false;
    if (view === 'calendar' && selectedDate && r.excuse_date !== selectedDate) return false;
    return true;
  }), [reqs, statusFilter, reasonFilter, search, view, selectedDate]);

  // 달력 셀 데이터
  const monthReqs = useMemo(() => {
    const map = new Map<string, ExcuseReq[]>();
    reqs.forEach(r => {
      const d = new Date(r.excuse_date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const arr = map.get(r.excuse_date) ?? [];
        arr.push(r); map.set(r.excuse_date, arr);
      }
    });
    return map;
  }, [reqs, calYear, calMonth]);

  const changeMonth = (delta: number) => {
    let m = calMonth + delta, y = calYear;
    if (m > 11) { m = 0; y++; } if (m < 0) { m = 11; y--; }
    setCalMonth(m); setCalYear(y); setSelectedDate(null);
  };

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const dateStr = (d: number) => `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <>
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-5xl flex flex-col gap-6">
            <SessionTabs />

            <div>
              <h3 className="text-lg font-black text-ink mb-1">출석 인정 신청 검토</h3>
              <p className="text-sand-500 font-bold text-sm">부원이 신청한 출석 인정 요청을 검토하고 승인 또는 반려하세요.</p>
            </div>

            {/* 뷰 토글 */}
            <div className="flex bg-sand-100 rounded-ctl p-1 w-fit gap-1">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-ctl font-bold text-sm transition-all ${view === 'list' ? 'bg-white text-ink shadow-soft' : 'text-sand-500 hover:text-ink'}`}
              >
                <List className="w-4 h-4" strokeWidth={2.5} /> 신청 목록
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-ctl font-bold text-sm transition-all ${view === 'calendar' ? 'bg-white text-ink shadow-soft' : 'text-sand-500 hover:text-ink'}`}
              >
                <CalendarDays className="w-4 h-4" strokeWidth={2.5} /> 달력 뷰
              </button>
            </div>

            {fetching ? (
              <LoadingScreen />
            ) : (
              <>
                {/* 상태 필터 탭 */}
                <div className="flex flex-wrap gap-2">
                  {(['전체', '대기', '승인', '반려', '취소'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-ctl font-bold text-xs flex items-center gap-1.5 transition-all ${statusFilter === s ? 'bg-ink text-white' : 'bg-white border border-sand-300 text-ink hover:bg-sand-50'}`}
                    >
                      {s} <span className={`px-1.5 rounded ${statusFilter === s ? 'bg-white/20' : 'bg-sand-100'}`}>{counts[s] ?? 0}</span>
                    </button>
                  ))}
                </div>

                {view === 'calendar' && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
                    {/* 달력 */}
                    <div className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b border-sand-200">
                        <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-ctl border border-sand-300 flex items-center justify-center hover:bg-sand-50"><ChevronLeft className="w-4 h-4" strokeWidth={2.5} /></button>
                        <span className="font-black text-lg text-ink">{calYear}년 {calMonth + 1}월</span>
                        <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-ctl border border-sand-300 flex items-center justify-center hover:bg-sand-50"><ChevronRight className="w-4 h-4" strokeWidth={2.5} /></button>
                      </div>
                      <div className="grid grid-cols-7 border-b border-sand-200">
                        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                          <div key={d} className={`text-center text-xs font-black py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-info-fg' : 'text-sand-400'}`}>{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="min-h-[72px] border-r border-b border-sand-200 bg-sand-50" />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const ds = dateStr(day);
                          const dayReqs = monthReqs.get(ds) ?? [];
                          const isSel = selectedDate === ds;
                          return (
                            <button
                              key={day}
                              onClick={() => setSelectedDate(isSel ? null : ds)}
                              className={`min-h-[72px] border-r border-b border-sand-200 p-1.5 text-left align-top hover:bg-brand-tint ${isSel ? 'bg-brand-tint' : ''}`}
                            >
                              <span className="text-xs font-bold text-sand-600">{day}</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {dayReqs.slice(0, 6).map(r => <span key={r.id} className={`w-2 h-2 rounded-full ${DOT_COLOR[r.status]}`} />)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 선택 일자 요약 */}
                    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-4 lg:sticky lg:top-0">
                      <p className="font-black text-sm text-ink mb-3">
                        {selectedDate ? formatDate(selectedDate + 'T00:00:00') : '날짜를 선택하세요'}
                      </p>
                      {!selectedDate ? (
                        <p className="text-sand-400 font-bold text-xs">달력에서 날짜를 클릭하면<br />해당 일자 신청을 볼 수 있어요.</p>
                      ) : filtered.length === 0 ? (
                        <p className="text-sand-400 font-bold text-xs">이 날짜의 신청이 없어요.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {filtered.map(r => (
                            <div key={r.id} className="border border-sand-200 rounded-ctl p-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-sm text-ink">{r.memberName}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-ctl font-bold ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                              </div>
                              <p className="text-xs font-bold text-sand-400 mt-0.5">{r.reason_category}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {view === 'list' && (
                  <>
                    {/* 필터 행 */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)} className="field px-3 py-2 border border-sand-300 rounded-ctl font-bold text-xs outline-none">
                        <option value="">전체 사유</option>
                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="이름으로 검색..."
                        className="field flex-1 min-w-[160px] px-3 py-2 border border-sand-300 rounded-ctl font-bold text-xs outline-none placeholder:text-sand-400"
                      />
                      <span className="text-xs font-bold text-sand-400 ml-auto">총 {filtered.length}건</span>
                    </div>

                    {/* 목록 */}
                    {filtered.length === 0 ? (
                      <div className="py-16 text-center font-bold text-sand-400 border border-dashed border-sand-300 rounded-card">해당 조건의 신청 내역이 없어요.</div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {filtered.map(r => (
                          <div key={r.id} className="bg-white border border-sand-200 rounded-card p-4 shadow-soft flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-ink">{r.memberName}</span>
                                {r.generation && <span className="text-xs font-bold text-sand-400">{r.generation}</span>}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-ctl font-bold ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                              </div>
                              <span className="text-xs font-bold text-sand-400">신청일 {formatDate(r.created_at)}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-sand-500">
                              <span>📅 {formatDate(r.excuse_date + 'T00:00:00')}</span>
                              {r.sessionTitle && <span>▶ {r.sessionTitle}</span>}
                              <span className="px-1.5 py-0.5 rounded-ctl bg-sand-100 text-sand-600">{r.reason_category}</span>
                            </div>
                            {r.detail && <p className="text-sm font-bold text-sand-600 bg-sand-50 border border-sand-200 rounded-ctl p-2.5">{r.detail}</p>}
                            {r.file_url && (
                              <a href={r.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline w-fit">
                                <Paperclip className="w-3.5 h-3.5" strokeWidth={2.5} /> 첨부파일 보기
                              </a>
                            )}
                            {r.status === '반려' && r.reviewer_note && (
                              <p className="text-xs font-bold text-bad-fg">반려 사유: {r.reviewer_note}</p>
                            )}

                            {r.status === '대기' && (
                              <div className="flex flex-col gap-2 pt-1">
                                {rejectId === r.id ? (
                                  <div className="flex gap-2 items-center flex-wrap">
                                    <input
                                      value={rejectNote}
                                      onChange={e => setRejectNote(e.target.value)}
                                      placeholder="반려 사유..."
                                      autoFocus
                                      className="flex-1 min-w-[180px] px-2.5 py-1.5 border border-red-300 rounded-ctl bg-bad-bg font-bold text-xs outline-none"
                                    />
                                    <button onClick={() => reject(r.id)} disabled={busyId === r.id} className="px-3 py-1.5 rounded-ctl bg-red-500 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1">
                                      {busyId === r.id && <Loader className="w-3 h-3 animate-spin" />} 반려 확인
                                    </button>
                                    <button onClick={() => { setRejectId(null); setRejectNote(''); }} className="px-3 py-1.5 rounded-ctl border border-sand-300 font-bold text-xs text-ink hover:bg-sand-50">취소</button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <button onClick={() => approve(r.id)} disabled={busyId === r.id} className="px-4 py-1.5 rounded-ctl btn-grad text-white font-bold text-xs shadow-btn hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-1">
                                      {busyId === r.id ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />} 승인
                                    </button>
                                    <button onClick={() => { setRejectId(r.id); setRejectNote(''); }} className="px-4 py-1.5 rounded-ctl border border-sand-300 bg-white font-bold text-xs text-ink hover:bg-sand-50 flex items-center gap-1">
                                      <X className="w-3.5 h-3.5" strokeWidth={2.5} /> 반려
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-ink text-white rounded-card px-6 py-4 font-bold flex items-center gap-2 shadow-soft-lg">
          {toast}
        </div>
      )}
    </>
  );
}
