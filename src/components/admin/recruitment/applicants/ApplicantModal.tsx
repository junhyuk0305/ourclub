import React, { useEffect, useRef, useState } from 'react';
import {
  FileText, ClipboardCheck, MessageSquare, HelpCircle, Calendar, ChevronDown, X, Trash2,
} from 'lucide-react';
import { Applicant } from './types';
import { TagEditor } from './TagEditor';
import { ApplicationTabContent } from './ApplicationTabContent';
import { InterviewTabContent } from './InterviewTabContent';

// ── 지원자 상세 모달 (Phase 6 재구성) ─────────────────────────────────────
type DetailTab = 'application' | 'evaluation' | 'chat' | 'interview';

export function ApplicantModal({
  applicant, stages, onClose, onStatusChange, onSaveNote, onAddMemo, onSaveQuestions, onSaveTags, onDelete,
}: {
  applicant: Applicant;
  stages: string[];
  onClose: () => void;
  onStatusChange: (id: string, stage: string) => void;
  onSaveNote: (id: string, score: number | null, note: string) => void;
  onAddMemo: (id: string, content: string) => void;
  onSaveQuestions: (id: string, questions: string[]) => void;
  onSaveTags: (id: string, tags: string[]) => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<DetailTab>('application');
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    { key: 'application', label: '지원서',     icon: <FileText className="w-4 h-4" strokeWidth={2.5} /> },
    { key: 'evaluation',  label: '평가',       icon: <ClipboardCheck className="w-4 h-4" strokeWidth={2.5} /> },
    { key: 'chat',        label: '팀 채팅',    icon: <MessageSquare className="w-4 h-4" strokeWidth={2.5} /> },
    { key: 'interview',   label: '면접 질문',  icon: <HelpCircle className="w-4 h-4" strokeWidth={2.5} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white border border-sand-200 rounded-card overflow-hidden flex flex-col shadow-soft-lg"
        style={{ width: '85vw', height: '90vh', maxWidth: '1100px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 — Phase 6 재구성 */}
        <div className="px-8 py-5 border-b border-sand-200 bg-sand-50 shrink-0">
          {/* 접수일자 (가장 위, 작게 — 유입 시점 추적용) */}
          <div className="flex items-center gap-2 text-xs text-sand-400 font-bold mb-2">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>접수일자: {submittedDate.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            <span className="ml-1">· 유입 시점 추적용</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* 필수 개인정보 - 가장 위에 prominent */}
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-2xl font-black text-ink">{applicant.profiles?.name ?? '—'}</h2>

                {/* 단계 드롭다운 토글 */}
                <div className="relative">
                  <button
                    onClick={() => setStageMenuOpen(v => !v)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-ctl ${
                      isLastStage ? 'bg-ok-fg text-white' : 'bg-ink text-white'
                    } hover:opacity-90`}
                  >
                    {applicant.status}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stageMenuOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                  </button>
                  {stageMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setStageMenuOpen(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-sand-200 rounded-card shadow-soft-lg min-w-[160px] overflow-hidden">
                        {stages.map(s => (
                          <button
                            key={s}
                            onClick={() => { setStageMenuOpen(false); onStatusChange(applicant.id, s); }}
                            className={`w-full text-left px-3 py-2 text-sm font-bold border-b border-sand-100 last:border-b-0 transition-colors ${
                              applicant.status === s ? 'bg-brand-tint text-brand' : 'text-sand-600 hover:bg-sand-50'
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

              <p className="text-sand-600 font-bold text-sm">
                {[applicant.profiles?.university, applicant.profiles?.major].filter(Boolean).join(' · ') || '소속 미입력'}
              </p>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-sand-500 font-medium flex-wrap">
                <span>📞 {applicant.profiles?.phone ?? '—'}</span>
                <span>✉ {applicant.profiles?.email ?? '—'}</span>
                {applicant.profiles?.portfolio_url && (
                  <a href={applicant.profiles.portfolio_url} target="_blank" rel="noreferrer" className="text-brand hover:underline font-bold">
                    포트폴리오 →
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setConfirmDelete(true)} title="지원자 삭제" className="p-1.5 text-red-500 hover:bg-red-50 rounded-ctl">
                <Trash2 className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button onClick={onClose} className="p-1 text-sand-500 hover:bg-sand-100 rounded-ctl">
                <X className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* 태그 영역 */}
          <div className="mt-4 pt-3 border-t border-sand-200">
            <TagEditor
              tags={applicant.tags ?? []}
              onChange={tags => onSaveTags(applicant.id, tags)}
            />
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-sand-200 shrink-0 bg-white">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-brand text-brand' : 'border-transparent text-sand-400 hover:text-ink'
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
              <div className="border border-sand-200 rounded-card p-6 bg-sand-50">
                <h4 className="font-black text-sm text-ink mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-brand" strokeWidth={2.5} /> 운영진 평가
                </h4>
                <div className="flex gap-4">
                  <div className="w-36 shrink-0">
                    <label className="font-bold text-xs block mb-1 text-sand-600">점수 (0~100)</label>
                    <input
                      type="number" value={score}
                      onChange={e => setScore(e.target.value)}
                      onBlur={handleScoreBlur}
                      min={0} max={100}
                      className="field w-full p-2 border border-sand-300 rounded-ctl font-bold outline-none"
                      placeholder="85"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="font-bold text-xs block mb-1 text-sand-600">
                      내부 메모 (단독)
                      {noteSaved && <span className="text-ok-fg font-bold text-xs ml-2">저장됨 ✓</span>}
                    </label>
                    <textarea
                      value={note}
                      onChange={e => handleNoteChange(e.target.value)}
                      rows={6}
                      className="field w-full p-2 border border-sand-300 rounded-ctl font-bold outline-none resize-none"
                      placeholder="내부 검토 메모 (자동 저장)"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'chat' && (
            <div className="p-8">
              <div className="border border-sand-200 rounded-card shadow-soft p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-sm text-ink flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-brand" strokeWidth={2.5} /> 팀 채팅
                  </h4>
                  <span className="text-xs font-bold text-sand-400">{(applicant.memos ?? []).length}개 메시지</span>
                </div>
                {(applicant.memos ?? []).length === 0 ? (
                  <div className="border border-dashed border-sand-200 rounded-card p-10 text-center text-sand-400 font-bold text-sm">
                    아직 채팅이 없습니다. 운영진끼리 이 지원자에 대해 의견을 나눠보세요.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mb-3 max-h-[420px] overflow-y-auto">
                    {(applicant.memos ?? []).map((m, i) => (
                      <div key={i} className="bg-sand-50 border border-sand-200 rounded-card p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-xs text-brand">{m.author}</span>
                          <span className="text-xs text-sand-400">
                            {new Date(m.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-sand-600 whitespace-pre-wrap">{m.content}</p>
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
                    className="field flex-1 p-2 border border-sand-300 rounded-ctl font-medium text-sm outline-none resize-none"
                    placeholder="메시지 입력… (Ctrl+Enter 전송)"
                  />
                  <button
                    onClick={submitMemo}
                    disabled={!newMemo.trim()}
                    className="px-4 py-2 rounded-ctl btn-grad text-white shadow-btn font-bold text-sm transition-all self-end disabled:opacity-30 disabled:cursor-not-allowed"
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

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
          onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
        >
          <div
            className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-sm p-8 flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-black text-red-600">지원자를 삭제하시겠어요?</h2>
            <p className="font-bold text-sand-600">
              {applicant.profiles?.name ?? '이 지원자'}님의 지원서·평가·메모가 모두 삭제되며 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-ctl border border-sand-300 font-bold text-ink hover:bg-sand-50">
                취소
              </button>
              <button onClick={() => { setConfirmDelete(false); onDelete(applicant.id); }} className="flex-1 py-3 rounded-ctl bg-red-500 text-white font-bold hover:bg-red-600">
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
