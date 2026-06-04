import React, { useEffect, useRef, useState } from 'react';
import {
  Search, UserCheck, X, Loader, MessageSquare, ChevronDown, GripVertical, Users,
  Plus, HelpCircle, Download, LayoutGrid, List, ChevronUp, ArrowUpDown, CheckSquare, Square,
  Inbox, Tag, Calendar, ShieldCheck, ShieldX, FileText, ClipboardCheck, FileEdit, Save, Bell,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAdmin } from '../../../contexts/AdminContext';

interface Applicant {
  id: string;
  recruitment_id: string;
  status: string;
  score: number | null;
  interviewer_note: string | null;
  interview_at: string | null;
  submitted_at: string;
  interview_questions: string[] | null;
  memos: { author: string; content: string; created_at: string }[] | null;
  tags: string[] | null;
  profiles: {
    name: string;
    email: string;
    phone: string | null;
    major: string | null;
    university: string | null;
    portfolio_url: string | null;
  } | null;
  answers: Record<string, string>;
}

interface EmailModalState {
  applicant: Applicant;
  fromStage: string;
  toStage: string;
  subject: string;
  body: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  stage: string | null;
  subject: string;
  body: string;
}

type ViewMode = 'kanban' | 'list';
type SortKey = 'name' | 'submitted_at' | 'status' | 'score';
type SortDir = 'asc' | 'desc';

interface Props {
  recruitmentId: string;
  pipelineStages: string[];
  recruitmentTitle: string;
}

export function ApplicantsTab({ recruitmentId, pipelineStages, recruitmentTitle }: Props) {
  const stages = pipelineStages;
  const { adminClubId } = useAdmin();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [emailModal, setEmailModal] = useState<EmailModalState | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [sortKey, setSortKey] = useState<SortKey>('submitted_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState('');

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!recruitmentId) return;
    loadApplicants(recruitmentId);
  }, [recruitmentId]);

  useEffect(() => {
    if (!adminClubId) return;
    loadTemplates();
  }, [adminClubId]);

  const loadTemplates = async () => {
    if (!adminClubId) return;
    const { data } = await supabase
      .from('club_email_templates')
      .select('id, name, stage, subject, body')
      .eq('club_id', adminClubId)
      .order('created_at', { ascending: false });
    setTemplates((data as EmailTemplate[] | null) ?? []);
  };

  const loadApplicants = async (rId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('recruitment_applications')
      .select('id, recruitment_id, status, score, interviewer_note, interview_at, submitted_at, answers, interview_questions, memos, tags, profiles(name, email, phone, major, university, portfolio_url)')
      .eq('recruitment_id', rId)
      .order('submitted_at', { ascending: false });

    setApplicants((data as unknown as Applicant[]) ?? []);
    setSelectedIds(new Set());
    setFetching(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const updateLocal = (id: string, patch: Partial<Applicant>) => {
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    if (selectedApplicant?.id === id) setSelectedApplicant(prev => prev ? { ...prev, ...patch } : null);
  };

  const changeStatus = async (id: string, newStage: string) => {
    await supabase.from('recruitment_applications').update({ status: newStage }).eq('id', id);
    updateLocal(id, { status: newStage });
  };

  const saveNote = async (id: string, score: number | null, note: string) => {
    await supabase.from('recruitment_applications').update({ score, interviewer_note: note }).eq('id', id);
    updateLocal(id, { score, interviewer_note: note });
  };

  const addMemo = async (id: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const author = user?.email?.split('@')[0] ?? '운영진';
    const applicant = applicants.find(a => a.id === id);
    if (!applicant) return;
    const entry = { author, content, created_at: new Date().toISOString() };
    const updated = [...(applicant.memos ?? []), entry];
    await supabase.from('recruitment_applications').update({ memos: updated }).eq('id', id);
    updateLocal(id, { memos: updated });
  };

  const saveInterviewQuestions = async (id: string, questions: string[]) => {
    await supabase.from('recruitment_applications').update({ interview_questions: questions }).eq('id', id);
    updateLocal(id, { interview_questions: questions });
  };

  const saveTags = async (id: string, tags: string[]) => {
    await supabase.from('recruitment_applications').update({ tags }).eq('id', id);
    updateLocal(id, { tags });
  };

  const exportToCSV = (targets?: Applicant[]) => {
    const list = targets ?? applicants;
    if (list.length === 0) return;
    const allKeys = Array.from(new Set(list.flatMap(a => Object.keys(a.answers ?? {}))));
    const headers = ['이름', '이메일', '전화번호', '학교', '전공', '상태', '태그', '점수', '지원일', ...allKeys];
    const rows = list.map(a => [
      a.profiles?.name ?? '', a.profiles?.email ?? '', a.profiles?.phone ?? '',
      a.profiles?.university ?? '', a.profiles?.major ?? '',
      a.status, (a.tags ?? []).join(' '),
      a.score != null ? String(a.score) : '',
      new Date(a.submitted_at).toLocaleDateString('ko-KR'),
      ...allKeys.map(k => a.answers?.[k] ?? ''),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recruitmentTitle}_지원자.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openEmailModal = (applicant: Applicant, toStage: string) => {
    // 해당 단계의 기본 템플릿 찾기
    const matched = templates.find(t => t.stage === toStage) ?? templates.find(t => !t.stage) ?? null;
    const fill = (s: string) => s
      .replace(/{{\s*name\s*}}/g, applicant.profiles?.name ?? '지원자')
      .replace(/{{\s*recruitment_title\s*}}/g, recruitmentTitle)
      .replace(/{{\s*stage\s*}}/g, toStage);
    const defaultBody = `안녕하세요, ${applicant.profiles?.name ?? '지원자'}님!\n\n${recruitmentTitle}에 지원해주셔서 감사합니다.\n\n현재 '${toStage}' 단계로 진행되었습니다. 자세한 내용은 마이페이지 알림에서 확인하실 수 있어요.\n\n감사합니다.`;
    const defaultSubject = `[${recruitmentTitle}] ${toStage} 안내`;
    setEmailModal({
      applicant,
      fromStage: applicant.status,
      toStage,
      subject: matched ? fill(matched.subject) : defaultSubject,
      body: matched ? fill(matched.body) : defaultBody,
    });
  };

  const confirmStageMove = async (sendEmail: boolean) => {
    if (!emailModal) return;
    await changeStatus(emailModal.applicant.id, emailModal.toStage);
    // 이동 로그
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('application_stage_log').insert({
      application_id: emailModal.applicant.id,
      from_stage: emailModal.fromStage,
      to_stage: emailModal.toStage,
      email_sent: sendEmail,
      email_subject: sendEmail ? emailModal.subject : null,
      email_body: sendEmail ? emailModal.body : null,
      moved_by: user?.id ?? null,
    });
    showToast(
      sendEmail
        ? `${emailModal.applicant.profiles?.name ?? ''} → '${emailModal.toStage}' 이동 및 알림 전송`
        : `${emailModal.applicant.profiles?.name ?? ''} → '${emailModal.toStage}' 이동`
    );
    setEmailModal(null);
  };

  const saveAsTemplate = async (name: string, asDefault: boolean) => {
    if (!emailModal || !adminClubId) return;
    await supabase.from('club_email_templates').insert({
      club_id: adminClubId,
      name,
      stage: asDefault ? emailModal.toStage : null,
      subject: emailModal.subject,
      body: emailModal.body,
      is_default: asDefault,
    });
    await loadTemplates();
    showToast('템플릿이 저장되었습니다.');
  };

  const bulkChangeStatus = async () => {
    if (!bulkStage || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await supabase.from('recruitment_applications').update({ status: bulkStage }).in('id', ids);
    setApplicants(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, status: bulkStage } : a));
    showToast(`${ids.length}명 → '${bulkStage}' 이동 완료`);
    setSelectedIds(new Set());
    setBulkStage('');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };
  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggingId) return;
    const applicant = applicants.find(a => a.id === draggingId);
    setDraggingId(null);
    if (!applicant || applicant.status === targetStage) return;
    openEmailModal(applicant, targetStage);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = applicants.filter(a =>
    !search ||
    (a.profiles?.name ?? '').includes(search) ||
    (a.profiles?.major ?? '').includes(search) ||
    (a.tags ?? []).some(t => t.includes(search))
  );

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = '';
    let bv: string | number = '';
    if (sortKey === 'name') { av = a.profiles?.name ?? ''; bv = b.profiles?.name ?? ''; }
    if (sortKey === 'submitted_at') { av = a.submitted_at; bv = b.submitted_at; }
    if (sortKey === 'status') { av = stages.indexOf(a.status); bv = stages.indexOf(b.status); }
    if (sortKey === 'score') { av = a.score ?? -1; bv = b.score ?? -1; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const allSelected = sorted.length > 0 && sorted.every(a => selectedIds.has(a.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map(a => a.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4 border-b border-gray-200 bg-white flex items-center justify-between gap-4 shrink-0 flex-wrap">
        <p className="text-gray-500 font-bold text-sm">
          {viewMode === 'kanban' ? '지원자 카드를 드래그하여 단계를 이동하세요.' : '지원자 전체를 표 형태로 관리합니다.'}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="이름·전공·태그 검색"
              className="pl-9 pr-4 py-2 border border-black font-bold outline-none focus:border-orange-500 w-52 text-sm"
            />
          </div>
          <div className="flex border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setViewMode('kanban')} title="칸반 뷰" className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} title="리스트 뷰" className={`p-2 transition-colors border-l border-black ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => exportToCSV(selectedIds.size > 0 ? sorted.filter(a => selectedIds.has(a.id)) : undefined)}
            disabled={applicants.length === 0}
            className="px-4 py-2 border border-black font-bold text-sm bg-white hover:bg-green-500 transition-colors flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {selectedIds.size > 0 ? `CSV (${selectedIds.size}명)` : 'CSV'}
          </button>
          <span className="text-sm font-bold text-gray-500 border border-gray-200 px-3 py-2 bg-white">
            총 {applicants.length}명
          </span>
        </div>
      </div>

      {fetching ? (
        <div className="flex-1 flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : stages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-black text-gray-400 mb-2">프로세스 단계가 설정되지 않았습니다</h3>
            <p className="text-sm font-bold text-gray-400">
              상단의 <span className="text-orange-500">'채용 프로세스'</span> 탭에서 단계를 추가하세요.
            </p>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full" style={{ minWidth: `${stages.length * 280}px` }}>
            {stages.map((stage, idx) => {
              const stageCards = filtered.filter(a => a.status === stage);
              const isLast = idx === stages.length - 1;
              const isDropTarget = dragOverStage === stage;
              return (
                <div
                  key={stage}
                  className={`flex flex-col border-r border-black transition-colors ${isDropTarget ? 'bg-orange-50' : 'bg-gray-50'}`}
                  style={{ width: '280px', minWidth: '280px' }}
                  onDragOver={e => handleDragOver(e, stage)}
                  onDrop={e => handleDrop(e, stage)}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null); }}
                >
                  <div className={`px-4 py-3 border-b-2 border-black flex items-center justify-between shrink-0 ${isLast ? 'bg-green-500' : 'bg-white'}`}>
                    <h3 className={`font-black text-sm ${isLast ? 'text-white' : 'text-black'}`}>{stage}</h3>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isLast ? 'bg-white text-green-700' : 'bg-black text-white'}`}>
                      {stageCards.length}
                    </span>
                  </div>
                  <div className={`flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0 ${isDropTarget ? 'outline-2 outline-dashed outline-orange-400 outline-offset-[-4px]' : ''}`}>
                    {stageCards.length === 0 && (
                      <div className={`border-2 border-dashed rounded p-6 text-center text-xs font-bold leading-relaxed ${isDropTarget ? 'border-orange-400 text-orange-500 bg-orange-50' : 'border-gray-200 text-gray-300'}`}>
                        {isDropTarget ? '여기에 놓기' : isLast ? '최종 합격자\n없음' : idx === 0 ? '새 지원이\n없습니다' : `${stage} 단계\n없음`}
                      </div>
                    )}
                    {stageCards.map(app => (
                      <KanbanCard
                        key={app.id}
                        applicant={app}
                        isDragging={draggingId === app.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedApplicant(app)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white">
          {selectedIds.size > 0 && (
            <div className="px-8 py-3 bg-orange-50 border-b border-orange-200 flex items-center gap-4 shrink-0">
              <span className="text-sm font-black text-orange-700">{selectedIds.size}명 선택됨</span>
              <div className="flex items-center gap-2">
                <select value={bulkStage} onChange={e => setBulkStage(e.target.value)} className="px-3 py-1.5 border border-black font-bold text-sm outline-none focus:border-orange-500 bg-white">
                  <option value="">단계 선택...</option>
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={bulkChangeStatus} disabled={!bulkStage} className="px-4 py-1.5 bg-black text-white font-black text-sm hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-40">
                  일괄 이동
                </button>
              </div>
              <button onClick={() => exportToCSV(sorted.filter(a => selectedIds.has(a.id)))} className="flex items-center gap-1.5 px-4 py-1.5 border border-black font-bold text-sm bg-white hover:bg-green-500 transition-colors">
                <Download className="w-3.5 h-3.5" /> 선택 CSV
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 font-bold hover:text-black ml-auto">선택 해제</button>
            </div>
          )}
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="sticky top-0 bg-white z-10 border-b-2 border-black">
              <tr>
                <th className="w-12 px-4 py-3">
                  <button onClick={toggleAll}>
                    {allSelected ? <CheckSquare className="w-4 h-4 text-orange-500" /> : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
                <SortTh label="이름" sortKey="name" current={sortKey} dir={sortDir} onToggle={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">학교·전공</th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">태그</th>
                <SortTh label="지원일" sortKey="submitted_at" current={sortKey} dir={sortDir} onToggle={toggleSort} />
                <SortTh label="단계" sortKey="status" current={sortKey} dir={sortDir} onToggle={toggleSort} />
                <SortTh label="점수" sortKey="score" current={sortKey} dir={sortDir} onToggle={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400 font-bold">
                  <Inbox className="w-10 h-10 mx-auto mb-2 text-gray-200" />지원자가 없습니다.
                </td></tr>
              )}
              {sorted.map((app, i) => {
                const isSelected = selectedIds.has(app.id);
                const isLast = app.status === stages[stages.length - 1];
                return (
                  <tr key={app.id} className={`border-b border-gray-100 transition-colors cursor-pointer ${isSelected ? 'bg-orange-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-orange-50`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleOne(app.id); }}>
                      {isSelected ? <CheckSquare className="w-4 h-4 text-orange-500" /> : <Square className="w-4 h-4 text-gray-300" />}
                    </td>
                    <td className="px-4 py-3" onClick={() => setSelectedApplicant(app)}>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{app.profiles?.name ?? '—'}</span>
                        {app.score != null && <span className="text-xs font-black text-orange-500">{app.score}점</span>}
                        {app.interviewer_note && <MessageSquare className="w-3 h-3 text-orange-400" />}
                      </div>
                      <p className="text-xs text-gray-400 font-medium">{app.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-medium" onClick={() => setSelectedApplicant(app)}>
                      {[app.profiles?.university, app.profiles?.major].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3" onClick={() => setSelectedApplicant(app)}>
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(app.tags ?? []).slice(0, 3).map((t, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200">
                            #{t}
                          </span>
                        ))}
                        {(app.tags?.length ?? 0) > 3 && <span className="text-[10px] text-gray-400 font-bold">+{(app.tags?.length ?? 0) - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-500" onClick={() => setSelectedApplicant(app)}>
                      {new Date(app.submitted_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3" onClick={() => setSelectedApplicant(app)}>
                      <span className={`inline-block text-xs font-black px-2.5 py-1 border ${isLast ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={() => setSelectedApplicant(app)}>
                      {app.score != null ? (
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${app.score}%` }} />
                          </div>
                          <span className="text-xs font-black text-gray-600">{app.score}</span>
                        </div>
                      ) : <span className="text-xs text-gray-300 font-bold">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {stages.map(s => (
                          <button
                            key={s}
                            onClick={e => { e.stopPropagation(); if (app.status !== s) openEmailModal(app, s); }}
                            title={s}
                            className="p-1.5 group/dot"
                          >
                            <span className={`block w-2.5 h-2.5 rounded-full border transition-all ${app.status === s ? 'bg-orange-500 border-orange-500 scale-125' : 'bg-gray-200 border-gray-300 group-hover/dot:bg-orange-300'}`} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedApplicant && !emailModal && (
        <ApplicantModal
          key={selectedApplicant.id}
          applicant={selectedApplicant}
          stages={stages}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={(id, stage) => {
            const app = applicants.find(a => a.id === id);
            if (!app || app.status === stage) return;
            openEmailModal(app, stage);
          }}
          onSaveNote={saveNote}
          onAddMemo={addMemo}
          onSaveQuestions={saveInterviewQuestions}
          onSaveTags={saveTags}
        />
      )}

      {emailModal && (
        <EmailMoveModal
          state={emailModal}
          templates={templates}
          onChangeState={next => setEmailModal(next)}
          onConfirm={confirmStageMove}
          onSaveAsTemplate={saveAsTemplate}
          onClose={() => setEmailModal(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-[70] bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(255,165,0,0.5)]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {toast}
        </div>
      )}
    </div>
  );
}

function EmailMoveModal({
  state, templates, onChangeState, onConfirm, onSaveAsTemplate, onClose,
}: {
  state: EmailModalState;
  templates: EmailTemplate[];
  onChangeState: (s: EmailModalState) => void;
  onConfirm: (sendEmail: boolean) => void;
  onSaveAsTemplate: (name: string, asDefault: boolean) => void;
  onClose: () => void;
}) {
  const [showSave, setShowSave] = useState(false);
  const [tplName, setTplName] = useState('');
  const [asDefault, setAsDefault] = useState(true);

  const applyTemplate = (tpl: EmailTemplate) => {
    const fill = (s: string) => s
      .replace(/{{\s*name\s*}}/g, state.applicant.profiles?.name ?? '지원자')
      .replace(/{{\s*stage\s*}}/g, state.toStage);
    onChangeState({ ...state, subject: fill(tpl.subject), body: fill(tpl.body) });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-2 border-black w-full max-w-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[92vh]">
        <div className="p-6 border-b border-black bg-gray-50 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500" /> 단계 이동 알림</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-orange-50 border border-orange-200 p-4 text-sm font-bold text-orange-800 flex gap-2 items-start">
            <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              <strong>{state.applicant.profiles?.name}</strong>님을{' '}
              <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">{state.fromStage}</span>
              {' → '}<span className="bg-orange-500 px-1.5 py-0.5 rounded text-white">{state.toStage}</span>{' '}으로 이동합니다.
            </p>
          </div>
          <div><label className="font-black text-sm mb-1 block">수신: <span className="font-bold text-gray-600">{state.applicant.profiles?.name ?? '지원자'}님 (마이페이지 인앱 알림)</span></label></div>

          {/* 템플릿 선택 */}
          {templates.length > 0 && (
            <div>
              <label className="font-black text-xs block mb-1.5 text-gray-700">템플릿 불러오기</label>
              <select
                onChange={e => {
                  const tpl = templates.find(t => t.id === e.target.value);
                  if (tpl) applyTemplate(tpl);
                  e.target.value = '';
                }}
                defaultValue=""
                className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500 text-sm bg-white"
              >
                <option value="" disabled>저장된 템플릿 선택...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.stage ? ` · ${t.stage}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="font-black text-xs block mb-1.5 text-gray-700">제목</label>
            <input
              value={state.subject}
              onChange={e => onChangeState({ ...state, subject: e.target.value })}
              className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm"
            />
          </div>

          <div>
            <label className="font-black text-xs block mb-1.5 text-gray-700">
              본문 <span className="font-medium text-gray-400">— 사용 가능 변수: {`{{name}}, {{recruitment_title}}, {{stage}}`}</span>
            </label>
            <textarea
              rows={6}
              value={state.body}
              onChange={e => onChangeState({ ...state, body: e.target.value })}
              className="w-full p-4 border border-black outline-none focus:border-orange-500 font-medium leading-relaxed resize-none text-sm"
            />
          </div>

          {showSave ? (
            <div className="border-2 border-orange-300 bg-orange-50 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-orange-800">
                <FileEdit className="w-4 h-4" /> 이 내용을 템플릿으로 저장
              </div>
              <input
                value={tplName}
                onChange={e => setTplName(e.target.value)}
                placeholder="템플릿 이름 (예: 면접 안내)"
                className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500 text-sm bg-white"
              />
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={asDefault} onChange={e => setAsDefault(e.target.checked)} className="accent-orange-500" />
                <span>'{state.toStage}' 단계 기본 템플릿으로 설정</span>
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowSave(false)} className="px-3 py-1.5 border border-black font-bold text-xs hover:bg-white">취소</button>
                <button
                  onClick={() => { if (tplName.trim()) { onSaveAsTemplate(tplName.trim(), asDefault); setShowSave(false); setTplName(''); } }}
                  disabled={!tplName.trim()}
                  className="px-3 py-1.5 bg-black text-white font-black text-xs hover:bg-orange-500 hover:text-black disabled:opacity-40 flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> 저장
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              className="self-start text-xs font-black text-orange-500 hover:underline flex items-center gap-1"
            >
              <FileEdit className="w-3.5 h-3.5" /> 이 내용을 템플릿으로 저장
            </button>
          )}

          <p className="text-xs text-gray-400 font-bold border-t border-gray-200 pt-3">
            ℹ 이 메시지는 지원자의 마이페이지에 인앱 알림으로 전송됩니다. (이메일 발송은 추후 지원 예정)
          </p>
        </div>
        <div className="p-6 border-t border-black bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={() => onConfirm(false)} className="px-6 py-2.5 border border-black font-bold bg-white hover:bg-gray-100 text-sm">
            알림 없이 이동
          </button>
          <button onClick={() => onConfirm(true)} className="px-6 py-2.5 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors flex items-center gap-2 text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none">
            <Bell className="w-4 h-4" /> 알림 보내고 이동
          </button>
        </div>
      </div>
    </div>
  );
}

function SortTh({ label, sortKey, current, dir, onToggle }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onToggle: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="px-4 py-3 text-left cursor-pointer select-none group" onClick={() => onToggle(sortKey)}>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-black uppercase tracking-wider transition-colors ${active ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-800'}`}>{label}</span>
        {active ? (dir === 'asc' ? <ChevronUp className="w-3 h-3 text-orange-500" /> : <ChevronDown className="w-3 h-3 text-orange-500" />)
          : <ArrowUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />}
      </div>
    </th>
  );
}

function KanbanCard({ applicant, isDragging, onDragStart, onDragEnd, onClick }: {
  applicant: Applicant;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const daysAgo = Math.floor((Date.now() - new Date(applicant.submitted_at).getTime()) / 86400000);
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, applicant.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-white border-2 border-black p-3.5 cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging ? 'opacity-40 rotate-1 shadow-none' : 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-black text-sm">{applicant.profiles?.name ?? '—'}</span>
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
      </div>
      {(applicant.profiles?.university || applicant.profiles?.major) && (
        <p className="text-xs text-gray-500 font-bold mb-2 truncate">
          {[applicant.profiles?.university, applicant.profiles?.major].filter(Boolean).join(' · ')}
        </p>
      )}
      {(applicant.tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(applicant.tags ?? []).slice(0, 3).map((t, i) => (
            <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200">
              #{t}
            </span>
          ))}
          {(applicant.tags?.length ?? 0) > 3 && <span className="text-[10px] text-gray-400 font-bold">+{(applicant.tags?.length ?? 0) - 3}</span>}
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400 font-bold">{daysAgo === 0 ? '오늘 접수' : `${daysAgo}일 전`}</span>
        <div className="flex items-center gap-1.5">
          {applicant.interviewer_note && <span title="메모 있음"><MessageSquare className="w-3.5 h-3.5 text-orange-400" /></span>}
          {applicant.score != null && <span className="text-xs font-black text-orange-500">{applicant.score}점</span>}
        </div>
      </div>
    </div>
  );
}

// ── 지원자 상세 모달 (Phase 6 재구성) ─────────────────────────────────────
type DetailTab = 'application' | 'evaluation' | 'chat' | 'interview';

function ApplicantModal({
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

// ── 태그 편집기 ──────────────────────────────────────────────────────────
function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(false);

  const add = () => {
    const v = input.trim().replace(/^#/, '');
    if (!v || tags.includes(v)) { setInput(''); return; }
    onChange([...tags, v]);
    setInput('');
  };
  const remove = (t: string) => onChange(tags.filter(x => x !== t));

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-black uppercase tracking-widest text-gray-500">태그</span>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.length === 0 && !editing && (
          <span className="text-xs text-gray-400 font-bold">아직 태그가 없습니다.</span>
        )}
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 border border-orange-300 text-xs font-black">
            #{t}
            <button onClick={() => remove(t)} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {editing ? (
          <div className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') add();
                else if (e.key === 'Escape') { setEditing(false); setInput(''); }
              }}
              onBlur={() => { add(); setEditing(false); }}
              placeholder="태그 입력 후 Enter"
              className="px-2 py-1 border border-black font-bold text-xs outline-none focus:border-orange-500 w-32"
            />
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-gray-300 hover:border-orange-400 hover:text-orange-500 text-xs font-bold text-gray-400 transition-colors"
          >
            <Plus className="w-3 h-3" /> 태그 추가
          </button>
        )}
      </div>
    </div>
  );
}

// ── 지원서 탭 (개인정보 동의 현황 포함) ───────────────────────────────────
function ApplicationTabContent({ applicant, consentEntries }: { applicant: Applicant; consentEntries: [string, string][] }) {
  const allEntries = Object.entries(applicant.answers ?? {});
  const nonConsentEntries = allEntries.filter(([k]) => !consentEntries.some(([ck]) => ck === k));

  return (
    <div className="p-8 flex flex-col gap-5">
      {allEntries.length === 0 ? (
        <div className="text-center py-12 text-gray-400 font-bold">
          <Inbox className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          제출된 응답이 없습니다.
        </div>
      ) : (
        <>
          {nonConsentEntries.map(([key, val]) => (
            <div key={key} className="border border-black p-6 bg-orange-50">
              <h4 className="font-black text-sm text-orange-600 mb-2">{key}</h4>
              <p className="font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{renderAnswer(val)}</p>
            </div>
          ))}

          {/* 개인정보 동의 현황 - 지원서 아래 */}
          {consentEntries.length > 0 && (
            <div className="border-2 border-blue-300 bg-blue-50 p-6 mt-2">
              <h4 className="font-black text-sm mb-3 flex items-center gap-2 text-blue-800">
                <ShieldCheck className="w-4 h-4" /> 개인정보 동의 현황
              </h4>
              <div className="flex flex-col gap-2">
                {consentEntries.map(([key, val]) => {
                  const agreed = val === '동의함' || val === '동의' || val === 'true';
                  return (
                    <div key={key} className={`flex items-center gap-2 p-3 border ${agreed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                      {agreed
                        ? <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                        : <ShieldX className="w-4 h-4 text-red-500 shrink-0" />}
                      <span className="font-bold text-sm flex-1">{key}</span>
                      <span className={`text-xs font-black px-2 py-0.5 ${agreed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {agreed ? '동의' : '미동의'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function renderAnswer(val: string) {
  // 파일 형식 (filename|url)인 경우 링크로
  if (val && val.includes('|') && /https?:\/\//.test(val)) {
    const [name, url] = val.split('|');
    return <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{name}</a>;
  }
  return val;
}

// ── 면접 질문 탭 ─────────────────────────────────────────────────────────
function InterviewTabContent({
  questions, setQuestions, onSave,
}: { questions: string[]; setQuestions: (q: string[]) => void; onSave: () => void }) {
  const update = (i: number, v: string) => setQuestions(questions.map((q, idx) => idx === i ? v : q));
  const remove = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));
  const add = () => setQuestions([...questions, '']);

  return (
    <div className="p-8">
      <div className="border-2 border-black p-6 bg-white">
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-black text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-500" /> 이 지원자에게 할 면접 질문
          </h4>
          <button onClick={onSave} className="text-xs font-black text-white bg-blue-500 px-4 py-1.5 hover:bg-blue-600 transition-colors">저장</button>
        </div>
        {questions.length === 0 && (
          <p className="text-gray-400 font-bold text-sm mb-4">아직 등록된 질문이 없습니다. 아래에서 추가하세요.</p>
        )}
        <div className="flex flex-col gap-3 mb-4">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 w-6 shrink-0 text-right">{i + 1}.</span>
              <input
                value={q}
                onChange={e => update(i, e.target.value)}
                className="flex-1 p-2.5 border border-black font-medium text-sm outline-none focus:border-orange-500"
                placeholder={`면접 질문 ${i + 1}`}
              />
              <button onClick={() => remove(i)} className="p-1.5 hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button onClick={add} className="text-sm font-bold text-blue-500 hover:underline flex items-center gap-1">
          <Plus className="w-4 h-4" /> 질문 추가
        </button>
      </div>
    </div>
  );
}
