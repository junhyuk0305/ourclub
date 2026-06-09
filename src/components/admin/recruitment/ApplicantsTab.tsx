import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Loader, MessageSquare, Users,
  Download, LayoutGrid, List, CheckSquare, Square, Inbox,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { fetchAll } from '../../../lib/fetchAll';
import { useIncremental } from '../../../lib/useIncremental';
import { formatDate } from '../../../lib/format';
import { useAdmin } from '../../../contexts/AdminContext';
import { Applicant, EmailModalState, EmailTemplate, SortKey, SortDir } from './applicants/types';
import { EmailMoveModal } from './applicants/EmailMoveModal';
import { SortTh } from './applicants/SortTh';
import { KanbanCard } from './applicants/KanbanCard';
import { ApplicantModal } from './applicants/ApplicantModal';

type ViewMode = 'kanban' | 'list';

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

  // 지원자 로드 경쟁 가드: 공고를 빠르게 전환하면 이전 응답이 새 응답을 덮어쓰는 것 방지
  const loadSeq = useRef(0);

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
    const seq = ++loadSeq.current;
    setFetching(true);
    const { data } = await fetchAll((from, to) => supabase
      .from('recruitment_applications')
      .select('id, recruitment_id, status, score, interviewer_note, interview_at, submitted_at, answers, interview_questions, memos, tags, profiles(name, email, phone, major, university, portfolio_url)')
      .eq('recruitment_id', rId)
      .order('submitted_at', { ascending: false })
      .range(from, to));

    if (seq !== loadSeq.current) return; // 더 최신 로드가 진행 중 → 이 응답은 폐기

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

  const saveNote = async (id: string, score: number | null, note: string) => {
    await supabase.from('recruitment_applications').update({ score, interviewer_note: note }).eq('id', id);
    updateLocal(id, { score, interviewer_note: note });
  };

  const addMemo = async (id: string, content: string) => {
    // 배열 전체 읽기-수정-쓰기(lost update) 대신 서버측 jsonb append RPC.
    // 두 면접관이 동시에 추가해도 메모가 덮여 사라지지 않는다.
    const { data: memos, error } = await supabase.rpc('add_application_memo', {
      p_application_id: id,
      p_content: content,
    });
    if (error) { showToast('메모 추가에 실패했습니다.'); return; }
    updateLocal(id, { memos: (memos as Applicant['memos']) ?? [] });
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
      formatDate(a.submitted_at),
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
    // 상태변경 + 이동로그(→알림 트리거)를 한 트랜잭션(RPC)으로 → 부분쓰기 제거.
    const { error } = await supabase.rpc('move_application_stage', {
      p_application_id: emailModal.applicant.id,
      p_to_stage: emailModal.toStage,
      p_from_stage: emailModal.fromStage,
      p_email_sent: sendEmail,
      p_email_subject: sendEmail ? emailModal.subject : null,
      p_email_body: sendEmail ? emailModal.body : null,
    });
    if (error) { showToast('단계 이동에 실패했습니다.'); return; }
    updateLocal(emailModal.applicant.id, { status: emailModal.toStage });
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
    // 상태 일괄변경 + (실제 바뀐 건만) 이동로그를 한 트랜잭션(RPC)으로.
    // RPC 내부에서 현재 단계 != 목표인 지원자만 로그→알림을 남긴다(기존 동작 동일).
    const { error } = await supabase.rpc('move_applications_stage_bulk', {
      p_ids: ids,
      p_to_stage: bulkStage,
      p_email_sent: true,
    });
    if (error) { showToast('일괄 이동에 실패했습니다.'); return; }
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

  // 드래그/렌더마다 전체 지원자를 다시 필터·정렬하지 않도록 캐싱. 결과는 기존과 동일.
  const filtered = useMemo(() => applicants.filter(a =>
    !search ||
    (a.profiles?.name ?? '').includes(search) ||
    (a.profiles?.major ?? '').includes(search) ||
    (a.tags ?? []).some(t => t.includes(search))
  ), [applicants, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: string | number = '';
    let bv: string | number = '';
    if (sortKey === 'name') { av = a.profiles?.name ?? ''; bv = b.profiles?.name ?? ''; }
    if (sortKey === 'submitted_at') { av = a.submitted_at; bv = b.submitted_at; }
    if (sortKey === 'status') { av = stages.indexOf(a.status); bv = stages.indexOf(b.status); }
    if (sortKey === 'score') { av = a.score ?? -1; bv = b.score ?? -1; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }), [filtered, sortKey, sortDir, stages]);

  // 칸반: 컬럼마다 filtered 를 다시 훑지 않도록 단계별로 한 번에 그룹화(결과 동일).
  const byStage = useMemo(() => {
    const m: Record<string, Applicant[]> = {};
    filtered.forEach(a => (m[a.status] ??= []).push(a));
    return m;
  }, [filtered]);

  // 리스트뷰 점진 렌더: 큰 지원자 목록을 한꺼번에 마운트하지 않는다(소규모는 전부 렌더).
  const listKey = `${recruitmentId}|${search}|${sortKey}|${sortDir}|${applicants.length}`;
  const { count: shownCount, sentinelRef } = useIncremental<HTMLTableRowElement>(sorted.length, listKey);

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
              const stageCards = byStage[stage] ?? [];
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
              {sorted.slice(0, shownCount).map((app, i) => {
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
                      {formatDate(app.submitted_at, 'monthDay')}
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
              {shownCount < sorted.length && (
                <tr ref={sentinelRef}>
                  <td colSpan={8} className="text-center py-4 text-gray-400 font-bold text-sm">
                    <Loader className="w-4 h-4 animate-spin inline-block mr-2" />
                    {sorted.length - shownCount}명 더 불러오는 중…
                  </td>
                </tr>
              )}
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
