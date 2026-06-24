import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users, FileText, ClipboardList, GitBranch, ChevronRight, Eye, Trash2,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { AdminHeaderPortal } from './AdminLayout';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
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
  { key: 'applicants', label: '지원자 관리', icon: <Users className="w-4 h-4" strokeWidth={2.5} /> },
  { key: 'info', label: '공고 수정', icon: <FileText className="w-4 h-4" strokeWidth={2.5} /> },
  { key: 'form', label: '지원서 수정', icon: <ClipboardList className="w-4 h-4" strokeWidth={2.5} /> },
  { key: 'pipeline', label: '모집 프로세스', icon: <GitBranch className="w-4 h-4" strokeWidth={2.5} /> },
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
    return <LoadingScreen />;
  }

  if (!recruitment) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="font-black text-lg mb-3">공고를 찾을 수 없습니다.</p>
          <Link to="/admin/recruitments" className="text-brand font-bold hover:underline">
            ← 전체 모집으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const derivedStatus = deriveRecruitStatus(recruitment);
  const statusStyle = derivedStatus === '진행중'
    ? 'bg-ok-bg text-ok-fg'
    : derivedStatus === '마감'
      ? 'bg-off-bg text-off-fg'
      : 'bg-warn-bg text-warn-fg';

  return (
    <>
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 브레드크럼 + 제목 */}
          <div className="h-14 border-b border-sand-200 bg-white flex items-center px-6 flex-shrink-0 min-w-0">
            <Link to="/admin/recruitments" className="text-sm font-bold text-sand-500 hover:text-ink shrink-0">
              전체 모집
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-sand-300 shrink-0 mx-2" strokeWidth={2.5} />
            <h1 className="font-black text-base truncate text-ink">
              {recruitment.title}
              {recruitment.generation && <span className="text-sand-500 ml-2 text-sm">{recruitment.generation}</span>}
            </h1>
            <span className={`shrink-0 px-2 py-0.5 text-xs font-bold rounded-ctl ml-2 ${statusStyle}`}>
              {derivedStatus}
            </span>
          </div>

          {/* 공고 빠른이동 */}
          {siblings.length > 1 && (
            <div className="border-b border-sand-200 bg-white px-6 py-2 flex items-center gap-1.5 flex-wrap shrink-0">
              <span className="text-xs font-black text-sand-400 uppercase tracking-widest mr-1">
                다른 공고
              </span>
              {siblings.map(s => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/admin/recruitments/${s.id}?tab=${tab}`)}
                  className={`px-2 py-1 text-xs font-bold rounded-ctl transition-colors truncate max-w-[160px] ${
                    s.id === recruitment.id
                      ? 'bg-brand-tint text-brand'
                      : 'text-sand-600 hover:bg-sand-100'
                  }`}
                  title={s.title}
                >
                  {s.title}
                  {s.generation && <span className="text-sand-400 ml-1">{s.generation}</span>}
                </button>
              ))}
            </div>
          )}

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-sand-200 bg-white shrink-0">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
                  tab === t.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-sand-400 hover:text-ink'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1 overflow-y-auto bg-sand-50">
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

      <AdminHeaderPortal>
        {adminClub?.slug && (
          <Link
            to={`/clubs/${adminClub.slug}/recruit${recruitment.status === '진행중' ? '' : '?preview=1'}`}
            target="_blank"
            className="px-4 py-2 rounded-ctl border border-sand-300 bg-white text-ink hover:bg-sand-50 transition-colors font-bold flex items-center gap-2"
            title={recruitment.status === '진행중' ? '실제 모집 페이지' : '임시저장 미리보기 (운영진만 보임)'}
          >
            <Eye className="w-4 h-4" strokeWidth={2.5} />
            {recruitment.status === '진행중' ? '라이브 프리뷰' : '임시저장 미리보기'}
          </Link>
        )}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 rounded-ctl border border-sand-300 bg-white text-red-600 hover:bg-red-50 transition-colors font-bold flex items-center gap-2"
          title="공고 삭제"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2.5} />
          공고 삭제
        </button>
      </AdminHeaderPortal>

      {/* 삭제 확인 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-sm mx-4 p-8 flex flex-col gap-5">
            <h2 className="text-xl font-black text-red-600">정말로 삭제하시겠어요?</h2>
            <p className="font-bold text-sand-600">
              이 공고와 관련된 모든 지원 데이터도 함께 삭제됩니다.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-ctl border border-sand-300 font-bold text-ink hover:bg-sand-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteRecruitment}
                disabled={deleting}
                className="flex-1 py-3 rounded-ctl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50"
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
          <div className={`flex items-center gap-2 px-5 py-3 rounded-card font-bold shadow-soft-lg ${
            toast.ok ? 'bg-ink text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.ok ? <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} /> : <AlertCircle className="w-5 h-5" strokeWidth={2.5} />}
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}
