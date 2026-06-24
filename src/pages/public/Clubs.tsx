import React, { useState, useMemo, useEffect } from 'react';
import { Search, Heart, CheckCircle, Bell, RefreshCcw, Filter, Loader, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useClubAlert } from '../../hooks/useClubAlert';
import { FadeInText } from '../../components/ui/FadeInText';

interface ClubRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  one_line_desc: string | null;
  is_certified: boolean;
  recruitments: { id: string; status: string; deadline: string | null }[];
}

interface ClubDisplay {
  id: string;
  slug: string;
  name: string;
  category: string;
  badge: boolean;
  img: string | null;
  oneLineDesc: string | null;
  isRecruiting: boolean;
  dDay: number | null;
}

function toDisplay(row: ClubRow): ClubDisplay {
  const active = row.recruitments.filter(r => ['진행중'].includes(r.status));
  const nearest = active
    .filter(r => r.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
  const dDay = nearest?.deadline
    ? Math.ceil((new Date(nearest.deadline).getTime() - Date.now()) / 86400000)
    : null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.type ?? '기타',
    badge: row.is_certified ?? false,
    img: row.logo_url,
    oneLineDesc: row.one_line_desc,
    isRecruiting: active.length > 0,
    dDay: dDay !== null && dDay >= 0 ? dDay : null,
  };
}

const CATEGORIES = ['전체', 'IT/개발', '마케팅/기획', '창업', '문화/예술'];
const SORT_OPTIONS = ['최신순', '인기순', '마감임박순'] as const;
type SortKey = (typeof SORT_OPTIONS)[number];

// 마감임박순: 모집중 우선 → 가까운 dDay 순.
function byDeadline(a: ClubDisplay, b: ClubDisplay): number {
  if (a.isRecruiting !== b.isRecruiting) return a.isRecruiting ? -1 : 1;
  const ad = a.dDay ?? Infinity;
  const bd = b.dDay ?? Infinity;
  if (ad !== bd) return ad - bd;
  return a.name.localeCompare(b.name);
}

// 디스커버리 정렬: 지금 지원할 수 있는 곳을 위로 — 모집중 우선 → 마감 임박순 → 인증 → 이름.
// (단순 나열 대신 '살아있는' 탐색 경험을 위해 클라이언트에서 정렬)
function byDiscovery(a: ClubDisplay, b: ClubDisplay): number {
  if (a.isRecruiting !== b.isRecruiting) return a.isRecruiting ? -1 : 1;
  const ad = a.dDay ?? Infinity;
  const bd = b.dDay ?? Infinity;
  if (ad !== bd) return ad - bd;
  if (a.badge !== b.badge) return a.badge ? -1 : 1;
  return a.name.localeCompare(b.name);
}

// 카드마다 useClubAlert hook 호출이 필요해 별도 컴포넌트로 분리
const ClubCard = ({ club, onLoginRequired }: { club: ClubDisplay; onLoginRequired: () => void }) => {
  const { active, toggle, loading: alertLoading } = useClubAlert(club.id);

  const handleAlert = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = await toggle();
    if (result === 'login_required') onLoginRequired();
  };

  return (
    <Link
      to={`/clubs/${club.slug}`}
      className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden group hover:shadow-soft-lg hover:-translate-y-1 transition-all block"
    >
      {/* 썸네일 */}
      <div className="h-36 thumb-grad relative flex items-center justify-center text-3xl font-black text-brand-peach overflow-hidden">
        {club.img ? (
          <img
            src={club.img}
            alt={club.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{club.name[0]}</span>
        )}

        {/* 카테고리 핀 */}
        <div className="absolute top-2.5 left-2.5 bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-md leading-tight">
          {club.category}
        </div>

        {/* 인증 칩 */}
        {club.badge && (
          <div className="absolute top-2.5 right-2.5 bg-brand-accent text-white w-6 h-6 rounded-ctl flex items-center justify-center text-sm font-black shadow-soft" title="인증 동아리">
            <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
          </div>
        )}

        {/* 알림/스크랩 버튼 */}
        <button
          className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-ctl border border-sand-200 shadow-soft flex items-center justify-center transition-colors z-10 ${
            active ? 'bg-brand text-white' : 'bg-white/90 hover:bg-brand hover:text-white'
          }`}
          onClick={handleAlert}
          disabled={alertLoading}
          title={active ? '관심 해제 (스크랩·알림)' : '관심 등록 (스크랩·알림)'}
        >
          <Heart className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 클럽 정보 */}
      <div className="p-4">
        <h3 className="font-black mb-1 flex items-center gap-2 group-hover:text-brand transition-colors leading-tight">
          {club.name}
        </h3>
        {club.oneLineDesc && (
          <p className="text-xs font-medium text-sand-500 mb-3 line-clamp-2">{club.oneLineDesc}</p>
        )}

        {/* 모집 상태 블록 */}
        {club.isRecruiting ? (
          <div className="cta-grad text-brand-dark text-center py-2 text-xs font-bold rounded-ctl">
            🔶 모집중{club.dDay !== null ? ` · D-${club.dDay}` : ''}
          </div>
        ) : (
          <div className="bg-sand-100 text-sand-400 text-center py-2 text-xs font-bold rounded-ctl">
            모집 마감
          </div>
        )}

        {/* 인증 여부 */}
        <div className="flex items-center gap-1.5 mt-3">
          {club.badge ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="text-xs font-bold text-brand">OURCLUB 인증 완료</span>
            </>
          ) : (
            <span className="text-xs font-bold text-sand-400">미인증 동아리</span>
          )}
        </div>
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden flex flex-col animate-pulse">
    <div className="h-36 bg-sand-100" />
    <div className="p-4 flex-1">
      <div className="h-5 bg-sand-100 rounded-ctl w-3/4 mb-2" />
      <div className="h-3 bg-sand-100 rounded-ctl w-full mb-3" />
      <div className="h-8 bg-sand-100 rounded-ctl w-full" />
    </div>
  </div>
);

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="p-10 md:p-20 flex items-center justify-center w-full">
    <div className="border-2 border-dashed border-sand-300 bg-white rounded-card p-10 max-w-lg w-full text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-ctl bg-sand-100 flex items-center justify-center mb-6">
        <Filter className="w-8 h-8 text-sand-400" />
      </div>
      <h3 className="text-xl font-black mb-2">조건에 맞는 동아리가 없습니다</h3>
      <p className="text-sand-600 font-medium mb-8">선택하신 필터 조건에 부합하는 동아리가 현재 없습니다.</p>
      <div className="flex flex-col w-full gap-3">
        <button
          onClick={onReset}
          className="w-full btn-grad text-white shadow-btn rounded-ctl font-bold py-3 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> 검색 초기화
        </button>
      </div>
    </div>
  </div>
);

export default function Clubs() {
  const [clubs, setClubs] = useState<ClubDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [onlyRecruiting, setOnlyRecruiting] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('최신순');
  const [toast, setToast] = useState('');

  const showLoginToast = () => {
    setToast('관심 등록은 로그인 후 이용할 수 있어요.');
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('clubs')
        .select('id, name, slug, type, logo_url, one_line_desc, is_certified, recruitments(id, status, deadline)')
        .order('is_certified', { ascending: false });

      if (err) {
        setError('동아리 목록을 불러오지 못했습니다.');
      } else {
        setClubs((data as ClubRow[]).map(toDisplay).sort(byDiscovery));
      }
      setLoading(false);
    })();
  }, []);

  const resetFilters = () => {
    setSearchQuery('');
    setOnlyRecruiting(false);
    setActiveCategory('전체');
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = clubs.filter(club => {
      if (q && !club.name.toLowerCase().includes(q) && !club.oneLineDesc?.toLowerCase().includes(q)) return false;
      if (onlyRecruiting && !club.isRecruiting) return false;
      if (activeCategory !== '전체' && club.category !== activeCategory) return false;
      return true;
    });
    // 최신순: 생성일 필드가 없어 기본 디스커버리 순서를 '최신순'으로 노출.
    // 인기순: 인기/스크랩/멤버수 필드가 없어 디스커버리 순서로 폴백.
    // TODO: 인기 지표 필드 확정 시 연결
    const comparator =
      sortBy === '마감임박순' ? byDeadline : byDiscovery;
    return list.sort(comparator);
  }, [clubs, searchQuery, onlyRecruiting, activeCategory, sortBy]);

  const recruitingCount = useMemo(() => clubs.filter(c => c.isRecruiting).length, [clubs]);

  return (
    <div className="bg-sand-50 min-h-screen py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white border border-sand-200 rounded-card shadow-soft flex flex-col mb-10 overflow-hidden">

          {/* 헤더 & 검색 */}
          <div className="border-b border-sand-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-sand-50">
            <div>
              <FadeInText as="h2" className="text-3xl font-black tracking-tight flex items-center gap-3">
                <span className="w-4 h-4 bg-brand-accent rounded-md block" />
                동아리·학회 둘러보기
              </FadeInText>
              <p className="text-sand-500 font-bold mt-2">
                관심 분야의 동아리·학회를 찾아 둘러보세요.
                {!loading && (
                  <span className="ml-2 text-brand">
                    전체 {clubs.length}곳 · 지금 모집중 {recruitingCount}곳
                  </span>
                )}
              </p>
            </div>
            <div className="flex w-full md:w-96 border border-sand-300 rounded-ctl bg-white overflow-hidden">
              <input
                type="text"
                placeholder="키워드 검색 (예: 마케팅, IT)"
                className="flex-1 p-3 outline-none font-bold text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="btn-grad text-white px-4 transition-all">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 필터 바 */}
          <div className="border-b border-sand-200 p-4 md:p-5 flex flex-wrap items-center gap-3 bg-white relative z-10">
            <div className="flex flex-wrap gap-2 flex-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2.5 text-sm font-black rounded-ctl transition-colors ${
                    activeCategory === cat
                      ? 'bg-ink text-white'
                      : 'bg-white border border-sand-300 text-sand-500 hover:bg-sand-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setOnlyRecruiting(!onlyRecruiting)}
              className={`px-4 py-2.5 text-sm font-black rounded-ctl flex items-center justify-center gap-2 transition-colors ${
                onlyRecruiting ? 'bg-brand-tint text-brand-dark' : 'bg-white border border-sand-300 hover:bg-sand-50'
              }`}
            >
              <CheckCircle className="w-4 h-4" /> 모집중만 보기
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="field px-3 py-2.5 text-sm font-bold border border-sand-300 rounded-ctl bg-white"
              aria-label="정렬"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* 콘텐츠 */}
          <div className="p-8 md:p-10 bg-sand-50 min-h-[500px]">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle className="w-10 h-10 text-brand" />
                <p className="font-bold text-sand-600">{error}</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(club => (
                  <ClubCard key={club.id} club={club} onLoginRequired={showLoginToast} />
                ))}
              </div>
            ) : (
              <EmptyState onReset={resetFilters} />
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white px-5 py-3 font-bold text-sm rounded-ctl shadow-soft flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-peach" /> {toast}
        </div>
      )}
    </div>
  );
}
