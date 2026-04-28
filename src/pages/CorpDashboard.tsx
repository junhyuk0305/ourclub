import React, { useState } from 'react';
import { CorpHeader } from '../components/corp/CorpHeader';
import { CorpSidebar } from '../components/corp/CorpSidebar';
import { useCorp } from '../contexts/CorpContext';
import { Plus, Search, ChevronRight, MessageCircle } from 'lucide-react';

const MOCK_APPLICANTS = [
  { id: 1, name: '마제스티', type: '연합 동아리', status: '미열람', skill: '친목 30 / 실무 70', comment: '저희 마제스티 13기 기획팀이 해당 리서치에 딱 맞는 타겟입니다!', logo: 'M' },
  { id: 2, name: '멋쟁이사자처럼', type: '연합 동아리', status: '검토 중', skill: '실무 90 / 개발 100', comment: 'IT 서비스 타겟 그룹 테스트 경험이 다수 있습니다.', logo: 'L' },
  { id: 3, name: '경영전략학회 SBC', type: '교내 동아리', status: '미팅 요청', skill: '학술 80 / 실무 80', comment: '20대 트렌드 리포트를 매월 발행하고 있습니다.', logo: 'S' },
];

export default function CorpDashboard() {
  const { corporation } = useCorp();
  const [activeProject, setActiveProject] = useState('20대 타겟 FGI 리서치 및 UX 테스트');

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <CorpHeader
        corpName={corporation?.name}
        creditBalance={corporation?.credit_balance}
      >
        <button className="ml-4 px-6 py-2 border border-black bg-black text-white font-black hover:bg-purple-600 hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> 새 프로젝트 의뢰하기
        </button>
      </CorpHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <CorpSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div>
              <h2 className="text-4xl font-black mb-2">발주한 프로젝트</h2>
              <p className="text-gray-500 font-bold">의뢰한 프로젝트에 지원한 동아리 목록을 검토하고 미팅을 진행하세요.</p>
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
               <div className="flex items-center gap-4 flex-1">
                 <span className="font-black text-purple-600 border-r-2 border-black pr-4">진행 중인 프로젝트</span>
                 <select 
                   value={activeProject} 
                   onChange={(e) => setActiveProject(e.target.value)}
                   className="font-black text-xl outline-none bg-transparent cursor-pointer flex-1"
                 >
                   <option>20대 타겟 FGI 리서치 및 UX 테스트</option>
                   <option>토스페이먼츠 연동 해커톤 스폰서십</option>
                   <option>마케팅 콘텐츠 제작 서포터즈</option>
                 </select>
               </div>
               <button className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 border border-gray-300 px-3 py-1 bg-gray-50">
                 상세 정보 수정 <ChevronRight className="w-4 h-4" />
               </button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
              {/* 미열람 */}
              <div className="flex flex-col bg-gray-200 border-2 border-black p-4">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <h3 className="font-black text-lg">미열람</h3>
                  <span className="bg-white text-black font-black px-2 py-0.5 border border-black text-sm">1</span>
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto pb-4">
                  {MOCK_APPLICANTS.filter(a => a.status === '미열람').map(applicant => (
                     <div key={applicant.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform cursor-pointer group">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 border border-black bg-gray-100 flex items-center justify-center font-black text-xl group-hover:bg-purple-100 transition-colors">
                           {applicant.logo}
                         </div>
                         <div>
                           <h4 className="font-black text-lg leading-tight">{applicant.name}</h4>
                           <p className="text-xs font-bold text-gray-500">{applicant.type}</p>
                         </div>
                       </div>
                       <div className="bg-gray-50 text-xs font-bold p-2 border border-gray-200 mb-2">
                         👉 {applicant.skill}
                       </div>
                       <p className="text-sm font-medium text-gray-600 line-clamp-2">"{applicant.comment}"</p>
                     </div>
                  ))}
                </div>
              </div>

              {/* 검토 중 */}
              <div className="flex flex-col bg-gray-200 border-2 border-black p-4">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <h3 className="font-black text-lg flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>검토 중</h3>
                  <span className="bg-white text-black font-black px-2 py-0.5 border border-black text-sm">1</span>
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto pb-4">
                  {MOCK_APPLICANTS.filter(a => a.status === '검토 중').map(applicant => (
                     <div key={applicant.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform cursor-pointer group">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 border border-black bg-gray-100 flex items-center justify-center font-black text-xl group-hover:bg-purple-100 transition-colors">
                           {applicant.logo}
                         </div>
                         <div>
                           <h4 className="font-black text-lg leading-tight">{applicant.name}</h4>
                           <p className="text-xs font-bold text-gray-500">{applicant.type}</p>
                         </div>
                       </div>
                       <div className="bg-gray-50 text-xs font-bold p-2 border border-gray-200 mb-2">
                         👉 {applicant.skill}
                       </div>
                       <p className="text-sm font-medium text-gray-600 line-clamp-2">"{applicant.comment}"</p>
                     </div>
                  ))}
                </div>
              </div>

              {/* 미팅 요청 */}
              <div className="flex flex-col bg-gray-200 border-2 border-black p-4">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <h3 className="font-black text-lg flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>미팅 요청</h3>
                  <span className="bg-white text-black font-black px-2 py-0.5 border border-black text-sm">1</span>
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto pb-4">
                  {MOCK_APPLICANTS.filter(a => a.status === '미팅 요청').map(applicant => (
                     <div key={applicant.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform cursor-pointer group">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 border border-black bg-yellow-100 flex items-center justify-center font-black text-xl group-hover:bg-purple-100 transition-colors">
                           {applicant.logo}
                         </div>
                         <div>
                           <h4 className="font-black text-lg leading-tight">{applicant.name}</h4>
                           <p className="text-xs font-bold text-gray-500">{applicant.type}</p>
                         </div>
                       </div>
                       <button className="w-full py-2 bg-yellow-300 border border-black font-black text-sm mb-2 flex items-center justify-center gap-2 hover:bg-yellow-400">
                         <MessageCircle className="w-4 h-4" /> 채팅하기
                       </button>
                       <div className="bg-gray-50 text-xs font-bold p-2 border border-gray-200 mb-2">
                         👉 {applicant.skill}
                       </div>
                     </div>
                  ))}
                </div>
              </div>

              {/* 매칭 완료 */}
              <div className="flex flex-col bg-purple-100 border-2 border-black p-4">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <h3 className="font-black text-purple-900 text-lg flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-600"></span>매칭 완료</h3>
                  <span className="bg-white text-black font-black px-2 py-0.5 border border-black text-sm">0</span>
                </div>
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-purple-300 p-4 text-center">
                   <p className="font-bold text-purple-600 text-sm">아직 최종 매칭된 동아리가 없습니다.<br/>좋은 파트너를 찾아보세요!</p>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
