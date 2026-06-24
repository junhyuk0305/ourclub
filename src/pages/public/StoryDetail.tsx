import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, Share2, Eye, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';

interface Post {
  id: string;
  title: string;
  content: string | null;
  author: string | null;
  images: string[];
  view_count: number;
  like_count: number;
  created_at: string;
  clubs: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    type: string;
    is_certified?: boolean;
  } | null;
}

function ImageGallery({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const [errored, setErrored] = useState<Set<number>>(new Set());

  const valid = images.filter((_, i) => !errored.has(i));
  if (valid.length === 0) return null;

  const safeIdx = Math.min(idx, valid.length - 1);

  return (
    <div className="mb-10">
      <div className="relative w-full border border-sand-200 rounded-card overflow-hidden bg-sand-100">
        <img
          src={valid[safeIdx]}
          alt={`이미지 ${safeIdx + 1}`}
          onError={() => setErrored(prev => new Set(prev).add(images.indexOf(valid[safeIdx])))}
          className="w-full max-h-[520px] object-contain"
        />
        {valid.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + valid.length) % valid.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % valid.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {valid.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full border border-white transition-colors ${i === safeIdx ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1">
              {safeIdx + 1} / {valid.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();
  // 진입 출처(예: 동아리 스토리)가 있으면 그쪽으로, 없으면 전역 피드로 돌아간다.
  const backState = location.state as { backTo?: string; backLabel?: string } | null;
  const backTo = backState?.backTo ?? '/stories';
  const backLabel = backState?.backLabel ?? '스토리 목록';

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, author, images, view_count, like_count, created_at, clubs(id, slug, name, logo_url, type, is_certified)')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const raw = data as unknown as Post;
      // Supabase 조인은 배열로 반환 — 단일 객체로 정규화
      const p: Post = {
        ...raw,
        clubs: Array.isArray(raw.clubs) ? raw.clubs[0] ?? null : raw.clubs,
      };
      setPost(p);
      setLikeCount(p.like_count ?? 0);
      setLoading(false);

      // 조회수 증가 (오류 무시)
      supabase.from('posts').update({ view_count: (p.view_count ?? 0) + 1 }).eq('id', id).then(() => {});

      // 좋아요 여부 확인
      if (user) {
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setLiked(!!likeData);
      }
    })();
  }, [id, user?.id]);

  const handleLike = async () => {
    if (!user) {
      setToast('로그인 후 좋아요를 누를 수 있습니다.');
      setTimeout(() => setToast(''), 2500);
      return;
    }
    if (likeLoading || !post) return;
    setLikeLoading(true);

    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
    setLikeLoading(false);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post?.title ?? '', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {}
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50 px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-brand mx-auto mb-4" strokeWidth={2.5} />
          <h2 className="text-2xl font-black text-ink mb-3">스토리를 찾을 수 없습니다.</h2>
          <p className="text-sand-500 font-medium mb-6">삭제되었거나 비공개 처리된 게시글입니다.</p>
          <Link to={backTo} className="font-black text-brand hover:underline">← {backLabel}으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* 헤더 바 */}
      <div className="border-b border-sand-200 bg-white sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 font-bold text-sm text-sand-600 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> {backLabel}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sand-400 text-xs font-bold mr-2">
              <Eye className="w-4 h-4" strokeWidth={2.5} />
              {(post.view_count ?? 0).toLocaleString()}
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 border border-sand-300 rounded-ctl text-xs font-bold text-sand-600 hover:bg-sand-50 transition-colors"
            >
              <Share2 className="w-4 h-4" strokeWidth={2.5} />
              {shared ? '복사됨!' : '공유'}
            </button>
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-ctl text-xs font-bold transition-colors ${
                liked ? 'bg-brand border-brand text-white' : 'border-sand-300 text-sand-600 hover:bg-sand-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} strokeWidth={2.5} />
              {likeCount}
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">

        {/* 클럽 프로필 */}
        {post.clubs && (
          <Link
            to={`/clubs/${post.clubs.slug}`}
            className="inline-flex items-center gap-3 mb-8 group"
          >
            {post.clubs.logo_url ? (
              <img
                src={post.clubs.logo_url}
                alt={post.clubs.name}
                className="w-10 h-10 rounded-full object-cover border border-sand-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full thumb-grad flex items-center justify-center font-black text-white shrink-0">
                {post.clubs.name[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-ink group-hover:text-brand transition-colors">{post.clubs.name}</span>
                {post.clubs.is_certified && (
                  <CheckCircle className="w-4 h-4 text-brand-accent" strokeWidth={2.5} />
                )}
              </div>
              <span className="text-xs font-bold text-sand-400">{post.clubs.type}</span>
            </div>
          </Link>
        )}

        {/* 제목 */}
        <h1 className="text-3xl md:text-4xl font-black text-ink leading-tight mb-4 tracking-tight">
          {post.title}
        </h1>

        {/* 메타 */}
        <div className="flex items-center gap-4 text-sm font-bold text-sand-400 mb-10 pb-6 border-b border-sand-200">
          {post.author && <span>{post.author}</span>}
          <span>{formatDate(post.created_at, 'medium')}</span>
        </div>

        {/* 이미지 갤러리 */}
        {Array.isArray(post.images) && post.images.length > 0 && (
          <ImageGallery images={post.images} />
        )}

        {/* 마크다운 본문 */}
        {post.content ? (
          <div className="prose-like">
            <MarkdownViewer content={post.content} />
          </div>
        ) : (
          <div className="bg-sand-50 border border-dashed border-sand-300 rounded-card p-12 text-center text-sand-400 font-bold">
            본문 내용이 없습니다.
          </div>
        )}

        {/* 하단 좋아요 */}
        <div className="mt-16 pt-8 border-t border-sand-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-3 px-8 py-4 rounded-ctl font-black text-lg transition-all hover:-translate-y-0.5 ${
              liked ? 'bg-brand text-white shadow-btn' : 'bg-white border border-sand-300 text-sand-600 shadow-soft hover:shadow-soft-lg'
            }`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} strokeWidth={2.5} />
            {liked ? '좋아요 취소' : '좋아요'} · {likeCount}
          </button>

          {post.clubs && (
            <Link
              to={`/clubs/${post.clubs.slug}/recruit`}
              className="inline-flex items-center gap-2 px-8 py-4 btn-grad text-white rounded-ctl font-black transition-all shadow-btn hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              이 동아리 지원하기 →
            </Link>
          )}
        </div>
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-ink text-white px-6 py-3 rounded-ctl font-bold text-sm shadow-soft-lg animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
}
