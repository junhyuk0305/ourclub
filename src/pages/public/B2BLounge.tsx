import React, { useState, useEffect } from 'react';
import {
  Briefcase, Building, ChevronRight, ArrowRight,
  DollarSign, Award, Search, Filter, Loader,
  Calendar, Tag,
} from 'lucide-react';
import { FadeInText } from '../../components/ui/FadeInText';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';
import { Modal } from '../../components/ui/Modal';
import { SUCCESS_CASES } from '../../data/mockData';

const FILTERS = ['전체보기', '마케팅', 'IT개발', '리서치', '디자인', '기획', '콘텐츠', '기타'];

interface LiveProject {
  id: string;
  title: string;
  category: string;
  budget: number | null;
  deadline: string | null;
  required_skills: string[];
  description: string | null;
  status: string;
  created_at: string;
  corporations: { name: string } | null;
}

// ── Hero ───────────────────────────────────────────────────────────────────

function LoungeHero({
  openCount, onCorpAction,
}: {
  openCount: number;
  onCorpAction: () => void;
}) {
  return (
    <section className="bg-black text-white border-b border-black flex flex-col md:flex-row relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />
      <div className="flex-1 p-8 md:p-16 relative z-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-800">
        <div className="flex items-center gap-2 mb-4 text-orange-500">
          <Briefcase className="w-6 h-6" />
          <span className="font-bold tracking-widest text-sm">B2B PROJECT LOUNGE</span>
        </div>
        <FadeInText as="h1" className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
          안전이 검증된 동아리에게<br />실무를 제안하세요.
        </FadeInText>
        <p className="text-gray-400 font-medium text-lg max-w-xl mb-10">
          100% 신원 및 활동 투명성이 입증된 <strong className="text-white">오렌지 뱃지 동아리</strong>만
          접근할 수 있는 익스클루시브 프로젝트 게시판입니다. 동아리와의 B2B 협업으로 기업의 태스크를 해결하세요.
        </p>
        <div className="bg-white text-black p-6 border border-white max-w-xl">
          <h3 className="font-black text-xl mb-2 flex items-center gap-2">
            <Building className="w-5 h-5" /> 기업이신가요?
          </h3>
          <p className="text-gray-600 font-medium text-sm mb-4">
            대학생 동아리와의 협업 일감을 등록하고 검증된 제안을 받아보세요.
          </p>
          <button
            onClick={onCorpAction}
            className="w-full bg-orange-500 border border-black py-3 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            우리 기업 프로젝트 등록하기 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="w-full md:w-80 flex flex-col relative z-10">
        <div className="flex-1 border-b border-gray-800 p-8 flex flex-col justify-center bg-gray-900/50">
          <p className="text-sm font-bold text-gray-400 mb-2">현재 모집 중인 프로젝트</p>
          <div className="text-5xl font-black text-white flex items-end gap-2">
            {openCount}<span className="text-2xl text-orange-500 mb-1">건</span>
          </div>
        </div>
        <div className="flex-1 p-8 flex flex-col justify-center bg-gray-900/50">
          <p className="text-sm font-bold text-gray-400 mb-2">누적 매칭 완료 프로젝트</p>
          <div className="text-5xl font-black text-white flex items-end gap-2">
            385<span className="text-2xl text-gray-500 mb-1">건</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Project Row ────────────────────────────────────────────────────────────

function ProjectRow({
  project,
  onDetail,
  onProposal,
}: {
  project: LiveProject;
  onDetail: (p: LiveProject) => void;
  onProposal: (p: LiveProject) => void;
}) {
  const isOpen = project.status === '모집중';

  const formatBudget = (b: number | null) =>
    b ? `${b.toLocaleString()}원` : '예산 협의';

  const formatDeadline = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) + ' 마감';
  };

  return (
    <div
      className={`flex flex-col lg:flex-row border-b border-black group transition-colors ${
        isOpen ? 'hover:bg-orange-50/50 bg-white' : 'bg-gray-100 opacity-75'
      }`}
    >
      {/* 기본 정보 */}
      <div className="p-6 lg:w-5/12 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {isOpen ? (
            <span className="px-2 py-1 text-xs font-black border border-black bg-green-400 text-black">
              {formatDeadline(project.deadline) ?? '모집중'}
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-black border border-black bg-gray-400 text-white">
              모집마감
            </span>
          )}
          <span className="px-2 py-1 text-xs font-bold border border-black bg-white">{project.category}</span>
          <span className="text-sm font-bold text-gray-500">{project.corporations?.name ?? '—'}</span>
        </div>
        <h3
          className="text-2xl font-black leading-tight mb-3 group-hover:text-orange-600 transition-colors cursor-pointer"
          onClick={() => onDetail(project)}
        >
          {project.title}
        </h3>
        {project.required_skills?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {project.required_skills.map(tag => (
              <span key={tag} className="text-xs font-bold text-gray-500 flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 조건/리워드 */}
      <div className="p-6 lg:w-4/12 border-t lg:border-t-0 lg:border-l border-black flex flex-col justify-center gap-4 bg-gray-50 group-hover:bg-transparent transition-colors">
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> 리워드/지원
          </p>
          <p className="font-black text-base text-black">{formatBudget(project.budget)}</p>
        </div>
      </div>

      {/* 액션 */}
      <div className="p-6 lg:w-3/12 border-t lg:border-t-0 lg:border-l border-black flex flex-col items-center justify-center gap-2 bg-white">
        {isOpen ? (
          <>
            <button
              onClick={() => onProposal(project)}
              className="w-full bg-black text-white font-bold py-3 border border-black hover:bg-orange-500 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              🔶 수주 제안하기
            </button>
            <button
              onClick={() => onDetail(project)}
              className="w-full text-sm font-bold text-gray-500 hover:text-black flex items-center justify-center gap-1 py-2 border border-gray-200 hover:border-black transition-colors"
            >
              상세 보기 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-4 border border-black cursor-not-allowed">
            모집이 완료되었습니다
          </button>
        )}
      </div>
    </div>
  );
}

// ── Project Detail Modal ───────────────────────────────────────────────────

function ProjectDetailModal({
  project,
  onClose,
  onProposal,
}: {
  project: LiveProject;
  onClose: () => void;
  onProposal: (p: LiveProject) => void;
}) {
  const formatBudget = (b: number | null) =>
    b ? `${b.toLocaleString()}원` : '예산 협의';

  return (
    <Modal isOpen={true} onClose={onClose} title={project.title} size="2xl">
      {/* 메타 정보 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="px-2 py-0.5 text-xs font-bold border border-black bg-white">{project.category}</span>
        <span className="text-sm font-bold text-gray-500">{project.corporations?.name}</span>
        {project.deadline && (
          <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(project.deadline).toLocaleDateString('ko-KR')} 마감
          </span>
        )}
      </div>

      {/* 스킬 태그 */}
      {project.required_skills?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {project.required_skills.map(s => (
            <span key={s} className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* 예산 */}
      <div className="px-4 py-3 bg-orange-50 border border-orange-200 flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-orange-500" />
        <span className="font-black text-orange-700">예산: {formatBudget(project.budget)}</span>
      </div>

      {/* 설명 */}
      {project.description ? (
        <MarkdownViewer content={project.description} />
      ) : (
        <p className="text-gray-400 font-bold text-sm">프로젝트 설명이 없습니다.</p>
      )}

      {/* CTA */}
      {project.status === '모집중' && (
        <button
          onClick={() => { onClose(); onProposal(project); }}
          className="w-full mt-6 bg-black text-white font-black py-4 border-2 border-black hover:bg-orange-500 hover:text-black transition-colors flex items-center justify-center gap-2 text-lg"
        >
          🔶 이 프로젝트 수주 제안하기
        </button>
      )}
    </Modal>
  );
}

// ── Success Showcase ───────────────────────────────────────────────────────

function SuccessShowcase() {
  return (
    <section className="border-b border-black bg-black text-white overflow-hidden py-16">
      <div className="px-6 md:px-10 mb-10 text-center flex flex-col items-center">
        <Award className="w-12 h-12 text-orange-500 mb-4" />
        <FadeInText as="h2" className="text-3xl md:text-4xl font-black tracking-tight mb-4">매칭 성공 사례</FadeInText>
        <p className="font-medium text-gray-400 max-w-2xl">
          기업의 실무 과제를 OURCLUB의 검증된 동아리들이 훌륭하게 완수해 낸 실제 사례들입니다.
        </p>
      </div>
      <div className="flex overflow-x-auto px-6 md:px-10 gap-6 snap-x hide-scrollbar pb-8">
        {SUCCESS_CASES.map(c => (
          <div key={c.id} className="min-w-[300px] md:min-w-[400px] border border-white bg-black group hover:-translate-y-2 transition-all snap-center cursor-pointer">
            <div className="h-48 border-b border-white overflow-hidden">
              <img src={c.img} alt={c.title} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-black mb-2 text-orange-500">{c.title}</h3>
              <p className="font-medium text-gray-300 leading-relaxed">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function B2BLounge() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [projects, setProjects]       = useState<LiveProject[]>([]);
  const [fetching, setFetching]       = useState(true);
  const [query, setQuery]             = useState('');
  const [activeFilter, setActiveFilter] = useState('전체보기');
  const [detailProject, setDetailProject] = useState<LiveProject | null>(null);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      const { data } = await supabase
        .from('b2b_projects')
        .select('id, title, category, budget, deadline, required_skills, description, status, created_at, corporations(name)')
        .order('created_at', { ascending: false });
      setProjects((data as unknown as LiveProject[]) ?? []);
      setFetching(false);
    };
    load();
  }, []);

  const handleProposal = (project: LiveProject) => {
    if (!session) {
      navigate('/login');
      return;
    }
    navigate(`/admin/b2b/proposal?project_id=${project.id}`);
  };

  const handleCorpAction = () => {
    navigate(session ? '/corp/dashboard' : '/login');
  };

  const openProjects = projects.filter(p => p.status === '모집중');

  const filtered = projects.filter(p => {
    const matchFilter = activeFilter === '전체보기' || p.category === activeFilter;
    const matchQuery  = !query.trim() ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      (p.corporations?.name ?? '').toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <>
      <LoungeHero openCount={openProjects.length} onCorpAction={handleCorpAction} />
      <SuccessShowcase />

      {/* 프로젝트 탐색 섹션 */}
      <section className="bg-gray-100 py-12 md:py-16 flex-1 border-b border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-[600px]">

            {/* 검색 + 필터 헤더 */}
            <div className="border-b border-black">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 border-b border-black">
                <FadeInText as="h2" className="text-2xl font-black flex items-center gap-2">
                  <Briefcase className="w-6 h-6" /> 프로젝트 탐색
                </FadeInText>
                <div className="flex bg-white border border-black max-w-md w-full">
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="프로젝트, 기업명 검색..."
                    className="flex-1 px-4 py-2 outline-none font-bold placeholder:text-gray-400 text-sm"
                  />
                  <div className="bg-black text-white px-4 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex overflow-x-auto hide-scrollbar bg-white items-center p-2">
                <div className="flex px-4 gap-2">
                  {FILTERS.map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`whitespace-nowrap px-4 py-2 font-bold border border-black text-sm transition-colors ${
                        activeFilter === f ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 목록 */}
            <div className="flex flex-col flex-1 bg-white">
              {fetching ? (
                <div className="flex-1 flex items-center justify-center py-24">
                  <Loader className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex-1 p-16 flex items-center justify-center">
                  <div className="text-center text-gray-500 font-bold flex flex-col items-center">
                    <Filter className="w-10 h-10 mb-4 opacity-50" />
                    {query
                      ? `"${query}"에 해당하는 프로젝트가 없습니다.`
                      : '해당 카테고리에 현재 등록된 프로젝트가 없습니다.'}
                  </div>
                </div>
              ) : (
                filtered.map(project => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onDetail={setDetailProject}
                    onProposal={handleProposal}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 상세 보기 모달 */}
      {detailProject && (
        <ProjectDetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
          onProposal={handleProposal}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
