import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, Loader, AlertCircle } from 'lucide-react';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';
import { supabase } from '../../lib/supabaseClient';

interface Post {
  id: string;
  title: string;
  content: string | null;
  author: string | null;
  images: string[];
  view_count: number;
  created_at: string;
  clubs: { name: string; logo_url: string | null; type: string } | null;
}

const PAGE_SIZE = 6;

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const [errored, setErrored] = useState<Record<number, boolean>>({});

  if (images.length === 0) return null;

  const handleError = (i: number) => setErrored(prev => ({ ...prev, [i]: true }));
  const validImages = images.filter((_, i) => !errored[i]);
  if (validImages.length === 0) return null;

  // idx가 validImages 범위를 벗어나면 클램프
  const safeIdx = Math.min(idx, validImages.length - 1);

  if (validImages.length === 1) {
    return (
      <div className="w-full border-b-2 border-black overflow-hidden">
        <img
          src={validImages[0]}
          alt="포스트 이미지"
          onError={() => handleError(images.indexOf(validImages[0]))}
          className="w-full h-52 object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full border-b-2 border-black overflow-hidden">
      <img
        src={validImages[safeIdx]}
        alt={`포스트 이미지 ${safeIdx + 1}`}
        onError={() => { handleError(images.indexOf(validImages[safeIdx])); setIdx(0); }}
        className="w-full h-52 object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
      />
      <button
        onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + validImages.length) % validImages.length); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-1 hover:bg-black transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % validImages.length); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-1 hover:bg-black transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {validImages.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); setIdx(i); }}
            className={`w-1.5 h-1.5 rounded-full border border-white transition-colors ${i === safeIdx ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 0) return d.toLocaleDateString('ko-KR');
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return '';
  }
}

export default function Stories() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // ref로 관리 → fetchPosts 재생성 없이 최신값 접근
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const searchRef = useRef('');    // Observer 클로저에서 최신 search 참조
  const mountedRef = useRef(true); // 언마운트 후 setState 방지
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchPosts = useCallback(async (reset: boolean, query: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (mountedRef.current) { setLoading(true); setFetchError(false); }

    const currentOffset = reset ? 0 : offsetRef.current;

    try {
      let req = supabase
        .from('posts')
        .select('id, title, content, author, images, view_count, created_at, clubs(name, logo_url, type)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (query.trim()) {
        req = req.or(`title.ilike.%${query.trim()}%,author.ilike.%${query.trim()}%`);
      }

      const { data, error } = await req;

      if (!mountedRef.current) return;

      if (error) {
        setFetchError(true);
        return;
      }

      const fetched = (data ?? []).map(p => ({
        ...p,
        images: Array.isArray(p.images) ? (p.images as string[]).filter(Boolean) : [],
        clubs: Array.isArray(p.clubs) ? (p.clubs[0] ?? null) : (p.clubs ?? null),
      })) as Post[];

      offsetRef.current = currentOffset + fetched.length;
      setPosts(prev => reset ? fetched : [...prev, ...fetched]);
      setHasMore(fetched.length === PAGE_SIZE);
    } catch {
      if (mountedRef.current) setFetchError(true);
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []); // 의존성 없음 — 모든 가변값은 ref로 참조

  // 검색어 변경 시 리셋 후 재로드
  useEffect(() => {
    searchRef.current = search;
    offsetRef.current = 0;
    loadingRef.current = false;
    setPosts([]);
    setHasMore(true);
    setFetchError(false);
    fetchPosts(true, search);
  }, [search, fetchPosts]);

  // IntersectionObserver — hasMore/loading 변화 시만 재등록
  // searchRef를 통해 Observer 내부에서 항상 최신 search 값 사용
  useEffect(() => {
    observerRef.current?.disconnect();
    if (!hasMore || loading) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchPosts(false, searchRef.current);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-20 font-sans text-black border-b border-black">
      {/* Hero & Search */}
      <section className="bg-black text-white p-8 md:p-16 lg:p-20 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}
        />
        <div className="relative z-10 max-w-3xl w-full">
          <div className="text-orange-500 font-bold tracking-widest text-sm mb-4 flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-orange-500 border border-white inline-block" />
            COMMUNITY POSTS
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-8 leading-snug">
            팀의 성장을 이끄는<br />인사이트 아카이브
          </h1>
          <form
            onSubmit={handleSearch}
            className="w-full max-w-2xl mx-auto flex bg-white border-2 border-black focus-within:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] transition-all"
          >
            <div className="pl-6 flex items-center justify-center bg-white">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="포스트 제목, 작성자를 검색해보세요"
              className="flex-1 px-4 py-5 outline-none font-bold placeholder:text-gray-400 text-black text-lg bg-white"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              maxLength={100}
            />
            <button
              type="submit"
              className="bg-orange-500 px-8 font-black text-black border-l-2 border-black hover:bg-black hover:text-white transition-colors"
            >
              검색
            </button>
          </form>
        </div>
      </section>

      {/* 포스트 피드 */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">

        {/* 네트워크 오류 */}
        {fetchError && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="font-black text-gray-500">포스트를 불러오지 못했습니다.</p>
            <button
              onClick={() => { setFetchError(false); fetchPosts(true, search); }}
              className="px-6 py-2 border-2 border-black font-black text-sm hover:bg-orange-500 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 초기 로딩 */}
        {!fetchError && loading && posts.length === 0 && (
          <div className="flex justify-center py-24">
            <Loader className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        )}

        {/* 빈 상태 */}
        {!fetchError && !loading && posts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            {search.trim() ? (
              <>
                <p className="text-2xl font-black text-gray-300">검색 결과가 없습니다.</p>
                <p className="text-gray-400 font-bold text-sm">
                  &ldquo;{search}&rdquo;에 맞는 포스트를 찾지 못했습니다.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="mt-2 px-6 py-2 border-2 border-black font-black text-sm hover:bg-orange-500 transition-colors"
                >
                  전체 포스트 보기
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-gray-300">아직 발행된 포스트가 없습니다.</p>
                <p className="text-gray-400 font-bold text-sm">운영진이 첫 포스트를 작성하면 여기에 표시됩니다.</p>
              </>
            )}
          </div>
        )}

        {/* 포스트 그리드 */}
        {!fetchError && posts.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {posts.map(post => (
              <article
                key={post.id}
                className="break-inside-avoid border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-1 transition-all flex flex-col cursor-pointer group"
              >
                {/* 이미지 캐러셀 */}
                {post.images.length > 0 && <ImageCarousel images={post.images} />}

                {/* 헤더 */}
                <div className="p-6 pb-3 flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-base bg-orange-100 text-orange-600 flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {post.clubs?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="font-black text-sm group-hover:text-orange-600 transition-colors">
                      {post.author || post.clubs?.name || '운영진'}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {post.clubs?.type || '동아리'}
                    </div>
                  </div>
                </div>

                {/* 본문 */}
                <div className="px-6 pb-6 flex-1 flex flex-col justify-between">
                  <div>
                    {post.title && (
                      <h3 className="font-black text-xl mb-3 leading-snug group-hover:text-orange-600 transition-colors">
                        {post.title}
                      </h3>
                    )}
                    {post.content && (
                      <div className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-6 overflow-hidden">
                        <MarkdownViewer content={post.content} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-2">
                    <span>{formatDate(post.created_at)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {post.view_count ?? 0}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 무한스크롤 센티넬 */}
        <div ref={sentinelRef} className="mt-16 flex justify-center min-h-[1px]">
          {!fetchError && loading && posts.length > 0 && (
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
          )}
          {!fetchError && !loading && !hasMore && posts.length > 0 && (
            <p className="text-gray-400 font-bold text-sm">모든 포스트를 불러왔습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}
