import React, { useState, useMemo } from 'react';
import { Search, Heart, CheckCircle, ChevronRight, Bell, RefreshCcw, Filter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLUBS_DATA } from '../../data/mockData';
import { FadeInText } from '../../components/ui/FadeInText';

const CATEGORIES = ['전체', 'IT/개발', '마케팅/기획', '창업', '문화/예술'];

const ClubCard = ({ club }: any) => (
  <Link to={`/clubs/${club.id}`} className="w-full border border-black bg-white group cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
    {/* 1. 상단 - 썸네일 */}
    <div className="h-40 border-b border-black relative overflow-hidden bg-gray-200">
      <img src={club.img} alt={club.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
      
      {/* 오버레이: 모집 상태 */}
      <div className="absolute top-3 left-3 bg-black text-white px-3 py-1.5 text-xs font-bold border border-white flex flex-row items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${club.isRecruiting ? 'bg-green-400' : 'bg-gray-400'}`}></span>
        {club.isRecruiting ? `모집중 (D-${club.dDay})` : '모집마감'}
      </div>
      
      {/* 오버레이: 스크랩 버튼 */}
      <button className="absolute top-3 right-3 w-8 h-8 bg-white border border-black flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors z-10" onClick={(e) => e.preventDefault()}>
        <Heart className="w-4 h-4" />
      </button>
    </div>

    {/* 2. 중단 - 헤더 정보 */}
    <div className="p-5 flex-1 bg-white relative z-10">
      <div className="flex gap-2 mb-3 flex-wrap">
        {club.tags.map((tag: string) => (
          <span key={tag} className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1">{tag}</span>
        ))}
      </div>
      <h3 className="text-xl font-black flex items-center gap-2 mb-1 group-hover:text-orange-600 transition-colors">
        {club.name}
        {club.badge && (
          <div className="bg-orange-500 w-4 h-4 flex items-center justify-center border border-black" title="안전 검증 완료">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </h3>
      <p className="text-sm font-bold text-gray-600 mb-4">{club.category}</p>
    </div>

    {/* 3. 하단 - 증빙 데이터 격자 */}
    <div className="grid grid-cols-3 border-t border-black bg-white relative z-10">
      <div className="p-3 border-r border-black flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold text-gray-500 mb-1">누적 수주</span>
        <span className="font-black text-sm">{club.stats.project}건</span>
      </div>
      <div className="p-3 border-r border-black flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold text-gray-500 mb-1">예산 공개</span>
        <span className="font-black text-sm text-orange-600">{club.stats.budget}%</span>
      </div>
      <div className="p-3 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold text-gray-500 mb-1">경쟁률</span>
        <span className="font-black text-sm">{club.stats.comp}</span>
      </div>
    </div>
  </Link>
);

const EmptyState = ({ onReset }: any) => (
  <div className="p-10 md:p-20 flex items-center justify-center w-full">
    <div className="border-2 border-dashed border-black bg-white p-10 max-w-lg w-full text-center flex flex-col items-center">
      <div className="w-16 h-16 border border-black bg-gray-100 flex items-center justify-center mb-6">
        <Filter className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-black mb-2">조건에 맞는 동아리가 없습니다</h3>
      <p className="text-gray-600 font-medium mb-8">
        선택하신 필터 조건에 부합하는 오렌지 뱃지 동아리가 현재 없습니다. 필터를 초기화하거나 알림을 설정해 보세요.
      </p>
      <div className="flex flex-col w-full gap-3">
        <button
          onClick={onReset}
          className="w-full bg-black text-white font-bold py-3 border border-black hover:bg-orange-500 hover:text-black transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> 검색 초기화하기
        </button>
        <button className="w-full bg-white text-black font-bold py-3 border border-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Bell className="w-4 h-4" /> 원하는 동아리 알림 받기
        </button>
      </div>
    </div>
  </div>
);

export default function Clubs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [onlyRecruiting, setOnlyRecruiting] = useState(false);

  const resetFilters = () => {
    setSearchQuery('');
    setOnlyRecruiting(false);
    setActiveCategory('전체');
  };

  const filteredClubs = useMemo(() => {
    return CLUBS_DATA.filter(club => {
      if (searchQuery && !club.name.includes(searchQuery) && !club.tags.some((t: string) => t.includes(searchQuery))) return false;
      if (onlyRecruiting && !club.isRecruiting) return false;
      if (activeCategory !== '전체' && club.category !== activeCategory) return false;
      return true;
    });
  }, [searchQuery, onlyRecruiting, activeCategory]);

  return (
    <div className="bg-gray-100 min-h-screen py-10 md:py-16 border-b border-black">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main Boxed Layout (Like B2B Project Exploration) */}
        <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col mb-10">
          
          {/* Header & Search */}
          <div className="border-b border-black p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50 text-black">
            <div>
              <FadeInText as="h2" className="text-3xl font-black tracking-tight flex items-center gap-3">
                <span className="w-4 h-4 bg-orange-500 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] block"></span>
                동아리 전체보기
              </FadeInText>
              <p className="text-gray-500 font-bold mt-2">안전하고 능력 있는 동아리를 탐색해보세요.</p>
            </div>
            <div className="flex w-full md:w-96 border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <input
                type="text"
                placeholder="키워드 검색 (예: 마케팅, IT)"
                className="flex-1 p-3 outline-none font-bold text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="bg-black text-white px-4 hover:bg-orange-500 hover:text-black transition-colors border-l border-black">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="border-b border-black flex flex-wrap bg-white z-10 relative">
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
                <CheckCircle className="w-5 h-5" />
                모집중인 동아리만 보기
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 md:p-10 bg-gray-50 min-h-[500px]">
            {filteredClubs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredClubs.map(club => <ClubCard key={club.id} club={club} />)}
              </div>
            ) : (
              <EmptyState onReset={resetFilters} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
