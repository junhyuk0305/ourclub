import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronRight, CheckCircle, Briefcase, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { NumberTicker } from '../../components/ui/NumberTicker';
import { FadeInText } from '../../components/ui/FadeInText';
import { STORY_ENABLED } from '../../lib/features';
import { BannerSlider } from '../../components/ui/BannerSlider';
import { getBanners } from '../../data/banners';
import { usePublicStats } from '../../hooks/usePublicStats';

const MARQUEE_EVENTS = [
  "🎨 디자인 동아리 '모노그램', 홈페이지 오픈 후 신입 지원 3배 증가",
  "📋 IT 동아리 '코드크래프트', 출석·회비 관리 자동화로 운영 시간 70% 절약",
  "💼 마케팅 동아리 '마제스티', 기업 신제품 프로모션 프로젝트 진행",
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

const HeroSection = () => {
  const stats = usePublicStats();
  return (
  <section className="relative overflow-hidden border-b border-sand-200 bg-sand-50 hero-glow">
    {/* 연속 배경(도트) — 섹션 전체에 끊김 없이 깔린다 */}
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#EBE6DF_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
    <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 items-center">
      {/* 좌측 카피 */}
      <div className="md:col-span-2">
        <span className="inline-block px-3 py-1 bg-brand-tint text-brand-dark font-bold text-sm mb-6 rounded-ctl">
          동아리·학회를 위한 운영 플랫폼
        </span>
        <FadeInText as="h1" className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
          <span className="text-brand block">동아리·학회 운영,</span>
          이제 한 곳에서<br />시작하세요
        </FadeInText>
        <p className="text-lg font-medium text-sand-600 mb-10 max-w-xl">
          흩어진 카톡·엑셀, 복잡한 웹빌더는 그만. 우리 동아리 홈페이지를 만들고, 출석·회비·모집을 한 번에 관리하세요. 그리고 기업과 진짜 프로젝트로 한 단계 더 성장하세요.
        </p>
        <div className="flex flex-col gap-3 reveal-up">
          <Link to="/club-setup" className="inline-flex group flex-row items-center gap-4 btn-grad text-white px-8 py-5 text-xl font-black rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all w-fit">
            🚀 우리 동아리 시작하기
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={2.5} />
          </Link>
          <Link to="/clubs" className="text-sm font-bold text-sand-500 hover:text-brand transition-colors w-fit">
            동아리 찾는 학생이신가요? 동아리 둘러보기 →
          </Link>
        </div>
      </div>
      {/* 우측 지표 — 연속 배경 위 소프트 카드 (분할선·다른 배경색 제거) */}
      <div className="flex flex-col gap-4">
        <div className="stat-grad border border-sand-200 rounded-card shadow-soft p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-brand" strokeWidth={2.5} />
            <span className="font-bold tracking-widest text-sm text-sand-600">한 곳에서 운영 중</span>
          </div>
          <div className="text-4xl md:text-5xl font-black text-ink mb-2">
            <NumberTicker value={stats?.clubs ?? 0} /><span className="text-2xl text-sand-500 ml-2">팀</span>
          </div>
          <p className="text-sand-600 font-medium text-sm">의 동아리·학회가 OURCLUB으로 홈페이지와 운영을 해결하고 있어요.</p>
        </div>
        <div className="stat-grad border border-sand-200 rounded-card shadow-soft p-6">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-brand" strokeWidth={2.5} />
            <span className="font-bold tracking-widest text-sm text-sand-600">기업과 함께한 프로젝트</span>
          </div>
          <div className="text-4xl md:text-5xl font-black text-ink mb-2">
            <NumberTicker value={stats?.completedProjects ?? 0} duration={1600} /><span className="text-2xl text-sand-500 ml-2">건</span>
          </div>
          <p className="text-sand-600 font-medium text-sm">동아리들이 기업과 함께 완료한 협업 프로젝트입니다.</p>
        </div>
      </div>
    </div>
  </section>
  );
};

const Marquee = () => (
  <div className="flex overflow-hidden bg-brand-tint py-3 select-none">
    <div className="flex flex-shrink-0 animate-marquee whitespace-nowrap items-center">
      {[...MARQUEE_EVENTS, ...MARQUEE_EVENTS].map((text, i) => (
        <span key={i} className="mx-4 font-bold text-ink text-sm md:text-base flex items-center">
          {text} <span className="mx-4 w-1.5 h-1.5 bg-brand rounded-full inline-block" />
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
  <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
    <div>
      <div className="text-brand font-bold tracking-widest text-sm mb-3 flex items-center gap-2">
        <span className="w-3 h-3 bg-brand-accent rounded-md inline-block" />
        {eyebrow}
      </div>
      <FadeInText as="h2" className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight">{title}</FadeInText>
      {subtitle && <p className="font-medium text-sand-500 text-lg">{subtitle}</p>}
    </div>
    <div className="flex gap-2 flex-shrink-0 items-center">
      {linkTo && linkLabel && (
        <Link to={linkTo} className="text-sm font-black underline hover:text-brand transition-colors mr-4 hidden md:block">{linkLabel}</Link>
      )}
      <button onClick={onPrev} className="w-12 h-12 border border-sand-200 rounded-ctl flex items-center justify-center bg-white shadow-soft hover:shadow-soft-lg hover:-translate-y-1 hover:text-brand transition-all">
        <ChevronRight className="w-6 h-6 rotate-180" strokeWidth={2.5} />
      </button>
      <button onClick={onNext} className="w-12 h-12 border border-sand-200 rounded-ctl flex items-center justify-center bg-white shadow-soft hover:shadow-soft-lg hover:-translate-y-1 hover:text-brand transition-all">
        <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
      </button>
    </div>
  </div>
);

const FilterChips = ({ filters, active, onChange }: {
  filters: string[]; active: string; onChange: (f: string) => void;
}) => (
  <div className="flex gap-2 max-w-6xl mx-auto px-6 md:px-12 mb-8 overflow-x-auto hide-scrollbar">
    {filters.map(f => (
      <button
        key={f}
        onClick={() => onChange(f)}
        className={`whitespace-nowrap px-5 py-2 font-bold border text-sm rounded-ctl transition-all shrink-0 ${
          active === f ? 'btn-grad text-white border-transparent shadow-btn' : 'bg-white border-sand-200 text-sand-600 hover:bg-sand-100'
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
    <section className="border-b border-sand-200 bg-sand-50 overflow-hidden py-24 md:py-32">
      <SectionHead
        eyebrow="INSIGHT & STORIES"
        title={<>검증된 동아리들의<br />생생한 스토리</>}
        subtitle="인증을 마친 동아리들의 생생한 활동기와 인사이트입니다."
        linkTo="/stories"
        linkLabel="스토리 전체보기"
        onPrev={() => scroll('left')}
        onNext={() => scroll('right')}
      />
      <div
        ref={ref}
        className="flex overflow-x-auto max-w-6xl mx-auto px-6 md:px-12 gap-8 snap-x snap-mandatory hide-scrollbar py-4 cursor-grab select-none"
        {...dragHandlers}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="snap-start shrink-0 min-w-[300px] md:min-w-[400px] w-[300px] md:w-[400px] border border-sand-200 rounded-card bg-white flex flex-col animate-pulse overflow-hidden"
            >
              <div className="h-48 bg-sand-100" />
              <div className="p-6 flex flex-col gap-3">
                <div className="h-4 bg-sand-100 rounded w-3/4" />
                <div className="h-4 bg-sand-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : stories.length > 0 ? (
          stories.map(story => (
            <div key={story.id} className="snap-start shrink-0" style={{ pointerEvents: dragging ? 'none' : 'auto' }}>
              <Link
                to={`/stories/${story.id}`}
                className="min-w-[300px] md:min-w-[400px] w-[300px] md:w-[400px] border border-sand-200 rounded-card bg-white shadow-soft group hover:shadow-soft-lg hover:-translate-y-1 transition-all flex flex-col block overflow-hidden"
              >
                <div className="h-48 overflow-hidden relative thumb-grad">
                  {story.img ? (
                    <img
                      src={story.img}
                      alt={story.title}
                      className="w-full h-full object-cover transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-black text-brand-peach">{story.title[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-ink text-white px-3 py-1 text-xs font-bold rounded-md">
                    {story.tag}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <h3 className="text-xl font-bold leading-tight group-hover:text-brand transition-colors">
                    {story.title}
                  </h3>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full min-w-[400px] py-16 text-sand-400 font-bold">
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
            const active = (row.recruitments ?? []).filter(r => ['진행중'].includes(r.status));
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
    <section className="border-b border-sand-200 bg-white overflow-hidden py-24 md:py-32">
      <SectionHead
        eyebrow="CLUBS & SOCIETIES"
        title={<>지금 활동 중인<br />동아리·학회</>}
        subtitle="OURCLUB에서 운영 중인 동아리·학회를 둘러보세요. 인증을 마친 곳에는 인증 뱃지가 붙어요."
        linkTo="/clubs"
        linkLabel="동아리 전체보기"
        onPrev={() => scroll('left')}
        onNext={() => scroll('right')}
      />
      <FilterChips filters={CLUB_FILTERS} active={activeFilter} onChange={setActiveFilter} />
      <div
        ref={ref}
        className="flex overflow-x-auto max-w-6xl mx-auto px-6 md:px-12 gap-6 snap-x snap-mandatory hide-scrollbar py-4 cursor-grab select-none"
        {...dragHandlers}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="snap-start shrink-0 min-w-[300px] md:min-w-[340px] w-[300px] md:w-[340px] border border-sand-200 rounded-card bg-white flex flex-col animate-pulse overflow-hidden">
              <div className="h-44 bg-sand-100" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-3 bg-sand-100 rounded w-1/3" />
                <div className="h-5 bg-sand-100 rounded w-3/4" />
                <div className="h-3 bg-sand-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map(club => (
            <div key={club.id} className="snap-start shrink-0" style={{ pointerEvents: dragging ? 'none' : 'auto' }}>
              <Link
                to={`/clubs/${club.slug}`}
                className="min-w-[300px] md:min-w-[340px] w-[300px] md:w-[340px] bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden group hover:shadow-soft-lg hover:-translate-y-1 transition-all block"
              >
                <div className="h-36 thumb-grad relative flex items-center justify-center text-3xl font-black text-brand-peach overflow-hidden">
                  {club.img ? (
                    <img src={club.img} alt={club.name} className="w-full h-full object-cover transition-all duration-500" />
                  ) : (
                    club.name[0]
                  )}
                  <div className="absolute top-2.5 left-2.5 bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-md leading-tight">{club.category}</div>
                  {club.badge && (
                    <div className="absolute top-2.5 right-2.5 bg-brand-accent text-white w-6 h-6 rounded-ctl flex items-center justify-center text-sm font-black shadow-soft">
                      <CheckCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-black mb-1 group-hover:text-brand transition-colors">{club.name}</h3>
                  {club.desc && (
                    <p className="text-xs font-medium text-sand-500 mb-3 line-clamp-2">{club.desc}</p>
                  )}
                  {club.isRecruiting ? (
                    <div className="cta-grad text-brand-dark text-center py-2 text-xs font-bold rounded-ctl">
                      🔶 모집중{club.dDay !== null ? ` · D-${club.dDay}` : ''}
                    </div>
                  ) : (
                    <div className="bg-sand-100 text-sand-400 text-center py-2 text-xs font-bold rounded-ctl">
                      모집 마감
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full min-w-[400px] py-16 text-sand-400 font-bold">
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
    <section className="border-b border-sand-200 bg-sand-50 overflow-hidden py-24 md:py-32">
      <SectionHead
        eyebrow="COMPANY PROJECTS"
        title={<>진행 중인<br />기업 프로젝트</>}
        subtitle="기업이 동아리·학회에 제안한 실전 협업 프로젝트입니다."
        linkTo="/b2b"
        linkLabel="프로젝트 전체보기"
        onPrev={() => scroll('left')}
        onNext={() => scroll('right')}
      />
      <FilterChips filters={PROJECT_FILTERS} active={activeFilter} onChange={setActiveFilter} />
      <div
        ref={ref}
        className="flex overflow-x-auto max-w-6xl mx-auto px-6 md:px-12 gap-6 snap-x snap-mandatory hide-scrollbar py-4 cursor-grab select-none"
        {...dragHandlers}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="snap-start shrink-0 min-w-[300px] md:min-w-[360px] w-[300px] md:w-[360px] border border-sand-200 rounded-card bg-white flex flex-col animate-pulse overflow-hidden">
              <div className="h-14 bg-brand-tint" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-3 bg-sand-100 rounded w-1/3" />
                <div className="h-5 bg-sand-100 rounded w-full" />
                <div className="h-5 bg-sand-100 rounded w-4/5" />
                <div className="h-3 bg-sand-100 rounded w-1/2 mt-2" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map(project => (
            <div key={project.id} className="snap-start shrink-0" style={{ pointerEvents: dragging ? 'none' : 'auto' }}>
              <Link
                to="/b2b"
                className="min-w-[300px] md:min-w-[360px] w-[300px] md:w-[360px] bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden group hover:shadow-soft-lg hover:-translate-y-1 transition-all block"
              >
                <div className="px-4 py-3 bg-brand-tint flex justify-between items-center">
                  <span className="text-xs font-bold text-sand-600 truncate mr-2">{project.company}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-ctl bg-white ${
                    project.isOpen ? 'text-ok-fg' : 'text-off-fg'
                  }`}>{project.isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <div className="p-4">
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-ctl bg-ink text-white">{project.category}</span>
                    {project.dDayLabel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-ctl bg-brand-tint text-brand-dark">{project.dDayLabel}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-black mb-2 leading-snug group-hover:text-brand transition-colors line-clamp-2">{project.title}</h3>
                  {project.budget && (
                    <p className="text-xs font-medium text-sand-500 mb-4">활동비 {project.budget.toLocaleString()}만원</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-xs text-sand-400 font-medium bg-sand-100 px-2 py-0.5 rounded-ctl">{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full min-w-[400px] py-16 text-sand-400 font-bold">
            현재 진행 중인 프로젝트가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
};

const Gateway = () => (
  <section className="grid grid-cols-1 md:grid-cols-2">
    <Link to="/clubs" className="block border-r-0 border-b md:border-b-0 md:border-r border-sand-200 p-12 cta-grad text-ink group cursor-pointer transition-all duration-300">
      <div className="mb-8">
        <Users className="w-12 h-12 mb-4 text-brand group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        <FadeInText as="h2" className="text-3xl font-black mb-2">동아리·학회 둘러보기</FadeInText>
        <p className="font-medium text-sand-600">관심 분야의 동아리·학회를 찾아 둘러보고 지원하세요. 인증을 마친 곳에는 인증 뱃지가 붙어요.</p>
      </div>
      <div className="flex justify-end">
        <div className="w-16 h-16 btn-grad text-white rounded-full flex items-center justify-center shadow-btn group-hover:-translate-y-0.5 transition-all">
          <ArrowRight className="w-8 h-8 -rotate-45 group-hover:rotate-0 transition-transform" strokeWidth={2.5} />
        </div>
      </div>
    </Link>
    <Link to="/b2b" className="block p-12 cta-grad text-ink group cursor-pointer transition-all duration-300">
      <div className="mb-8">
        <Briefcase className="w-12 h-12 mb-4 text-brand group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        <FadeInText as="h2" className="text-3xl font-black mb-2">기업 프로젝트 라운지</FadeInText>
        <p className="font-medium text-sand-600">동아리·학회에게 프로젝트, 행사 제휴 등 협업을 제안해보세요.</p>
      </div>
      <div className="flex justify-end">
        <div className="w-16 h-16 btn-grad text-white rounded-full flex items-center justify-center shadow-btn group-hover:-translate-y-0.5 transition-all">
          <ArrowRight className="w-8 h-8 -rotate-45 group-hover:rotate-0 transition-transform" strokeWidth={2.5} />
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
      {STORY_ENABLED && <StoryArchive />}
      <ClubCarousel />
      <ProjectCarousel />
      <Gateway />
      <section className="border-b border-sand-200 bg-sand-50 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto">
          <BannerSlider page="home" slides={getBanners('home')} />
        </div>
      </section>
    </>
  );
}
