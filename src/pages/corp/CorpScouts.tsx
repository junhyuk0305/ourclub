import React from 'react';
import { CorpHeader } from '../../components/corp/CorpHeader';
import { CorpSidebar } from '../../components/corp/CorpSidebar';
import { Search, Star, Send } from 'lucide-react';

const SCOUT_POOLS = [
  { id: 1, name: '마제스티', tags: ['마케팅', 'IT연합'], rating: 4.8, projects: 12, thumb: 'M', desc: '플랫폼 내 평판이 좋고 수행력이 검증된 기획/마케팅 연합' },
  { id: 2, name: '코딩크루', tags: ['개발', '해커톤'], rating: 4.9, projects: 8, thumb: 'C', desc: 'React, Node.js 기반의 빠른 프로토타이핑 특화' },
  { id: 3, name: '디자인랩', tags: ['UX/UI', '브랜딩'], rating: 4.7, projects: 15, thumb: 'D', desc: 'A/B 테스트 및 사용자 리서치에 강점이 있는 학회' },
];

export default function CorpScouts() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <CorpHeader />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <CorpSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black mb-2">관심 동아리 풀 (Scouting)</h2>
                <p className="text-gray-500 font-bold">평판이 증명된 동아리들을 탐색하고 프라이빗 프로젝트를 제안하세요.</p>
              </div>
              <div className="relative">
                <input type="text" placeholder="동아리명, 스킬 검색" className="pl-10 pr-4 py-3 border-2 border-black font-black outline-none focus:border-purple-600 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {SCOUT_POOLS.map(club => (
                 <div key={club.id} className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,1)] hover:-translate-y-1 transition-all flex flex-col">
                   <div className="p-6 border-b border-black flex justify-between items-start">
                     <div className="w-16 h-16 border-2 border-black bg-purple-100 flex items-center justify-center font-black text-3xl text-purple-600">
                       {club.thumb}
                     </div>
                     <div className="bg-white border border-gray-200 px-2 py-1 rounded flex items-center gap-1 font-bold text-sm shadow-sm">
                       <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {club.rating}
                     </div>
                   </div>
                   <div className="p-6 flex-1">
                     <h3 className="text-2xl font-black mb-2">{club.name}</h3>
                     <div className="flex gap-2 mb-4">
                       {club.tags.map(tag => (
                         <span key={tag} className="bg-gray-100 text-gray-600 border border-gray-300 font-bold text-xs px-2 py-1">{tag}</span>
                       ))}
                     </div>
                     <p className="text-gray-600 font-bold text-sm mb-4">{club.desc}</p>
                     <p className="font-black text-sm">완료한 B2B 프로젝트: <span className="text-purple-600">{club.projects}건</span></p>
                   </div>
                   <div className="p-6 pt-0">
                     <button className="w-full py-3 bg-white border-2 border-black font-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2 group">
                       <Send className="w-4 h-4 group-hover:text-purple-400" /> <span>프라이빗 프로젝트 제안</span>
                     </button>
                   </div>
                 </div>
               ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
