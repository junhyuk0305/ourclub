import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader, Save, AlertTriangle, Info } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll } from '../../lib/fetchAll';
import { formatDate } from '../../lib/format';

type AttStatus = '출석' | '지각' | '결석' | '공결';
const STATUS_OPTIONS: AttStatus[] = ['출석', '지각', '결석', '공결'];

const STATUS_COLOR: Record<AttStatus, string> = {
  '출석': 'text-ok-fg border-sand-300 bg-ok-bg',
  '지각': 'text-warn-fg border-sand-300 bg-warn-bg',
  '결석': 'text-bad-fg border-sand-300 bg-bad-bg',
  '공결': 'text-info-fg border-sand-300 bg-info-bg',
};

interface SessionInfo {
  id: string;
  title: string;
  session_date: string | null;
  created_at: string;
  target_generations: string[] | null;
}

interface Row {
  memberId: string;
  memberName: string;
  generation: string | null;
  position: string | null;
  attendanceId: string | null;
  status: AttStatus | null;
}

const fmtDate = (s: string | null) =>
  s ? formatDate(s + 'T00:00:00') : null;

export default function AttendanceDetail() {
  const { id } = useParams<{ id: string }>();
  const { adminClubId } = useAdmin();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AttStatus>>({});
  const [fetching, setFetching] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!id || !adminClubId) return;
    load(id);
  }, [id, adminClubId]);

  const load = async (sessionId: string) => {
    setFetching(true);
    const [sRes, tRes, aRes] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, title, session_date, created_at, target_generations')
        .eq('id', sessionId)
        .single(),
      fetchAll((from, to) => supabase
        .from('session_targets')
        .select('member_id, club_members(id, generation, position, profiles(name))')
        .eq('session_id', sessionId)
        .range(from, to)),
      fetchAll((from, to) => supabase
        .from('attendances')
        .select('id, member_id, status')
        .eq('session_id', sessionId)
        .range(from, to)),
    ]);

    if (sRes.data) setSession(sRes.data as SessionInfo);

    const attMap = new Map(
      (aRes.data ?? []).map(a => [a.member_id, { id: a.id as string, status: a.status as AttStatus }])
    );

    const merged: Row[] = ((tRes.data ?? []) as unknown as Array<{
      member_id: string;
      club_members: { id: string; generation: string | null; position: string | null; profiles: { name: string } | null } | null;
    }>).map(t => {
      const cm = t.club_members;
      const att = attMap.get(t.member_id);
      return {
        memberId: t.member_id,
        memberName: cm?.profiles?.name ?? '—',
        generation: cm?.generation ?? null,
        position: cm?.position ?? null,
        attendanceId: att?.id ?? null,
        status: att?.status ?? null,
      };
    });

    setRows(merged);
    setDrafts({});
    setFetching(false);
  };

  const getStatus = (r: Row): AttStatus | null => drafts[r.memberId] ?? r.status;

  const setDraft = (memberId: string, status: AttStatus) => {
    setDrafts(prev => {
      const next = { ...prev };
      const original = rows.find(r => r.memberId === memberId)?.status ?? null;
      if (status === original) delete next[memberId];
      else next[memberId] = status;
      return next;
    });
  };

  const draftCount = Object.keys(drafts).length;
  const attendedCount = rows.filter(r => getStatus(r) === '출석').length;
  const targetCount = rows.length;
  const rate = targetCount > 0 ? Math.round(attendedCount / targetCount * 100) : 0;

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const saveAll = async () => {
    setBulkSaving(true);

    // 멤버 수만큼 개별 insert/update 를 동시 발사하던 것을 단일 upsert 로.
    // (session_id, member_id) 유일 제약 기반이라 신규/기존을 한 번에 처리하고,
    // load↔save 사이 셀프체크인/타 운영진 저장으로 행이 생겨도 충돌 없이 갱신된다.
    const upsertRows = Object.entries(drafts).map(([memberId, status]) => ({
      session_id: id,
      member_id: memberId,
      status,
    }));

    const { error } = await supabase
      .from('attendances')
      .upsert(upsertRows, { onConflict: 'session_id,member_id' });

    setBulkSaving(false);
    setShowSaveModal(false);

    if (error) {
      showToastMsg(`저장 실패. 다시 시도해주세요.`);
      return;
    }
    showToastMsg(`${Object.keys(drafts).length}건의 출석 상태가 저장되었습니다.`);
    if (id) load(id);
  };

  return (
    <>
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-4xl flex flex-col gap-6">
            <Link to="/admin/sessions" className="inline-flex items-center gap-1 text-sm font-bold text-sand-500 hover:text-ink w-fit">
              <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> 전체 세션 관리로
            </Link>

            {fetching ? (
              <LoadingScreen />
            ) : !session ? (
              <p className="font-bold text-sand-400">세션을 찾을 수 없습니다.</p>
            ) : (
              <>
                <div className="border-b border-sand-200 pb-6">
                  <h2 className="text-4xl font-black text-ink mb-2">{session.title}</h2>
                  <p className="text-sand-500 font-bold text-sm">
                    {fmtDate(session.session_date) ?? formatDate(session.created_at)}
                    {session.target_generations && session.target_generations.length > 0 && (
                      <> · 대상 기수: {session.target_generations.join(', ')}</>
                    )}
                  </p>
                </div>

                {/* 요약 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-sand-200 rounded-card p-5 shadow-soft">
                    <p className="text-xs font-bold text-sand-500 mb-1">총 대상</p>
                    <p className="text-3xl font-black text-ink">{targetCount}<span className="text-sm font-bold text-sand-400 ml-1">명</span></p>
                  </div>
                  <div className="bg-white border border-sand-200 rounded-card p-5 shadow-soft">
                    <p className="text-xs font-bold text-sand-500 mb-1">출석</p>
                    <p className="text-3xl font-black text-ok-fg">{attendedCount}<span className="text-sm font-bold text-sand-400 ml-1">명</span></p>
                  </div>
                  <div className="bg-white border border-sand-200 rounded-card p-5 shadow-soft">
                    <p className="text-xs font-bold text-sand-500 mb-1">출석률</p>
                    <p className="text-3xl font-black text-brand">{rate}%</p>
                  </div>
                </div>

                {draftCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-tint rounded-ctl text-brand-dark font-bold text-sm">
                    <Info className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                    <span>변경된 행은 주황색으로 표시됩니다. 하단의 <strong>저장</strong> 버튼을 눌러 확정하세요.</span>
                  </div>
                )}

                {/* 명단 테이블 */}
                <div className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden">
                  {rows.length === 0 ? (
                    <div className="py-12 text-center font-bold text-sand-400">
                      대상자가 없습니다.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-sand-50 border-b border-sand-200 text-sm text-sand-500">
                          <th className="p-4 font-bold">이름</th>
                          <th className="p-4 font-bold">기수</th>
                          <th className="p-4 font-bold">직책</th>
                          <th className="p-4 font-bold w-40">출석 상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-200">
                        {rows.map(r => {
                          const cur = getStatus(r);
                          const isDirty = drafts[r.memberId] !== undefined;
                          return (
                            <tr key={r.memberId} className={isDirty ? 'bg-brand-tint' : 'hover:bg-sand-50'}>
                              <td className="p-4 font-black text-ink">{r.memberName}</td>
                              <td className="p-4 text-sm font-bold text-sand-500">{r.generation ?? '—'}</td>
                              <td className="p-4 text-sm font-bold text-sand-500">{r.position ?? '—'}</td>
                              <td className="p-4">
                                <select
                                  value={cur ?? ''}
                                  onChange={e => setDraft(r.memberId, e.target.value as AttStatus)}
                                  className={`px-2 py-1.5 border rounded-ctl font-bold text-xs cursor-pointer outline-none ${
                                    cur ? STATUS_COLOR[cur] : 'border-sand-300 text-sand-400 bg-white'
                                  }`}
                                >
                                  {!cur && <option value="" disabled>미체크</option>}
                                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

      {/* 하단 고정 저장 바 */}
      {draftCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 btn-grad text-white rounded-card px-6 py-3 shadow-soft-lg flex items-center gap-4">
          <span className="font-black text-sm">
            <strong>{draftCount}건</strong>의 변경사항이 있습니다
          </span>
          <button
            onClick={() => setDrafts({})}
            className="px-3 py-1.5 rounded-ctl bg-white font-bold text-xs text-ink hover:bg-sand-50"
          >
            취소
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={bulkSaving}
            className="px-4 py-1.5 rounded-ctl bg-ink text-white font-bold text-xs hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
          >
            {bulkSaving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" strokeWidth={2.5} />}
            저장
          </button>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-md mx-4 p-8 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-7 h-7 text-brand shrink-0 mt-0.5" strokeWidth={2.5} />
              <div>
                <h2 className="text-2xl font-black text-ink mb-1">출석 상태 저장</h2>
                <p className="text-sand-600 font-bold text-sm">
                  총 <strong className="text-ink">{draftCount}건</strong>의 출석 상태가 변경되었습니다.<br />
                  저장하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={bulkSaving}
                className="flex-1 py-3 rounded-ctl border border-sand-300 font-bold text-ink hover:bg-sand-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={saveAll}
                disabled={bulkSaving}
                className="flex-1 py-3 btn-grad text-white rounded-ctl font-bold shadow-btn hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkSaving && <Loader className="w-4 h-4 animate-spin" />}
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-ink text-white rounded-card px-6 py-4 font-bold flex items-center gap-2 shadow-soft-lg">
          {toast}
        </div>
      )}
    </>
  );
}
