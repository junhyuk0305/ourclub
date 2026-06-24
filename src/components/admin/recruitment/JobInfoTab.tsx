import React, { useEffect, useState } from 'react';
import { Loader, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { MarkdownEditor } from '../../ui/MarkdownEditor';
import { useToast } from '../../../hooks/useToast';
import type { RecruitmentRow } from '../../../types/recruitment';

type Recruitment =
  Pick<RecruitmentRow, 'id' | 'title' | 'generation' | 'category' | 'short_desc' | 'description' | 'deadline'>
  & { status: string }
  & Partial<Pick<RecruitmentRow, 'recruit_start_date' | 'targets' | 'location' | 'regular_meeting' | 'hashtags'>>;

interface Props {
  recruitment: Recruitment;
  onUpdate: (patch: Partial<Recruitment>) => void;
}

export function JobInfoTab({ recruitment, onUpdate }: Props) {
  const [title, setTitle] = useState(recruitment.title);
  const [generation, setGeneration] = useState(recruitment.generation ?? '');
  const [category, setCategory] = useState(recruitment.category ?? '');
  const [shortDesc, setShortDesc] = useState(recruitment.short_desc ?? '');
  const [description, setDescription] = useState(recruitment.description ?? '');
  const [targets, setTargets] = useState(recruitment.targets ?? '');
  const [location, setLocation] = useState(recruitment.location ?? '');
  const [regularMeeting, setRegularMeeting] = useState(recruitment.regular_meeting ?? '');
  const [startDate, setStartDate] = useState(formatDt(recruitment.recruit_start_date));
  const [deadline, setDeadline] = useState(formatDt(recruitment.deadline));
  const [hashtagsText, setHashtagsText] = useState((recruitment.hashtags ?? []).map(h => `#${h}`).join(' '));
  const [saving, setSaving] = useState(false);
  const { toast, show: showToast } = useToast();

  useEffect(() => {
    setTitle(recruitment.title);
    setGeneration(recruitment.generation ?? '');
    setCategory(recruitment.category ?? '');
    setShortDesc(recruitment.short_desc ?? '');
    setDescription(recruitment.description ?? '');
    setTargets(recruitment.targets ?? '');
    setLocation(recruitment.location ?? '');
    setRegularMeeting(recruitment.regular_meeting ?? '');
    setStartDate(formatDt(recruitment.recruit_start_date));
    setDeadline(formatDt(recruitment.deadline));
    setHashtagsText((recruitment.hashtags ?? []).map(h => `#${h}`).join(' '));
  }, [recruitment.id]);

  const save = async () => {
    if (!title.trim()) {
      showToast('공고 제목은 필수입니다.', false);
      return;
    }
    setSaving(true);
    const hashtags = hashtagsText
      .split(/[\s,]+/)
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    const patch = {
      title: title.trim(),
      generation: generation.trim() || null,
      category: category.trim() || null,
      short_desc: shortDesc.trim() || null,
      description: description.trim() || null,
      targets: targets.trim() || null,
      location: location.trim() || null,
      regular_meeting: regularMeeting.trim() || null,
      recruit_start_date: startDate || null,
      deadline: deadline || null,
      hashtags,
    };
    const { error } = await supabase.from('recruitments').update(patch).eq('id', recruitment.id);
    setSaving(false);
    if (error) {
      showToast(`저장 실패: ${error.message}`, false);
      return;
    }
    onUpdate(patch);
    showToast('공고가 저장되었습니다.', true);
  };

  const isDirty =
    title !== recruitment.title ||
    generation !== (recruitment.generation ?? '') ||
    category !== (recruitment.category ?? '') ||
    shortDesc !== (recruitment.short_desc ?? '') ||
    description !== (recruitment.description ?? '') ||
    targets !== (recruitment.targets ?? '') ||
    location !== (recruitment.location ?? '') ||
    regularMeeting !== (recruitment.regular_meeting ?? '') ||
    startDate !== formatDt(recruitment.recruit_start_date) ||
    deadline !== formatDt(recruitment.deadline) ||
    hashtagsText !== (recruitment.hashtags ?? []).map(h => `#${h}`).join(' ');

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-ink">공고 수정</h2>
          <p className="text-sm text-sand-500 font-bold mt-1">제목, 마감일, 본문 내용 등 공고 정보를 편집합니다.</p>
        </div>
        <button
          onClick={save}
          disabled={saving || !isDirty}
          className="px-5 py-2.5 rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 transition-all font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2.5} />}
          저장
        </button>
      </div>

      {/* 기본 정보 카드 */}
      <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6 flex flex-col gap-5">
        <h3 className="font-black text-base text-ink flex items-center gap-2">
          📋 기본 정보
        </h3>

        <Field label="모집 제목 *">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="예) 25기 정기 모집"
            className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="기수">
            <input
              value={generation}
              onChange={e => setGeneration(e.target.value)}
              placeholder="예) 25기"
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
            />
          </Field>
          <Field label="분야 / 카테고리">
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="예) 개발 / 기획 / 디자인"
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
            />
          </Field>
        </div>

        <Field label="짧은 설명 (공고 카드에 표시)">
          <input
            value={shortDesc}
            onChange={e => setShortDesc(e.target.value)}
            placeholder="한 줄로 매력적인 소개를 적어주세요"
            className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
          />
        </Field>

        <Field label="모집 대상">
          <input
            value={targets}
            onChange={e => setTargets(e.target.value)}
            placeholder="예) 대학생 누구나 / 25학번 이상"
            className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="주요 활동지">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="예) 서울 신촌"
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
            />
          </Field>
          <Field label="정기 활동일">
            <input
              value={regularMeeting}
              onChange={e => setRegularMeeting(e.target.value)}
              placeholder="예) 매주 수 19:00"
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="모집 시작일시" hint="비워두면 즉시 시작">
            <input
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
            />
          </Field>
          <Field label="모집 마감일시">
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
            />
          </Field>
        </div>

        <Field label="공고 해시태그" hint="쉼표·공백·#으로 구분. 검색에 사용됩니다.">
          <input
            value={hashtagsText}
            onChange={e => setHashtagsText(e.target.value)}
            placeholder="#개발 #기획 #신촌"
            className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
          />
        </Field>
      </div>

      {/* 본문 카드 */}
      <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6 flex flex-col gap-3">
        <div>
          <h3 className="font-black text-base text-ink flex items-center gap-2 mb-1">
            📝 공고 본문
          </h3>
          <p className="text-xs text-sand-500 font-bold">
            마크다운 문법으로 제목, 인용, 구분선, 이미지를 추가할 수 있습니다.
          </p>
        </div>
        <MarkdownEditor
          value={description}
          onChange={setDescription}
          placeholder="# 우리는 인사(人思)합니다&#10;&#10;## 너가 끌리는 일은 뭐야?&#10;&#10;- 활동 영역&#10;- 기대하는 인재상&#10;..."
          minHeight={420}
        />
      </div>

      {toast && (
        <div
          className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-card font-bold flex items-center gap-3 shadow-soft-lg ${
            toast.ok ? 'bg-ink text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} /> : <AlertCircle className="w-5 h-5" strokeWidth={2.5} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="font-bold text-xs block mb-1.5 text-sand-600">{label}</label>
      {children}
      {hint && <p className="text-xs text-sand-400 font-bold mt-1">{hint}</p>}
    </div>
  );
}

// timestamptz / date 문자열을 datetime-local input 형식(YYYY-MM-DDTHH:mm)으로
function formatDt(v: string | null | undefined): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
