import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Briefcase, AlertCircle, ChevronRight, Edit3, Sparkles } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { formatDate } from '../../lib/format';
import { useAdmin } from '../../contexts/AdminContext';
import { ClubPageRenderer } from '../../components/ClubPageRenderer';
import { STORY_ENABLED } from '../../lib/features';

interface Club {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  one_line_desc: string | null;
  is_certified: boolean;
  theme_color: string | null;
}

interface ActiveRecruit {
  id: string;
  title: string;
  generation: string | null;
  deadline: string | null;
  status: string;
}

interface Post {
  id: string;
  title: string;
  images: string[];
  created_at: string;
}

interface ClubPage {
  id: string;
  /** 발행된 공개본 — 방문자가 보는 스냅샷 */
  blocks: { blocks: any[]; config: any } | null;
  /** 작업 중인 초안 — 운영진 미리보기용 (방문자 노출 안 됨) */
  draft: { blocks: any[]; config: any } | null;
  published_at: string | null;
}

type TabKey = 'intro' | 'posts';

export default function ClubDetail() {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, adminClub } = useAdmin();
  const isOwnClub = isAdmin && adminClub?.slug === slug;

  const [club, setClub] = useState<Club | null>(null);
  const [recruits, setRecruits] = useState<ActiveRecruit[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [clubPage, setClubPage] = useState<ClubPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('intro');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) return;

    (async () => {
      setLoading(true);

      const { data: clubData, error } = await supabase
        .from('clubs')
        .select('id, name, slug, type, logo_url, one_line_desc, is_certified, theme_color')
        .eq('slug', slug)
        .single();

      if (error || !clubData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setClub(clubData as Club);

      const [recruitRes, postRes, pageRes] = await Promise.all([
        supabase
          .from('recruitments')
          .select('id, title, generation, deadline, status')
          .eq('club_id', clubData.id)
          .in('status', ['진행중'])
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('posts')
          .select('id, title, images, created_at', { count: 'exact' })
          .eq('club_id', clubData.id)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('club_pages')
          .select('id, blocks, draft, published_at')
          .eq('club_id', clubData.id)
          .maybeSingle(),
      ]);

      setRecruits((recruitRes.data as ActiveRecruit[]) ?? []);
      setPosts((postRes.data as Post[]) ?? []);
      setPostCount(postRes.count ?? 0);
      setClubPage((pageRes.data as ClubPage) ?? null);

      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (notFound || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50 px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-brand mx-auto mb-4" strokeWidth={2.5} />
          <h2 className="text-2xl font-black mb-3 text-ink">동아리를 찾을 수 없습니다.</h2>
          <p className="text-sand-500 font-medium mb-6">주소가 잘못되었거나 삭제된 동아리입니다.</p>
          <Link to="/clubs" className="font-black text-brand hover:underline">← 동아리 목록으로</Link>
        </div>
      </div>
    );
  }

  const activeRecruit = recruits[0] ?? null;
  const dDay = activeRecruit?.deadline
    ? Math.ceil((new Date(activeRecruit.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const handleApply = () => {
    if (activeRecruit) navigate(`/clubs/${slug}/recruit`);
  };

  const SideTabNav = () => (
    <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col rounded-ctl shadow-soft overflow-hidden">
      <button
        onClick={() => { setActiveTab('intro'); window.scrollTo(0, 0); }}
        className={`flex items-center justify-center px-3 font-black text-xs md:text-sm transition-colors ${
          activeTab === 'intro' ? 'btn-grad text-white' : 'bg-white border border-sand-200 text-sand-600 hover:text-brand'
        }`}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '72px' }}
      >소개</button>
      <button
        onClick={() => navigate(`/clubs/${slug}/recruit`)}
        className="flex items-center justify-center px-3 font-black text-xs md:text-sm transition-colors bg-white border border-sand-200 text-sand-600 hover:text-brand"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '72px' }}
      >모집</button>
      {STORY_ENABLED && (
        <button
          onClick={() => { setActiveTab('posts'); window.scrollTo(0, 0); }}
          className={`flex items-center justify-center px-3 font-black text-xs md:text-sm transition-colors ${
            activeTab === 'posts' ? 'btn-grad text-white' : 'bg-white border border-sand-200 text-sand-600 hover:text-brand'
          }`}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '72px' }}
        >스토리</button>
      )}
    </div>
  );

  /* ── 커스텀 페이지 노출 ──
     방문자: 발행된 공개본(blocks)만. 운영진: 작업 중인 초안(draft)을 미리보기.
     초안/공개본이 없으면 아래 기본 정적 레이아웃으로 폴백(페이지는 항상 노출됨). */
  const publishedSource = clubPage?.published_at ? clubPage?.blocks : null;
  const draftSource = clubPage?.draft ?? clubPage?.blocks;
  const previewSource = isOwnClub ? draftSource : publishedSource;
  const hasCustomPage = !!previewSource?.blocks;

  if (hasCustomPage) {
    /* 운영진 안내 배너: 미발행이거나, 초안이 공개본과 달라 발행이 필요한 경우 */
    const isPublished = !!clubPage?.published_at;
    const draftDiffers = JSON.stringify(clubPage?.draft ?? null) !== JSON.stringify(clubPage?.blocks ?? null);
    const showDraftBanner = isOwnClub && (!isPublished || draftDiffers);
    return (
      <div className="bg-white min-h-screen">
        {/* 초안 미리보기 배너 (운영진 전용) */}
        {showDraftBanner && (
          <div className="fixed top-0 left-0 right-0 z-[70] bg-warn-bg text-warn-fg border-b border-sand-200 px-6 py-2 flex items-center justify-between">
            <span className="font-black text-sm">
              {!isPublished
                ? '초안 미리보기 — 아직 발행 전입니다. 방문자에게는 기본 소개 페이지가 보입니다.'
                : '초안 미리보기 — 발행되지 않은 변경사항이 있습니다. 방문자에게는 마지막 발행본이 보입니다.'}
            </span>
            <Link
              to="/workspace"
              className="btn-grad text-white px-4 py-1 font-black text-xs rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              1PAGE 웹 디자인에서 발행하기 →
            </Link>
          </div>
        )}

        {isOwnClub && (
          <div className={`fixed left-4 z-[60] flex flex-col gap-2 ${showDraftBanner ? 'top-16' : 'top-20'}`}>
            <Link
              to="/workspace"
              className="flex items-center gap-1.5 px-3 py-2 btn-grad text-white rounded-ctl font-black text-xs shadow-btn hover:-translate-y-0.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> 페이지 편집
            </Link>
            <Link
              to="/clubs"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-sand-200 text-sand-600 rounded-ctl font-bold text-xs hover:bg-sand-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
            </Link>
          </div>
        )}
        {!isOwnClub && (
          <div className="fixed top-20 left-4 z-[60]">
            <Link
              to="/clubs"
              className="flex items-center gap-1.5 px-3 py-2 bg-white/80 backdrop-blur border border-sand-200 text-sand-600 font-bold text-xs hover:bg-white transition-colors rounded-ctl"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
            </Link>
          </div>
        )}

        <SideTabNav />

        {activeTab === 'intro' && (
          <ClubPageRenderer
            blocks={previewSource!.blocks}
            config={previewSource!.config ?? {}}
            activeRecruit={activeRecruit}
            onApply={handleApply}
          />
        )}

        {activeTab === 'posts' && (
          <div className="max-w-5xl mx-auto px-6 pr-20 md:pr-24 py-24">
            {posts.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
                  <h2 className="text-3xl font-black flex items-center gap-3 text-ink">
                    <span className="w-4 h-4 bg-brand-accent rounded-md inline-block" />
                    활동 스토리
                  </h2>
                  <div className="flex items-center gap-3">
                    {isOwnClub && (
                      <Link to="/admin/posts" className="flex items-center gap-1.5 px-4 py-2 bg-white border border-sand-200 text-sand-600 rounded-ctl font-black text-sm hover:text-brand transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> 스토리 작성
                      </Link>
                    )}
                    <Link to={`/clubs/${slug}/stories`} className="flex items-center gap-1.5 px-4 py-2 btn-grad text-white rounded-ctl font-black text-sm shadow-btn hover:-translate-y-0.5 transition-all">
                      전체보기 {postCount > 0 && `(${postCount}개)`} <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* 피처드 첫 번째 스토리 */}
                <Link to={`/stories/${posts[0].id}`} state={{ backTo: `/clubs/${slug}`, backLabel: '동아리 페이지' }} className="block mb-6 bg-white border border-sand-200 rounded-card shadow-soft group hover:shadow-soft-lg hover:-translate-y-1 transition-all overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 h-64 md:h-80 overflow-hidden relative bg-sand-50">
                      {posts[0].images?.[0] ? (
                        <img src={posts[0].images[0]} alt={posts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full thumb-grad flex items-center justify-center">
                          <span className="text-brand-peach font-bold text-sm">이미지 없음</span>
                        </div>
                      )}
                      <span className="absolute top-4 left-4 bg-brand-accent text-white font-black text-xs px-3 py-1.5 rounded-ctl">LATEST</span>
                    </div>
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between bg-white">
                      <div>
                        <p className="text-xs font-bold text-sand-400 mb-3">
                          {formatDate(posts[0].created_at, 'medium')}
                        </p>
                        <h3 className="text-2xl md:text-3xl font-black leading-snug text-ink group-hover:text-brand transition-colors mb-4">
                          {posts[0].title}
                        </h3>
                      </div>
                      <span className="font-black text-sm text-brand flex items-center gap-2">
                        스토리 읽기 <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* 나머지 스토리 가로 스크롤 */}
                {posts.length > 1 && (
                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
                    {posts.slice(1).map((post, i) => (
                      <Link
                        key={post.id}
                        to={`/stories/${post.id}`}
                        state={{ backTo: `/clubs/${slug}`, backLabel: '동아리 페이지' }}
                        className="min-w-[260px] bg-white border border-sand-200 rounded-card shadow-soft group snap-center hover:shadow-soft-lg hover:-translate-y-1 transition-all block shrink-0 overflow-hidden"
                      >
                        <div className="h-44 overflow-hidden relative bg-sand-50">
                          {post.images?.[0] ? (
                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center thumb-grad">
                              <span className="text-3xl font-black text-brand-peach">{post.title[0]}</span>
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 w-7 h-7 bg-ink text-white flex items-center justify-center font-black text-xs rounded-md">
                            {String(i + 2).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-xs font-bold text-sand-400 mb-1.5">
                            {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
                          </p>
                          <h3 className="font-black text-base leading-snug line-clamp-2 text-ink group-hover:text-brand transition-colors">{post.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-sand-300 rounded-card p-12 text-center flex flex-col items-center gap-4">
                <Briefcase className="w-10 h-10 text-sand-400" />
                <p className="text-sand-400 font-bold">아직 등록된 활동 스토리가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── 기본 정적 레이아웃 (커스텀 페이지 없는 경우) ── */
  return (
    <div className="bg-white min-h-screen">
      {/* 커버 헤더 — 따뜻한 라이트 히어로 */}
      <div className="relative w-full bg-gradient-to-b from-brand-tint to-white border-b border-sand-200">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-16">
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 font-bold text-sand-600 px-4 py-2 bg-white border border-sand-200 hover:text-brand transition-colors rounded-ctl text-sm shadow-soft mb-10"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> 동아리 목록으로
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            {/* 로고 아바타 */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-card overflow-hidden bg-white border border-sand-200 shadow-soft shrink-0">
              {club.logo_url ? (
                <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full thumb-grad flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-black text-brand-peach">{club.name[0]}</span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-white border border-sand-200 text-sand-600 text-xs font-bold px-3 py-1 rounded-ctl">{club.type}</span>
                {club.is_certified && (
                  <span className="bg-brand-tint border border-brand-peach text-brand text-xs font-bold px-3 py-1 rounded-ctl">인증 동아리</span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-ink mb-3 break-keep">{club.name}</h1>
              {club.one_line_desc && (
                <p className="text-lg md:text-xl font-bold text-sand-600 break-keep">{club.one_line_desc}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 상단 CTA 바 */}
      <div className="w-full border-b border-sand-200 bg-white sticky top-16 z-50 shadow-soft">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-lg hidden md:flex items-center gap-2 text-sand-600">
            <Calendar className="w-5 h-5 text-brand" strokeWidth={2.5} />
            {activeRecruit
              ? `${activeRecruit.generation ?? ''} 모집중${dDay !== null ? ` (D-${dDay})` : ''}`
              : '현재 모집 중인 공고가 없습니다'}
          </div>
          <Link
            to={`/clubs/${slug}/recruit`}
            className={`px-10 py-3 text-lg font-black rounded-ctl transition-all ${
              activeRecruit
                ? 'btn-grad text-white shadow-btn hover:-translate-y-0.5'
                : 'bg-white border border-sand-200 text-sand-600 hover:bg-sand-50'
            }`}
          >
            {activeRecruit ? `${activeRecruit.generation ?? ''} 지원서 작성하기` : '모집 페이지 보기'}
          </Link>
        </div>
      </div>

      {/* 오른쪽 고정 탭 메뉴 */}
      <SideTabNav />

      {/* 바디 */}
      <div className="max-w-5xl mx-auto px-6 pr-20 md:pr-24 py-16 md:py-24">

        {/* ── 소개 탭 ── */}
        {activeTab === 'intro' && (
          <div className="max-w-2xl mx-auto">
            {isOwnClub ? (
              <div className="border border-brand-peach bg-brand-tint rounded-card p-10 text-center flex flex-col items-center gap-5">
                <div className="w-14 h-14 rounded-card bg-white border border-brand-peach flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-brand" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-ink mb-2 break-keep">나만의 소개 페이지를 만들어보세요</h2>
                  <p className="text-sand-600 font-medium leading-relaxed break-keep">
                    아직 발행된 페이지가 없어 방문자에게는 기본 안내 화면이 보여요.
                    1PAGE 웹 디자인으로 우리 동아리만의 페이지를 완성해보세요.
                  </p>
                </div>
                <Link
                  to="/workspace"
                  className="px-6 py-3 btn-grad text-white font-black rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all text-sm"
                >
                  페이지 꾸미러 가기 →
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-card bg-brand-tint mb-6">
                  <Sparkles className="w-8 h-8 text-brand" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-ink mb-3 break-keep">
                  아직 동아리가 홈페이지를 구성 중이에요
                </h2>
                <p className="text-sand-600 font-medium leading-relaxed max-w-md mx-auto break-keep">
                  {club.name}의 소개 페이지가 곧 공개됩니다. 그 사이 모집 공고와 활동 스토리를 먼저 둘러보세요.
                </p>
                <div className="flex flex-wrap gap-3 justify-center mt-8">
                  <Link
                    to={`/clubs/${slug}/recruit`}
                    className="px-6 py-3 btn-grad text-white font-black rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all text-sm"
                  >
                    모집 공고 보기
                  </Link>
                  {STORY_ENABLED && postCount > 0 && (
                    <button
                      onClick={() => { setActiveTab('posts'); window.scrollTo(0, 0); }}
                      className="px-6 py-3 bg-white border border-sand-200 text-sand-600 font-black rounded-ctl hover:text-brand transition-colors text-sm"
                    >
                      활동 스토리 보기
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 스토리 탭 ── */}
        {activeTab === 'posts' && (
          <div>
            {posts.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
                  <h2 className="text-3xl font-black flex items-center gap-3 text-ink">
                    <span className="w-4 h-4 bg-brand-accent rounded-md inline-block" />
                    활동 스토리
                  </h2>
                  <div className="flex items-center gap-3">
                    {isOwnClub && (
                      <Link to="/admin/posts" className="flex items-center gap-1.5 px-4 py-2 bg-white border border-sand-200 text-sand-600 rounded-ctl font-black text-sm hover:text-brand transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> 스토리 작성
                      </Link>
                    )}
                    <Link to={`/clubs/${slug}/stories`} className="flex items-center gap-1.5 px-4 py-2 btn-grad text-white rounded-ctl font-black text-sm shadow-btn hover:-translate-y-0.5 transition-all">
                      전체보기 {postCount > 0 && `(${postCount}개)`} <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* 피처드 첫 번째 스토리 */}
                <Link to={`/stories/${posts[0].id}`} state={{ backTo: `/clubs/${slug}`, backLabel: '동아리 페이지' }} className="block mb-6 bg-white border border-sand-200 rounded-card shadow-soft group hover:shadow-soft-lg hover:-translate-y-1 transition-all overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 h-64 md:h-80 overflow-hidden relative bg-sand-50">
                      {posts[0].images?.[0] ? (
                        <img src={posts[0].images[0]} alt={posts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full thumb-grad flex items-center justify-center">
                          <span className="text-brand-peach font-bold text-sm">이미지 없음</span>
                        </div>
                      )}
                      <span className="absolute top-4 left-4 bg-brand-accent text-white font-black text-xs px-3 py-1.5 rounded-ctl">LATEST</span>
                    </div>
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between bg-white">
                      <div>
                        <p className="text-xs font-bold text-sand-400 mb-3">
                          {formatDate(posts[0].created_at, 'medium')}
                        </p>
                        <h3 className="text-2xl md:text-3xl font-black leading-snug text-ink group-hover:text-brand transition-colors mb-4">
                          {posts[0].title}
                        </h3>
                      </div>
                      <span className="font-black text-sm text-brand flex items-center gap-2">
                        스토리 읽기 <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* 나머지 스토리 가로 스크롤 */}
                {posts.length > 1 && (
                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
                    {posts.slice(1).map((post, i) => (
                      <Link
                        key={post.id}
                        to={`/stories/${post.id}`}
                        state={{ backTo: `/clubs/${slug}`, backLabel: '동아리 페이지' }}
                        className="min-w-[260px] bg-white border border-sand-200 rounded-card shadow-soft group snap-center hover:shadow-soft-lg hover:-translate-y-1 transition-all block shrink-0 overflow-hidden"
                      >
                        <div className="h-44 overflow-hidden relative bg-sand-50">
                          {post.images?.[0] ? (
                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center thumb-grad">
                              <span className="text-3xl font-black text-brand-peach">{post.title[0]}</span>
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 w-7 h-7 bg-ink text-white flex items-center justify-center font-black text-xs rounded-md">
                            {String(i + 2).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-xs font-bold text-sand-400 mb-1.5">
                            {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
                          </p>
                          <h3 className="font-black text-base leading-snug line-clamp-2 text-ink group-hover:text-brand transition-colors">{post.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-sand-300 rounded-card p-12 text-center flex flex-col items-center gap-4">
                <Briefcase className="w-10 h-10 text-sand-400" />
                <p className="text-sand-400 font-bold">아직 등록된 활동 스토리가 없습니다.</p>
                {isOwnClub && (
                  <Link to="/admin/posts" className="px-6 py-3 btn-grad text-white rounded-ctl font-black shadow-btn hover:-translate-y-0.5 transition-all text-sm">
                    첫 스토리 작성하기 →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
