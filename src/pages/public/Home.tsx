import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronRight, CheckCircle, Briefcase, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { NumberTicker } from '../../components/ui/NumberTicker';
import { FadeInText } from '../../components/ui/FadeInText';

const MARQUEE_EVENTS = [
  "🔥 마케팅 동아리 '마제스티', 기업 A 신제품 프로모션 성공적 수주 완료",
  "🔒 IT 동아리 '코드크래프트', 14기 운영진 전원 안전 검증 통과",
  "💼 창업 동아리 '스타터스', 시드 투자 유치 및 B2B 협약 체결",
  "🏆 기획 동아리 '플래너스', 13기 누적 회비 100% 투명 공개 달성",
];

function useCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const scroll = (dir: 'left' | 'right') =>
    ref.current?.scrollBy({ left: dir === 'right' ? 380 : -380, behavior: 'smooth' });

  const dragHandlers = {
    onMouseDown(e: React.MouseEvent) {
      isDown.current = true;
      startX.current = e.clientX;
      scrollStart.current = ref.current?.scrollLeft ?? 0;
    },
    onMouseMove(e: React.MouseEvent) {
      if (!isDown.current || !ref.current) return;
      if (!dragging && Math.abs(e.clientX - startX.current) > 5) setDragging(true);
      ref.current.scrollLeft = scrollStart.current - (e.clientX - startX.current);
    },
    onMouseUp() { isDown.current = false; setTimeout(() => setDragging(false), 50); },
    onMouseLeave() { isDown.current = false; setDragging(false); },
  };

  return { ref, scroll, dragging, dragHandlers };
}

const HeroSection = () => (
  <section className="grid grid-cols-1 md:grid-cols-3 border-b border-black">
    <div className="md:col-span-2 p-8 md:p-12 lg:p-16 border-r-0 md:border-r border-black flex flex-col justify-between bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div>
        <span className="inline-block px-3 py-1 border border-black bg-white font-bold text-sm mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          B2B 동아리를 위한 관문
        </span>
        <FadeInText as="h1" className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
          <span className="text-orange-500 block">100% 검증된 청정 구역,</span>
          진짜 실무 스펙을 쌓는<br />B2B 동아리 허브
        </FadeInText>
        <p className="text-lg font-medium text-gray-700 mb-12 max-w-xl">
          불확실한 동아리 활동은 그만. 신원 검증과 예산 투명성이 확인된 오렌지 뱃지 클럽에서 진짜 기업의 프로젝트를 수주하세요.
        </p>
      </div>
      <div>
        <Link to="/clubs" className="inline-flex group flex-row items-center gap-4 bg-orange-500 border border-black px-8 py-5 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
          🚀 검증된 동아리 합류하기
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </div>
    <div className="grid grid-rows-2">
      <div className="p-8 border-b border-black bg-gray-100 text-black flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-orange-500" />
          <span className="font-bold tracking-widest text-sm">엄격한 동아리 검증</span>
        </div>
        <div className="text-5xl font-black text-black mb-2">
          <NumberTicker value={124} /><span className="text-2xl text-gray-500 ml-2">팀</span>
        </div>
        <p className="text-gray-600 font-medium">의 동아리가 엄격한 안전 검증을 통과하여 오렌지 뱃지를 획득했습니다.</p>
      </div>
      <div className="p-8 bg-white flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5" />
          <span className="font-bold tracking-widest text-sm">B2B 프로젝트 매칭</span>
        </div>
        <div className="text-5xl font-black text-black mb-2">
          <NumberTicker value={45} duration={1600} /><span className="text-2xl text-gray-500 ml-2">건</span>
        </div>
        <p className="text-gray-600 font-medium">이번 달 동아리들이 기업으로부터 성공적으로 수주한 협업 건수입니다.</p>
      </div>
    </div>
  </section>
);

const Marquee = () => (
  <div className="flex overflow-hidden bg-orange-500 border-b border-black py-3 select-none">
    <div className="flex flex-shrink-0 animate-marquee whitespace-nowrap items-center">
      {[...MARQUEE_EVENTS, ...MARQUEE_EVENTS].map((text, i) => (
        <span key={i} className="mx-4 font-bold text-black text-sm md:text-base flex items-center">
          {text} <span className="mx-4 w-1.5 h-1.5 bg-black rounded-full inline-block" />
        </span>
      ))}
    </div>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .animate-marquee { animation: marquee 20s linear infinite; }
    `}} />
  </div>
);

const SectionHead = ({ eyebrow, title, subtitle, linkTo, linkLabel, onPrev, onNext }: {
  eyebrow: string; title: React.ReactNode; subtitle?: string;
  linkTo?: string; linkLabel?: string; onPrev: () => void; onNext: () => void;
}) => (
  <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
    <div>
      <div className="text-orange-500 font-bold tracking-widest text-sm mb-3 flex items-center gap-2">
        <span className="w-3 h-3 bg-orange-500 border border-black inline-block" />
        {eyebrow}
      </div>
      <FadeInText as="h2" className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight">{title}</FadeInText>
      {subtitle && <p className="font-medium text-gray-500 text-lg">{subtitle}</p>}
    </div>
    <div className="flex gap-2 flex-shrink-0 items-center">
      {linkTo && linkLabel && (
        <Link to={linkTo} className="text-sm font-black underline hover:text-orange-500 transition-colors mr-4 hidden md:block">{linkLabel}</Link>
      )}
      <button onClick={onPrev} className="w-12 h-12 border border-black flex items-center justify-center hover:bg-orange-500 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all bg-white">
        <ChevronRight className="w-6 h-6 rotate-180" />
      </button>
      <button onClick={onNext} className="w-12 h-12 border border-black flex items-center justify-center hover:bg-orange-500 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all bg-white">
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  </div>
);

const FilterChips = ({ filters, active, onChange }: {
  filters: string[]; active: string; onChange: (f: string) => void;
}) => (
  <div className="flex gap-2 px-6 md:px-12 mb-8 overflow-x-auto hide-scrollbar">
    {filters.map(f => (
      <button
        key={f}
        onClick={() => onChange(f)}
        className={`whitespace-nowrap px-5 py-2 font-bold border border-black text-sm transition-colors shrink-0 ${
          active === f ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(249,115,22,1)]' : 'bg-white hover:bg-gray-100'
        }`}
      >
        {f}
      </button>
    ))}
  </div>
);

interface StoryCard {
  id: string;
  title: string;
  img: string | null;
  tag: string;
}

const StoryArchive = () => {
  const { ref, scroll, dragging, dragHandlers } = useCarousel();
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, title, images, clubs(type)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        setStories(
          (data as unknown as { id: string; title: string; images: unknown; clubs: { type: string } | { type: string }[] | null }[])
            .map(p => {
              const clubsRaw = p.clubs;
              const clubType = Array.isArray(clubsRaw)
                ? (clubsRaw[0]?.type ?? '스토리')
                : ((clubsRaw as { type: string } | null)?.type ?? '스토리');
              const imgs = Array.isArray(p.images) ? (p.images as string[]).filter(Boolean) : [];
              return { id: p.id, title: p.title, img: imgs[0] ?? null, tag: clubType };
            })
        );
        setLoading(false);
      });
  }, []);

  return (
    <section className="border-b border-black bg-gray-50 overflow-hidden py-24 md:py-32">
      <SectionHead
        eyebrow="INSIGHT & STORIES"
        title={<>검증된 동아리들의<br />생생한 스토리</>}
        subtitle="오렌지 뱃지를 획득한 동아리들의 생생한 활동기와 인사이트입니다."
        linkTo="/stories"
        linkLabel="스토리 전체보기"
        onPrev={() => scroll('left')}
        onNext={() => scroll('right')}
      />
      <div
        ref={ref}
        className="flex overflow-x-auto px-6 md:px-12 gap-8 snap-x snap-mandatory hide-scrollbar py-4 cursor-grab select-none"
        {...dragHandlers}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="snap-start shrink-0 min-w-[300px] md:min-w-[400px] w-[300px] md:w-[400px] border border-black bg-white flex flex-col animate-pulse"
            >
              <div className="h-48 bg-gray-200 border-b border-black" />
              <div className="p-6 flex flex-col gap-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : stories.length > 0 ? (
          stories.map(story => (
            <div key={story.id} className="snap-start shrink-0" style={{ pointerEvents: dragging ? 'none' : 'auto' }}>
              <Link
                to={`/stories/${story.id}`}
                className="min-w-[300px] md:min-w-[400px] w-[300px] md:w-[400px] border border-black bg-white group hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all flex flex-col block"
              >
                <div className="h-48 border-b border-black overflow-hidden relative bg-gray-100">
                  {story.img ? (
                    <img
                      src={story.img}
                      alt={story.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <span className="text-4xl font-black text-gray-400">{story.title[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-bold border border-white">
                    {story.tag}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <h3 className="text-xl font-bold leading-tight group-hover:text-orange-600 transition-colors">
                    {story.title}
                  </h3>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full min-w-[400px] py-16 text-gray-400 font-bold">
            아직 발행된 스토리가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
};

interface ClubCard {
  id: string;
  slug: string;
  name: string;
  category: string;
  badge: boolean;
  img: string | null;
  desc: string | null;
  isRecruiting: boolean;
  dDay: number | null;
}

const CLUB_FILTERS = ['전체', '마케팅/기획', 'IT/개발', '창업', '문화/예술'];

const ClubCarousel = () => {
  const { ref, scroll, dragging, dragHandlers } = useCarousel();
  const [activeFilter, setActiveFilter] = useState('전체');
  const [clubs, setClubs] = useState<ClubCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('clubs')
      .select('id, name, slug, type, logo_url, one_line_desc, is_certified, recruitments(id, status, deadline)')
      .eq('is_certified', true)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        setClubs(
          (data as unknown as {
            id: string; name: string; slug: string; type: string;
            logo_url: string | null; one_line_desc: string | null; is_certified: boolean;
            recruitments: { id: string; status: string; deadline: string | null }[];
          }[]).map(row => {
            const active = (row.recruitments ?? []).filter(r => ['진행중', '모집중'].includes(r.status));
            const nearest = active
              .filter(r => r.deadline)
              .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
            const dDay = nearest?.deadline
              ? Math.ceil((new Date(nearest.deadline).getTime() - Date.now()) / 86400000)
              : null;
            return {
              id: row.id, slug: row.slug, name: row.name,
              category: row.type ?? '기타',
              badge: row.is_certified,
              img: row.logo_url,
              desc: row.one_line_desc,
              isRecruiting: active.length > 0,
              dDay: dDay !== null && dDay >= 0 ? dDay : null,
            };
          })
        );
        setLoading(false);
      });
  }, []);

  const filtered = activeFilter === '전체' ? clubs : clubs.filter(c => c.category === activeFilter);

  return (
    <section className="border-b border-black bg-white overflow-hidden py-24 md:py-32">
      <SectionHead
        eyebrow="CURATED CLUBS"
        title={<>검증된 동아리<br />큐레이션</>}
        subtitle="OURCLUB이 직접 심사한 오렌지 뱃지 동아리만 모았습니다."
        linkTo="/clubs"
        linkLabel="동아리 전체보기"
        onPrev={() => scroll('left')}
        onNext={() => scroll('right')}
      />
      <FilterChips filters={CLUB_FILTERS} active={activeFilter} onChange={setActiveFilter} />
      <div
        ref={ref}
        className="flex overflow-x-auto px-6 md:px-12 gap-6 snap-x snap-mandatory hide-scrollbar py-4 cursor-grab select-none"
        {...dragHandlers}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="snap-start shrink-0 min-w-[300px] md:min-w-[340px] w-[300px] md:w-[340px] border border-black bg-white flex flex-col animate-pulse">
              <div className="h-44 bg-gray-200 border-b border-black" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map(club => (
            <div key={club.id} className="snap-start shrink-0" style={{ pointerEvents: dragging ? 'none' : 'auto' }}>
              <Link
                to={`/clubs/${club.slug}`}
                className="min-w-[300px] md:min-w-[340px] w-[300px] md:w-[340px] border border-black bg-white group hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all flex flex-col block"
              >
                <div className="h-44 border-b border-black overflow-hidden relative bg-gray-100">
                  {club.img ? (
                    <img src={club.img} alt={club.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <span className="text-4xl font-black text-gray-400">{club.name[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black text-white px-2 py-1 text-xs font-bold">{club.category}</div>
                  {club.badge && (
                    <div className="absolute top-3 right-3 bg-orange-500 w-7 h-7 border border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-black mb-2 group-hover:text-orange-600 transition-colors leading-tight">{club.name}</h3>
                  {club.desc && (
                    <p className="text-xs font-medium text-gray-500 mb-4 leading-relaxed line-clamp-2">{club.desc}</p>
                  )}
                  <div className="mt-auto">
                    {club.isRecruiting ? (
                      <div className="w-full bg-orange-500 border border-black py-2.5 font-bold text-black text-center text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        🔶 모집중{club.dDay !== null ? ` · D-${club.dDay}` : ''}
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 border border-black py-2.5 font-medium text-gray-400 text-center text-sm">
                        모집 마감
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full min-w-[400px] py-16 text-gray-400 font-bold">
            해당 카테고리의 동아리가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
};

interface ProjectCard {
  id: string;
  company: string;
  title: string;
  category: string;
  budget: number | null;
  dDayLabel: string;
  isOpen: boolean;
  tags: string[];
}

const PROJECT_FILTERS = ['전체', '마케팅', 'IT개발', '기획', '디자인', '리서치', '콘텐츠'];

function toDDayLabel(deadline: string | null): string {
  if (!deadline) return '';
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return d <= 0 ? '마감' : `D-${d}`;
}

const ProjectCarousel = () => {
  const { ref, scroll, dragging, dragHandlers } = useCarousel();
  const [activeFilter, setActiveFilter] = useState('전체');
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('b2b_projects')
      .select('id, title, category, budget, deadline, required_skills, status, corporations(name)')
      .neq('status', 'CLOSED')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        setProjects(
          (data as unknown as {
            id: string; title: string; category: string; budget: number | null;
            deadline: string | null; required_skills: string[]; status: string;
            corporations: { name: string } | null;
          }[]).map(row => ({
            id: row.id,
            company: row.corporations?.name ?? '기업',
            title: row.title,
            category: row.category,
            budget: row.budget,
            dDayLabel: toDDayLabel(row.deadline),
            isOpen: row.status !== 'CLOSED',
            tags: (row.required_skills ?? []).slice(0, 3),
          }))
        );
        setLoading(false);
      });
  }, []);

  const filtered = activeFilter === '전체' ? projects : projects.filter(p => p.category === activeFilter);

  return (
    <section className="border-b border-black bg-gray-50 overflow-hidden py-24 md:py-32">
      <SectionHead
        eyebrow="B2B PROJECTS"
        title={<>진행 중인<br />B2B 프로젝트</>}
        subtitle="기업들이 동아리에 제안한 실전 협업 프로젝트입니다."
        linkTo="/b2b"
        linkLabel="프로젝트 전체보기"
        onPrev={() => scroll('left')}
        onNext={() => scroll('right')}
      />
      <FilterChips filters={PROJECT_FILTERS} active={activeFilter} onChange={setActiveFilter} />
      <div
        ref={ref}
        className="flex overflow-x-auto px-6 md:px-12 gap-6 snap-x snap-mandatory hide-scrollbar py-4 cursor-grab select-none"
        {...dragHandlers}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="snap-start shrink-0 min-w-[300px] md:min-w-[360px] w-[300px] md:w-[360px] border border-black bg-white flex flex-col animate-pulse">
              <div className="h-14 bg-gray-100 border-b border-black" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-full" />
                <div className="h-5 bg-gray-200 rounded w-4/5" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map(project => (
            <div key={project.id} className="snap-start shrink-0" style={{ pointerEvents: dragging ? 'none' : 'auto' }}>
              <Link
                to="/b2b"
                className="min-w-[300px] md:min-w-[360px] w-[300px] md:w-[360px] border border-black bg-white group hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all flex flex-col block"
              >
                <div className={`px-5 py-4 border-b border-black flex justify-between items-center ${project.isOpen ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <span className="text-sm font-bold text-gray-700 truncate mr-3">{project.company}</span>
                  <span className={`text-xs font-black px-2.5 py-1 border shrink-0 ${
                    project.isOpen ? 'bg-white text-green-700 border-green-500' : 'bg-gray-200 text-gray-500 border-gray-400'
                  }`}>{project.isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="text-xs font-black px-2 py-0.5 bg-black text-white">{project.category}</span>
                    {project.dDayLabel && (
                      <span className={`text-xs font-bold px-2 py-0.5 border ${
                        project.dDayLabel === '마감' ? 'border-gray-300 text-gray-400' : 'border-orange-400 text-orange-600 bg-orange-50'
                      }`}>{project.dDayLabel}</span>
                    )}
                  </div>
                  <h3 className="text-base font-black mb-3 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">{project.title}</h3>
                  {project.budget && (
                    <p className="text-xs font-medium text-gray-500 mb-4">활동비 {project.budget.toLocaleString()}만원</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full min-w-[400px] py-16 text-gray-400 font-bold">
            현재 진행 중인 프로젝트가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
};

const Gateway = () => (
  <section className="grid grid-cols-1 md:grid-cols-2">
    <Link to="/clubs" className="block border-r border-b md:border-b-0 border-black p-12 bg-gray-100 group cursor-pointer hover:bg-orange-500 transition-colors duration-300">
      <div className="mb-8">
        <Users className="w-12 h-12 mb-4 text-black group-hover:scale-110 transition-transform" />
        <FadeInText as="h2" className="text-3xl font-black mb-2">동아리 큐레이션 보기</FadeInText>
        <p className="font-medium text-gray-700 group-hover:text-black">안전하고 내 커리어에 도움되는 검증된 동아리를 탐색하고 지원하세요.</p>
      </div>
      <div className="flex justify-end">
        <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors bg-white">
          <ArrowRight className="w-8 h-8 -rotate-45 group-hover:rotate-0 transition-transform" />
        </div>
      </div>
    </Link>
    <Link to="/b2b" className="block p-12 bg-black text-white group cursor-pointer hover:bg-orange-500 hover:text-black transition-colors duration-300">
      <div className="mb-8">
        <Briefcase className="w-12 h-12 mb-4 text-orange-500 group-hover:text-black group-hover:scale-110 transition-transform" />
        <FadeInText as="h2" className="text-3xl font-black mb-2">기업 프로젝트 라운지</FadeInText>
        <p className="font-medium text-gray-400 group-hover:text-gray-900">검증된 동아리에게 외주, 행사 제휴 등 B2B 협업을 제안해보세요.</p>
      </div>
      <div className="flex justify-end">
        <div className="w-16 h-16 border-2 border-orange-500 rounded-full flex items-center justify-center bg-black text-white group-hover:bg-black group-hover:border-black transition-colors">
          <ArrowRight className="w-8 h-8 -rotate-45 group-hover:rotate-0 transition-transform" />
        </div>
      </div>
    </Link>
  </section>
);

export default function Home() {
  return (
    <>
      <HeroSection />
      <Marquee />
      <StoryArchive />
      <ClubCarousel />
      <ProjectCarousel />
      <Gateway />
    </>
  );
}
