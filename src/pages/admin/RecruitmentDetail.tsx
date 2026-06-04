import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, FileText, ClipboardList, GitBranch, Loader, ChevronRight, Eye,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { ApplicantsTab } from '../../components/admin/recruitment/ApplicantsTab';
import { JobInfoTab } from '../../components/admin/recruitment/JobInfoTab';
import { FormTab } from '../../components/admin/recruitment/FormTab';
import { PipelineTab } from '../../components/admin/recruitment/PipelineTab';

interface RecruitmentSummary {
  id: string;
  title: string;
  generation: string | null;
  status: string;
}

interface Recruitment extends RecruitmentSummary {
  category: string | null;
  short_desc: string | null;
  description: string | null;
  deadline: string | null;
  recruit_start_date: string | null;
  targets: string | null;
  location: string | null;
  regular_meeting: string | null;
  hashtags: string[] | null;
  pipeline_stages: string[];
  form_schema: unknown[];
  form_version: number;
  deployed_form_schema: unknown[] | null;
}

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

  const rawTab = params.get('tab') as Tab | null;
  const tab: Tab = (rawTab && TABS.some(t => t.key === rawTab)) ? rawTab : 'applicants';

  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [siblings, setSiblings] = useState<RecruitmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  const statusStyle = recruitment.status === '진행중'
    ? 'bg-green-500 text-white'
    : recruitment.status === '마감'
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
              {recruitment.status}
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
    </div>
  );
}
