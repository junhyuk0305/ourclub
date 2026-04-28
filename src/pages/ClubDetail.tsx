import React, { useEffect } from 'react';
import { ArrowLeft, ExternalLink, Calendar, Users, Briefcase, Plus, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function ClubDetail() {
  const { id } = useParams();
  const isRecruiting = true;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* 1. Full Screen Cover Header */}
      <div className="w-full h-[50vh] md:h-[60vh] bg-gray-900 relative">
        <img 
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80" 
          alt="Club Cover" 
          className="w-full h-full object-cover opacity-70 grayscale mix-blend-overlay"
        />
        
        {/* Navigation Over Header */}
        <div className="absolute top-0 w-full p-6 md:p-10 z-20">
          <Link to="/clubs" className="inline-flex items-center gap-2 font-black text-white px-4 py-2 bg-black/50 backdrop-blur-md border border-white hover:bg-white hover:text-black transition-colors rounded-full opacity-70 hover:opacity-100 text-sm w-max">
            <ArrowLeft className="w-4 h-4" /> 동아리 목록으로 돌아가기
          </Link>
        </div>

        {/* Header Content */}
        <div className="absolute bottom-0 w-full p-6 md:p-12 z-20 bg-gradient-to-t from-black to-transparent flex justify-between items-end">
           <div>
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 font-bold text-sm bg-white text-black">#기획</span>
                <span className="px-3 py-1 font-bold text-sm bg-white text-black">#마케팅</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-2">
                마제스티 (Majesty)
              </h1>
              <p className="text-xl md:text-2xl font-bold text-gray-300">기업이 검증한 NO.1 실무 마케팅 동아리</p>
           </div>
           {/* Floating Badge on cover */}
           <div className="hidden md:block bg-orange-500 text-black px-6 py-3 font-black text-lg border-2 border-black transform rotate-3 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
             안전 검증 100% 완료
           </div>
        </div>
      </div>

      {/* 2. Top Bar Action / CTA */}
      <div className="w-full border-b-2 border-black bg-white sticky top-16 z-50 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
           <div className="font-bold text-lg hidden md:flex items-center gap-2">
             <Calendar className="w-5 h-5 text-orange-500" /> D-14 (14기 모집중)
           </div>
           
           <Link to={`/clubs/${id || 'majesty'}/recruit`} className={`px-10 py-3 text-lg font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${isRecruiting ? 'bg-orange-500 text-black hover:bg-black hover:text-white hover:translate-y-1 hover:shadow-none' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
             {isRecruiting ? '14기 지원서 작성하기' : '모집 마감'}
           </Link>
        </div>
      </div>

      {/* 3. Stats Full Width Grid (Grid system preservation) */}
      <div className="w-full bg-gray-50 border-b border-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black border-l border-r border-black">
            <div className="p-10 flex flex-col items-center justify-center text-center bg-white group hover:bg-orange-50 transition-colors">
              <Briefcase className="w-10 h-10 mb-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-bold text-gray-400 mb-1 tracking-widest uppercase">진행된 기업 프로젝트</div>
              <div className="text-4xl font-black">12건</div>
            </div>
            <div className="p-10 flex flex-col items-center justify-center text-center bg-white group hover:bg-orange-50 transition-colors">
              <Users className="w-10 h-10 mb-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-bold text-gray-400 mb-1 tracking-widest uppercase">회원 수 (누적 기수)</div>
              <div className="text-4xl font-black">240명 (13기)</div>
            </div>
            <div className="p-10 flex flex-col items-center justify-center text-center bg-white group hover:bg-orange-50 transition-colors">
              <Calendar className="w-10 h-10 mb-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-bold text-gray-400 mb-1 tracking-widest uppercase">투명 회비 공개</div>
              <div className="text-4xl font-black text-orange-500">100% 보장</div>
            </div>
        </div>
      </div>

      {/* 4. Canvas Body (Widgets representation) */}
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        
        {/* Intro Block */}
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight">우리는 시장의 반응을 확인하는<br/>진짜 마케터들의 집단입니다.</h2>
          <p className="text-lg font-medium text-gray-600 leading-relaxed text-left">
            마제스티는 실무를 갈망하는 열정적인 기획자, 마케터들이 모인 연합 동아리입니다. 단순한 스터디를 넘어 진짜 시장의 반응을 확인합니다.
            스타트업부터 중견기업까지 다양한 B2B 파트너의 프로젝트를 위탁받아 기획부터 실행, 데이터 분석까지 주도적으로 수행합니다.
            이 경험은 취업 포트폴리오의 가장 강력한 무기가 됩니다.
          </p>
        </div>

        {/* Split Grid Component (Widget Simulation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
           <div className="bg-black text-white p-12 border border-black flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <MapPin className="w-32 h-32" />
             </div>
             <h3 className="text-2xl font-black mb-4 z-10">활동 장소 및 회비</h3>
             <ul className="space-y-4 font-bold text-gray-300 z-10">
               <li className="flex items-center gap-3">📍 정규 세션: 매주 토요일 신촌 소재 세미나룸</li>
               <li className="flex items-center gap-3">💸 회비: 40,000원 (결산 내역 100% 공개)</li>
               <li className="flex items-center gap-3">👥 모집 인원: 20명 내외</li>
             </ul>
           </div>

           <div className="bg-orange-500 p-12 border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-2 transition-transform">
             <div>
               <h3 className="text-2xl font-black text-black mb-2">마제스티 14기 지원하기</h3>
               <p className="font-bold text-orange-900 mb-8">열정 있는 예비 실무자들의 지원을 기다립니다.</p>
             </div>
             <Link to={`/clubs/${id || 'majesty'}/recruit`} className="bg-white text-black font-black py-4 px-6 border-2 border-black flex justify-between items-center hover:bg-black hover:text-white transition-colors">
               지원서 작성하러 가기 <ArrowLeft className="w-5 h-5 rotate-180" />
             </Link>
           </div>
        </div>

        {/* Portfolio Gallery Widget */}
        <div className="mb-20">
          <h2 className="text-3xl font-black mb-10 flex items-center gap-3">
             <span className="w-4 h-4 bg-orange-500 border border-black inline-block"></span>
             실무 포트폴리오 갤러리
          </h2>
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x hide-scrollbar">
            {/* Gallery Slide 1 */}
            <div className="min-w-[300px] md:min-w-[400px] border border-black bg-white group snap-center cursor-pointer">
              <div className="h-64 border-b border-black overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" alt="Port 1" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"/>
              </div>
              <div className="p-6">
                <div className="font-black text-sm text-orange-500 mb-2">2026.01 - (주)뷰티이노베이션</div>
                <h3 className="font-black text-xl mb-3 leading-tight">Z세대 타겟 오프라인 팝업 및 바이럴 캠페인</h3>
                <Link to="/stories" className="text-sm font-black underline hover:text-orange-600 block mt-4">스토리 원문 보기</Link>
              </div>
            </div>
            {/* Gallery Slide 2 */}
            <div className="min-w-[300px] md:min-w-[400px] border border-black bg-white group snap-center cursor-pointer">
              <div className="h-64 border-b border-black overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" alt="Port 2" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"/>
              </div>
              <div className="p-6">
                <div className="font-black text-sm text-orange-500 mb-2">2025.10 - 패스트캠퍼스</div>
                <h3 className="font-black text-xl mb-3 leading-tight">B2B SaaS 기업과 진행한 사용성 테스트(UT)</h3>
                <Link to="/stories" className="text-sm font-black underline hover:text-orange-600 block mt-4">스토리 원문 보기</Link>
              </div>
            </div>
            {/* More Slides Dummy */}
            <div className="min-w-[300px] md:min-w-[400px] border border-black bg-gray-50 flex items-center justify-center snap-center cursor-pointer hover:bg-gray-100 transition-colors">
               <div className="text-center font-bold text-gray-400">
                 <Plus className="w-10 h-10 mx-auto mb-2" />
                 더 많은 포트폴리오
               </div>
            </div>
          </div>
        </div>
        
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
