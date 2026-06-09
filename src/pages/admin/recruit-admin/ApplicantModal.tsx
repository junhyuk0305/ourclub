import React, { useEffect, useRef, useState } from 'react';
import { X, MessageSquare, Users, Plus, HelpCircle, Inbox } from 'lucide-react';
import type { Applicant } from './types';

// ── 지원서 상세 Extended Modal (탭 UI) ────────────────────────────────────────
type DetailTab = 'application' | 'evaluation' | 'interview';

export function ApplicantModal({
  applicant, stages, onClose, onStatusChange, onSaveNote, onAddMemo, onSaveQuestions,
}: {
  applicant: Applicant;
  stages: string[];
  onClose: () => void;
  onStatusChange: (id: string, stage: string) => void;
  onSaveNote: (id: string, score: number | null, note: string) => void;
  onAddMemo: (id: string, content: string) => void;
  onSaveQuestions: (id: string, questions: string[]) => void;
}) {
  const [tab, setTab] = useState<DetailTab>('application');
  const [score, setScore] = useState(applicant.score != null ? String(applicant.score) : '');
  const [note, setNote] = useState(applicant.interviewer_note ?? '');
  const [noteSaved, setNoteSaved] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<string[]>(applicant.interview_questions ?? []);
  const [newMemo, setNewMemo] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 시 디바운스 타이머 정리 → 모달을 800ms 내 닫으면 발생하던 늦은 저장·언마운트 setState 경고 방지
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

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

  const addQuestion = () => setLocalQuestions(prev => [...prev, '']);
  const updateQuestion = (i: number, val: string) =>
    setLocalQuestions(prev => prev.map((q, idx) => (idx === i ? val : q)));
  const removeQuestion = (i: number) =>
    setLocalQuestions(prev => prev.filter((_, idx) => idx !== i));
  const handleSaveQuestions = () =>
    onSaveQuestions(applicant.id, localQuestions.filter(q => q.trim()));

  const submitMemo = () => {
    if (!newMemo.trim()) return;
    onAddMemo(applicant.id, newMemo.trim());
    setNewMemo('');
  };

  const TABS: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'application', label: '지원서', icon: <Users className="w-4 h-4" /> },
    { key: 'evaluation', label: '평가 및 메모', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'interview', label: '면접 풀', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-black flex flex-col shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
        style={{ width: '85vw', height: '90vh', maxWidth: '1100px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-8 py-5 border-b-2 border-black bg-gray-50 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black">{applicant.profiles?.name ?? '—'}</h2>
              <span className="text-xs font-black bg-black text-white px-3 py-1">{applicant.status}</span>
            </div>
            <p className="text-gray-500 font-bold text-sm">
              {[applicant.profiles?.university, applicant.profiles?.major].filter(Boolean).join(' · ')}
            </p>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 font-medium">
              <span>{applicant.profiles?.phone}</span>
              <span>{applicant.profiles?.email}</span>
              {applicant.profiles?.portfolio_url && (
                <a href={applicant.profiles.portfolio_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold">
                  포트폴리오 →
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b-2 border-black shrink-0 bg-white">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-black border-r border-gray-200 transition-colors ${
                tab === t.key
                  ? 'bg-orange-500 text-black border-b-2 border-black -mb-0.5'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {/* 지원서 탭 */}
          {tab === 'application' && (
            <div className="p-8 flex flex-col gap-5">
              {Object.entries(applicant.answers ?? {}).length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-bold">
                  <Inbox className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  제출된 응답이 없습니다.
                </div>
              ) : (
                Object.entries(applicant.answers ?? {}).map(([key, val]) => (
                  <div key={key} className="border border-black p-6 bg-orange-50">
                    <h4 className="font-black text-sm text-orange-600 mb-2">{key}</h4>
                    <p className="font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{val}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 평가 및 메모 탭 */}
          {tab === 'evaluation' && (
            <div className="p-8 flex flex-col gap-6">
              {/* 점수 + 내부 메모 */}
              <div className="border-2 border-black p-6 bg-gray-50">
                <h4 className="font-black text-sm mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500" /> 운영진 평가
                </h4>
                <div className="flex gap-4 mb-6">
                  <div className="w-36 shrink-0">
                    <label className="font-black text-xs block mb-1">점수 (0~100)</label>
                    <input
                      type="number"
                      value={score}
                      onChange={e => setScore(e.target.value)}
                      onBlur={handleScoreBlur}
                      min={0}
                      max={100}
                      className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500"
                      placeholder="85"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="font-black text-xs block mb-1">
                      내부 메모 (단독)
                      {noteSaved && <span className="text-green-500 font-bold text-xs ml-2">저장됨 ✓</span>}
                    </label>
                    <textarea
                      value={note}
                      onChange={e => handleNoteChange(e.target.value)}
                      rows={4}
                      className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500 resize-none"
                      placeholder="내부 검토 메모 (자동 저장)"
                    />
                  </div>
                </div>

                {/* 팀 메모 쓰레드 */}
                <div>
                  <p className="font-black text-xs text-gray-500 uppercase tracking-wider mb-3">팀 메모</p>
                  {(applicant.memos ?? []).length > 0 && (
                    <div className="flex flex-col gap-2 mb-3 max-h-56 overflow-y-auto">
                      {(applicant.memos ?? []).map((m, i) => (
                        <div key={i} className="bg-white border border-gray-200 p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-black text-xs text-orange-600">{m.author}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(m.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={newMemo}
                      onChange={e => setNewMemo(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitMemo(); }}
                      rows={2}
                      className="flex-1 p-2 border border-black font-medium text-sm outline-none focus:border-orange-500 resize-none"
                      placeholder="팀 메모 남기기… (Ctrl+Enter)"
                    />
                    <button
                      onClick={submitMemo}
                      disabled={!newMemo.trim()}
                      className="px-4 py-2 bg-black text-white font-black text-sm hover:bg-orange-500 hover:text-black transition-colors self-end disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      등록
                    </button>
                  </div>
                </div>
              </div>

              {/* 단계 이동 */}
              <div className="border-2 border-black p-6">
                <p className="font-black text-xs text-gray-500 uppercase tracking-widest mb-3">단계 이동</p>
                <div className="flex gap-2 flex-wrap">
                  {stages.map(stage => (
                    <button
                      key={stage}
                      onClick={() => onStatusChange(applicant.id, stage)}
                      className={`px-4 py-2 border border-black font-bold text-sm transition-colors ${
                        applicant.status === stage
                          ? 'bg-black text-white cursor-default'
                          : 'bg-white hover:bg-orange-500 hover:text-black'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 면접 풀 탭 */}
          {tab === 'interview' && (
            <div className="p-8">
              <div className="border-2 border-black p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-500" /> 면접 질문 풀
                  </h4>
                  <button
                    onClick={handleSaveQuestions}
                    className="text-xs font-black text-white bg-blue-500 px-4 py-1.5 hover:bg-blue-600 transition-colors"
                  >
                    저장
                  </button>
                </div>
                {localQuestions.length === 0 && (
                  <p className="text-gray-400 font-bold text-sm mb-4">아직 등록된 질문이 없습니다. 아래에서 추가하세요.</p>
                )}
                <div className="flex flex-col gap-3 mb-4">
                  {localQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-400 w-6 shrink-0 text-right">{i + 1}.</span>
                      <input
                        value={q}
                        onChange={e => updateQuestion(i, e.target.value)}
                        className="flex-1 p-2.5 border border-black font-medium text-sm outline-none focus:border-orange-500"
                        placeholder={`면접 질문 ${i + 1}`}
                      />
                      <button onClick={() => removeQuestion(i)} className="p-1.5 hover:text-red-500 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addQuestion}
                  className="text-sm font-bold text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 질문 추가
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
