import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Eye, Heart, Loader, AlertCircle, Edit3, CheckCircle } from 'lucide-react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatRelativeDate } from '../../lib/format';
import { useAdmin } from '../../contexts/AdminContext';

interface ClubInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  is_certified: boolean;
}

interface StoryPost {
  id: string;
  title: string;
  images: string[];
  view_count: number;
  like_count: number;
  created_at: string;
}

const PAGE_SIZE = 9;

export default function ClubStories() {
  const { id: slug } = useParams<{ id: string }>();
  const { isAdmin, adminClub } = useAdmin();
  const isOwnClub = isAdmin && adminClub?.slug === slug;

  const [club, setClub] = useState<ClubInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState<StoryPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // 클럽 정보 조회
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('clubs')
      .select('id, name, slug, type, logo_url, is_certified')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (!mountedRef.current) return;
        if (error || !data) { setNotFound(true); setLoading(false); return; }
        setClub(data as ClubInfo);
      });
  }, [slug]);

  // 포스트 페이지 조회
  const fetchPosts = useCallback(async (reset: boolean, clubId: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (mountedRef.current) setFetchError(false);

    const offset = reset ? 0 : offsetRef.current;

    const { data, error, count } = await supabase
      .from('posts')
      .select('id, title, images, view_count, like_count, created_at', { count: 'exact' })
      .eq('club_id', clubId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!mountedRef.current) return;

    loadingRef.current = false;

    if (error) {
      setFetchError(true);
      setLoading(false);
      return;
    }

    const fetched = (data ?? []).map(p => ({
      ...p,
      images: Array.isArray(p.images) ? (p.images as string[]).filter(Boolean) : [],
    })) as StoryPost[];

    if (reset && count !== null) setTotalCount(count);
    offsetRef.current = offset + fetched.length;
    setPosts(prev => reset ? fetched : [...prev, ...fetched]);
    setHasMore(fetched.length === PAGE_SIZE);
    setLoading(false);
  }, []);

  // 클럽 로드 후 포스트 조회 시작
  useEffect(() => {
    if (!club) return;
    offsetRef.current = 0;
    loadingRef.current = false;
    setPosts([]);
    setHasMore(true);
    fetchPosts(true, club.id);
  }, [club?.id, fetchPosts]);

  // 무한스크롤
  useEffect(() => {
    if (!hasMore || loading || fetchError || !club) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) fetchPosts(false, club.id); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchError, club, fetchPosts]);

  if (notFound) return <Navigate to="/clubs" replace />;

  return (
    <div className="bg-gray-100 min-h-screen pb-16">
      {/* 클럽 헤더 */}
      <div className="bg-black text-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Link
            to={`/clubs/${slug}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-bold text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {club ? `${club.name}으로 돌아가기` : '동아리로 돌아가기'}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {club?.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={club.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center font-black text-black text-2xl shrink-0">
                  {club?.name?.[0] ?? '?'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black">{club?.name ?? '—'}</h1>
                  {club?.is_certified && (
                    <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
                  <span>{club?.type ?? '—'}</span>
                  {!loading && (
                    <>
                      <span>·</span>
                      <span className="text-orange-400">{totalCount}개의 스토리</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isOwnClub && (
              <Link
                to="/admin/posts"
                className="shrink-0 flex items-center gap-2 px-5 py-3 bg-orange-500 text-black font-black border-2 border-white hover:bg-white transition-colors text-sm"
              >
                <Edit3 className="w-4 h-4" /> 새 스토리 작성
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 포스트 그리드 */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 초기 로딩 */}
        {loading && posts.length === 0 && (
          <div className="flex justify-center py-24">
            <Loader className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        )}

        {/* 오류 */}
        {fetchError && !loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="font-black text-gray-500">스토리를 불러오지 못했습니다.</p>
            <button
              onClick={() => club && fetchPosts(true, club.id)}
              className="px-6 py-2 border-2 border-black font-black text-sm hover:bg-orange-500 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && !fetchError && posts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center border-2 border-dashed border-gray-300 bg-white">
            <Edit3 className="w-12 h-12 text-gray-200" />
            <p className="text-xl font-black text-gray-300">아직 등록된 스토리가 없습니다.</p>
            {isOwnClub ? (
              <Link
                to="/admin/posts"
                className="mt-2 px-6 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors"
              >
                첫 스토리 작성하기 →
              </Link>
            ) : (
              <p className="text-sm font-bold text-gray-400">이 동아리가 스토리를 발행하면 여기에 표시됩니다.</p>
            )}
          </div>
        )}

        {/* 매거진 레이아웃 */}
        {posts.length > 0 && (
          <div className="space-y-6">
            {/* 히어로: 첫 번째 스토리 */}
            <Link
              to={`/stories/${posts[0].id}`}
              state={{ backTo: `/clubs/${slug}/stories`, backLabel: '동아리 스토리' }}
              className="block relative overflow-hidden border-2 border-black group"
            >
              <div className="h-[45vh] md:h-[55vh] relative">
                {posts[0].images[0] ? (
                  <img
                    src={posts[0].images[0]}
                    alt={posts[0].title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-orange-500 text-black font-black text-xs px-3 py-1.5 border border-black">LATEST</span>
                  <span className="text-gray-300 font-bold text-sm">{formatRelativeDate(posts[0].created_at)}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight group-hover:text-orange-300 transition-colors max-w-3xl mb-4">
                  {posts[0].title}
                </h2>
                <div className="flex items-center gap-5 text-gray-400 text-sm font-bold">
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{posts[0].view_count ?? 0}</span>
                  <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" />{posts[0].like_count ?? 0}</span>
                </div>
              </div>
              <div className="absolute top-4 right-5 text-white/10 font-black text-[80px] md:text-[120px] leading-none select-none pointer-events-none">
                01
              </div>
            </Link>

            {/* 나머지 그리드 */}
            {posts.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.slice(1).map((post, i) => (
                  <Link
                    key={post.id}
                    to={`/stories/${post.id}`}
                    state={{ backTo: `/clubs/${slug}/stories`, backLabel: '동아리 스토리' }}
                    className="bg-white border border-black group hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-1 transition-all flex flex-col"
                  >
                    <div className="relative h-52 border-b border-black overflow-hidden bg-gray-100">
                      {post.images[0] ? (
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <span className="text-5xl font-black text-gray-400">{post.title[0]}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs">
                        {String(i + 2).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-2">
                      <p className="text-xs font-bold text-gray-400">{formatRelativeDate(post.created_at)}</p>
                      <h3 className="font-black text-base leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors flex-1">
                        {post.title}
                      </h3>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-400">
                      <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{post.view_count ?? 0}</span>
                      <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />{post.like_count ?? 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 무한스크롤 센티넬 */}
        <div ref={sentinelRef} className="mt-12 flex justify-center min-h-[1px]">
          {!fetchError && loading && posts.length > 0 && (
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
          )}
          {!fetchError && !loading && !hasMore && posts.length > 0 && (
            <p className="text-gray-400 font-bold text-sm">모든 스토리를 불러왔습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
