import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Loader, AlertCircle, Clock, X, FileText,
  Star, MessageSquare, Plus, Eye, MapPin, Users, CalendarDays, Bell, ImageIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';
import { useAuth } from '../../contexts/AuthContext';
import { useClubAlert } from '../../hooks/useClubAlert';
import { RecruitPageSettings, mergeRecruitPage, type RecruitmentRow } from '../../types/recruitment';

const MONO = '#000000';

interface Club {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  one_line_desc: string | null;
  is_certified: boolean;
  recruit_page: unknown;
}

type Recruitment = Pick<RecruitmentRow,
  'id' | 'title' | 'category' | 'description' | 'short_desc' | 'generation'
  | 'status' | 'deadline' | 'targets' | 'location' | 'regular_meeting'
  | 'hashtags' | 'pipeline_stages'>;

interface Post {
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

const ACTIVE_STATUSES = ['진행중'];
const dDay = (deadline: string | null): number | null =>
  deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000) : null;

export default function ClubRecruit() {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const [club, setClub] = useState<Club | null>(null);
  const [settings, setSettings] = useState<RecruitPageSettings | null>(null);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jdModal, setJdModal] = useState<Recruitment | null>(null);
  const [toast, setToast] = useState('');

  const alert = useClubAlert(club?.id);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: clubData, error: clubErr } = await supabase
        .from('clubs')
        .select('id, name, slug, type, logo_url, one_line_desc, is_certified, recruit_page')
        .eq('slug', slug)
        .single();
      if (clubErr || !clubData) { setError('동아리를 찾을 수 없습니다.'); setLoading(false); return; }
      const c = clubData as Club;
      setClub(c);
      setSettings(mergeRecruitPage(c.recruit_page));

      const recruitsQuery = supabase
        .from('recruitments')
        .select('id, title, category, description, short_desc, generation, status, deadline, targets, location, regular_meeting, hashtags, pipeline_stages')
        .eq('club_id', c.id)
        .order('deadline', { ascending: true });
      // 미리보기: 모든 상태 / 공개: 진행중 + 마감 모두(히스토리 표기). RLS가 운영진 임시저장 보호.

      const [recruitRes, postRes, reviewRes] = await Promise.all([
        recruitsQuery,
        supabase
          .from('posts')
          .select('id, title, content, images, created_at')
          .eq('club_id', c.id).eq('is_published', true)
          .order('created_at', { ascending: false }).limit(30),
        supabase
          .from('club_reviews')
          .select('id, rating, title, body, generation, result, created_at, user_id, profiles(name)')
          .eq('club_id', c.id).eq('is_published', true)
          .order('created_at', { ascending: false }).limit(30),
      ]);

      let recs = (recruitRes.data as Recruitment[]) ?? [];
      if (!isPreview) recs = recs.filter(r => r.status !== '임시저장');
      setRecruitments(recs);
      setPosts((postRes.data as Post[]) ?? []);
      setReviews((reviewRes.data as unknown as Review[]) ?? []);
      setLoading(false);
    })();
  }, [slug, isPreview]);

  const { active, closed } = useMemo(() => {
    const isActive = (r: Recruitment) => {
      const d = dDay(r.deadline);
      const expired = d !== null && d < 0;
      return ACTIVE_STATUSES.includes(r.status ?? '') && !expired;
    };
    const active = recruitments.filter(isActive).sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'));
    const closed = recruitments.filter(r => !isActive(r)).sort((a, b) => (b.deadline ?? '').localeCompare(a.deadline ?? ''));
    return { active, closed };
  }, [recruitments]);

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const tagline = (settings?.tagline?.trim()) || club?.one_line_desc || '';

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };
  const handleAlert = async () => {
    const r = await alert.toggle();
    if (r === 'login_required') { showToast('로그인이 필요합니다.'); return; }
    showToast(alert.active ? '관심 등록을 해제했습니다.' : '관심 등록 완료! 새 모집 시 알려드릴게요.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Loader className="w-8 h-8 animate-spin text-gray-900" /></div>;
  }
  if (error || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-900 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">{error ?? '페이지를 찾을 수 없습니다.'}</h2>
          <Link to="/clubs" className="font-bold underline">← 동아리 목록으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {isPreview && (
        <div className="bg-gray-900 text-white py-2.5 px-6 flex items-center justify-center gap-3 font-black text-sm">
          <Eye className="w-4 h-4" /> 미리보기 — 임시저장 공고 포함(운영진 전용)
        </div>
      )}

      <div className="max-w-3xl mx-auto px-5 py-6 flex flex-col gap-8">
        {/* 상단 바 */}
        <div className="flex items-center justify-between">
          <Link to={`/clubs/${slug}`} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" /> {club.name} 소개
          </Link>
          <span className="text-xs font-bold text-gray-300">Powered by OurClub</span>
        </div>

        {/* 프로필 헤더 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-5">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.name} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-gray-900 shrink-0" />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-3xl shrink-0">
                {club.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black truncate">{club.name}</h1>
                {club.is_certified && <span className="text-[11px] font-black border border-gray-900 px-1.5 py-0.5">✓ 인증</span>}
              </div>
              <p className="text-sm text-gray-500 font-bold">{club.type}</p>
              <div className="flex items-center gap-4 mt-2 text-sm font-bold">
                <span>{active.length > 0 ? <><b>{active.length}</b> 모집중</> : <span className="text-gray-400">모집 준비중</span>}</span>
                <span><b>{posts.length}</b> 게시물</span>
                {reviews.length > 0 && <span><b>{reviews.length}</b> 후기 · ★ {avg.toFixed(1)}</span>}
              </div>
            </div>
          </div>

          {tagline && <p className="text-[15px] font-bold leading-relaxed whitespace-pre-wrap">{tagline}</p>}

          <button
            onClick={handleAlert}
            disabled={alert.loading}
            className={`w-full md:w-auto md:self-start px-6 py-2.5 border-2 border-gray-900 font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              alert.active ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
          >
            <Bell className="w-4 h-4" /> {alert.active ? '관심 등록됨' : '관심 등록'}
          </button>
        </div>

        {/* 모집 공고 (지원 배너) */}
        <section className="flex flex-col gap-3">
          {active.length === 0 && closed.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 p-10 text-center">
              <Clock className="w-9 h-9 text-gray-300 mx-auto mb-3" />
              <p className="font-black text-gray-400">현재 모집 준비중입니다.</p>
              <p className="text-xs font-bold text-gray-400 mt-1">관심 등록하면 새 모집 시 알려드릴게요.</p>
            </div>
          ) : (
            <>
              {active.map(r => <ApplyBanner key={r.id} r={r} onOpen={() => setJdModal(r)} />)}
              {closed.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">지난 모집</p>
                  {closed.map(r => <ApplyBanner key={r.id} r={r} onOpen={() => setJdModal(r)} closed />)}
                </div>
              )}
            </>
          )}
        </section>

        {/* 게시물 그리드 */}
        <section className="flex flex-col gap-3">
          <SectionLabel text="게시물" />
          {posts.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 p-10 text-center">
              <ImageIcon className="w-9 h-9 text-gray-300 mx-auto mb-3" />
              <p className="font-black text-gray-400">아직 게시물이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {posts.map(p => <PostTile key={p.id} post={p} />)}
            </div>
          )}
        </section>

        {/* 후기 */}
        <ReviewsSection
          reviews={reviews}
          clubId={club.id}
          onRefresh={() => {
            supabase.from('club_reviews').select('id, rating, title, body, generation, result, created_at, user_id, profiles(name)')
              .eq('club_id', club.id).eq('is_published', true)
              .order('created_at', { ascending: false }).limit(30)
              .then(({ data }) => setReviews((data as unknown as Review[]) ?? []));
          }}
        />
      </div>

      {jdModal && (
        <JDModal
          recruitment={jdModal}
          closed={!active.some(a => a.id === jdModal.id)}
          onClose={() => setJdModal(null)}
          onApply={() => { setJdModal(null); navigate(`/clubs/${slug}/apply?rid=${jdModal.id}`); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 font-bold text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── 지원 배너 ───────────────────────────────────────────────────────────────
function ApplyBanner({ r, onOpen, closed }: { r: Recruitment; onOpen: () => void; closed?: boolean }) {
  const d = dDay(r.deadline);
  const urgent = !closed && d !== null && d >= 0 && d <= 7;
  return (
    <button
      onClick={onOpen}
      className={`w-full text-left border-2 border-gray-900 p-5 flex items-center gap-4 transition-all ${
        closed ? 'opacity-50 bg-gray-50' : 'bg-white hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {r.category && <span className="text-[11px] font-black border border-gray-900 px-1.5 py-0.5">{r.category}</span>}
          {r.generation && <span className="text-[11px] font-bold text-gray-400">{r.generation}</span>}
          {closed ? (
            <span className="text-[11px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5">마감</span>
          ) : urgent ? (
            <span className="text-[11px] font-black bg-gray-900 text-white px-1.5 py-0.5">D-{d}</span>
          ) : null}
        </div>
        <h3 className="font-black text-lg truncate">{r.title}</h3>
        {r.short_desc && <p className="text-sm font-bold text-gray-500 truncate">{r.short_desc}</p>}
        {!closed && r.deadline && (
          <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {d === 0 ? '오늘 마감' : d != null && d > 0 ? `${formatDate(r.deadline, 'monthDay')} 마감` : ''}
          </p>
        )}
      </div>
      <span className={`shrink-0 px-4 py-2.5 border-2 border-gray-900 font-black text-sm flex items-center gap-1 ${closed ? 'text-gray-400' : 'bg-gray-900 text-white'}`}>
        {closed ? '열람' : '지원'} <ChevronRight className="w-4 h-4" />
      </span>
    </button>
  );
}

// ── 게시물 타일 ─────────────────────────────────────────────────────────────
function PostTile({ post }: { post: Post }) {
  const img = post.images?.[0];
  const excerpt = (post.content ?? '').replace(/[#*>`\-!\[\]()]/g, ' ').trim();
  return (
    <Link to={`/stories/${post.id}`} className="relative aspect-square border border-gray-200 overflow-hidden group bg-gray-50">
      {img ? (
        <img src={img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
      ) : (
        <div className="w-full h-full flex flex-col p-3 bg-gray-100">
          <span className="font-black text-xs line-clamp-2 mb-1">{post.title}</span>
          <span className="text-[10px] font-bold text-gray-400 line-clamp-4">{excerpt}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 text-white font-black text-xs px-2 text-center line-clamp-2">{post.title}</span>
      </div>
    </Link>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <h2 className="text-lg font-black border-b-2 border-gray-900 pb-1.5">{text}</h2>;
}

// ── 후기 ────────────────────────────────────────────────────────────────────
function ReviewsSection({ reviews, clubId, onRefresh }: { reviews: Review[]; clubId: string; onRefresh: () => void }) {
  const [writing, setWriting] = useState(false);
  const [genFilter, setGenFilter] = useState<string>('all');

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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel text="후기" />
        <button onClick={() => setWriting(true)} className="shrink-0 px-3 py-1.5 border-2 border-gray-900 bg-white hover:bg-gray-100 font-bold text-xs flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 후기 작성
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="border-2 border-gray-900 p-5 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black">{avg.toFixed(1)}</span>
                <span className="text-sm font-bold text-gray-400">/ 5.0</span>
              </div>
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4" style={{ color: i < Math.round(avg) ? MONO : '#e5e7eb', fill: i < Math.round(avg) ? MONO : '#e5e7eb' }} />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-400 mt-1">총 {filtered.length}개</span>
            </div>
            <div className="flex flex-col items-center border-l border-gray-200 pl-6">
              <span className="text-3xl font-black">{recommend}%</span>
              <span className="text-xs font-black text-gray-600">추천율</span>
              <span className="text-[10px] font-bold text-gray-400">4★ 이상</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {dist.map(d => (
              <div key={d.star} className="flex items-center gap-2 text-xs font-bold">
                <span className="w-7 text-gray-500">{d.star}★</span>
                <div className="flex-1 h-2.5 bg-gray-100 border border-gray-200 overflow-hidden">
                  <div className="h-full bg-gray-900" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-gray-500">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gens.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-gray-400">활동기수:</span>
          {(['all', ...gens]).map(g => (
            <button
              key={g}
              onClick={() => setGenFilter(g)}
              className={`px-2.5 py-1 border-2 border-gray-900 font-black text-xs ${genFilter === g ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
            >
              {g === 'all' ? '전체' : g}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 p-8 text-center">
          <MessageSquare className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="font-bold text-gray-400 text-sm">{genFilter === 'all' ? '아직 후기가 없습니다.' : '해당 기수의 후기가 없습니다.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      {writing && <ReviewWriter clubId={clubId} onClose={() => setWriting(false)} onSuccess={() => { setWriting(false); onRefresh(); }} />}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-2 border-gray-900 p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-4 h-4" style={{ color: i < review.rating ? MONO : '#e5e7eb', fill: i < review.rating ? MONO : '#e5e7eb' }} />
        ))}
        <span className="font-black text-sm ml-1">{review.rating}.0</span>
        {review.generation && <span className="ml-1 text-xs font-bold text-gray-500">{review.generation}</span>}
        {review.result && (
          <span className="text-xs font-bold px-2 py-0.5 border border-gray-300 text-gray-600">{review.result}</span>
        )}
      </div>
      <h4 className="font-black text-base mb-1.5">{review.title}</h4>
      <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap line-clamp-4">{review.body}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500 font-bold">{anonymize(review.profiles?.name)}</span>
        <span className="text-xs text-gray-400 font-bold">{formatDate(review.created_at, 'monthDay')}</span>
      </div>
    </div>
  );
}

function anonymize(name: string | null | undefined): string {
  if (!name || !name.trim()) return '익명';
  const t = name.trim();
  if (t.length === 1) return `${t}*`;
  return t[0] + '*'.repeat(Math.min(t.length - 1, 2));
}

function ReviewWriter({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
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
    if (!user) { setError('로그인이 필요합니다.'); return; }
    if (!title.trim() || !body.trim()) { setError('제목과 본문을 입력해주세요.'); return; }
    setSubmitting(true);
    const { error: insErr } = await supabase.from('club_reviews').insert({
      club_id: clubId, user_id: user.id, rating,
      title: title.trim(), body: body.trim(),
      generation: generation.trim() || null, result: result || null,
    });
    setSubmitting(false);
    if (insErr) {
      setError(
        insErr.code === '23505' ? '이미 같은 기수로 작성한 후기가 있습니다.'
        : /row-level security|permission/i.test(insErr.message) ? '후기는 해당 동아리의 부원 또는 지원 이력이 있는 분만 작성할 수 있습니다.'
        : insErr.message
      );
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white border-2 border-gray-900 w-full max-w-lg shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b-2 border-gray-900 bg-gray-50 flex items-center justify-between">
          <h3 className="text-xl font-black">후기 작성</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="font-black text-xs block mb-2 text-gray-700">평점 *</label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRating(i + 1)} className="hover:scale-110 transition-transform">
                  <Star className="w-8 h-8" style={{ color: i < rating ? MONO : '#e5e7eb', fill: i < rating ? MONO : '#e5e7eb' }} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-black text-xs block mb-1.5 text-gray-700">제목 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="후기 한 줄 요약" className="w-full p-2.5 border border-gray-900 font-bold outline-none focus:border-gray-500 text-sm" />
          </div>
          <div>
            <label className="font-black text-xs block mb-1.5 text-gray-700">본문 *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="활동 경험, 분위기, 추천 포인트 등을 자유롭게 적어주세요." className="w-full p-2.5 border border-gray-900 font-medium text-sm outline-none focus:border-gray-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black text-xs block mb-1.5 text-gray-700">활동 기수</label>
              <input value={generation} onChange={e => setGeneration(e.target.value)} placeholder="예) 24기" className="w-full p-2.5 border border-gray-900 font-bold outline-none focus:border-gray-500 text-sm" />
            </div>
            <div>
              <label className="font-black text-xs block mb-1.5 text-gray-700">결과</label>
              <select value={result} onChange={e => setResult(e.target.value)} className="w-full p-2.5 border border-gray-900 font-bold outline-none focus:border-gray-500 text-sm bg-white">
                <option value="">선택 안 함</option>
                <option value="합격">합격</option>
                <option value="불합격">불합격</option>
                <option value="지원포기">지원포기</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}
        </div>
        <div className="p-5 border-t-2 border-gray-900 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 border border-gray-900 font-bold text-sm hover:bg-gray-100">취소</button>
          <button onClick={submit} disabled={submitting} className="px-5 py-2 bg-gray-900 text-white font-black text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader className="w-4 h-4 animate-spin" />} 등록
          </button>
        </div>
      </div>
    </div>
  );
}

// ── JD Modal ─────────────────────────────────────────────────────────────────
function JDModal({ recruitment: r, closed, onClose, onApply }: { recruitment: Recruitment; closed: boolean; onClose: () => void; onApply: () => void }) {
  const d = dDay(r.deadline);
  const stages = Array.isArray(r.pipeline_stages) && r.pipeline_stages.length > 0 ? r.pipeline_stages : ['서류접수', '면접', '최종합격'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-white border-2 border-gray-900 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
        <div className="px-8 py-5 border-b-2 border-gray-900 bg-gray-50 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {r.category && <span className="text-[11px] font-black border border-gray-900 px-1.5 py-0.5">{r.category}</span>}
              {r.generation && <span className="text-[11px] font-bold text-gray-500">{r.generation}</span>}
              {closed && <span className="text-[11px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5">마감</span>}
            </div>
            <h2 className="text-2xl font-black leading-tight">{r.title}</h2>
            {r.deadline && !closed && (
              <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {d === 0 ? '오늘 마감' : d != null && d > 0 ? `D-${d} · ${formatDate(r.deadline, 'monthDay')}` : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded shrink-0 mt-0.5"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">
          <div className="flex-1 px-8 py-6 lg:border-r-2 lg:border-gray-900 min-w-0">
            {r.description ? <MarkdownViewer content={r.description} /> : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-400 font-bold text-sm">상세 모집 요강이 등록되지 않았습니다.</p>
              </div>
            )}
          </div>

          <aside className="lg:w-80 shrink-0 bg-gray-50 px-6 py-6 flex flex-col gap-6 border-t-2 border-gray-900 lg:border-t-0">
            {(r.targets || r.location || r.regular_meeting || r.deadline || r.generation) && (
              <div>
                <h4 className="font-black text-sm mb-3">모집 정보</h4>
                <dl className="flex flex-col gap-2.5 text-sm">
                  {r.generation && <InfoRow icon={Users} label="기수" value={r.generation} />}
                  {r.targets && <InfoRow icon={Users} label="모집 대상" value={r.targets} />}
                  {r.location && <InfoRow icon={MapPin} label="주요 활동지" value={r.location} />}
                  {r.regular_meeting && <InfoRow icon={CalendarDays} label="정기 활동일" value={r.regular_meeting} />}
                  {r.deadline && <InfoRow icon={Clock} label="마감" value={closed ? '마감됨' : (d === 0 ? '오늘 마감' : d != null && d > 0 ? `D-${d} · ${formatDate(r.deadline, 'monthDay')}` : '마감됨')} />}
                </dl>
              </div>
            )}

            <div>
              <h4 className="font-black text-sm mb-3">선발 프로세스</h4>
              <ol className="flex flex-col">
                {stages.map((s, i, arr) => (
                  <li key={`${s}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                      {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-gray-300 my-0.5 min-h-[14px]" />}
                    </div>
                    <span className="font-bold text-sm pt-0.5 pb-3">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">내부 평가 기준은 공개되지 않으며, 결과는 개별 연락드립니다.</p>
            </div>

            <button
              onClick={onApply}
              disabled={closed}
              className="mt-auto w-full py-3.5 bg-gray-900 text-white font-black flex items-center justify-center gap-2 text-sm border-2 border-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-900"
            >
              {closed ? '마감된 공고입니다' : <>지원폼 작성하기 <ChevronRight className="w-4 h-4" /></>}
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
