import React, { useState, useEffect } from 'react';
import { CorpHeaderPortal } from './CorpLayout';
import { useCorp } from '../../contexts/CorpContext';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import {
  Plus, Loader, X, Building2, Calendar, Tag,
  CheckCircle2, ChevronRight,
} from 'lucide-react';
import { MarkdownEditor } from '../../components/ui/MarkdownEditor';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { ContractNatureBanner } from '../../components/b2b/B2BNotices';
import B2BHandoffModal, { type HandoffApp } from '../../components/b2b/B2BHandoffModal';

type AppStatus = '미열람' | '검토중' | '미팅요청' | '매칭완료' | '거절';

interface B2BProject {
  id: string;
  corp_id: string;
  title: string;
  category: string;
  budget: number | null;
  deadline: string | null;
  description: string | null;
  required_skills: string[];
  status: string;
  created_at: string;
}

interface B2BApplication {
  id: string;
  club_id: string;
  proposal_text: string | null;
  status: AppStatus;
  submitted_at: string;
  clubs: {
    name: string;
    type: string;
    logo_url: string | null;
  } | null;
}

interface FormState {
  title: string;
  category: string;
  budget: string;
  deadline: string;
  description: string;
  required_skills: string[];
}

const KANBAN_COLS: { key: AppStatus; label: string; bg: string; border?: string; headerBg?: string; dot?: string; pulse?: boolean }[] = [
  { key: '미열람',  label: '미열람',   bg: 'bg-sand-100' },
  { key: '검토중',  label: '검토 중',  bg: 'bg-info-bg',     dot: 'bg-info-fg' },
  { key: '미팅요청', label: '⚡ 미팅 요청', bg: 'bg-brand-tint', border: 'border-brand', headerBg: 'text-brand-dark', dot: 'bg-brand', pulse: true },
  { key: '매칭완료', label: '매칭 완료', bg: 'bg-ok-bg',  dot: 'bg-ok-fg' },
];

const CATEGORIES = ['마케팅', 'IT개발', '리서치', '디자인', '기획', '콘텐츠', '기타'];

const STATUS_STYLE: Record<AppStatus, string> = {
  '미열람':  'bg-off-bg text-off-fg',
  '검토중':  'bg-info-bg text-info-fg',
  '미팅요청': 'bg-warn-bg text-warn-fg',
  '매칭완료': 'bg-ok-bg text-ok-fg',
  '거절':    'bg-bad-bg text-bad-fg',
};

// ── Application Card ───────────────────────────────────────────────────────

function AppCard({ app, onClick }: { app: B2BApplication; onClick: () => void }) {
  const initial = app.clubs?.name?.[0] ?? '?';
  return (
    <div
      onClick={onClick}
      className="bg-white border border-sand-200 rounded-card p-4 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 border border-sand-200 rounded-ctl bg-sand-100 flex items-center justify-center font-black text-lg text-ink shrink-0 overflow-hidden">
          {app.clubs?.logo_url
            ? <img src={app.clubs.logo_url} alt="" className="w-full h-full object-cover" />
            : initial}
        </div>
        <div className="min-w-0">
          <p className="font-black text-base text-ink leading-tight truncate">{app.clubs?.name ?? '—'}</p>
          <p className="text-xs font-bold text-sand-500 truncate">{app.clubs?.type ?? '동아리'}</p>
        </div>
      </div>
      {app.proposal_text && (
        <p className="text-sm font-medium text-sand-600 line-clamp-2 mb-2">"{app.proposal_text}"</p>
      )}
      <p className="text-xs font-bold text-sand-400">
        {formatDate(app.submitted_at)} 지원
      </p>
    </div>
  );
}

// ── Application Detail Modal ───────────────────────────────────────────────

function AppModal({
  app, onClose, onStatusChange, onOpenHandoff,
}: {
  app: B2BApplication;
  onClose: () => void;
  onStatusChange: (id: string, status: AppStatus) => Promise<void>;
  onOpenHandoff: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const handle = async (status: AppStatus) => {
    setUpdating(true);
    await onStatusChange(app.id, status);
    setUpdating(false);
  };

  const rejectStyle = 'bg-white text-bad-fg border border-sand-300 hover:bg-bad-bg';
  const nextActions: { label: string; status: AppStatus; style: string }[] = [];
  if (app.status === '미열람') {
    nextActions.push({ label: '검토 시작하기', status: '검토중', style: 'btn-grad text-white shadow-btn' });
    nextActions.push({ label: '거절하기', status: '거절', style: rejectStyle });
  } else if (app.status === '검토중') {
    nextActions.push({ label: '미팅 요청하기', status: '미팅요청', style: 'btn-grad text-white shadow-btn' });
    nextActions.push({ label: '거절하기', status: '거절', style: rejectStyle });
  } else if (app.status === '미팅요청') {
    nextActions.push({ label: '최종 매칭 확정', status: '매칭완료', style: 'btn-grad text-white shadow-btn' });
    nextActions.push({ label: '거절하기', status: '거절', style: rejectStyle });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sand-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-sand-200 rounded-ctl bg-sand-100 flex items-center justify-center font-black text-2xl text-ink shrink-0 overflow-hidden">
              {app.clubs?.logo_url
                ? <img src={app.clubs.logo_url} alt="" className="w-full h-full object-cover" />
                : (app.clubs?.name?.[0] ?? '?')}
            </div>
            <div>
              <h3 className="font-black text-xl text-ink">{app.clubs?.name ?? '—'}</h3>
              <p className="text-sm font-bold text-sand-500">{app.clubs?.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-ctl text-sand-500 hover:bg-sand-100 transition-colors">
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div>
            <p className="text-xs font-black text-sand-400 uppercase mb-2">현재 상태</p>
            <span className={`px-3 py-1 rounded-ctl font-black text-sm ${STATUS_STYLE[app.status]}`}>
              {app.status}
            </span>
          </div>

          {app.proposal_text ? (
            <div>
              <p className="text-xs font-black text-sand-400 uppercase mb-2">제안서 내용</p>
              <div className="bg-sand-50 border border-sand-200 rounded-card p-4 text-sm font-medium text-sand-600 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {app.proposal_text}
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-sand-400">제안서 내용이 없습니다.</p>
          )}

          <p className="text-xs font-bold text-sand-400">
            지원일: {formatDate(app.submitted_at)}
          </p>
        </div>

        {/* Actions */}
        {app.status === '매칭완료' ? (
          <div className="p-6 border-t border-sand-200 bg-ok-bg rounded-b-card flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-ok-fg" strokeWidth={2.5} />
              <span className="font-black text-ok-fg">최종 매칭이 완료되었습니다.</span>
            </div>
            <button
              onClick={onOpenHandoff}
              className="w-full py-3 rounded-ctl btn-grad text-white shadow-btn font-black text-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              프로젝트 진행 관리 <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : app.status === '거절' ? (
          <div className="p-6 border-t border-sand-200 bg-bad-bg rounded-b-card text-center font-black text-bad-fg text-sm">
            거절된 지원입니다.
          </div>
        ) : nextActions.length > 0 ? (
          <div className="p-6 border-t border-sand-200 flex gap-3">
            {nextActions.map(action => (
              <button
                key={action.status}
                onClick={() => handle(action.status)}
                disabled={updating}
                className={`flex-1 py-3 rounded-ctl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${action.style}`}
              >
                {updating ? <Loader className="w-4 h-4 animate-spin" /> : action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Create Project Modal ───────────────────────────────────────────────────

function CreateModal({
  form, setForm, creating, onClose, onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  creating: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.required_skills.includes(s)) {
      setForm(prev => ({ ...prev, required_skills: [...prev.required_skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, required_skills: prev.required_skills.filter(s => s !== skill) }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sand-200">
          <h2 className="text-2xl font-black text-ink">새 프로젝트 의뢰하기</h2>
          <button onClick={onClose} className="p-2 rounded-ctl text-sand-500 hover:bg-sand-100 transition-colors">
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* 도급 성격 고지 (R1) */}
          <ContractNatureBanner />

          {/* 프로젝트명 */}
          <div>
            <label className="block font-black text-ink mb-1 text-sm">프로젝트명 <span className="text-red-500">*</span></label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="예) 20대 타겟 FGI 리서치 및 UX 테스트"
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none bg-white"
            />
          </div>

          {/* 카테고리 + 예산 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-black text-ink mb-1 text-sm">카테고리 <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none bg-white cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-black text-ink mb-1 text-sm">예산 (원)</label>
              <input
                type="number"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="미입력 시 협의"
                className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none bg-white"
              />
            </div>
          </div>

          {/* 마감일 */}
          <div>
            <label className="block font-black text-ink mb-1 text-sm">지원 마감일</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none bg-white"
            />
          </div>

          {/* 필요 역량 태그 */}
          <div>
            <label className="block font-black text-ink mb-1 text-sm">필요 역량 / 태그</label>
            <div className="flex gap-2 mb-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="예) UX리서치, 기획, 마케팅"
                className="field flex-1 p-3 border border-sand-300 rounded-ctl font-bold outline-none bg-white"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-3 rounded-ctl btn-grad text-white font-black shadow-btn transition-all hover:-translate-y-0.5"
              >
                추가
              </button>
            </div>
            {form.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.required_skills.map(s => (
                  <span key={s} className="flex items-center gap-1 px-3 py-1 rounded-ctl bg-brand-tint text-brand font-bold text-sm">
                    <Tag className="w-3 h-3" strokeWidth={2.5} />{s}
                    <button type="button" onClick={() => removeSkill(s)} className="ml-1 hover:text-bad-fg">
                      <X className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 프로젝트 설명 (마크다운) */}
          <div>
            <label className="block font-black text-ink mb-1 text-sm">프로젝트 설명</label>
            <MarkdownEditor
              value={form.description}
              onChange={v => setForm(f => ({ ...f, description: v }))}
              placeholder="## 프로젝트 목적&#10;&#10;- 원하는 동아리 유형&#10;- 협업 방식&#10;- 기대 산출물"
              minHeight={220}
            />
          </div>

          {/* 대금 지급·세무 처리 안내 (R2) */}
          <div className="border border-sand-200 bg-sand-50 rounded-card px-4 py-3 text-xs font-bold text-sand-600 leading-relaxed">
            <p className="text-ink mb-1">대금 지급·세무 처리 안내</p>
            동아리는 사업자등록이 없어 세금계산서 발행이 어렵습니다. 기본 경로는 <strong>학생 개인에게 사업소득세 3.3% 원천징수 후 지급</strong>(지급액은 비용 처리 가능)이며,
            세금계산서가 필요하면 동아리 측 간이과세자 등록을 협의할 수 있습니다. 대금은 기업이 프로젝트팀에 직접 지급하며 OURCLUB은 대금을 보관하지 않습니다.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-sand-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-ctl bg-white text-ink border border-sand-300 font-black hover:bg-sand-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!form.title.trim() || creating}
            className="flex-1 py-3 rounded-ctl btn-grad text-white font-black shadow-btn transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
            프로젝트 등록하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  title: '', category: '마케팅', budget: '', deadline: '', description: '', required_skills: [],
};

export default function CorpDashboard() {
  const { corporation, corpId } = useCorp();
  const [projects, setProjects]           = useState<B2BProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [applications, setApplications]   = useState<B2BApplication[]>([]);
  const [fetching, setFetching]           = useState(true);
  const [appFetching, setAppFetching]     = useState(false);
  const [showCreate, setShowCreate]       = useState(false);
  const [selectedApp, setSelectedApp]     = useState<B2BApplication | null>(null);
  const [handoffApp, setHandoffApp]       = useState<HandoffApp | null>(null);
  const [form, setForm]                   = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating]           = useState(false);

  useEffect(() => {
    if (!corpId) { setFetching(false); return; }
    loadProjects(corpId);
  }, [corpId]);

  useEffect(() => {
    if (!selectedProjectId) { setApplications([]); return; }
    loadApplications(selectedProjectId);
  }, [selectedProjectId]);

  const loadProjects = async (cid: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('b2b_projects')
      .select('*')
      .eq('corp_id', cid)
      .order('created_at', { ascending: false });
    const list = (data as B2BProject[]) ?? [];
    setProjects(list);
    if (list.length > 0) setSelectedProjectId(list[0].id);
    setFetching(false);
  };

  const loadApplications = async (pid: string) => {
    setAppFetching(true);
    const { data } = await supabase
      .from('b2b_applications')
      .select('id, club_id, proposal_text, status, submitted_at, clubs(name, type, logo_url)')
      .eq('project_id', pid)
      .order('submitted_at', { ascending: false });
    setApplications((data as unknown as B2BApplication[]) ?? []);
    setAppFetching(false);
  };

  const updateStatus = async (appId: string, status: AppStatus) => {
    const { error } = await supabase.from('b2b_applications').update({ status }).eq('id', appId);
    if (error) return; // 쓰기 실패 시 낙관적 반영 생략 — DB가 안 바뀌었으므로 기존 로컬값이 진실(거짓 성공 방지)
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    setSelectedApp(prev => (prev?.id === appId ? { ...prev, status } : prev));
  };

  const handleCreate = async () => {
    if (!corpId || !form.title.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('b2b_projects')
      .insert({
        corp_id: corpId,
        title: form.title.trim(),
        category: form.category,
        budget: form.budget ? parseInt(form.budget, 10) : null,
        deadline: form.deadline || null,
        description: form.description.trim() || null,
        required_skills: form.required_skills,
        status: '모집중',
      })
      .select()
      .single();
    setCreating(false);
    if (error || !data) return;
    const proj = data as B2BProject;
    setProjects(prev => [proj, ...prev]);
    setSelectedProjectId(proj.id);
    setApplications([]);
    setShowCreate(false);
    setForm(EMPTY_FORM);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const rejectedCount   = applications.filter(a => a.status === '거절').length;

  return (
    <>
      <CorpHeaderPortal>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-4 px-6 py-2 rounded-ctl btn-grad text-white font-black shadow-btn hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> 새 프로젝트 의뢰하기
        </button>
      </CorpHeaderPortal>

      <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          {fetching ? (
            <LoadingScreen />
          ) : projects.length === 0 ? (
            /* ── 프로젝트 없는 경우 ── */
            <div className="max-w-6xl mx-auto text-center py-24 border border-dashed border-sand-300 rounded-card bg-white">
              <Building2 className="w-16 h-16 text-sand-300 mx-auto mb-4" strokeWidth={2.5} />
              <h2 className="text-2xl font-black text-sand-400 mb-2">아직 의뢰한 프로젝트가 없습니다</h2>
              <p className="text-sand-400 font-bold mb-8">첫 번째 프로젝트를 의뢰하고 적합한 동아리를 찾아보세요!</p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-8 py-4 rounded-ctl btn-grad text-white font-black shadow-btn hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} /> 첫 프로젝트 의뢰하기
              </button>
            </div>
          ) : (
            /* ── 본 콘텐츠 ── */
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
              <div>
                <h2 className="text-4xl font-black text-ink mb-2">발주한 프로젝트</h2>
                <p className="text-sand-500 font-bold">지원한 동아리 목록을 검토하고 미팅을 진행하세요.</p>
              </div>

              {/* 프로젝트 선택 바 */}
              <div className="bg-white border border-sand-200 rounded-card shadow-soft flex flex-col md:flex-row md:items-stretch overflow-hidden">
                <div className="px-5 py-4 border-b md:border-b-0 md:border-r border-sand-200 shrink-0 flex items-center">
                  <span className="font-black text-brand text-sm whitespace-nowrap">진행 프로젝트</span>
                </div>
                <select
                  value={selectedProjectId ?? ''}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="font-black text-base text-ink outline-none bg-transparent cursor-pointer flex-1 min-w-0 px-5 py-4"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                {selectedProject && (
                  <div className="flex items-center gap-0 border-t md:border-t-0 md:border-l border-sand-200 divide-x divide-sand-200">
                    {selectedProject.deadline && (
                      <div className="px-4 py-3 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-sand-400 uppercase tracking-wider mb-0.5">마감</span>
                        <span className="font-black text-sm text-ink flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-sand-400" strokeWidth={2.5} />
                          {formatDate(selectedProject.deadline, 'monthDay')}
                        </span>
                      </div>
                    )}
                    {selectedProject.budget ? (
                      <div className="px-4 py-3 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-sand-400 uppercase tracking-wider mb-0.5">예산</span>
                        <span className="font-black text-sm text-brand">{selectedProject.budget.toLocaleString()}원</span>
                      </div>
                    ) : null}
                    {selectedProject.required_skills?.length > 0 && (
                      <div className="px-4 py-3 flex flex-col justify-center shrink-0 gap-1">
                        <span className="text-[10px] font-bold text-sand-400 uppercase tracking-wider">스킬</span>
                        <div className="flex gap-1 flex-wrap">
                          {selectedProject.required_skills.slice(0, 3).map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded-md bg-brand-tint text-brand text-xs font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 칸반 보드 */}
              {appFetching ? (
                <div className="flex justify-center py-16">
                  <Loader className="w-8 h-8 animate-spin text-brand" />
                </div>
              ) : (
                <>
                  <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
                    {KANBAN_COLS.map(col => {
                      const colApps = applications.filter(a => a.status === col.key);
                      const emptyHint: Record<AppStatus, string> = {
                        '미열람':  '아직 새 지원이\n없습니다',
                        '검토중':  '검토 중인\n지원이 없습니다',
                        '미팅요청': '미팅 요청 대기\n지원이 없습니다',
                        '매칭완료': '최종 매칭된\n동아리가 없습니다',
                        '거절':    '',
                      };
                      return (
                        <div key={col.key} className={`flex flex-col border ${col.border ?? 'border-sand-200'} rounded-card p-4 ${col.bg} h-[540px] min-w-[220px] md:min-w-0 shrink-0 md:shrink`}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-2 ${col.key === '미팅요청' ? 'border-brand' : 'border-sand-200'}`}>
                            <h3 className={`font-black text-base text-ink flex items-center gap-2 ${col.headerBg ?? ''}`}>
                              {col.dot && (
                                <span className={`w-2 h-2 rounded-full ${col.dot} ${col.pulse ? 'animate-pulse' : ''}`} />
                              )}
                              {col.label}
                            </h3>
                            <span className="bg-white text-ink font-black px-2 py-0.5 rounded-ctl border border-sand-200 text-sm">
                              {colApps.length}
                            </span>
                          </div>
                          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-0.5">
                            {colApps.length === 0 ? (
                              <div className="flex-1 flex items-center justify-center border border-dashed border-sand-300 rounded-card p-4 text-center min-h-[80px]">
                                <p className="font-bold text-sand-400 text-xs leading-relaxed whitespace-pre-line">
                                  {emptyHint[col.key]}
                                </p>
                              </div>
                            ) : (
                              colApps.map(app => (
                                <AppCard key={app.id} app={app} onClick={() => setSelectedApp(app)} />
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {rejectedCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-sand-200 rounded-ctl self-start">
                      <span className="w-2 h-2 rounded-full bg-bad-fg shrink-0" />
                      <p className="text-sm font-bold text-sand-400">
                        거절 처리된 지원 <span className="text-bad-fg font-black">{rejectedCount}건</span> — 칸반에서 숨겨짐
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>

      {/* 지원서 상세 모달 */}
      {selectedApp && (
        <AppModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={updateStatus}
          onOpenHandoff={() => {
            if (!selectedProject) return;
            setHandoffApp({
              applicationId: selectedApp.id,
              projectId: selectedProject.id,
              clubId: selectedApp.club_id,
              projectTitle: selectedProject.title,
              clubName: selectedApp.clubs?.name ?? '매칭 동아리',
              projectStatus: selectedProject.status,
            });
            setSelectedApp(null);
          }}
        />
      )}

      {/* 매칭 후 핸드오프(진행 관리) 모달 */}
      {handoffApp && (
        <B2BHandoffModal
          side="corp"
          app={handoffApp}
          onClose={() => setHandoffApp(null)}
          onProjectStatusChange={status =>
            setProjects(prev => prev.map(p => p.id === handoffApp.projectId ? { ...p, status } : p))
          }
        />
      )}

      {/* 프로젝트 생성 모달 */}
      {showCreate && (
        <CreateModal
          form={form}
          setForm={setForm}
          creating={creating}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
    </>
  );
}
