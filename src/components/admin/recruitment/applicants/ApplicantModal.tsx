import React, { useEffect, useRef, useState } from 'react';
import {
  FileText, ClipboardCheck, MessageSquare, HelpCircle, Calendar, ChevronDown, X,
} from 'lucide-react';
import { Applicant } from './types';
import { TagEditor } from './TagEditor';
import { ApplicationTabContent } from './ApplicationTabContent';
import { InterviewTabContent } from './InterviewTabContent';

// ── 지원자 상세 모달 (Phase 6 재구성) ─────────────────────────────────────
type DetailTab = 'application' | 'evaluation' | 'chat' | 'interview';

export function ApplicantModal({
  applicant, stages, onClose, onStatusChange, onSaveNote, onAddMemo, onSaveQuestions, onSaveTags,
}: {
  applicant: Applicant;
  stages: string[];
  onClose: () => void;
  onStatusChange: (id: string, stage: string) => void;
  onSaveNote: (id: string, score: number | null, note: string) => void;
  onAddMemo: (id: string, content: string) => void;
  onSaveQuestions: (id: string, questions: string[]) => void;
  onSaveTags: (id: string, tags: string[]) => void;
}) {
  const [tab, setTab] = useState<DetailTab>('application');
  const [score, setScore] = useState(applicant.score != null ? String(applicant.score) : '');
  const [note, setNote] = useState(applicant.interviewer_note ?? '');
  const [noteSaved, setNoteSaved] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<string[]>(applicant.interview_questions ?? []);
  const [newMemo, setNewMemo] = useState('');
  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleNoteChange = (val: string) => {
    setNote(val);
    setNoteSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSaveNote(applicant.id, score ? parseInt(score, 10) : null, val);
      setNoteSaved(true);
    }, 800);
  };

  const handleScoreBlur = () => onSaveNote(applicant.id, score ? parseInt(score, 10) : null, note);

  const submitMemo = () => {
    if (!newMemo.trim()) return;
    onAddMemo(applicant.id, newMemo.trim());
    setNewMemo('');
  };

  const submittedDate = new Date(applicant.submitted_at);
  const isLastStage = applicant.status === stages[stages.length - 1];

  // 개인정보 동의 항목 추출 (answers에서 '동의함'/'동의'가 있는 키)
  const consentEntries = Object.entries(applicant.answers ?? {}).filter(([k, v]) =>
    k.includes('동의') || k.includes('개인정보') || v === '동의함'
  );

  const TABS: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'application', label: '지원서',     icon: <FileText className="w-4 h-4" /> },
    { key: 'evaluation',  label: '평가',       icon: <ClipboardCheck className="w-4 h-4" /> },
    { key: 'chat',        label: '팀 채팅',    icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'interview',   label: '면접 질문',  icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white border-2 border-black flex flex-col shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
        style={{ width: '85vw', height: '90vh', maxWidth: '1100px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 — Phase 6 재구성 */}
        <div className="px-8 py-5 border-b-2 border-black bg-gray-50 shrink-0">
          {/* 접수일자 (가장 위, 작게 — 유입 시점 추적용) */}
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>접수일자: {submittedDate.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            <span className="ml-1">· 유입 시점 추적용</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* 필수 개인정보 - 가장 위에 prominent */}
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-2xl font-black">{applicant.profiles?.name ?? '—'}</h2>

                {/* 단계 드롭다운 토글 */}
                <div className="relative">
                  <button
                    onClick={() => setStageMenuOpen(v => !v)}
                    className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 border ${
                      isLastStage ? 'bg-green-500 text-white border-green-500' : 'bg-black text-white border-black'
                    } hover:opacity-90`}
                  >
                    {applicant.status}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stageMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {stageMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setStageMenuOpen(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[160px]">
                        {stages.map(s => (
                          <button
                            key={s}
                            onClick={() => { setStageMenuOpen(false); onStatusChange(applicant.id, s); }}
                            className={`w-full text-left px-3 py-2 text-sm font-bold border-b border-gray-100 last:border-b-0 transition-colors ${
                              applicant.status === s ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-600 font-bold text-sm">
                {[applicant.profiles?.university, applicant.profiles?.major].filter(Boolean).join(' · ') || '소속 미입력'}
              </p>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 font-medium flex-wrap">
                <span>📞 {applicant.profiles?.phone ?? '—'}</span>
                <span>✉ {applicant.profiles?.email ?? '—'}</span>
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

          {/* 태그 영역 */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <TagEditor
              tags={applicant.tags ?? []}
              onChange={tags => onSaveTags(applicant.id, tags)}
            />
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b-2 border-black shrink-0 bg-white">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-black border-r border-gray-200 transition-colors ${
                tab === t.key ? 'bg-orange-500 text-black border-b-2 border-black -mb-0.5' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'application' && (
            <ApplicationTabContent applicant={applicant} consentEntries={consentEntries} />
          )}

          {tab === 'evaluation' && (
            <div className="p-8 flex flex-col gap-6">
              <div className="border-2 border-black p-6 bg-gray-50">
                <h4 className="font-black text-sm mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-orange-500" /> 운영진 평가
                </h4>
                <div className="flex gap-4">
                  <div className="w-36 shrink-0">
                    <label className="font-black text-xs block mb-1">점수 (0~100)</label>
                    <input
                      type="number" value={score}
                      onChange={e => setScore(e.target.value)}
                      onBlur={handleScoreBlur}
                      min={0} max={100}
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
                      rows={6}
                      className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500 resize-none"
                      placeholder="내부 검토 메모 (자동 저장)"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'chat' && (
            <div className="p-8">
              <div className="border-2 border-black p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-500" /> 팀 채팅
                  </h4>
                  <span className="text-xs font-bold text-gray-400">{(applicant.memos ?? []).length}개 메시지</span>
                </div>
                {(applicant.memos ?? []).length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 p-10 text-center text-gray-400 font-bold text-sm">
                    아직 채팅이 없습니다. 운영진끼리 이 지원자에 대해 의견을 나눠보세요.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mb-3 max-h-[420px] overflow-y-auto">
                    {(applicant.memos ?? []).map((m, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 p-3">
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
                <div className="flex gap-2 mt-4">
                  <textarea
                    value={newMemo}
                    onChange={e => setNewMemo(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitMemo(); }}
                    rows={3}
                    className="flex-1 p-2 border border-black font-medium text-sm outline-none focus:border-orange-500 resize-none"
                    placeholder="메시지 입력… (Ctrl+Enter 전송)"
                  />
                  <button
                    onClick={submitMemo}
                    disabled={!newMemo.trim()}
                    className="px-4 py-2 bg-black text-white font-black text-sm hover:bg-orange-500 hover:text-black transition-colors self-end disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    전송
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'interview' && (
            <InterviewTabContent
              questions={localQuestions}
              setQuestions={setLocalQuestions}
              onSave={() => onSaveQuestions(applicant.id, localQuestions.filter(q => q.trim()))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
