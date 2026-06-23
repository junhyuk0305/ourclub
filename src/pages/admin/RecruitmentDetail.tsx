import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, FileText, ClipboardList, GitBranch, Loader, ChevronRight, Eye, Trash2,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAdmin } from '../../contexts/AdminContext';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabaseClient';
import { ApplicantsTab } from '../../components/admin/recruitment/ApplicantsTab';
import { JobInfoTab } from '../../components/admin/recruitment/JobInfoTab';
import { FormTab } from '../../components/admin/recruitment/FormTab';
import { PipelineTab } from '../../components/admin/recruitment/PipelineTab';
import { deriveRecruitStatus, type RecruitmentRow } from '../../types/recruitment';

type RecruitmentSummary =
  Pick<RecruitmentRow, 'id' | 'title' | 'generation'>
  & { status: string };

type Recruitment = RecruitmentSummary
  & Pick<RecruitmentRow,
      'category' | 'short_desc' | 'description' | 'deadline' | 'recruit_start_date'
      | 'targets' | 'location' | 'regular_meeting' | 'hashtags'
      | 'form_schema' | 'form_version' | 'deployed_form_schema'>
  & { pipeline_stages: string[] };

type Tab = 'applicants' | 'info' | 'form' | 'pipeline';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'applicants', label: '지원자 관리', icon: <Users className="w-4 h-4" /> },
  { key: 'info', label: '공고 수정', icon: <FileText className="w-4 h-4" /> },
  { key: 'form', label: '지원서 수정', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'pipeline', label: '채용 프로세스', icon: <GitBranch className="w-4 h-4" /> },
];

export default function RecruitmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { adminClubId, adminClub } = useAdmin();
  const { toast, show: showToast } = useToast();

  const rawTab = params.get('tab') as Tab | null;
  const tab: Tab = (rawTab && TABS.some(t => t.key === rawTab)) ? rawTab : 'applicants';

  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [siblings, setSiblings] = useState<RecruitmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id || !adminClubId) return;
    load();
  }, [id, adminClubId]);

  const load = async () => {
    if (!id || !adminClubId) return;
    setLoading(true);
    const [{ data: rec }, { data: sibs }] = await Promise.all([
      supabase
        .from('recruitments')
        .select('id, title, generation, status, category, short_desc, description, deadline, recruit_start_date, targets, location, regular_meeting, hashtags, pipeline_stages, form_schema, form_version, deployed_form_schema')
        .eq('id', id)
        .eq('club_id', adminClubId)
        .single(),
      supabase
        .from('recruitments')
        .select('id, title, generation, status')
        .eq('club_id', adminClubId)
        .order('created_at', { ascending: false }),
    ]);

    setRecruitment(rec as Recruitment | null);
    setSiblings((sibs as RecruitmentSummary[] | null) ?? []);
    setLoading(false);
  };

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    setParams(next, { replace: true });
  };

  const onUpdate = (patch: Partial<Recruitment>) => {
    setRecruitment(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handleDeleteRecruitment = async () => {
    if (!id) return;
    setDeleting(true);
    const { error } = await supabase.from('recruitments').delete().eq('id', id);

    if (error) {
      setDeleting(false);
      showToast(`삭제 실패: ${error.message}`, false);
      return;
    }

    showToast('삭제되었습니다.');
    setShowDeleteConfirm(false);
    navigate('/admin/recruitments');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!recruitment) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="font-black text-lg mb-3">공고를 찾을 수 없습니다.</p>
            <Link to="/admin/recruitments" className="text-orange-500 font-bold hover:underline">
              ← 전체 채용으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const derivedStatus = deriveRecruitStatus(recruitment);
  const statusStyle = derivedStatus === '진행중'
    ? 'bg-green-500 text-white'
    : derivedStatus === '마감'
      ? 'bg-gray-400 text-white'
      : 'bg-yellow-400 text-black';

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* 헤더 */}
      <header className="h-14 border-b border-black bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/admin/recruitments" className="p-2 hover:bg-gray-100 transition-colors rounded-full border border-transparent hover:border-black shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/admin/recruitments" className="text-sm font-bold text-gray-500 hover:text-black shrink-0">
              전체 채용
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            <h1 className="font-black text-base truncate">
              {recruitment.title}
              {recruitment.generation && <span className="text-gray-500 ml-2 text-sm">{recruitment.generation}</span>}
            </h1>
            <span className={`shrink-0 px-2 py-0.5 text-xs font-black ${statusStyle}`}>
              {derivedStatus}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {adminClub?.slug && (
            <Link
              to={`/clubs/${adminClub.slug}/recruit${recruitment.status === '진행중' ? '' : '?preview=1'}`}
              target="_blank"
              className="px-4 py-2 border border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-bold flex items-center gap-2"
              title={recruitment.status === '진행중' ? '실제 채용 페이지' : '임시저장 미리보기 (운영진만 보임)'}
            >
              <Eye className="w-4 h-4" />
              {recruitment.status === '진행중' ? '라이브 프리뷰' : '임시저장 미리보기'}
            </Link>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-black bg-white text-red-600 hover:bg-red-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-bold flex items-center gap-2"
            title="공고 삭제"
          >
            <Trash2 className="w-4 h-4" />
            공고 삭제
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 + 공고 빠른이동 */}
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
          {siblings.length > 1 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                다른 공고
              </p>
              <div className="flex flex-col gap-0.5">
                {siblings.map(s => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/admin/recruitments/${s.id}?tab=${tab}`)}
                    className={`text-left px-2 py-1.5 text-xs font-bold transition-colors truncate ${
                      s.id === recruitment.id
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={s.title}
                  >
                    {s.title}
                    {s.generation && <span className="text-gray-400 ml-1">{s.generation}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 탭 네비게이션 */}
          <div className="flex border-b-2 border-black bg-white shrink-0">
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
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {tab === 'applicants' && (
              <ApplicantsTab
                recruitmentId={recruitment.id}
                pipelineStages={recruitment.pipeline_stages ?? []}
                recruitmentTitle={recruitment.title}
              />
            )}
            {tab === 'info' && (
              <JobInfoTab
                recruitment={recruitment}
                onUpdate={onUpdate}
              />
            )}
            {tab === 'form' && (
              <FormTab
                recruitment={recruitment}
                onUpdate={onUpdate}
              />
            )}
            {tab === 'pipeline' && (
              <PipelineTab
                recruitmentId={recruitment.id}
                pipelineStages={recruitment.pipeline_stages ?? []}
                onUpdate={stages => onUpdate({ pipeline_stages: stages })}
              />
            )}
          </div>
        </main>
      </div>

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
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteRecruitment}
                disabled={deleting}
                className="flex-1 py-3 bg-red-600 text-white font-black hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '삭제 중…' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div className={`flex items-center gap-2 px-5 py-3 border-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            toast.ok ? 'bg-green-500 text-white border-black' : 'bg-red-500 text-white border-black'
          }`}>
            {toast.ok ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
