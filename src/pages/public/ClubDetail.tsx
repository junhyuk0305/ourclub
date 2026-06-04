import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Briefcase, Loader, AlertCircle, ChevronRight, Edit3 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { useAdmin } from '../../contexts/AdminContext';
import { ClubPageRenderer } from '../../components/ClubPageRenderer';

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
          .in('status', ['진행중', '모집중'])
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (notFound || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">동아리를 찾을 수 없습니다.</h2>
          <p className="text-gray-500 font-medium mb-6">주소가 잘못되었거나 삭제된 동아리입니다.</p>
          <Link to="/clubs" className="font-black text-orange-500 hover:underline">← 동아리 목록으로</Link>
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
    <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] overflow-hidden">
      <button
        onClick={() => { setActiveTab('intro'); window.scrollTo(0, 0); }}
        className={`flex items-center justify-center px-3 font-black text-xs md:text-sm transition-colors border-b-2 border-black ${
          activeTab === 'intro' ? 'bg-orange-500 text-black' : 'bg-white text-black hover:bg-orange-50'
        }`}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '72px' }}
      >소개</button>
      <button
        onClick={() => navigate(`/clubs/${slug}/recruit`)}
        className="flex items-center justify-center px-3 font-black text-xs md:text-sm transition-colors border-b-2 border-black bg-white text-black hover:bg-orange-50"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '72px' }}
      >채용</button>
      <button
        onClick={() => { setActiveTab('posts'); window.scrollTo(0, 0); }}
        className={`flex items-center justify-center px-3 font-black text-xs md:text-sm transition-colors ${
          activeTab === 'posts' ? 'bg-orange-500 text-black' : 'bg-white text-black hover:bg-orange-50'
        }`}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '72px' }}
      >스토리</button>
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
          <div className="fixed top-0 left-0 right-0 z-[70] bg-yellow-400 border-b-2 border-black px-6 py-2 flex items-center justify-between">
            <span className="font-black text-sm text-black">
              {!isPublished
                ? '초안 미리보기 — 아직 발행 전입니다. 방문자에게는 기본 소개 페이지가 보입니다.'
                : '초안 미리보기 — 발행되지 않은 변경사항이 있습니다. 방문자에게는 마지막 발행본이 보입니다.'}
            </span>
            <Link
              to="/workspace"
              className="px-4 py-1 bg-black text-white font-black text-xs border border-black hover:bg-orange-500 hover:text-black transition-colors whitespace-nowrap"
            >
              웹빌더에서 발행하기 →
            </Link>
          </div>
        )}

        {isOwnClub && (
          <div className={`fixed left-4 z-[60] flex flex-col gap-2 ${showDraftBanner ? 'top-16' : 'top-20'}`}>
            <Link
              to="/workspace"
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> 페이지 편집
            </Link>
            <Link
              to="/clubs"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-black font-bold text-xs hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
            </Link>
          </div>
        )}
        {!isOwnClub && (
          <div className="fixed top-20 left-4 z-[60]">
            <Link
              to="/clubs"
              className="flex items-center gap-1.5 px-3 py-2 bg-white/80 backdrop-blur border border-black/20 font-bold text-xs hover:bg-white transition-colors rounded-full"
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
                  <h2 className="text-3xl font-black flex items-center gap-3">
                    <span className="w-4 h-4 bg-orange-500 border border-black inline-block" />
                    활동 스토리
                  </h2>
                  <div className="flex items-center gap-3">
                    {isOwnClub && (
                      <Link to="/admin/posts" className="flex items-center gap-1.5 px-4 py-2 border border-black font-black text-sm hover:bg-orange-500 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> 스토리 작성
                      </Link>
                    )}
                    <Link to={`/clubs/${slug}/stories`} className="flex items-center gap-1.5 px-4 py-2 bg-black text-white font-black text-sm hover:bg-orange-500 hover:text-black transition-colors border border-black">
                      전체보기 {postCount > 0 && `(${postCount}개)`} <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* 피처드 첫 번째 스토리 */}
                <Link to={`/stories/${posts[0].id}`} className="block mb-6 border-2 border-black group hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 h-64 md:h-80 overflow-hidden relative bg-gray-100 border-b-2 md:border-b-0 md:border-r-2 border-black">
                      {posts[0].images?.[0] ? (
                        <img src={posts[0].images[0]} alt={posts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-sm">이미지 없음</span>
                        </div>
                      )}
                      <span className="absolute top-4 left-4 bg-orange-500 text-black font-black text-xs px-3 py-1.5 border border-black">LATEST</span>
                    </div>
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between bg-white">
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-3">
                          {formatDate(posts[0].created_at, 'medium')}
                        </p>
                        <h3 className="text-2xl md:text-3xl font-black leading-snug group-hover:text-orange-600 transition-colors mb-4">
                          {posts[0].title}
                        </h3>
                      </div>
                      <span className="font-black text-sm text-orange-500 flex items-center gap-2">
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
                        className="min-w-[260px] border border-black bg-white group snap-center hover:shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-0.5 transition-all block shrink-0"
                      >
                        <div className="h-44 border-b border-black overflow-hidden relative bg-gray-100">
                          {post.images?.[0] ? (
                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                              <span className="text-3xl font-black text-gray-400">{post.title[0]}</span>
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 w-7 h-7 bg-black text-white flex items-center justify-center font-black text-xs">
                            {String(i + 2).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-xs font-bold text-gray-400 mb-1.5">
                            {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
                          </p>
                          <h3 className="font-black text-base leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">{post.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="border border-dashed border-gray-300 p-12 text-center flex flex-col items-center gap-4">
                <Briefcase className="w-10 h-10 text-gray-200" />
                <p className="text-gray-400 font-bold">아직 등록된 활동 스토리가 없습니다.</p>
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
      {/* 커버 헤더 */}
      <div className="w-full h-[50vh] md:h-[60vh] bg-gray-900 relative">
        {club.logo_url ? (
          <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black" />
        )}

        <div className="absolute top-0 w-full p-6 md:p-10 z-20">
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 font-black text-white px-4 py-2 bg-black/50 backdrop-blur-md border border-white hover:bg-white hover:text-black transition-colors rounded-full opacity-70 hover:opacity-100 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> 동아리 목록으로
          </Link>
        </div>

        <div className="absolute bottom-0 w-full p-6 md:p-12 z-20 bg-gradient-to-t from-black to-transparent flex justify-between items-end">
          <div>
            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 font-bold text-sm bg-white text-black">{club.type}</span>
              {club.is_certified && (
                <span className="px-3 py-1 font-bold text-sm bg-orange-500 text-black">인증 동아리</span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2">{club.name}</h1>
            {club.one_line_desc && (
              <p className="text-lg md:text-xl font-bold text-gray-300">{club.one_line_desc}</p>
            )}
          </div>
          {club.is_certified && (
            <div className="hidden md:block bg-orange-500 text-black px-6 py-3 font-black text-lg border-2 border-black transform rotate-3 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              안전 검증 완료
            </div>
          )}
        </div>
      </div>

      {/* 상단 CTA 바 */}
      <div className="w-full border-b-2 border-black bg-white sticky top-16 z-50 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-lg hidden md:flex items-center gap-2 text-gray-700">
            <Calendar className="w-5 h-5 text-orange-500" />
            {activeRecruit
              ? `${activeRecruit.generation ?? ''} 모집중${dDay !== null ? ` (D-${dDay})` : ''}`
              : '현재 모집 중인 공고가 없습니다'}
          </div>
          <Link
            to={`/clubs/${slug}/recruit`}
            className={`px-10 py-3 text-lg font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
              activeRecruit
                ? 'bg-orange-500 text-black hover:bg-black hover:text-white hover:translate-y-1 hover:shadow-none'
                : 'bg-gray-100 text-gray-400 pointer-events-none'
            }`}
          >
            {activeRecruit ? `${activeRecruit.generation ?? ''} 지원서 작성하기` : '모집 마감'}
          </Link>
        </div>
      </div>

      {/* 오른쪽 고정 탭 메뉴 */}
      <SideTabNav />

      {/* 바디 */}
      <div className="max-w-5xl mx-auto px-6 pr-20 md:pr-24 py-16 md:py-24">

        {/* ── 소개 탭 ── */}
        {activeTab === 'intro' && (
          <div className="max-w-3xl mx-auto">
            {club.one_line_desc && (
              <div className="mb-16 text-center">
                <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight">{club.name}</h2>
                <p className="text-lg font-medium text-gray-600 leading-relaxed">{club.one_line_desc}</p>
              </div>
            )}

            {isOwnClub && (
              <div className="border-2 border-dashed border-orange-300 bg-orange-50 p-8 text-center flex flex-col items-center gap-4">
                <p className="text-gray-700 font-bold">
                  1-Page 웹빌더로 이 페이지를 커스텀 디자인해보세요!
                </p>
                <Link
                  to="/workspace"
                  className="px-6 py-3 bg-orange-500 text-black font-black border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5 transition-all text-sm"
                >
                  페이지 꾸미러 가기 →
                </Link>
              </div>
            )}

            {!isOwnClub && !club.one_line_desc && (
              <div className="text-center py-20 text-gray-400 font-bold">
                아직 소개 내용이 없습니다.
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
                  <h2 className="text-3xl font-black flex items-center gap-3">
                    <span className="w-4 h-4 bg-orange-500 border border-black inline-block" />
                    활동 스토리
                  </h2>
                  <div className="flex items-center gap-3">
                    {isOwnClub && (
                      <Link to="/admin/posts" className="flex items-center gap-1.5 px-4 py-2 border border-black font-black text-sm hover:bg-orange-500 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> 스토리 작성
                      </Link>
                    )}
                    <Link to={`/clubs/${slug}/stories`} className="flex items-center gap-1.5 px-4 py-2 bg-black text-white font-black text-sm hover:bg-orange-500 hover:text-black transition-colors border border-black">
                      전체보기 {postCount > 0 && `(${postCount}개)`} <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* 피처드 첫 번째 스토리 */}
                <Link to={`/stories/${posts[0].id}`} className="block mb-6 border-2 border-black group hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 h-64 md:h-80 overflow-hidden relative bg-gray-100 border-b-2 md:border-b-0 md:border-r-2 border-black">
                      {posts[0].images?.[0] ? (
                        <img src={posts[0].images[0]} alt={posts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-sm">이미지 없음</span>
                        </div>
                      )}
                      <span className="absolute top-4 left-4 bg-orange-500 text-black font-black text-xs px-3 py-1.5 border border-black">LATEST</span>
                    </div>
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between bg-white">
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-3">
                          {formatDate(posts[0].created_at, 'medium')}
                        </p>
                        <h3 className="text-2xl md:text-3xl font-black leading-snug group-hover:text-orange-600 transition-colors mb-4">
                          {posts[0].title}
                        </h3>
                      </div>
                      <span className="font-black text-sm text-orange-500 flex items-center gap-2">
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
                        className="min-w-[260px] border border-black bg-white group snap-center hover:shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-0.5 transition-all block shrink-0"
                      >
                        <div className="h-44 border-b border-black overflow-hidden relative bg-gray-100">
                          {post.images?.[0] ? (
                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                              <span className="text-3xl font-black text-gray-400">{post.title[0]}</span>
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 w-7 h-7 bg-black text-white flex items-center justify-center font-black text-xs">
                            {String(i + 2).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-xs font-bold text-gray-400 mb-1.5">
                            {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
                          </p>
                          <h3 className="font-black text-base leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">{post.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="border border-dashed border-gray-300 p-12 text-center flex flex-col items-center gap-4">
                <Briefcase className="w-10 h-10 text-gray-200" />
                <p className="text-gray-400 font-bold">아직 등록된 활동 스토리가 없습니다.</p>
                {isOwnClub && (
                  <Link to="/admin/posts" className="px-6 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors text-sm">
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
