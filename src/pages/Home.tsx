import React, { useState } from 'react';
import { ArrowRight, ChevronRight, CheckCircle, Briefcase, Users, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { marqueeEvents, storyShowcase, homeClubsData } from '../data/mockData';
import { Modal } from '../components/ui/Modal';

const HeroSection = () => (
  <section className="grid grid-cols-1 md:grid-cols-3 border-b border-black">
    {/* Left Main */}
    <div className="md:col-span-2 p-8 md:p-12 lg:p-16 border-r-0 md:border-r border-black flex flex-col justify-between bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div>
        <span className="inline-block px-3 py-1 border border-black bg-white font-bold text-sm mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          B2B 동아리를 위한 관문
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
          <span className="text-orange-500 block">100% 검증된 청정 구역,</span>
          진짜 실무 스펙을 쌓는<br />B2B 동아리 허브
        </h1>
        <p className="text-lg font-medium text-gray-700 mb-12 max-w-xl">
          불확실한 동아리 활동은 그만. 신원 검증과 예산 투명성이 확인된 오렌지 뱃지 클럽에서 진짜 기업의 프로젝트를 수주하세요.
        </p>
      </div>
      <div>
        <Link to="/clubs" className="inline-flex group flex flex-row items-center gap-4 bg-orange-500 border border-black px-8 py-5 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
          🚀 검증된 동아리 합류하기
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </div>

    {/* Right Panel */}
    <div className="grid grid-rows-2">
      <div className="p-8 border-b border-black bg-black text-white flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2 text-orange-500">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold tracking-widest text-sm">엄격한 동아리 검증</span>
        </div>
        <div className="text-5xl font-black text-orange-500 mb-2">124<span className="text-2xl text-white ml-2">팀</span></div>
        <p className="text-gray-300 font-medium">의 동아리가 엄격한 안전 검증을 통과하여 오렌지 뱃지를 획득했습니다.</p>
      </div>
      <div className="p-8 bg-white flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2 text-black">
          <Briefcase className="w-5 h-5" />
          <span className="font-bold tracking-widest text-sm">B2B 프로젝트 매칭</span>
        </div>
        <div className="text-5xl font-black text-black mb-2">45<span className="text-2xl text-gray-500 ml-2">건</span></div>
        <p className="text-gray-600 font-medium">이번 달 동아리들이 기업으로부터 성공적으로 수주한 협업 건수입니다.</p>
      </div>
    </div>
  </section>
);

const Marquee = () => {
  return (
    <div className="flex overflow-hidden bg-orange-500 border-b border-black py-3 select-none">
      <div className="flex flex-shrink-0 animate-marquee whitespace-nowrap items-center">
        {[...marqueeEvents, ...marqueeEvents].map((text, i) => (
          <span key={i} className="mx-4 font-bold text-black text-sm md:text-base flex items-center">
            {text} <span className="mx-4 w-1.5 h-1.5 bg-black rounded-full inline-block"></span>
          </span>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}} />
    </div>
  );
};

const StoryArchive = () => (
  <section className="border-b border-black bg-gray-50 overflow-hidden py-24 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
      <div>
        <div className="text-orange-500 font-bold tracking-widest text-sm mb-3 flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 border border-black inline-block"></span>
          INSIGHT & STORIES
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">검증된 동아리들의<br />생생한 스토리</h2>
        <p className="font-medium text-gray-500 text-lg">오렌지 뱃지를 획득한 동아리들의 생생한 활동기와 인사이트입니다.</p>
      </div>
      <div className="flex gap-2 flex-shrink-0 items-center">
        <Link to="/stories" className="text-sm font-black underline hover:text-orange-500 transition-colors mr-4 hidden md:block">스토리 전체보기</Link>
        <button className="w-12 h-12 border border-black flex items-center justify-center hover:bg-orange-500 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all bg-white">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <button className="w-12 h-12 border border-black flex items-center justify-center hover:bg-orange-500 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all bg-white">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
    
    <div className="flex overflow-x-auto px-6 md:px-12 gap-8 snap-x hide-scrollbar py-4">
      {storyShowcase.map((story) => (
        <Link to={`/stories/${story.id}`} key={story.id} className="min-w-[300px] md:min-w-[400px] border border-black bg-white group cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all snap-center flex flex-col">
          <div className="h-48 border-b border-black overflow-hidden relative">
            <img src={story.img} alt={story.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-bold border border-white">
              {story.tag}
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            <h3 className="text-xl font-bold leading-tight group-hover:text-orange-600 transition-colors">
              {story.title}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

const CurationSection = ({ onOpenAlert }: any) => {
  const [activeFilter, setActiveFilter] = React.useState('전체보기');
  const filters = ['전체보기', '🔶 B2B 프로젝트 수주 TOP', '🔶 회비/예산 투명성 100%', '🔶 평균 경쟁률 3:1 이상'];

  return (
    <section className="bg-white">
      {/* Sticky Filter Bar */}
      <div className="border-b border-black bg-white overflow-x-auto hide-scrollbar z-40 relative">
        <div className="flex justify-between items-center pr-4">
          <div className="flex p-4 gap-3">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-5 py-2.5 font-bold border border-black text-sm transition-colors ${
                  activeFilter === filter
                    ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(249,115,22,1)]'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <Link to="/clubs" className="hidden md:block text-sm font-black underline hover:text-orange-500 whitespace-nowrap">모든 동아리 보기 →</Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-black">
        {homeClubsData.map((club, idx) => (
          <div key={club.id} className={`p-6 flex flex-col justify-between ${idx !== homeClubsData.length -1 ? 'border-b md:border-b-0 md:border-r border-black' : ''} hover:bg-orange-50 transition-colors group cursor-pointer`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-full h-32 border border-black bg-gray-200 overflow-hidden mb-4 relative">
                   <img src={club.img} alt={club.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                   <div className="absolute top-2 right-2 bg-orange-500 w-6 h-6 border border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                     <CheckCircle className="w-4 h-4 text-white" />
                   </div>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-1 bg-gray-100 border border-black">{club.category}</span>
                <span className="text-xs font-bold px-2 py-1 bg-orange-100 text-orange-600 border border-orange-500">{club.factor}</span>
              </div>
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                {club.name}
              </h3>
              <p className="text-sm font-medium text-gray-600 mb-6 line-clamp-2">
                {club.desc}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2 mt-auto">
              {club.status === '모집중' ? (
                <Link to={`/clubs/${club.id}`} className="w-full bg-orange-500 border border-black py-3 font-bold text-black hover:bg-orange-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all text-center">
                  🔶 역량 검증 완료, 지원하기
                </Link>
              ) : (
                <button onClick={onOpenAlert} className="w-full bg-gray-100 border border-black py-3 font-bold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                  <Bell className="w-4 h-4" /> 다음 모집 알림 설정
                </button>
              )}
              <Link to={`/clubs/${club.id}`} className="w-full bg-white border border-black py-2 font-bold text-sm hover:bg-gray-50 transition-colors text-center inline-block">
                📄 투명성 리포트 확인
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Gateway = () => (
  <section className="grid grid-cols-1 md:grid-cols-2">
    <Link to="/clubs" className="block border-r border-b md:border-b-0 border-black p-12 bg-gray-100 group cursor-pointer hover:bg-orange-500 transition-colors duration-300">
      <div className="mb-8">
        <Users className="w-12 h-12 mb-4 text-black group-hover:scale-110 transition-transform" />
        <h2 className="text-3xl font-black mb-2">동아리 큐레이션 보기</h2>
        <p className="font-medium text-gray-700 group-hover:text-black">안전하고 내 커리어에 도움되는 검증된 동아리를 탐색하고 지원하세요.</p>
      </div>
      <div className="flex justify-end">
        <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors bg-white group-hover:bg-black group-hover:border-black">
           <ArrowRight className="w-8 h-8 -rotate-45 group-hover:rotate-0 transition-transform" />
        </div>
      </div>
    </Link>
    
    <Link to="/b2b" className="block p-12 bg-black text-white group cursor-pointer hover:bg-orange-500 hover:text-black transition-colors duration-300">
      <div className="mb-8">
        <Briefcase className="w-12 h-12 mb-4 text-orange-500 group-hover:text-black group-hover:scale-110 transition-transform" />
        <h2 className="text-3xl font-black mb-2">기업 프로젝트 라운지</h2>
        <p className="font-medium text-gray-400 group-hover:text-gray-900">검증된 동아리에게 외주, 행사 제휴 등 B2B 협업을 제안해보세요.</p>
      </div>
      <div className="flex justify-end">
        <div className="w-16 h-16 border-2 border-orange-500 rounded-full flex items-center justify-center bg-black text-white group-hover:bg-black group-hover:border-black transition-colors">
           <ArrowRight className="w-8 h-8 -rotate-45 group-hover:rotate-0 transition-transform" />
        </div>
      </div>
    </Link>
  </section>
);

export default function Home() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  return (
    <>
      <HeroSection />
      <Marquee />
      <StoryArchive />
      <CurationSection onOpenAlert={() => setIsAlertOpen(true)} />
      <Gateway />

      <Modal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} title="알림 설정">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-16 h-16 bg-orange-100 border-2 border-black rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Bell className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-black mb-2">모집 알림이 설정되었습니다!</h3>
          <p className="text-gray-600 font-medium text-center mb-6">해당 동아리의 다음 기수 모집이 시작되면<br/>즉시 알림을 보내드릴게요.</p>
          <button onClick={() => setIsAlertOpen(false)} className="w-full bg-black text-white font-bold py-3 border border-black hover:bg-orange-500 hover:text-black transition-colors">
            확인
          </button>
        </div>
      </Modal>
    </>
  );
}
