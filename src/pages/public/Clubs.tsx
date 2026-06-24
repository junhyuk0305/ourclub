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
      className="w-full border border-black bg-white group cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden"
    >
      {/* 썸네일 */}
      <div className="h-40 border-b border-black relative overflow-hidden bg-gray-100">
        {club.img ? (
          <img
            src={club.img}
            alt={club.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-4xl font-black text-gray-400">{club.name[0]}</span>
          </div>
        )}

        {/* 모집 상태 뱃지 */}
        <div className="absolute top-3 left-3 bg-black text-white px-3 py-1.5 text-xs font-bold border border-white flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${club.isRecruiting ? 'bg-green-400' : 'bg-gray-400'}`} />
          {club.isRecruiting
            ? club.dDay !== null ? `모집중 (D-${club.dDay})` : '모집중'
            : '모집마감'}
        </div>

        {/* 알림/스크랩 버튼 */}
        <button
          className={`absolute top-3 right-3 w-8 h-8 border border-black flex items-center justify-center transition-colors z-10 ${
            active ? 'bg-orange-500 text-white' : 'bg-white hover:bg-orange-500 hover:text-white'
          }`}
          onClick={handleAlert}
          disabled={alertLoading}
          title={active ? '관심 해제 (스크랩·알림)' : '관심 등록 (스크랩·알림)'}
        >
          <Heart className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 클럽 정보 */}
      <div className="p-5 flex-1 bg-white">
        <p className="text-xs font-bold text-orange-500 mb-1">{club.category}</p>
        <h3 className="text-xl font-black flex items-center gap-2 mb-2 group-hover:text-orange-600 transition-colors leading-tight">
          {club.name}
          {club.badge && (
            <div className="bg-orange-500 w-4 h-4 flex items-center justify-center border border-black shrink-0" title="인증 동아리">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </h3>
        {club.oneLineDesc && (
          <p className="text-sm font-medium text-gray-500 line-clamp-2">{club.oneLineDesc}</p>
        )}
      </div>

      {/* 인증 여부 푸터 */}
      <div className="px-5 py-3 border-t border-black bg-gray-50 flex items-center gap-2">
        {club.badge ? (
          <>
            <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-xs font-bold text-orange-600">OURCLUB 인증 완료</span>
          </>
        ) : (
          <span className="text-xs font-bold text-gray-400">미인증 동아리</span>
        )}
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="w-full border border-black bg-white flex flex-col animate-pulse">
    <div className="h-40 bg-gray-200 border-b border-black" />
    <div className="p-5 flex-1">
      <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-full" />
    </div>
    <div className="h-10 bg-gray-100 border-t border-black" />
  </div>
);

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="p-10 md:p-20 flex items-center justify-center w-full">
    <div className="border-2 border-dashed border-black bg-white p-10 max-w-lg w-full text-center flex flex-col items-center">
      <div className="w-16 h-16 border border-black bg-gray-100 flex items-center justify-center mb-6">
        <Filter className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-black mb-2">조건에 맞는 동아리가 없습니다</h3>
      <p className="text-gray-600 font-medium mb-8">선택하신 필터 조건에 부합하는 동아리가 현재 없습니다.</p>
      <div className="flex flex-col w-full gap-3">
        <button
          onClick={onReset}
          className="w-full bg-black text-white font-bold py-3 border border-black hover:bg-orange-500 hover:text-black transition-colors flex items-center justify-center gap-2"
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
        setClubs((data as ClubRow[]).map(toDisplay));
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
    return clubs.filter(club => {
      if (q && !club.name.toLowerCase().includes(q) && !club.oneLineDesc?.toLowerCase().includes(q)) return false;
      if (onlyRecruiting && !club.isRecruiting) return false;
      if (activeCategory !== '전체' && club.category !== activeCategory) return false;
      return true;
    });
  }, [clubs, searchQuery, onlyRecruiting, activeCategory]);

  return (
    <div className="bg-gray-100 min-h-screen py-10 md:py-16 border-b border-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col mb-10">

          {/* 헤더 & 검색 */}
          <div className="border-b border-black p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50">
            <div>
              <FadeInText as="h2" className="text-3xl font-black tracking-tight flex items-center gap-3">
                <span className="w-4 h-4 bg-orange-500 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] block" />
                동아리 전체보기
              </FadeInText>
              <p className="text-gray-500 font-bold mt-2">
                안전하고 능력 있는 동아리를 탐색해보세요.
                {!loading && <span className="ml-2 text-orange-500">({clubs.length}개 동아리)</span>}
              </p>
            </div>
            <div className="flex w-full md:w-96 border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <input
                type="text"
                placeholder="키워드 검색 (예: 마케팅, IT)"
                className="flex-1 p-3 outline-none font-bold text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="bg-black text-white px-4 hover:bg-orange-500 hover:text-black transition-colors border-l border-black">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 필터 바 */}
          <div className="border-b border-black flex flex-wrap bg-white relative z-10">
            <div className="flex flex-wrap flex-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-4 font-black border-r border-black hover:bg-gray-100 transition-colors ${
                    activeCategory === cat ? 'bg-black text-white hover:bg-black' : 'text-gray-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex border-t md:border-t-0 border-black w-full md:w-auto">
              <button
                onClick={() => setOnlyRecruiting(!onlyRecruiting)}
                className={`flex-1 md:flex-none px-6 py-4 font-black flex items-center justify-center gap-2 transition-colors ${
                  onlyRecruiting ? 'bg-orange-500 text-black' : 'bg-white hover:bg-gray-100'
                }`}
              >
                <CheckCircle className="w-5 h-5" /> 모집중인 동아리만 보기
              </button>
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className="p-8 md:p-10 bg-gray-50 min-h-[500px]">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle className="w-10 h-10 text-orange-500" />
                <p className="font-bold text-gray-600">{error}</p>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3 font-bold text-sm border border-black shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-400" /> {toast}
        </div>
      )}
    </div>
  );
}
