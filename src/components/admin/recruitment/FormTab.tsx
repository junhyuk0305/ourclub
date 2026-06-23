import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, Type, AlignLeft, GripVertical, Trash2, Loader, Save, CheckCircle2,
  AlertCircle, Rocket, AlertTriangle, Hash, Mail, Phone, CircleDot, CheckSquare,
  Paperclip, Compass, ShieldCheck, X, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import {
  Question, QuestionType, QUESTION_TYPE_META, makeQuestion, DEFAULT_SOURCE_OPTIONS,
  type RecruitmentRow,
} from '../../../types/recruitment';
import { useToast } from '../../../hooks/useToast';

type Recruitment =
  Pick<RecruitmentRow, 'id' | 'form_schema' | 'form_version' | 'deployed_form_schema'>
  & { status: string };

interface Props {
  recruitment: Recruitment;
  onUpdate: (patch: Partial<Recruitment>) => void;
}

const TYPE_ICON: Record<QuestionType, React.ReactNode> = {
  text:        <Type className="w-3.5 h-3.5" />,
  textarea:    <AlignLeft className="w-3.5 h-3.5" />,
  number:      <Hash className="w-3.5 h-3.5" />,
  email:       <Mail className="w-3.5 h-3.5" />,
  phone:       <Phone className="w-3.5 h-3.5" />,
  select:      <CircleDot className="w-3.5 h-3.5" />,
  multiselect: <CheckSquare className="w-3.5 h-3.5" />,
  file:        <Paperclip className="w-3.5 h-3.5" />,
  source:      <Compass className="w-3.5 h-3.5" />,
  consent:     <ShieldCheck className="w-3.5 h-3.5" />,
};

const ADD_TYPES: QuestionType[] = [
  'text', 'textarea', 'number', 'email', 'phone',
  'select', 'multiselect', 'file', 'source', 'consent',
];

export function FormTab({ recruitment, onUpdate }: Props) {
  const [questions, setQuestions] = useState<Question[]>(() =>
    Array.isArray(recruitment.form_schema) ? (recruitment.form_schema as Question[]) : []
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { toast, show: showToast } = useToast();
  const [showRedeployWarning, setShowRedeployWarning] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setQuestions(Array.isArray(recruitment.form_schema) ? (recruitment.form_schema as Question[]) : []);
  }, [recruitment.id]);

  const addQuestion = (type: QuestionType) => {
    setQuestions(prev => [...prev, makeQuestion(type)]);
    setShowAddMenu(false);
  };

  const removeQuestion = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id));

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    const newQs = [...questions];
    const [moved] = newQs.splice(dragIndexRef.current, 1);
    newQs.splice(index, 0, moved);
    setQuestions(newQs);
    dragIndexRef.current = index;
  };
  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('recruitments')
      .update({ form_schema: questions })
      .eq('id', recruitment.id);
    setSaving(false);
    if (error) {
      showToast(`저장 실패: ${error.message}`, false);
      return;
    }
    onUpdate({ form_schema: questions });
    showToast('지원서가 저장되었습니다.', true);
  };

  const publish = async () => {
    if (recruitment.status === '진행중') {
      setShowRedeployWarning(true);
      return;
    }
    setPublishing(true);
    const patch = {
      form_schema: questions,
      status: '진행중',
      form_version: 1,
      deployed_form_schema: questions as unknown as unknown[],
    };
    const { error } = await supabase.from('recruitments').update(patch).eq('id', recruitment.id);
    setPublishing(false);
    if (error) {
      showToast(`발행 실패: ${error.message}`, false);
      return;
    }
    onUpdate(patch);
    showToast('발행되었습니다! 지원자가 지원서를 작성할 수 있습니다.', true);
  };

  const confirmRedeploy = async () => {
    setShowRedeployWarning(false);
    setPublishing(true);
    const nextVersion = (recruitment.form_version ?? 1) + 1;
    const patch = {
      form_schema: questions,
      form_version: nextVersion,
      deployed_form_schema: questions as unknown as unknown[],
    };
    const { error } = await supabase.from('recruitments').update(patch).eq('id', recruitment.id);
    setPublishing(false);
    if (error) {
      showToast(`재배포 실패: ${error.message}`, false);
      return;
    }
    onUpdate(patch);
    showToast(`v${nextVersion}로 재배포되었습니다.`, true);
  };

  const isPublished = recruitment.status === '진행중';

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 pb-16">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black">지원서 수정</h2>
          <p className="text-sm text-gray-500 font-bold mt-1">
            지원자가 작성할 질문을 추가하고 순서를 조정하세요. 이름·연락처·이메일·포트폴리오는 기본 정보로 별도 수집됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2.5 border border-black bg-white font-bold text-sm hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장
          </button>
          <button
            onClick={publish}
            disabled={publishing}
            className={`px-5 py-2.5 border border-black font-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px text-sm disabled:opacity-50 flex items-center gap-2 ${
              isPublished ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {publishing && <Loader className="w-4 h-4 animate-spin" />}
            <Rocket className="w-4 h-4" />
            {isPublished ? `발행 중 (재배포 v${recruitment.form_version + 1})` : '발행하기'}
          </button>
        </div>
      </div>

      {!isPublished && (
        <div className="bg-orange-50 border border-orange-300 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="font-bold text-orange-800 text-sm">
            현재 <strong>임시저장</strong> 상태입니다. 발행 전에는 지원자가 지원할 수 없습니다.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {questions.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 p-12 text-center text-gray-400 font-bold">
            아래 버튼으로 질문을 추가해보세요.<br />
            <span className="text-sm font-medium mt-1 block">기본 정보(이름·연락처·이메일)는 자동으로 수집됩니다.</span>
          </div>
        ) : (
          questions.map((q, index) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={index}
              dragOver={dragOverIndex === index}
              onRemove={() => removeQuestion(q.id)}
              onUpdate={patch => updateQuestion(q.id, patch)}
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>

      {/* 질문 추가 메뉴 */}
      <div className="pt-4 border-t border-gray-200">
        <div className="relative inline-block">
          <button
            onClick={() => setShowAddMenu(v => !v)}
            className="px-5 py-3 border-2 border-black bg-orange-500 hover:bg-orange-600 font-black text-sm flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px transition-all"
          >
            <Plus className="w-4 h-4" /> 질문 추가
            <ChevronDown className={`w-4 h-4 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
          </button>
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowAddMenu(false)} />
              <div className="absolute left-0 top-full mt-2 z-40 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-72 max-h-96 overflow-y-auto">
                {ADD_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => addQuestion(t)}
                    className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-orange-50 transition-colors flex items-start gap-3"
                  >
                    <span className="mt-0.5 text-orange-500">{TYPE_ICON[t]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm">{QUESTION_TYPE_META[t].label}</p>
                      <p className="text-xs text-gray-500 font-bold truncate">{QUESTION_TYPE_META[t].description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showRedeployWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowRedeployWarning(false)}>
          <div className="bg-white border-2 border-black w-full max-w-md shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-lg mb-1">지원서 재배포</h3>
                <p className="text-sm font-bold text-gray-600">
                  이미 지원자가 있을 수 있습니다. 질문이 변경되면 기존 응답과 형식이 어긋날 수 있습니다.
                  v{(recruitment.form_version ?? 1) + 1}로 재배포하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRedeployWarning(false)} className="px-4 py-2 border border-black font-bold text-sm hover:bg-gray-100">
                취소
              </button>
              <button onClick={confirmRedeploy} className="px-4 py-2 bg-orange-500 text-white font-black text-sm hover:bg-orange-600">
                재배포
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-8 right-8 z-50 px-6 py-4 border-2 font-black flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] ${
            toast.ok ? 'bg-green-500 text-white border-black' : 'bg-red-500 text-white border-black'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question, index, dragOver, onRemove, onUpdate, onDragStart, onDragOver, onDragEnd,
}: {
  question: Question;
  index: number;
  dragOver: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<Question>) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const meta = QUESTION_TYPE_META[question.type];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-white border-2 border-black flex transition-all ${
        dragOver ? 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-y-1' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
      }`}
    >
      <div className="w-12 border-r-2 border-black flex items-center justify-center cursor-grab active:cursor-grabbing bg-gray-50 hover:bg-orange-100 transition-colors select-none">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      <div className="p-6 flex-1 flex flex-col gap-4 relative">
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* 헤더: 번호 · 타입 뱃지 · 제목 · 필수 */}
        <div className="flex items-center gap-3 border-b border-gray-200 pb-3 pr-10 flex-wrap">
          <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{index + 1}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black bg-orange-100 text-orange-700 border border-orange-300">
            {TYPE_ICON[question.type]} {meta.label}
          </span>
          <input
            value={question.title}
            onChange={e => onUpdate({ title: e.target.value })}
            className="text-lg font-black outline-none border-b-2 border-transparent focus:border-orange-500 flex-1 min-w-[200px] bg-transparent"
            placeholder="질문을 입력하세요"
          />
          <label className="flex items-center gap-2 font-bold cursor-pointer shrink-0 text-sm">
            <input
              type="checkbox"
              checked={question.required}
              onChange={e => onUpdate({ required: e.target.checked })}
              className="w-4 h-4 cursor-pointer accent-orange-500"
            />
            <span className="text-gray-600">필수</span>
          </label>
        </div>

        {/* 설명 (선택) */}
        <div>
          <input
            value={question.description ?? ''}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="설명 (선택) — 지원자에게 안내할 추가 설명"
            className="w-full p-2 border border-gray-200 font-medium text-sm outline-none focus:border-orange-500 text-gray-600"
          />
        </div>

        {/* 타입별 편집 영역 */}
        <TypeSpecificEditor question={question} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function TypeSpecificEditor({ question, onUpdate }: { question: Question; onUpdate: (patch: Partial<Question>) => void }) {
  const t = question.type;

  if (t === 'text' || t === 'textarea') {
    return null;
  }

  if (t === 'number') {
    return (
      <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200 p-3">
        <label className="text-xs font-bold text-gray-600 flex flex-col gap-1">
          최솟값 (선택)
          <input
            type="number"
            value={question.min ?? ''}
            onChange={e => onUpdate({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="p-2 border border-gray-300 font-bold outline-none focus:border-orange-500 text-sm"
            placeholder="0"
          />
        </label>
        <label className="text-xs font-bold text-gray-600 flex flex-col gap-1">
          최댓값 (선택)
          <input
            type="number"
            value={question.max ?? ''}
            onChange={e => onUpdate({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="p-2 border border-gray-300 font-bold outline-none focus:border-orange-500 text-sm"
            placeholder="100"
          />
        </label>
      </div>
    );
  }

  if (t === 'email' || t === 'phone') {
    return (
      <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 font-bold flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        {t === 'email'
          ? '이메일 형식 (예: user@domain.com)이 자동으로 검증됩니다.'
          : '휴대폰 번호 (010으로 시작, 010xxxxxxxx)가 자동으로 검증됩니다.'}
      </div>
    );
  }

  if (t === 'select' || t === 'multiselect' || t === 'source') {
    const options = question.options ?? [];
    const addOption = () => onUpdate({ options: [...options, `옵션 ${options.length + 1}`] });
    const removeOption = (i: number) => onUpdate({ options: options.filter((_, idx) => idx !== i) });
    const updateOption = (i: number, val: string) =>
      onUpdate({ options: options.map((o, idx) => (idx === i ? val : o)) });

    return (
      <div className="bg-gray-50 border border-gray-200 p-3 flex flex-col gap-2">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
          {t === 'multiselect' ? '선택 옵션 (다중)' : t === 'source' ? '지원 경로 옵션' : '선택 옵션 (단일)'}
        </p>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold w-5">{i + 1}.</span>
            <input
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              className="flex-1 p-2 border border-gray-300 font-bold outline-none focus:border-orange-500 text-sm bg-white"
            />
            <button
              onClick={() => removeOption(i)}
              disabled={options.length <= 1}
              className="p-1.5 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addOption}
          className="self-start text-xs font-black text-orange-500 hover:underline flex items-center gap-1 mt-1"
        >
          <Plus className="w-3 h-3" /> 옵션 추가
        </button>
        {t === 'source' && (
          <p className="text-xs text-gray-400 font-bold mt-1">
            기본값: {DEFAULT_SOURCE_OPTIONS.join(' · ')}
          </p>
        )}
      </div>
    );
  }

  if (t === 'file') {
    return (
      <div className="bg-gray-50 border border-gray-200 p-3">
        <label className="text-xs font-bold text-gray-600 flex flex-col gap-1">
          허용 파일 형식 (쉼표 구분)
          <input
            value={question.acceptTypes ?? ''}
            onChange={e => onUpdate({ acceptTypes: e.target.value })}
            placeholder=".pdf,.docx,.zip,.png"
            className="p-2 border border-gray-300 font-bold outline-none focus:border-orange-500 text-sm font-mono bg-white"
          />
        </label>
        <p className="text-xs text-gray-400 font-bold mt-2">
          비워두면 모든 파일을 허용합니다. 최대 10MB.
        </p>
      </div>
    );
  }

  if (t === 'consent') {
    return (
      <div className="bg-blue-50 border border-blue-200 p-3 flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-600 flex flex-col gap-1">
          동의 안내 문구
          <textarea
            value={question.consentText ?? ''}
            onChange={e => onUpdate({ consentText: e.target.value })}
            rows={3}
            className="p-2 border border-gray-300 font-medium text-sm outline-none focus:border-orange-500 bg-white resize-none"
            placeholder="본 지원서에 기재한 개인정보를 모집 절차 및 결과 통지 목적으로 수집·이용하는 데 동의합니다."
          />
        </label>
        <p className="text-xs text-blue-700 font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          필수 동의로 설정하면 체크해야만 지원할 수 있습니다.
        </p>
      </div>
    );
  }

  return null;
}
