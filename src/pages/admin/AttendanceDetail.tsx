import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader, Save, AlertTriangle, Info } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

type AttStatus = '출석' | '지각' | '결석' | '공결';
const STATUS_OPTIONS: AttStatus[] = ['출석', '지각', '결석', '공결'];

const STATUS_COLOR: Record<AttStatus, string> = {
  '출석': 'text-green-600 border-green-500 bg-green-50',
  '지각': 'text-yellow-600 border-yellow-500 bg-yellow-50',
  '결석': 'text-red-600 border-red-500 bg-red-50',
  '공결': 'text-blue-600 border-blue-500 bg-blue-50',
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
  s ? new Date(s + 'T00:00:00').toLocaleDateString('ko-KR') : null;

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
      supabase
        .from('session_targets')
        .select('member_id, club_members(id, generation, position, profiles(name))')
        .eq('session_id', sessionId),
      supabase
        .from('attendances')
        .select('id, member_id, status')
        .eq('session_id', sessionId),
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

    const ops = Object.entries(drafts).map(async ([memberId, status]) => {
      const row = rows.find(r => r.memberId === memberId);
      if (!row) return { error: null };
      if (row.attendanceId) {
        return supabase.from('attendances').update({ status }).eq('id', row.attendanceId);
      }
      return supabase.from('attendances').insert({
        session_id: id,
        member_id: memberId,
        status,
      });
    });

    const results = await Promise.all(ops);
    const failed = results.filter(r => r && 'error' in r && r.error).length;

    setBulkSaving(false);
    setShowSaveModal(false);

    if (failed > 0) {
      showToastMsg(`${failed}건 저장 실패. 다시 시도해주세요.`);
      return;
    }
    showToastMsg(`${Object.keys(drafts).length}건의 출석 상태가 저장되었습니다.`);
    if (id) load(id);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-4xl flex flex-col gap-6">
            <Link to="/admin/sessions" className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-black w-fit">
              <ArrowLeft className="w-4 h-4" /> 전체 세션 관리로
            </Link>

            {fetching ? (
              <div className="flex justify-center py-16">
                <Loader className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : !session ? (
              <p className="font-bold text-gray-400">세션을 찾을 수 없습니다.</p>
            ) : (
              <>
                <div className="border-b border-black pb-6">
                  <h2 className="text-4xl font-black mb-2">{session.title}</h2>
                  <p className="text-gray-500 font-bold text-sm">
                    {fmtDate(session.session_date) ?? new Date(session.created_at).toLocaleDateString('ko-KR')}
                    {session.target_generations && session.target_generations.length > 0 && (
                      <> · 대상 기수: {session.target_generations.join(', ')}</>
                    )}
                  </p>
                </div>

                {/* 요약 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-bold text-gray-500 mb-1">총 대상</p>
                    <p className="text-3xl font-black">{targetCount}<span className="text-sm font-bold text-gray-400 ml-1">명</span></p>
                  </div>
                  <div className="bg-white border border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-bold text-gray-500 mb-1">출석</p>
                    <p className="text-3xl font-black text-green-600">{attendedCount}<span className="text-sm font-bold text-gray-400 ml-1">명</span></p>
                  </div>
                  <div className="bg-white border border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-bold text-gray-500 mb-1">출석률</p>
                    <p className="text-3xl font-black text-orange-500">{rate}%</p>
                  </div>
                </div>

                {draftCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-sm">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>변경된 행은 주황색으로 표시됩니다. 하단의 <strong>저장</strong> 버튼을 눌러 확정하세요.</span>
                  </div>
                )}

                {/* 명단 테이블 */}
                <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {rows.length === 0 ? (
                    <div className="py-12 text-center font-bold text-gray-400">
                      대상자가 없습니다.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-sm">
                          <th className="p-4 font-black">이름</th>
                          <th className="p-4 font-black">기수</th>
                          <th className="p-4 font-black">직책</th>
                          <th className="p-4 font-black w-40">출석 상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rows.map(r => {
                          const cur = getStatus(r);
                          const isDirty = drafts[r.memberId] !== undefined;
                          return (
                            <tr key={r.memberId} className={isDirty ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                              <td className="p-4 font-black">{r.memberName}</td>
                              <td className="p-4 text-sm font-bold text-gray-500">{r.generation ?? '—'}</td>
                              <td className="p-4 text-sm font-bold text-gray-500">{r.position ?? '—'}</td>
                              <td className="p-4">
                                <select
                                  value={cur ?? ''}
                                  onChange={e => setDraft(r.memberId, e.target.value as AttStatus)}
                                  className={`px-2 py-1.5 border-2 font-bold text-xs cursor-pointer outline-none ${
                                    cur ? STATUS_COLOR[cur] : 'border-gray-300 text-gray-400 bg-white'
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
      </div>

      {/* 하단 고정 저장 바 */}
      {draftCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-orange-500 border-2 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
          <span className="font-black text-sm">
            <strong>{draftCount}건</strong>의 변경사항이 있습니다
          </span>
          <button
            onClick={() => setDrafts({})}
            className="px-3 py-1.5 border-2 border-black bg-white font-black text-xs hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={bulkSaving}
            className="px-4 py-1.5 bg-black text-white font-black text-xs border-2 border-black hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1"
          >
            {bulkSaving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            저장
          </button>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-7 h-7 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-2xl font-black mb-1">출석 상태 저장</h2>
                <p className="text-gray-600 font-bold text-sm">
                  총 <strong className="text-black">{draftCount}건</strong>의 출석 상태가 변경되었습니다.<br />
                  저장하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={bulkSaving}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={saveAll}
                disabled={bulkSaving}
                className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkSaving && <Loader className="w-4 h-4 animate-spin" />}
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]">
          {toast}
        </div>
      )}
    </div>
  );
}
