import React, { useState, useEffect } from 'react';
import {
  Briefcase, Building, ChevronRight, ArrowRight,
  DollarSign, Award, Search, Filter, Loader,
  Calendar, Tag,
} from 'lucide-react';
import { FadeInText } from '../../components/ui/FadeInText';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { useAuth } from '../../contexts/AuthContext';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';
import { Modal } from '../../components/ui/Modal';
import { ContractNatureBanner } from '../../components/b2b/B2BNotices';
import { BannerSlider } from '../../components/ui/BannerSlider';
import { getBanners } from '../../data/banners';
const SUCCESS_CASES = [
  { id: 1, title: '마제스티 x (주)뷰티이노베이션', desc: '3주 만에 신제품 팝업 스토어 기획 및 방문객 1,000명 달성', img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=60' },
  { id: 2, title: '코드크래프트 x 테크스타트', desc: 'SaaS 서비스 사용성 개선 리포트 제공 및 산학협력 체결', img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=500&q=60' },
  { id: 3, title: '플래너스 x 커리어네트웍스', desc: '전국 대학생 취업 박람회 부스 공동 기획 및 운영 완료', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=500&q=60' },
];

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
  openCount, completedCount, onCorpAction,
}: {
  openCount: number;
  completedCount: number;
  onCorpAction: () => void;
}) {
  return (
    <section className="bg-ink text-white flex flex-col md:flex-row relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />
      <div className="flex-1 p-8 md:p-16 relative z-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/15">
        <div className="flex items-center gap-2 mb-4 text-brand">
          <Briefcase className="w-6 h-6" strokeWidth={2.5} />
          <span className="font-bold tracking-widest text-sm">COMPANY PROJECT LOUNGE</span>
        </div>
        <FadeInText as="h1" className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
          동아리·학회에게<br />진짜 프로젝트를 제안하세요.
        </FadeInText>
        <p className="text-sand-300 font-medium text-lg max-w-xl mb-10">
          OURCLUB의 동아리·학회와 함께 마케팅·개발·리서치 같은 실무 과제를 해결하세요.
          인증을 마친 곳에는 <strong className="text-white">오렌지 뱃지</strong>가 붙어, 믿고 함께할 팀을 골라 협업할 수 있습니다.
        </p>
        <div className="bg-white text-ink p-6 rounded-card shadow-soft max-w-xl">
          <h3 className="font-black text-xl mb-2 flex items-center gap-2">
            <Building className="w-5 h-5" strokeWidth={2.5} /> 기업이신가요?
          </h3>
          <p className="text-sand-600 font-medium text-sm mb-4">
            동아리·학회와의 협업 프로젝트를 등록하고 제안을 받아보세요.
          </p>
          <button
            onClick={onCorpAction}
            className="w-full btn-grad text-white rounded-ctl shadow-btn py-3 font-black text-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            우리 기업 프로젝트 등록하기 <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="w-full md:w-80 flex flex-col relative z-10">
        <div className="flex-1 border-b border-white/15 p-8 flex flex-col justify-center bg-white/5">
          <p className="text-sm font-bold text-sand-300 mb-2">현재 모집 중인 프로젝트</p>
          <div className="text-5xl font-black text-white flex items-end gap-2">
            {openCount}<span className="text-2xl text-brand mb-1">건</span>
          </div>
        </div>
        <div className="flex-1 p-8 flex flex-col justify-center bg-white/5">
          <p className="text-sm font-bold text-sand-300 mb-2">누적 협업 완료 프로젝트</p>
          <div className="text-5xl font-black text-white flex items-end gap-2">
            {completedCount}<span className="text-2xl text-sand-400 mb-1">건</span>
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
    return formatDate(d, 'monthDay') + ' 마감';
  };

  return (
    <div
      className={`flex flex-col lg:flex-row border-b border-sand-200 group transition-colors ${
        isOpen ? 'hover:bg-sand-50 bg-white' : 'bg-sand-50 opacity-70'
      }`}
    >
      {/* 기본 정보 */}
      <div className="p-6 lg:w-5/12 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {isOpen ? (
            <span className="px-2 py-1 text-xs font-black rounded-ctl bg-ok-bg text-ok-fg">
              {formatDeadline(project.deadline) ?? '모집중'}
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-black rounded-ctl bg-off-bg text-off-fg">
              모집마감
            </span>
          )}
          <span className="px-2 py-1 text-xs font-bold rounded-md bg-ink text-white">{project.category}</span>
          <span className="text-sm font-bold text-sand-500">{project.corporations?.name ?? '—'}</span>
        </div>
        <h3
          className="text-2xl font-black leading-tight mb-3 group-hover:text-brand transition-colors cursor-pointer"
          onClick={() => onDetail(project)}
        >
          {project.title}
        </h3>
        {project.required_skills?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {project.required_skills.map(tag => (
              <span key={tag} className="text-xs font-bold text-sand-500 flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 조건/리워드 */}
      <div className="p-6 lg:w-4/12 border-t lg:border-t-0 lg:border-l border-sand-200 flex flex-col justify-center gap-4 bg-sand-50 group-hover:bg-transparent transition-colors">
        <div>
          <p className="text-xs font-bold text-sand-500 mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> 리워드/지원
          </p>
          <p className="font-black text-base text-ink">{formatBudget(project.budget)}</p>
        </div>
      </div>

      {/* 액션 */}
      <div className="p-6 lg:w-3/12 border-t lg:border-t-0 lg:border-l border-sand-200 flex flex-col items-center justify-center gap-2 bg-white">
        {isOpen ? (
          <>
            <button
              onClick={() => onProposal(project)}
              className="w-full btn-grad text-white font-bold py-3 rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              🔶 협업 제안하기
            </button>
            <button
              onClick={() => onDetail(project)}
              className="w-full text-sm font-bold bg-white border border-sand-300 text-ink rounded-ctl hover:bg-sand-50 flex items-center justify-center gap-1 py-2 transition-colors"
            >
              상세 보기 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button disabled className="w-full bg-sand-100 text-sand-400 font-bold py-4 rounded-ctl cursor-not-allowed">
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
        <span className="px-2 py-0.5 text-xs font-bold rounded-ctl bg-sand-100 text-sand-600">{project.category}</span>
        <span className="text-sm font-bold text-sand-500">{project.corporations?.name}</span>
        {project.deadline && (
          <span className="text-xs font-bold text-brand flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(project.deadline)} 마감
          </span>
        )}
      </div>

      {/* 스킬 태그 */}
      {project.required_skills?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {project.required_skills.map(s => (
            <span key={s} className="px-2 py-0.5 bg-brand-tint text-brand-dark rounded-ctl text-xs font-bold">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* 예산 */}
      <div className="px-4 py-3 bg-brand-tint rounded-card flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-brand" strokeWidth={2.5} />
        <span className="font-black text-brand-dark">예산: {formatBudget(project.budget)}</span>
      </div>

      {/* 설명 */}
      {project.description ? (
        <MarkdownViewer content={project.description} />
      ) : (
        <p className="text-sand-400 font-bold text-sm">프로젝트 설명이 없습니다.</p>
      )}

      {/* CTA */}
      {project.status === '모집중' && (
        <button
          onClick={() => { onClose(); onProposal(project); }}
          className="w-full mt-6 btn-grad text-white font-black py-4 rounded-ctl shadow-btn transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg"
        >
          🔶 이 프로젝트 협업 제안하기
        </button>
      )}
    </Modal>
  );
}

// ── Success Showcase ───────────────────────────────────────────────────────

function SuccessShowcase() {
  return (
    <section className="bg-sand-50 overflow-hidden py-16">
      <div className="px-6 md:px-10 mb-10 text-center flex flex-col items-center">
        <Award className="w-12 h-12 text-brand mb-4" strokeWidth={2.5} />
        <FadeInText as="h2" className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-ink">함께한 프로젝트</FadeInText>
        <p className="font-medium text-sand-500 max-w-2xl">
          기업의 실무 과제를 OURCLUB의 검증된 동아리들이 훌륭하게 완수해 낸 실제 사례들입니다.
        </p>
      </div>
      <div className="flex overflow-x-auto px-6 md:px-10 gap-6 snap-x hide-scrollbar pb-8">
        {SUCCESS_CASES.map(c => (
          <div key={c.id} className="min-w-[300px] md:min-w-[400px] bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden group hover:-translate-y-2 transition-all snap-center cursor-pointer">
            <div className="h-48 overflow-hidden">
              <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-black mb-2 text-brand">{c.title}</h3>
              <p className="font-medium text-sand-600 leading-relaxed">{c.desc}</p>
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
  const [toast, setToast]             = useState('');

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
      setToast('협업 제안은 동아리 운영진만 가능해요. 로그인 페이지로 이동합니다.');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    navigate(`/admin/b2b/proposal?project_id=${project.id}`);
  };

  const resetSearch = () => { setQuery(''); setActiveFilter('전체보기'); };

  const handleCorpAction = () => {
    // 로그인 유저는 기업 등록 페이지로 — 이미 기업담당자면 거기서 대시보드로, 심사중이면 대기 화면으로 자동 분기.
    // (바로 /corp/dashboard로 보내면 비-기업 유저가 CorpRoute에서 안내 없이 /login으로 튕김)
    navigate(session ? '/corp/register' : '/login');
  };

  const openProjects = projects.filter(p => p.status === '모집중');
  const completedCount = projects.filter(p => p.status === '완료').length;

  // 배너의 '누적 매칭 완료' 수치를 실집계로 덮어쓴다 (banners.ts 기본값은 fallback).
  const loungeSlides = getBanners('lounge').map(s =>
    s.id === 'lounge-trust'
      ? { ...s, title: `${completedCount}건 협업이 성사됐어요`, highlight: `${completedCount}건` }
      : s
  );

  const filtered = projects.filter(p => {
    const matchFilter = activeFilter === '전체보기' || p.category === activeFilter;
    const matchQuery  = !query.trim() ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      (p.corporations?.name ?? '').toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <>
      <LoungeHero openCount={openProjects.length} completedCount={completedCount} onCorpAction={handleCorpAction} />
      <SuccessShowcase />

      {/* 프로젝트 탐색 섹션 */}
      <section className="bg-sand-50 py-12 md:py-16 flex-1">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <ContractNatureBanner className="mb-4 shadow-soft" />
          <div className="bg-white border border-sand-200 rounded-card shadow-soft flex flex-col min-h-[600px]">

            {/* 검색 + 필터 헤더 */}
            <div className="border-b border-sand-200">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-sand-50 border-b border-sand-200">
                <FadeInText as="h2" className="text-2xl font-black flex items-center gap-2 text-ink">
                  <Briefcase className="w-6 h-6" strokeWidth={2.5} /> 프로젝트 탐색
                </FadeInText>
                <div className="flex field border border-sand-300 rounded-ctl overflow-hidden max-w-md w-full p-0">
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="프로젝트, 기업명 검색..."
                    className="flex-1 px-4 py-2 outline-none bg-transparent font-bold placeholder:text-sand-400 text-sm"
                  />
                  <div className="bg-ink text-white rounded-ctl m-1 px-3 flex items-center justify-center">
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
                      className={`whitespace-nowrap px-4 py-2 font-bold rounded-ctl text-sm transition-colors ${
                        activeFilter === f ? 'bg-ink text-white' : 'bg-white border border-sand-300 text-ink hover:bg-sand-50'
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
                  <Loader className="w-8 h-8 animate-spin text-brand" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex-1 p-16 flex items-center justify-center">
                  <div className="text-center text-sand-500 font-bold flex flex-col items-center gap-4">
                    <Filter className="w-10 h-10 opacity-50" />
                    <p>{query
                      ? `"${query}"에 해당하는 프로젝트가 없습니다.`
                      : '해당 카테고리에 현재 등록된 프로젝트가 없습니다.'}</p>
                    {(query || activeFilter !== '전체보기') && (
                      <button
                        onClick={resetSearch}
                        className="px-5 py-2.5 btn-grad text-white font-black text-sm rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all"
                      >
                        전체 프로젝트 보기
                      </button>
                    )}
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

      <section className="bg-sand-50 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto">
          <BannerSlider page="lounge" slides={loungeSlides} />
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-white border border-sand-200 text-ink px-5 py-3 font-bold text-sm rounded-card shadow-soft flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-accent shrink-0" />
          {toast}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
