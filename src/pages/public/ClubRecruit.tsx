import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Loader, AlertCircle, Clock, Briefcase, X, FileText,
  Star, MessageSquare, ChevronDown, Plus, Eye, MapPin, Users, CalendarDays,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';
import { useAuth } from '../../contexts/AuthContext';
import {
  RecruitPageSettings, mergeRecruitPage, SloganPosition,
} from '../../types/recruitment';

interface Club {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  one_line_desc: string | null;
  theme_color: string;
  is_certified: boolean;
  recruit_page: unknown;
}

interface Recruitment {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  short_desc: string | null;
  generation: string | null;
  deadline: string | null;
  recruit_start_date: string | null;
  targets: string | null;
  location: string | null;
  regular_meeting: string | null;
  hashtags: string[] | null;
  pipeline_stages: string[] | null;
  max_applicants: number | null;
}

interface Story {
  id: string;
  title: string;
  content: string | null;
  images: string[] | null;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  generation: string | null;
  result: string | null;
  created_at: string;
  user_id?: string;
  profiles?: { name: string | null } | null;
}

export default function ClubRecruit() {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const [club, setClub] = useState<Club | null>(null);
  const [settings, setSettings] = useState<RecruitPageSettings | null>(null);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jdModal, setJdModal] = useState<Recruitment | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);

      const { data: clubData, error: clubErr } = await supabase
        .from('clubs')
        .select('id, name, slug, type, logo_url, one_line_desc, theme_color, is_certified, recruit_page')
        .eq('slug', slug)
        .single();

      if (clubErr || !clubData) {
        setError('동아리를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      const c = clubData as Club;
      setClub(c);
      setSettings(mergeRecruitPage(c.recruit_page));

      const recruitsQuery = supabase
        .from('recruitments')
        .select('id, title, category, description, short_desc, generation, deadline, recruit_start_date, targets, location, regular_meeting, hashtags, pipeline_stages, max_applicants')
        .eq('club_id', c.id)
        .order('created_at', { ascending: false })
        .limit(3);
      // 미리보기 모드: 모든 상태(임시저장 포함) 조회 — RLS가 운영진만 접근 허용
      if (!isPreview) {
        recruitsQuery.in('status', ['진행중', '모집중']);
      }
      const [recruitRes, storyRes, reviewRes] = await Promise.all([
        recruitsQuery,
        supabase
          .from('posts')
          .select('id, title, content, images, created_at')
          .eq('club_id', c.id).eq('is_published', true)
          .order('created_at', { ascending: false }).limit(3),
        supabase
          .from('club_reviews')
          .select('id, rating, title, body, generation, result, created_at, user_id, profiles(name)')
          .eq('club_id', c.id).eq('is_published', true)
          .order('created_at', { ascending: false }).limit(10),
      ]);

      if (reviewRes.error && /club_reviews/.test(reviewRes.error.message)) {
        console.warn('[ClubRecruit] club_reviews 테이블이 없습니다. 마이그레이션 20260517000000_recruit_page_builder.sql 적용 필요.');
      }
      if (clubErr) console.error('[ClubRecruit] club load error:', clubErr);

      setRecruitments((recruitRes.data as Recruitment[]) ?? []);
      setStories((storyRes.data as Story[]) ?? []);
      setReviews((reviewRes.data as unknown as Review[]) ?? []);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }
  if (error || !club || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">{error ?? '페이지를 찾을 수 없습니다.'}</h2>
          <Link to="/clubs" className="text-orange-500 font-bold hover:underline">← 동아리 목록으로</Link>
        </div>
      </div>
    );
  }

  const brand = settings.brand_color;

  return (
    <div className="min-h-screen bg-gray-50 font-sans" style={{ ['--brand' as never]: brand } as React.CSSProperties}>
      {isPreview && (
        <div className="bg-yellow-400 text-black border-b-2 border-black py-2.5 px-6 flex items-center justify-center gap-3 font-black text-sm">
          <Eye className="w-4 h-4" />
          미리보기 모드 — 임시저장 공고를 포함한 운영진 전용 화면입니다. 지원자에게는 발행 후에만 표시됩니다.
        </div>
      )}
      {/* 클럽 헤더 바 */}
      <div className="bg-black text-white border-b-4" style={{ borderColor: brand }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to={`/clubs/${slug}`} className="p-2 hover:bg-white/10 rounded transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name} className="w-9 h-9 rounded-full object-cover border-2 border-white shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-black shrink-0" style={{ backgroundColor: brand }}>
              {club.name[0]}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-black text-base leading-tight truncate">{club.name}</h1>
            <p className="text-xs text-gray-400 font-bold">{club.type}</p>
          </div>
          {club.is_certified && (
            <span className="ml-auto shrink-0 text-xs font-black text-black px-3 py-1 border" style={{ backgroundColor: brand, borderColor: brand }}>
              ✓ 인증 동아리
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-16">
        {settings.hero.enabled && <HeroSection club={club} hero={settings.hero} brand={brand} />}
        {settings.recruitments.enabled && (
          <RecruitmentsSection
            title={settings.recruitments.title}
            recruitments={recruitments}
            onOpenJD={setJdModal}
            brand={brand}
          />
        )}
        {settings.story.enabled && <StorySection title={settings.story.title} description={settings.story.description} stories={stories} clubSlug={slug!} />}
        {settings.reviews.enabled && <ReviewsSection title={settings.reviews.title} reviews={reviews} clubId={club.id} brand={brand} onRefresh={() => {
          supabase.from('club_reviews').select('id, rating, title, body, generation, result, created_at, user_id, profiles(name)')
            .eq('club_id', club.id).eq('is_published', true)
            .order('created_at', { ascending: false }).limit(10)
            .then(({ data }) => setReviews((data as unknown as Review[]) ?? []));
        }} />}
        {settings.faq.enabled && <FAQSection title={settings.faq.title} items={settings.faq.items} />}

        <div className="pt-8 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
          <Link to={`/clubs/${slug}`} className="text-gray-500 font-bold hover:text-black transition-colors flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> {club.name} 소개 보기
          </Link>
          <p className="text-xs text-gray-400 font-bold">Powered by OurClub</p>
        </div>
      </div>

      {jdModal && <JDModal recruitment={jdModal} onClose={() => setJdModal(null)} onApply={() => { setJdModal(null); navigate(`/clubs/${slug}/apply?rid=${jdModal.id}`); }} brand={brand} />}
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────
function HeroSection({ club, hero, brand }: { club: Club; hero: RecruitPageSettings['hero']; brand: string }) {
  const position: SloganPosition = hero.slogan_position;
  const insideImage = position.startsWith('in-');

  const sloganAlign =
    position.endsWith('-left') ? 'text-left items-start' :
    position.endsWith('-right') ? 'text-right items-end' :
    'text-center items-center';

  const slogan = (
    <div className={`flex flex-col ${sloganAlign} ${insideImage ? '' : 'flex-1'}`}>
      <p className="font-black text-xs mb-3 tracking-[0.2em] uppercase" style={{ color: brand }}>
        Careers at {club.name}
      </p>
      <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight whitespace-pre-wrap">
        {hero.slogan}
      </h2>
      {club.one_line_desc && (
        <p className="text-gray-600 font-bold text-lg mt-5 max-w-2xl leading-relaxed">
          {club.one_line_desc}
        </p>
      )}
    </div>
  );

  if (!hero.thumbnail_url) {
    return <div>{slogan}</div>;
  }

  if (insideImage) {
    const overlayAlign =
      position === 'in-left' ? 'justify-start text-left' :
      position === 'in-right' ? 'justify-end text-right' :
      'justify-center text-center';
    return (
      <div className="relative overflow-hidden border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <img src={hero.thumbnail_url} alt="" className="w-full h-[420px] object-cover" loading="lazy" />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40 flex items-end p-10 md:p-14 ${overlayAlign}`}>
          <div className="text-white max-w-2xl">
            <p className="font-black text-xs mb-3 tracking-[0.2em] uppercase" style={{ color: brand }}>
              Careers at {club.name}
            </p>
            <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight whitespace-pre-wrap">
              {hero.slogan}
            </h2>
            {club.one_line_desc && (
              <p className="font-bold text-base md:text-lg mt-4 leading-relaxed text-gray-100">
                {club.one_line_desc}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // out-of-image: slogan + image side-by-side
  const order = position === 'out-right' ? 'md:flex-row-reverse' : 'md:flex-row';
  return (
    <div className={`flex flex-col gap-8 ${order} items-center`}>
      {slogan}
      <img src={hero.thumbnail_url} alt="" className="w-full md:w-1/2 max-h-80 object-cover border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" loading="lazy" />
    </div>
  );
}

// ── Recruitments ─────────────────────────────────────────────────────────
function RecruitmentsSection({
  title, recruitments, onOpenJD, brand,
}: {
  title: string;
  recruitments: Recruitment[];
  onOpenJD: (r: Recruitment) => void;
  brand: string;
}) {
  return (
    <section>
      <SectionTitle text={title} brand={brand} />
      {recruitments.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 p-16 text-center">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-400 mb-2">현재 진행 중인 모집이 없습니다</h3>
          <p className="text-gray-400 font-bold text-sm">새로운 채용 공고가 올라오면 이 페이지에서 확인하실 수 있습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {recruitments.map(r => (
            <RecruitCard key={r.id} recruitment={r} onOpenJD={() => onOpenJD(r)} brand={brand} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecruitCard({ recruitment: r, onOpenJD, brand }: { recruitment: Recruitment; onOpenJD: () => void; brand: string }) {
  const deadline = r.deadline ? new Date(r.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const stages = Array.isArray(r.pipeline_stages) && r.pipeline_stages.length > 0 ? r.pipeline_stages : ['서류접수', '면접', '최종합격'];

  return (
    <div className={`bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group ${isExpired ? 'opacity-60' : 'hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}>
      <div className="p-7 flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {r.category && (
              <span className="px-2.5 py-1 border text-xs font-black" style={{ backgroundColor: `${brand}15`, borderColor: brand, color: brand }}>
                {r.category}
              </span>
            )}
            {r.generation && <span className="px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold">{r.generation}</span>}
            {isUrgent && !isExpired && (
              <span className="px-2.5 py-1 bg-red-100 border border-red-400 text-red-600 text-xs font-black animate-pulse">
                D-{daysLeft}
              </span>
            )}
          </div>
          <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">{r.title}</h3>
          {r.short_desc && <p className="text-gray-600 font-bold text-sm mb-3 leading-relaxed">{r.short_desc}</p>}

          {/* 메타 정보 */}
          {(r.targets || r.location || r.regular_meeting) && (
            <div className="flex flex-col gap-1 mb-3 text-xs font-bold text-gray-600">
              {r.targets && <p>· 모집 대상: {r.targets}</p>}
              {r.location && <p>· 주요 활동지: {r.location}</p>}
              {r.regular_meeting && <p>· 정기 활동일: {r.regular_meeting}</p>}
            </div>
          )}

          {/* 해시태그 */}
          {(r.hashtags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {r.hashtags!.slice(0, 6).map(h => (
                <span key={h} className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 border border-gray-200">
                  #{h}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            {stages.map((s, i) => (
              <React.Fragment key={`${s}-${i}`}>
                <span className="text-xs font-bold px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-500">{s}</span>
                {i < stages.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
          {deadline && (
            <p className={`text-xs font-bold mt-4 flex items-center gap-1.5 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
              <Clock className="w-3.5 h-3.5" />
              {isExpired
                ? '마감됨'
                : `마감: ${deadline.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
            </p>
          )}
        </div>
        <div className="flex md:flex-col gap-2 shrink-0">
          <button
            onClick={onOpenJD}
            className="flex-1 md:flex-none px-5 py-3 border-2 border-black bg-white hover:bg-gray-100 font-black text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" /> 상세 보기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stories ──────────────────────────────────────────────────────────────
function StorySection({ title, description, stories, clubSlug }: { title: string; description: string; stories: Story[]; clubSlug: string }) {
  return (
    <section>
      <SectionTitle text={title} subtitle={description} />
      {stories.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 p-10 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-400 text-sm">아직 작성된 스토리가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stories.map(s => (
            <Link
              key={s.id}
              to={`/stories/${s.id}`}
              className="bg-white border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex flex-col"
            >
              {s.images && s.images[0] ? (
                <img src={s.images[0]} alt="" className="w-full h-44 object-cover border-b-2 border-black" loading="lazy" />
              ) : (
                <div className="w-full h-44 bg-gray-100 border-b-2 border-black flex items-center justify-center">
                  <FileText className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-black text-base mb-1 line-clamp-2">{s.title}</h4>
                {s.content && (
                  <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-3">{s.content.replace(/[#*>`-]/g, ' ').trim()}</p>
                )}
                <p className="text-xs text-gray-400 font-bold mt-auto">
                  {formatDate(s.created_at, 'monthDay')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-5 text-right">
        <Link to={`/clubs/${clubSlug}/stories`} className="text-sm font-bold text-gray-500 hover:text-black inline-flex items-center gap-1">
          더 많은 스토리 보기 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// ── Reviews ──────────────────────────────────────────────────────────────
function ReviewsSection({
  title, reviews, clubId, brand, onRefresh,
}: {
  title: string; reviews: Review[]; clubId: string; brand: string; onRefresh: () => void;
}) {
  const [writing, setWriting] = useState(false);
  const [genFilter, setGenFilter] = useState<string>('all');

  // 활동기수 옵션(내림차순)
  const gens = useMemo(() => {
    const set = new Set(reviews.map(r => r.generation).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return nb - na;
      return b.localeCompare(a);
    });
  }, [reviews]);

  const filtered = genFilter === 'all' ? reviews : reviews.filter(r => r.generation === genFilter);
  const avg = filtered.length > 0 ? filtered.reduce((s, r) => s + r.rating, 0) / filtered.length : 0;
  const recommend = filtered.length > 0 ? Math.round((filtered.filter(r => r.rating >= 4).length / filtered.length) * 100) : 0;
  const dist = [5, 4, 3, 2, 1].map(star => ({ star, count: filtered.filter(r => r.rating === star).length }));
  const maxCount = Math.max(1, ...dist.map(d => d.count));

  return (
    <section>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <SectionTitle text={title} brand={brand} noMargin />
        <button
          onClick={() => setWriting(true)}
          className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold text-sm flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" /> 후기 작성하기
        </button>
      </div>

      {/* 평점 요약: 평균 + 추천율 + 별점 분포 */}
      {filtered.length > 0 && (
        <div className="bg-white border-2 border-black p-6 mb-5 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black" style={{ color: brand }}>{avg.toFixed(1)}</span>
                <span className="text-base font-bold text-gray-400">/ 5.0</span>
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4" style={{ color: i < Math.round(avg) ? brand : '#e5e7eb', fill: i < Math.round(avg) ? brand : '#e5e7eb' }} />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-400 mt-1.5">총 {filtered.length}개 후기</span>
            </div>
            <div className="flex flex-col items-center border-l border-gray-200 pl-8">
              <span className="text-4xl font-black" style={{ color: brand }}>{recommend}%</span>
              <span className="text-xs font-black text-gray-600 mt-1">추천율</span>
              <span className="text-[10px] font-bold text-gray-400">4★ 이상 비율</span>
            </div>
          </div>
          {/* 별점 분포 */}
          <div className="flex flex-col gap-1.5">
            {dist.map(d => (
              <div key={d.star} className="flex items-center gap-2 text-xs font-bold">
                <span className="w-7 text-gray-500">{d.star}★</span>
                <div className="flex-1 h-2.5 bg-gray-100 border border-gray-200 overflow-hidden">
                  <div className="h-full" style={{ width: `${(d.count / maxCount) * 100}%`, backgroundColor: brand }} />
                </div>
                <span className="w-6 text-right text-gray-500">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 활동기수 필터 */}
      {gens.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-black text-gray-400">활동기수:</span>
          {(['all', ...gens]).map(g => {
            const on = genFilter === g;
            return (
              <button
                key={g}
                onClick={() => setGenFilter(g)}
                className={`px-2.5 py-1 border-2 border-black font-black text-xs ${on ? 'text-black' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                style={on ? { backgroundColor: brand } : undefined}
              >
                {g === 'all' ? '전체' : g}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 p-10 text-center">
          <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-400 text-sm mb-2">{genFilter === 'all' ? '아직 작성된 후기가 없습니다.' : '해당 기수의 후기가 없습니다.'}</p>
          {genFilter === 'all' && <p className="text-xs text-gray-400 font-medium">첫 번째 후기를 작성해주세요.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => <ReviewCard key={r.id} review={r} brand={brand} />)}
        </div>
      )}

      {writing && <ReviewWriter clubId={clubId} onClose={() => setWriting(false)} onSuccess={() => { setWriting(false); onRefresh(); }} brand={brand} />}
    </section>
  );
}

function ReviewCard({ review, brand }: { review: Review; brand: string }) {
  const authorName = anonymize(review.profiles?.name);
  return (
    <div className="bg-white border-2 border-black p-5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-4 h-4" style={{ color: i < review.rating ? brand : '#e5e7eb', fill: i < review.rating ? brand : '#e5e7eb' }} />
        ))}
        <span className="font-black text-sm ml-1" style={{ color: brand }}>{review.rating}.0</span>
        {review.generation && <span className="ml-2 text-xs font-bold text-gray-500">{review.generation}</span>}
        {review.result && (
          <span className={`text-xs font-bold px-2 py-0.5 border ${
            review.result === '합격' ? 'bg-green-50 border-green-300 text-green-700' :
            review.result === '불합격' ? 'bg-gray-100 border-gray-300 text-gray-500' :
            'bg-yellow-50 border-yellow-300 text-yellow-700'
          }`}>
            {review.result}
          </span>
        )}
      </div>
      <h4 className="font-black text-base mb-2">{review.title}</h4>
      <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap line-clamp-4">{review.body}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500 font-bold">{authorName}</span>
        <span className="text-xs text-gray-400 font-bold">
          {new Date(review.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </span>
      </div>
    </div>
  );
}

// 이름을 익명화: '홍길동' → '홍**', '김지수' → '김**'
function anonymize(name: string | null | undefined): string {
  if (!name || !name.trim()) return '익명';
  const trimmed = name.trim();
  if (trimmed.length === 1) return `${trimmed}*`;
  return trimmed[0] + '*'.repeat(Math.min(trimmed.length - 1, 2));
}

function ReviewWriter({
  clubId, onClose, onSuccess, brand,
}: {
  clubId: string; onClose: () => void; onSuccess: () => void; brand: string;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [generation, setGeneration] = useState('');
  const [result, setResult] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError('제목과 본문을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    const { error: insErr } = await supabase.from('club_reviews').insert({
      club_id: clubId,
      user_id: user.id,
      rating,
      title: title.trim(),
      body: body.trim(),
      generation: generation.trim() || null,
      result: result || null,
    });
    setSubmitting(false);
    if (insErr) {
      setError(insErr.code === '23505' ? '이미 같은 기수로 작성한 후기가 있습니다.' : insErr.message);
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white border-2 border-black w-full max-w-lg shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-black bg-gray-50 flex items-center justify-between">
          <h3 className="text-xl font-black">후기 작성</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="font-black text-xs block mb-2 text-gray-700">평점 *</label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRating(i + 1)} className="hover:scale-110 transition-transform">
                  <Star
                    className="w-8 h-8"
                    style={{ color: i < rating ? brand : '#e5e7eb', fill: i < rating ? brand : '#e5e7eb' }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-black text-xs block mb-1.5 text-gray-700">제목 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="후기 한 줄 요약" className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
          </div>
          <div>
            <label className="font-black text-xs block mb-1.5 text-gray-700">본문 *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="활동 경험, 분위기, 추천 포인트 등을 자유롭게 적어주세요." className="w-full p-2.5 border border-black font-medium text-sm outline-none focus:border-orange-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black text-xs block mb-1.5 text-gray-700">지원한 기수</label>
              <input value={generation} onChange={e => setGeneration(e.target.value)} placeholder="예) 24기" className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
            </div>
            <div>
              <label className="font-black text-xs block mb-1.5 text-gray-700">결과</label>
              <select value={result} onChange={e => setResult(e.target.value)} className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm bg-white">
                <option value="">선택 안 함</option>
                <option value="합격">합격</option>
                <option value="불합격">불합격</option>
                <option value="지원포기">지원포기</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}
        </div>
        <div className="p-6 border-t border-black bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 border border-black font-bold text-sm hover:bg-gray-100">취소</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2 bg-black text-white font-black text-sm hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader className="w-4 h-4 animate-spin" />}
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────
function FAQSection({ title, items }: { title: string; items: { question: string; answer: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section>
      <SectionTitle text={title} />
      {items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-400 font-bold text-sm">등록된 FAQ가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((it, i) => (
            <div key={i} className="bg-white border-2 border-black">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-black text-base">{it.question}</span>
                <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-200 text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {it.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── 공통 섹션 타이틀 ───────────────────────────────────────────────────────
function SectionTitle({ text, subtitle, brand, noMargin }: { text: string; subtitle?: string; brand?: string; noMargin?: boolean }) {
  return (
    <div className={noMargin ? '' : 'mb-6'}>
      <h2 className="text-2xl md:text-3xl font-black tracking-tight" style={brand ? { color: 'inherit' } : undefined}>
        {text}
      </h2>
      {subtitle && <p className="text-sm text-gray-500 font-bold mt-1.5">{subtitle}</p>}
    </div>
  );
}

// ── JD Modal ─────────────────────────────────────────────────────────────
function JDModal({ recruitment: r, onClose, onApply, brand }: { recruitment: Recruitment; onClose: () => void; onApply: () => void; brand: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
        <div className="px-8 py-5 border-b-2 border-black bg-gray-50 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {r.category && <span className="px-2.5 py-1 border text-xs font-black" style={{ backgroundColor: `${brand}15`, borderColor: brand, color: brand }}>{r.category}</span>}
              {r.generation && <span className="px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold">{r.generation}</span>}
            </div>
            <h2 className="text-2xl font-black leading-tight">{r.title}</h2>
            {r.deadline && (
              <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {(() => {
                  const d = new Date(r.deadline);
                  const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000);
                  return daysLeft < 0 ? '마감됨' : daysLeft === 0 ? '오늘 마감' : `D-${daysLeft} · ${formatDate(d, 'monthDay')}`;
                })()}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded shrink-0 mt-0.5"><X className="w-5 h-5" /></button>
        </div>
        {/* 본문(좌) + 모집정보·선발프로세스·지원(우) */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">
          <div className="flex-1 px-8 py-6 lg:border-r-2 lg:border-black min-w-0">
            {r.description ? <MarkdownViewer content={r.description} /> : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-400 font-bold text-sm">상세 모집 요강이 등록되지 않았습니다.</p>
              </div>
            )}
          </div>

          <aside className="lg:w-80 shrink-0 bg-gray-50 px-6 py-6 flex flex-col gap-6 border-t-2 border-black lg:border-t-0">
            {/* 모집 정보 */}
            {(r.targets || r.location || r.regular_meeting || r.deadline || r.generation) && (
              <div>
                <h4 className="font-black text-sm mb-3">모집 정보</h4>
                <dl className="flex flex-col gap-2.5 text-sm">
                  {r.generation && <InfoRow icon={Users} label="기수" value={r.generation} />}
                  {r.targets && <InfoRow icon={Users} label="모집 대상" value={r.targets} />}
                  {r.location && <InfoRow icon={MapPin} label="주요 활동지" value={r.location} />}
                  {r.regular_meeting && <InfoRow icon={CalendarDays} label="정기 활동일" value={r.regular_meeting} />}
                  {r.deadline && (
                    <InfoRow
                      icon={Clock}
                      label="마감"
                      value={(() => {
                        const d = new Date(r.deadline!);
                        const dl = Math.ceil((d.getTime() - Date.now()) / 86400000);
                        return dl < 0 ? '마감됨' : dl === 0 ? '오늘 마감' : `D-${dl} · ${formatDate(d, 'monthDay')}`;
                      })()}
                    />
                  )}
                </dl>
              </div>
            )}

            {/* 선발 프로세스 타임라인 */}
            <div>
              <h4 className="font-black text-sm mb-3">선발 프로세스</h4>
              <ol className="flex flex-col">
                {(Array.isArray(r.pipeline_stages) && r.pipeline_stages.length > 0 ? r.pipeline_stages : ['서류접수', '면접', '최종합격']).map((s, i, arr) => (
                  <li key={`${s}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-xs font-black shrink-0" style={{ backgroundColor: brand, color: brand === '#000000' ? '#fff' : '#000' }}>{i + 1}</span>
                      {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-gray-300 my-0.5 min-h-[14px]" />}
                    </div>
                    <span className="font-bold text-sm pt-0.5 pb-3">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">내부 평가 기준은 공개되지 않으며, 결과는 개별 연락드립니다.</p>
            </div>

            {/* 지원하기 */}
            <button
              onClick={onApply}
              className="mt-auto w-full py-3.5 text-white font-black hover:opacity-90 transition-colors flex items-center justify-center gap-2 text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none"
              style={{ backgroundColor: brand === '#000000' ? '#000000' : brand }}
            >
              지원폼 작성하기 <ChevronRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <dt className="text-xs font-bold text-gray-400">{label}</dt>
        <dd className="font-bold text-sm break-words">{value}</dd>
      </div>
    </div>
  );
}
