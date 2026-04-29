import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Type,
  AlignLeft,
  GripVertical,
  Trash2,
  CheckCircle2,
  Loader,
  AlertCircle,
  Edit2,
  X,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';

interface Question {
  id: string;
  type: 'text' | 'textarea';
  title: string;
  required: boolean;
}

interface Recruitment {
  id: string;
  title: string;
  generation: string | null;
  status: string;
  deadline: string | null;
  form_schema: Question[];
  description: string | null;
  category: string | null;
  pipeline_stages: string[];
  form_version: number;
  deployed_form_schema: Question[] | null;
}

export default function FormBuilder() {
  const { adminClub, adminClubId } = useAdmin();

  // 채용 목록
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [selectedRecruitmentId, setSelectedRecruitmentId] = useState<string | null>(null);
  const selectedRecruitment = recruitments.find(r => r.id === selectedRecruitmentId) || null;

  // 폼 빌더 상태
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // 파이프라인(프로세스) 편집
  const [editingPipeline, setEditingPipeline] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<string[]>([]);
  const [newStage, setNewStage] = useState('');

  // 새 모집 모달
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGeneration, setNewGeneration] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  // 공고 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editGeneration, setEditGeneration] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editPipelineStages, setEditPipelineStages] = useState<string[]>([]);
  const [editNewStage, setEditNewStage] = useState('');
  const [editingPipelineInModal, setEditingPipelineInModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // 삭제 확인
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 재배포 경고
  const [showRedeployWarning, setShowRedeployWarning] = useState(false);

  // 드래그앤드롭
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 초기 로드
  useEffect(() => {
    if (!adminClubId) return;
    loadRecruitments(adminClubId);
  }, [adminClubId]);

  const loadRecruitments = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('recruitments')
      .select(
        'id, title, generation, status, deadline, form_schema, description, category, pipeline_stages, form_version, deployed_form_schema'
      )
      .eq('club_id', clubId)
      .neq('status', '마감')
      .order('created_at', { ascending: false });

    const typedData = data as Recruitment[] | null;
    setRecruitments(typedData ?? []);
    if (typedData && typedData.length > 0) {
      const first = typedData[0];
      setSelectedRecruitmentId(first.id);
      setQuestions(Array.isArray(first.form_schema) ? first.form_schema : []);
      setPipelineStages(first.pipeline_stages ?? ['서류접수', '면접', '최종합격', '불합격']);
    }
    setFetching(false);
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const switchRecruitment = (id: string) => {
    const recruitment = recruitments.find(r => r.id === id);
    if (recruitment) {
      setSelectedRecruitmentId(id);
      setQuestions(Array.isArray(recruitment.form_schema) ? recruitment.form_schema : []);
      setPipelineStages(recruitment.pipeline_stages ?? ['서류접수', '면접', '최종합격', '불합격']);
    }
  };

  const handleSave = async (publish = false) => {
    if (!selectedRecruitment) return;
    setSaving(true);

    const updates: Record<string, unknown> = { 
      form_schema: questions,
      pipeline_stages: pipelineStages,
    };

    // 배포 시 버전 관리 & 경고
    if (publish && selectedRecruitment.status !== '진행중') {
      // 새로 배포하는 경우
      updates.status = '진행중';
      updates.form_version = 1;
      updates.deployed_form_schema = questions;
    } else if (publish && selectedRecruitment.status === '진행중') {
      // 이미 배포 중인데 다시 배포하는 경우 → 경고 표시
      setShowRedeployWarning(true);
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('recruitments')
      .update(updates)
      .eq('id', selectedRecruitment.id);

    setSaving(false);
    if (error) {
      showToast(`저장 실패: ${error.message}`, false);
      return;
    }

    // UI 업데이트
    setRecruitments(prev =>
      prev.map(r =>
        r.id === selectedRecruitment.id
          ? { ...r, ...updates }
          : r
      )
    );

    if (publish) {
      showToast('발행 완료! 지원자가 지원서를 작성할 수 있습니다.');
    } else {
      showToast('지원서 양식이 저장되었습니다!');
    }
  };

  const handleConfirmRedeploy = async () => {
    if (!selectedRecruitment) return;
    setShowRedeployWarning(false);
    setSaving(true);

    const newVersion = (selectedRecruitment.form_version ?? 1) + 1;
    const updates = {
      form_version: newVersion,
      deployed_form_schema: questions,
      form_schema: questions,
    };

    const { error } = await supabase
      .from('recruitments')
      .update(updates)
      .eq('id', selectedRecruitment.id);

    setSaving(false);
    if (error) {
      showToast(`재배포 실패: ${error.message}`, false);
      return;
    }

    setRecruitments(prev =>
      prev.map(r =>
        r.id === selectedRecruitment.id
          ? { ...r, ...updates }
          : r
      )
    );
    showToast(`v${newVersion}로 재배포되었습니다.`);
  };

  const handleCreateRecruitment = async () => {
    if (!adminClubId || !newTitle.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('recruitments')
      .insert({
        club_id: adminClubId,
        title: newTitle.trim(),
        generation: newGeneration.trim() || null,
        category: newCategory.trim() || null,
        description: newDescription.trim() || null,
        deadline: newDeadline || null,
        form_schema: [],
        pipeline_stages: ['서류접수', '면접', '최종합격', '불합격'],
        form_version: 0,
        status: '임시저장',
      })
      .select()
      .single();

    setCreating(false);
    if (error) {
      showToast(`생성 실패: ${error.message}`, false);
      return;
    }

    const newRecruitment = data as Recruitment;
    setRecruitments(prev => [newRecruitment, ...prev]);
    setSelectedRecruitmentId(newRecruitment.id);
    setQuestions([]);
    setPipelineStages(['서류접수', '면접', '최종합격', '불합격']);
    setShowNewModal(false);
    setNewTitle('');
    setNewGeneration('');
    setNewCategory('');
    setNewDescription('');
    setNewDeadline('');
    showToast('새 모집이 생성되었습니다.');
  };

  const handleDeleteRecruitment = async (id: string) => {
    const { error } = await supabase.from('recruitments').delete().eq('id', id);

    if (error) {
      showToast(`삭제 실패: ${error.message}`, false);
      return;
    }

    setRecruitments(prev => prev.filter(r => r.id !== id));
    if (selectedRecruitmentId === id) {
      const remaining = recruitments.filter(r => r.id !== id);
      if (remaining.length > 0) {
        switchRecruitment(remaining[0].id);
      } else {
        setSelectedRecruitmentId(null);
        setQuestions([]);
      }
    }
    setShowDeleteConfirm(null);
    showToast('삭제되었습니다.');
  };

  const openEditModal = (recruitment: Recruitment) => {
    setEditTitle(recruitment.title);
    setEditGeneration(recruitment.generation || '');
    setEditCategory(recruitment.category || '');
    setEditDescription(recruitment.description || '');
    setEditDeadline(recruitment.deadline || '');
    setEditPipelineStages(recruitment.pipeline_stages || ['서류접수', '면접', '최종합격', '불합격']);
    setEditNewStage('');
    setEditingPipelineInModal(false);
    setShowEditModal(true);
  };

  const handleUpdateRecruitment = async () => {
    if (!selectedRecruitment) return;
    if (!editTitle.trim()) {
      showToast('공고 제목은 필수입니다.', false);
      return;
    }

    setUpdating(true);
    const { error } = await supabase
      .from('recruitments')
      .update({
        title: editTitle.trim(),
        generation: editGeneration.trim() || null,
        category: editCategory.trim() || null,
        description: editDescription.trim() || null,
        deadline: editDeadline || null,
        pipeline_stages: editPipelineStages,
      })
      .eq('id', selectedRecruitment.id);

    setUpdating(false);
    if (error) {
      showToast(`수정 실패: ${error.message}`, false);
      return;
    }

    setRecruitments(prev =>
      prev.map(r =>
        r.id === selectedRecruitment.id
          ? {
              ...r,
              title: editTitle.trim(),
              generation: editGeneration.trim() || null,
              category: editCategory.trim() || null,
              description: editDescription.trim() || null,
              deadline: editDeadline || null,
              pipeline_stages: editPipelineStages,
            }
          : r
      )
    );
    setPipelineStages(editPipelineStages);
    setShowEditModal(false);
    showToast('공고가 수정되었습니다.');
  };

  const addEditPipelineStage = () => {
    if (!editNewStage.trim()) return;
    setEditPipelineStages(prev => [...prev, editNewStage.trim()]);
    setEditNewStage('');
  };

  const removeEditPipelineStage = (index: number) => {
    setEditPipelineStages(prev => prev.filter((_, i) => i !== index));
  };

  const moveEditPipelineStage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= editPipelineStages.length) return;
    const newStages = [...editPipelineStages];
    const [moved] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, moved);
    setEditPipelineStages(newStages);
  };

  const addQuestion = (type: 'text' | 'textarea') => {
    setQuestions(prev => [...prev, {
      id: Date.now().toString(),
      type,
      title: type === 'text' ? '단답형 질문' : '장문형 질문',
      required: false,
    }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: string, value: unknown) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  // 드래그앤드롭
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

  // 파이프라인 함수
  const addPipelineStage = () => {
    if (!newStage.trim()) return;
    setPipelineStages(prev => [...prev, newStage.trim()]);
    setNewStage('');
  };

  const removePipelineStage = (index: number) => {
    setPipelineStages(prev => prev.filter((_, i) => i !== index));
  };

  const movePipelineStage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pipelineStages.length) return;
    const newStages = [...pipelineStages];
    const [moved] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, moved);
    setPipelineStages(newStages);
  };

  const isPublished = selectedRecruitment?.status === '진행중';

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <header className="h-14 border-b border-black bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 transition-colors rounded-full border border-transparent hover:border-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-lg tracking-tight">운영진 워크스페이스</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold">
          현재 관리 중인 동아리:
          <span className="text-orange-500">{adminClub?.name ?? '—'}</span>
          {selectedRecruitment && (
            <Link
              to={`/clubs/${adminClub?.slug ?? ''}/recruit`}
              target="_blank"
              className="ml-2 px-4 py-2 border border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none text-xs"
            >
              라이브 프리뷰
            </Link>
          )}
          {selectedRecruitment && (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 border border-black bg-white font-black hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm disabled:opacity-50"
            >
              저장
            </button>
          )}
          <button
            onClick={selectedRecruitment ? () => handleSave(true) : () => setShowNewModal(true)}
            disabled={saving}
            className={`ml-1 px-6 py-2 border border-black font-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px text-sm disabled:opacity-50 flex items-center gap-2 ${
              isPublished ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            {!selectedRecruitment ? '새 모집 만들기' : isPublished ? '✓ 발행 중 (재배포)' : '발행하기'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 flex items-start justify-center overflow-y-auto p-8">
          {fetching ? (
            <div className="flex items-center justify-center h-full w-full">
              <Loader className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="w-full max-w-6xl flex flex-col gap-8 mb-12">
              {/* 채용 카드 목록 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black">채용 공고 관리</h2>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="px-4 py-2 border border-black bg-white font-bold text-sm hover:bg-gray-100 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Plus className="w-4 h-4" /> 새 공고 추가
                  </button>
                </div>

                {recruitments.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-300 p-8 text-center text-gray-400 font-bold">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    아직 공고가 없습니다. 새 공고를 추가해보세요.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recruitments.map(recruitment => (
                      <div
                        key={recruitment.id}
                        onClick={() => switchRecruitment(recruitment.id)}
                        className={`border-2 p-6 cursor-pointer transition-all ${
                          selectedRecruitmentId === recruitment.id
                            ? 'border-orange-500 bg-orange-50 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]'
                            : 'border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-black text-lg mb-1">{recruitment.title}</h3>
                            {recruitment.generation && (
                              <p className="text-xs text-gray-500 font-bold">{recruitment.generation}</p>
                            )}
                          </div>
                          {selectedRecruitmentId === recruitment.id && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  openEditModal(recruitment);
                                }}
                                className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                                title="공고 수정"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(recruitment.id);
                                }}
                                className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                                title="공고 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-1 text-xs border font-black rounded ${
                            recruitment.status === '진행중'
                              ? 'bg-green-100 border-green-400 text-green-700'
                              : recruitment.status === '마감'
                                ? 'bg-gray-100 border-gray-300 text-gray-700'
                                : 'bg-yellow-100 border-yellow-400 text-yellow-700'
                          }`}>
                            {recruitment.status}
                          </span>
                          {recruitment.category && (
                            <span className="px-2 py-1 text-xs bg-gray-200 font-bold rounded">{recruitment.category}</span>
                          )}
                        </div>
                        {recruitment.deadline && (
                          <p className="text-xs text-gray-500 font-bold">
                            마감: {new Date(recruitment.deadline).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                        {recruitment.status === '진행중' && (
                          <p className="text-xs text-blue-600 font-bold mt-2">
                            v{recruitment.form_version} 배포 중
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 폼 빌더 & 파이프라인 */}
              {selectedRecruitment && (
                <>
                  {/* 프로세스 설정 */}
                  <div className="bg-white border-2 border-black p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-black flex items-center gap-2">
                        📋 프로세스 설정
                      </h3>
                      <button
                        onClick={() => setEditingPipeline(!editingPipeline)}
                        className={`px-3 py-1 text-sm font-bold border rounded transition-colors ${
                          editingPipeline
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-black hover:bg-gray-100'
                        }`}
                      >
                        {editingPipeline ? '✓ 완료' : <Edit2 className="w-4 h-4 inline" />}
                      </button>
                    </div>

                    {editingPipeline ? (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3">
                          {pipelineStages.map((stage, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs font-black bg-gray-200 px-2 py-1 rounded">{idx + 1}</span>
                              <input
                                value={stage}
                                onChange={e => {
                                  const newStages = [...pipelineStages];
                                  newStages[idx] = e.target.value;
                                  setPipelineStages(newStages);
                                }}
                                className="flex-1 border border-black p-2 font-bold outline-none focus:border-orange-500"
                              />
                              <button
                                onClick={() => movePipelineStage(idx, idx - 1)}
                                disabled={idx === 0}
                                className="p-1 hover:bg-gray-200 disabled:opacity-30 rounded"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => movePipelineStage(idx, idx + 1)}
                                disabled={idx === pipelineStages.length - 1}
                                className="p-1 hover:bg-gray-200 disabled:opacity-30 rounded"
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => removePipelineStage(idx)}
                                className="p-1 hover:bg-red-100 text-red-500 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-200">
                          <input
                            value={newStage}
                            onChange={e => setNewStage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addPipelineStage()}
                            placeholder="새 단계 이름"
                            className="flex-1 border border-black p-2 font-bold outline-none focus:border-orange-500"
                          />
                          <button
                            onClick={addPipelineStage}
                            disabled={!newStage.trim()}
                            className="px-4 py-2 bg-orange-500 text-white font-bold rounded hover:bg-orange-600 disabled:opacity-50"
                          >
                            추가
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {pipelineStages.map((stage, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-2 bg-gray-100 border border-gray-300 font-bold text-sm rounded"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 지원서 폼 빌더 */}
                  <div>
                    <h2 className="text-2xl font-black mb-4">지원서 폼 설계</h2>

                    {/* 준비중 안내 */}
                    {!isPublished && (
                      <div className="bg-orange-50 border border-orange-300 p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                        <p className="font-bold text-orange-800 text-sm">
                          현재 <strong>임시저장</strong> 상태입니다. 질문 작성 후 <strong>발행하기</strong>를 눌러야 지원자가 지원할 수 있습니다.
                        </p>
                      </div>
                    )}

                    {/* 질문 목록 */}
                    <div className="flex flex-col gap-4">
                      {questions.length === 0 && (
                        <div className="bg-white border-2 border-dashed border-gray-300 p-12 text-center text-gray-400 font-bold">
                          아래 버튼으로 질문을 추가해보세요.<br />
                          <span className="text-sm font-medium mt-1 block">기본 정보(이름·연락처)는 자동으로 수집됩니다.</span>
                        </div>
                      )}
                      {questions.map((q, index) => (
                        <div
                          key={q.id}
                          draggable
                          onDragStart={e => handleDragStart(e, index)}
                          onDragOver={e => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white border-2 border-black flex group transition-all ${
                            dragOverIndex === index
                              ? 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                              : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                          }`}
                        >
                          <div className="w-12 border-r-2 border-black flex items-center justify-center cursor-grab active:cursor-grabbing bg-gray-50 hover:bg-orange-100 transition-colors select-none">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="p-6 flex-1 flex flex-col gap-4 relative">
                            <button
                              onClick={() => removeQuestion(q.id)}
                              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3 border-b border-gray-200 pb-3 pr-10">
                              <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{index + 1}</span>
                              <input
                                value={q.title}
                                onChange={e => updateQuestion(q.id, 'title', e.target.value)}
                                className="text-xl font-black outline-none border-b-2 border-transparent focus:border-orange-500 flex-1 bg-transparent"
                                placeholder="질문을 입력하세요"
                              />
                              <label className="flex items-center gap-2 font-bold cursor-pointer shrink-0 text-sm">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={e => updateQuestion(q.id, 'required', e.target.checked)}
                                  className="w-4 h-4 cursor-pointer accent-orange-500"
                                />
                                필수
                              </label>
                            </div>
                            <div className="bg-gray-50 border border-dashed border-gray-300 pointer-events-none p-3">
                              {q.type === 'text' && (
                                <input
                                  readOnly
                                  placeholder="단답형 텍스트 (미리보기)"
                                  className="w-full p-2 bg-white border border-gray-200 text-gray-400 text-sm"
                                />
                              )}
                              {q.type === 'textarea' && (
                                <textarea
                                  readOnly
                                  rows={3}
                                  placeholder="장문형 텍스트 (미리보기)"
                                  className="w-full p-2 bg-white border border-gray-200 text-gray-400 resize-none text-sm"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 질문 추가 */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <button
                        onClick={() => addQuestion('text')}
                        className="py-5 bg-white border-2 border-black border-dashed font-black text-gray-500 hover:bg-orange-50 hover:text-black hover:border-solid transition-colors flex flex-col items-center justify-center gap-2 text-sm"
                      >
                        <Type className="w-5 h-5" />
                        단답형 질문 추가
                      </button>
                      <button
                        onClick={() => addQuestion('textarea')}
                        className="py-5 bg-white border-2 border-black border-dashed font-black text-gray-500 hover:bg-orange-50 hover:text-black hover:border-solid transition-colors flex flex-col items-center justify-center gap-2 text-sm"
                      >
                        <AlignLeft className="w-5 h-5" />
                        장문형 질문 추가
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 새 공고 생성 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
            <h2 className="text-2xl font-black">새 공고 만들기</h2>
            <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
              <Field label="공고 제목 *">
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="마제스티 14기 신입 부원 모집"
                  className={inp}
                />
              </Field>
              <Field label="기수">
                <input
                  value={newGeneration}
                  onChange={e => setNewGeneration(e.target.value)}
                  placeholder="14기"
                  className={inp}
                />
              </Field>
              <Field label="모집 분야/카테고리">
                <input
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="기획, 개발, 디자인 등"
                  className={inp}
                />
              </Field>
              <Field label="상세 설명">
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="채용 공고에 대한 상세 설명"
                  rows={3}
                  className={`${inp} resize-none`}
                />
              </Field>
              <Field label="모집 마감일">
                <input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                  className={inp}
                />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleCreateRecruitment}
                disabled={creating || !newTitle.trim()}
                className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader className="w-4 h-4 animate-spin" />}
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm mx-4 p-8 flex flex-col gap-5">
            <h2 className="text-xl font-black text-red-600">정말로 삭제하시겠어요?</h2>
            <p className="font-bold text-gray-700">
              이 공고와 관련된 모든 지원 데이터도 함께 삭제됩니다.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteRecruitment(showDeleteConfirm)}
                className="flex-1 py-3 bg-red-600 text-white font-black hover:bg-red-700"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 재배포 경고 */}
      {showRedeployWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-orange-500 shrink-0" />
              <h2 className="text-xl font-black">현재 진행 중인 채용 폼이 변경됩니다</h2>
            </div>
            <p className="font-bold text-gray-700">
              이미 배포된 지원서 폼을 수정하고 재배포하면, 진행 중인 지원자에게 새로운 폼 버전이 반영됩니다. 계속하시겠습니까?
            </p>
            <div className="bg-gray-100 border border-gray-300 p-4 rounded text-sm font-bold text-gray-700">
              현재 버전: <span className="text-orange-500">v{selectedRecruitment?.form_version ?? 0}</span> → v{(selectedRecruitment?.form_version ?? 0) + 1}로 업그레이드
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRedeployWarning(false)}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleConfirmRedeploy}
                disabled={saving}
                className="flex-1 py-3 bg-green-500 text-white font-black hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                재배포하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공고 수정 모달 */}
      {showEditModal && selectedRecruitment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg mx-4 p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">공고 수정</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <Field label="공고 제목 *">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className={inp}
                />
              </Field>
              <Field label="기수">
                <input
                  value={editGeneration}
                  onChange={e => setEditGeneration(e.target.value)}
                  placeholder="14기"
                  className={inp}
                />
              </Field>
              <Field label="모집 분야/카테고리">
                <input
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  placeholder="기획, 개발, 디자인 등"
                  className={inp}
                />
              </Field>
              <Field label="상세 설명">
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={3}
                  className={`${inp} resize-none`}
                />
              </Field>
              <Field label="모집 마감일">
                <input
                  type="datetime-local"
                  value={editDeadline}
                  onChange={e => setEditDeadline(e.target.value)}
                  className={inp}
                />
              </Field>

              {/* 프로세스 단계 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-black text-sm">프로세스 단계</label>
                  <button
                    onClick={() => setEditingPipelineInModal(!editingPipelineInModal)}
                    className={`px-2 py-1 text-xs font-bold border rounded transition-colors ${
                      editingPipelineInModal ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {editingPipelineInModal ? '✓ 완료' : '편집'}
                  </button>
                </div>

                {editingPipelineInModal ? (
                  <div className="space-y-2">
                    {editPipelineStages.map((stage, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-black bg-gray-200 px-2 py-1 rounded w-6 text-center">{idx + 1}</span>
                        <input
                          value={stage}
                          onChange={e => {
                            const s = [...editPipelineStages];
                            s[idx] = e.target.value;
                            setEditPipelineStages(s);
                          }}
                          className="flex-1 border border-black p-2 font-bold outline-none focus:border-orange-500 text-sm"
                        />
                        <button onClick={() => moveEditPipelineStage(idx, idx - 1)} disabled={idx === 0} className="p-1 hover:bg-gray-200 disabled:opacity-30 rounded text-sm">↑</button>
                        <button onClick={() => moveEditPipelineStage(idx, idx + 1)} disabled={idx === editPipelineStages.length - 1} className="p-1 hover:bg-gray-200 disabled:opacity-30 rounded text-sm">↓</button>
                        <button onClick={() => removeEditPipelineStage(idx)} className="p-1 hover:bg-red-100 text-red-500 rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <input
                        value={editNewStage}
                        onChange={e => setEditNewStage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addEditPipelineStage()}
                        placeholder="새 단계 이름"
                        className="flex-1 border border-black p-2 font-bold outline-none focus:border-orange-500 text-sm"
                      />
                      <button
                        onClick={addEditPipelineStage}
                        disabled={!editNewStage.trim()}
                        className="px-3 py-2 bg-orange-500 text-white font-bold text-sm rounded hover:bg-orange-600 disabled:opacity-50"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {editPipelineStages.map((stage, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 border border-gray-300 font-bold text-xs rounded">
                        {stage}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleUpdateRecruitment}
                disabled={updating || !editTitle.trim()}
                className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating && <Loader className="w-4 h-4 animate-spin" />}
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[70] px-6 py-4 border-2 border-black font-black flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
          toast.ok ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'
        }`}>
          <CheckCircle2 className="w-5 h-5" />
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const inp = 'w-full p-3 border border-black font-bold outline-none focus:border-orange-500 transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-black text-sm">{label}</label>
      {children}
    </div>
  );
}
