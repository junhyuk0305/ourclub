import React, { useEffect, useRef, useState } from 'react';
import { Search, Mail, UserCheck, X, Check, Edit2, Loader, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';

type AppStatus = '서류심사' | '면접' | '최종합격' | '불합격';

interface Applicant {
  id: string;
  status: AppStatus;
  score: number | null;
  interviewer_note: string | null;
  interview_at: string | null;
  submitted_at: string;
  profiles: { name: string; email: string; phone: string | null; major: string | null; university: string | null; portfolio_url: string | null } | null;
  answers: Record<string, string>;
}

const STATUS_STYLE: Record<AppStatus, string> = {
  '서류심사': 'bg-white',
  '면접':     'bg-yellow-100',
  '최종합격': 'bg-green-100',
  '불합격':   'bg-red-100 text-red-700',
};

export default function RecruitAdmin() {
  const { adminClubId } = useAdmin();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'전체' | AppStatus>('전체');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBody, setEmailBody] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  // 인라인 메모 팝오버
  const [memoPopover, setMemoPopover] = useState<{ id: string; note: string } | null>(null);

  const TABS: ('전체' | AppStatus)[] = ['전체', '서류심사', '면접', '최종합격', '불합격'];

  useEffect(() => {
    if (!adminClubId) return;
    loadApplicants(adminClubId);
  }, [adminClubId]);

  const loadApplicants = async (clubId: string) => {
    setFetching(true);
    const { data: recruitments } = await supabase
      .from('recruitments')
      .select('id')
      .eq('club_id', clubId);

    if (!recruitments || recruitments.length === 0) { setFetching(false); return; }
    const rIds = recruitments.map(r => r.id);

    const { data } = await supabase
      .from('recruitment_applications')
      .select('id, status, score, interviewer_note, interview_at, submitted_at, answers, profiles(name, email, phone, major, university, portfolio_url)')
      .in('recruitment_id', rIds)
      .order('submitted_at', { ascending: false });

    setApplicants((data as unknown as Applicant[]) ?? []);
    setFetching(false);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const changeStatus = async (id: string, status: AppStatus) => {
    await supabase.from('recruitment_applications').update({ status }).eq('id', id);
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selectedApplicant?.id === id) setSelectedApplicant(prev => prev ? { ...prev, status } : null);
  };

  const batchChangeStatus = async (status: AppStatus) => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    await supabase.from('recruitment_applications').update({ status }).in('id', selectedIds);
    setApplicants(prev => prev.map(a => selectedIds.includes(a.id) ? { ...a, status } : a));
    showToast(`${selectedIds.length}명 → '${status}' 처리 완료`);
    setSelectedIds([]);
    setSaving(false);
  };

  const saveNote = async (id: string, score: number | null, note: string) => {
    await supabase.from('recruitment_applications').update({ score, interviewer_note: note }).eq('id', id);
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, score, interviewer_note: note } : a));
    if (selectedApplicant?.id === id) setSelectedApplicant(prev => prev ? { ...prev, score, interviewer_note: note } : null);
  };

  // 인라인 메모 저장
  const saveMemoPopover = async () => {
    if (!memoPopover) return;
    await supabase.from('recruitment_applications')
      .update({ interviewer_note: memoPopover.note })
      .eq('id', memoPopover.id);
    setApplicants(prev => prev.map(a => a.id === memoPopover.id ? { ...a, interviewer_note: memoPopover.note } : a));
    if (selectedApplicant?.id === memoPopover.id) {
      setSelectedApplicant(prev => prev ? { ...prev, interviewer_note: memoPopover.note } : null);
    }
    showToast('메모가 저장되었습니다.');
    setMemoPopover(null);
  };

  const filtered = applicants
    .filter(a => activeTab === '전체' || a.status === activeTab)
    .filter(a => !search || (a.profiles?.name ?? '').includes(search) || (a.profiles?.major ?? '').includes(search));

  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(a => a.id));

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        <Link to="/admin/form-builder" className="ml-4 px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none text-sm flex items-center gap-2">
          <Edit2 className="w-4 h-4" /> 지원서 폼 빌더
        </Link>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-50 flex flex-col overflow-y-auto p-8">
          <div className="flex justify-between items-end mb-8 border-b border-black pb-6">
            <div>
              <h2 className="text-4xl font-black mb-2">리크루팅 CRM</h2>
              <p className="text-gray-500 font-bold">지원자 현황 및 합격 처리를 관리합니다.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="이름, 전공 검색"
                className="pl-9 pr-4 py-2 border border-black font-bold outline-none focus:border-orange-500 w-56"
              />
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
                className={`px-5 py-2 border border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px transition-all ${activeTab === tab ? 'bg-black text-white' : 'bg-white'}`}
              >
                {tab} ({tab === '전체' ? applicants.length : applicants.filter(a => a.status === tab).length})
              </button>
            ))}
          </div>

          {/* 일괄 처리 */}
          {selectedIds.length > 0 && (
            <div className="bg-orange-100 border border-black p-4 mb-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-bold flex items-center gap-2">
                <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">{selectedIds.length}</span>명 선택됨
              </span>
              <div className="flex gap-2 flex-wrap">
                {(['서류심사', '면접', '최종합격', '불합격'] as AppStatus[]).map(s => (
                  <button key={s} onClick={() => batchChangeStatus(s)} disabled={saving}
                    className="px-4 py-1.5 bg-white border border-black font-bold text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-50">
                    {s}으로 이동
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 테이블 */}
          <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-1 overflow-auto">
            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100">
                    <th className="p-4 w-12">
                      <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-4 h-4 accent-orange-500" />
                    </th>
                    <th className="p-4 font-black">이름</th>
                    <th className="p-4 font-black">전공</th>
                    <th className="p-4 font-black">점수</th>
                    <th className="p-4 font-black">메모</th>
                    <th className="p-4 font-black">지원일시</th>
                    <th className="p-4 font-black">상태</th>
                    <th className="p-4 font-black text-center">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-gray-500 font-bold">지원자가 없습니다.</td></tr>
                  ) : filtered.map(app => (
                    <React.Fragment key={app.id}>
                      <tr className={`hover:bg-orange-50 transition-colors ${selectedIds.includes(app.id) ? 'bg-orange-50' : ''}`}>
                        <td className="p-4">
                          <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggle(app.id)} className="w-4 h-4 accent-orange-500" />
                        </td>
                        <td className="p-4 font-bold cursor-pointer hover:underline hover:text-orange-500" onClick={() => setSelectedApplicant(app)}>
                          {app.profiles?.name ?? '—'}
                        </td>
                        <td className="p-4 text-gray-600">{app.profiles?.major ?? '—'}</td>
                        <td className="p-4 font-black text-orange-500">{app.score != null ? `${app.score}점` : '—'}</td>
                        <td className="p-4 max-w-[160px]">
                          <button
                            onClick={() => setMemoPopover({ id: app.id, note: app.interviewer_note ?? '' })}
                            className={`flex items-center gap-1.5 text-sm font-bold truncate max-w-full hover:text-orange-500 transition-colors ${
                              app.interviewer_note ? 'text-gray-700' : 'text-gray-300 hover:text-gray-500'
                            }`}
                            title={app.interviewer_note || '메모 추가'}
                          >
                            <MessageSquare className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {app.interviewer_note ? app.interviewer_note : '메모 추가'}
                            </span>
                          </button>
                        </td>
                        <td className="p-4 text-gray-500 text-sm">{new Date(app.submitted_at).toLocaleDateString('ko-KR')}</td>
                        <td className="p-4">
                          <select
                            value={app.status}
                            onChange={e => changeStatus(app.id, e.target.value as AppStatus)}
                            className={`p-1.5 border border-black text-sm font-bold outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${STATUS_STYLE[app.status]}`}
                          >
                            {(['서류심사', '면접', '최종합격', '불합격'] as AppStatus[]).map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-4 text-center flex justify-center gap-2">
                          <button onClick={() => setSelectedApplicant(app)} className="px-3 py-1 bg-white border border-black text-xs font-bold hover:bg-black hover:text-white transition-colors">상세보기</button>
                          {app.status !== '최종합격' && (
                            <button
                              onClick={() => {
                                setSelectedApplicant(app);
                                setEmailBody(`안녕하세요, ${app.profiles?.name ?? ''}님!\n최종 합격을 진심으로 축하드립니다.`);
                                setShowEmailModal(true);
                              }}
                              className="px-3 py-1 bg-orange-500 border border-black text-xs font-bold text-white hover:bg-orange-600 transition-colors"
                            >
                              합격처리
                            </button>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* 인라인 메모 팝오버 */}
      {memoPopover && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40" onClick={() => setMemoPopover(null)}>
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm mx-4 p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-black text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" /> 운영진 메모
              </h3>
              <button onClick={() => setMemoPopover(null)}><X className="w-5 h-5" /></button>
            </div>
            <textarea
              rows={4}
              value={memoPopover.note}
              onChange={e => setMemoPopover(prev => prev ? { ...prev, note: e.target.value } : null)}
              className="w-full p-3 border border-black outline-none focus:border-orange-500 font-medium resize-none"
              placeholder="내부 검토 메모를 입력하세요..."
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setMemoPopover(null)} className="flex-1 py-2 border border-black font-bold hover:bg-gray-100">취소</button>
              <button onClick={saveMemoPopover} className="flex-1 py-2 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 지원서 상세 슬라이드 패널 */}
      {selectedApplicant && !showEmailModal && (
        <ApplicantPanel
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={changeStatus}
          onSaveNote={saveNote}
          onFinalAccept={() => {
            setEmailBody(`안녕하세요, ${selectedApplicant.profiles?.name ?? ''}님!\n최종 합격을 진심으로 축하드립니다.`);
            setShowEmailModal(true);
          }}
        />
      )}

      {/* 합격 이메일 모달 */}
      {showEmailModal && selectedApplicant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-2 border-black w-full max-w-xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="p-6 border-b border-black bg-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><Mail className="w-5 h-5 text-orange-500" /> 합격 안내 이메일</h3>
              <button onClick={() => setShowEmailModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 text-sm font-bold flex gap-2">
                <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{selectedApplicant.profiles?.name}님을 <strong>최종 합격</strong> 처리합니다.<br />아래 이메일이 발송됩니다.</p>
              </div>
              <div>
                <label className="font-black text-sm mb-1 block">수신: {selectedApplicant.profiles?.email}</label>
              </div>
              <div>
                <label className="font-black text-sm mb-2 block">이메일 본문</label>
                <textarea rows={6} value={emailBody} onChange={e => setEmailBody(e.target.value)}
                  className="w-full p-4 border border-black outline-none focus:border-orange-500 font-medium leading-relaxed resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-black bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowEmailModal(false)} className="px-6 py-2 border border-black font-bold bg-white hover:bg-gray-100">취소</button>
              <button
                onClick={async () => {
                  await changeStatus(selectedApplicant.id, '최종합격');
                  setShowEmailModal(false);
                  setSelectedApplicant(null);
                  showToast(`${selectedApplicant.profiles?.name}님 합격 처리 완료`);
                }}
                className="px-6 py-2 bg-black text-white font-black hover:bg-gray-800 flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> 확인 및 합격 처리
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[70] bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(255,165,0,0.5)]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {toast}
        </div>
      )}
    </div>
  );
}

// 지원서 상세 패널
function ApplicantPanel({ applicant, onClose, onStatusChange, onSaveNote, onFinalAccept }: {
  applicant: Applicant;
  onClose: () => void;
  onStatusChange: (id: string, status: AppStatus) => void;
  onSaveNote: (id: string, score: number | null, note: string) => void;
  onFinalAccept: () => void;
}) {
  const [score, setScore] = useState(applicant.score != null ? String(applicant.score) : '');
  const [note, setNote] = useState(applicant.interviewer_note ?? '');
  const [noteSaved, setNoteSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 메모 자동저장 (800ms debounce)
  const handleNoteChange = (val: string) => {
    setNote(val);
    setNoteSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSaveNote(applicant.id, score ? parseInt(score, 10) : null, val);
      setNoteSaved(true);
    }, 800);
  };

  const handleScoreBlur = () => {
    onSaveNote(applicant.id, score ? parseInt(score, 10) : null, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white h-full border-l-2 border-black flex flex-col shadow-[-10px_0_20px_rgba(0,0,0,0.1)]"
        style={{ animation: 'slideLeft 0.3s cubic-bezier(0.16,1,0.3,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black flex justify-between items-center bg-gray-50">
          <h3 className="text-2xl font-black">지원서 상세</h3>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
          {/* 기본 정보 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black mb-1">
                {applicant.profiles?.name ?? '—'}
                <span className="ml-3 text-base font-bold text-gray-500 bg-gray-200 px-3 py-1">{applicant.status}</span>
              </h2>
              <p className="text-gray-600 font-bold">{applicant.profiles?.university} {applicant.profiles?.major}</p>
            </div>
            <div className="text-right text-gray-500 font-bold text-sm">
              <p>{applicant.profiles?.phone}</p>
              <p>{applicant.profiles?.email}</p>
            </div>
          </div>

          {/* 운영진 평가 */}
          <div className="border-2 border-black p-6 bg-gray-50">
            <h4 className="font-black text-sm mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-500" /> 운영진 평가 및 메모
            </h4>
            <div className="flex gap-4">
              <div className="w-32 shrink-0">
                <label className="font-black text-xs block mb-1">서류 점수 (0~100)</label>
                <input
                  type="number"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  onBlur={handleScoreBlur}
                  min={0} max={100}
                  className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500"
                  placeholder="85"
                />
              </div>
              <div className="flex-1">
                <label className="font-black text-xs block mb-1 flex items-center gap-2">
                  메모
                  {noteSaved && <span className="text-green-500 font-bold text-xs">저장됨 ✓</span>}
                </label>
                <textarea
                  value={note}
                  onChange={e => handleNoteChange(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500 resize-none"
                  placeholder="내부 검토 메모 (자동 저장)"
                />
              </div>
            </div>
          </div>

          {/* 지원서 답변 */}
          {Object.entries(applicant.answers).map(([key, val]) => (
            <div key={key} className="border border-black p-6 bg-orange-50">
              <h4 className="font-black text-sm text-orange-600 mb-2">{key}</h4>
              <p className="font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{val}</p>
            </div>
          ))}

          {applicant.profiles?.portfolio_url && (
            <div className="border border-black p-4">
              <a href={applicant.profiles.portfolio_url} target="_blank" rel="noreferrer"
                className="text-blue-600 font-bold hover:underline flex items-center gap-2">
                포트폴리오 보기 →
              </a>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-black bg-gray-50 flex justify-between items-center gap-4">
          <div className="flex gap-2 flex-wrap">
            {(['서류심사', '면접', '불합격'] as AppStatus[]).map(s => (
              <button key={s} onClick={() => onStatusChange(applicant.id, s)}
                className={`px-4 py-2 border border-black font-bold text-sm ${applicant.status === s ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={onFinalAccept}
            className="px-6 py-3 bg-orange-500 border-2 border-black font-black text-white hover:bg-orange-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all flex items-center gap-2"
          >
            최종 합격 처리 <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes slideLeft { from{transform:translateX(100%)} to{transform:translateX(0)} }` }} />
    </div>
  );
}
