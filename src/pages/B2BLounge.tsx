import React, { useState } from 'react';
import { Briefcase, Building, ChevronRight, CheckCircle, ArrowRight, DollarSign, Users, Award, Search, Filter } from 'lucide-react';
import { PROJECTS_DATA, SUCCESS_CASES } from '../data/mockData';
import { Modal } from '../components/ui/Modal';

const FILTERS = ['전체보기', '마케팅/SNS', 'IT/기획', 'IT/개발', '행사/부스', '리서치'];

const LoungeHero = ({ onProjectReg }: any) => (
  <section className="bg-black text-white border-b border-black flex flex-col md:flex-row relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
    
    <div className="flex-1 p-8 md:p-16 relative z-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-800">
      <div className="flex items-center gap-2 mb-4 text-orange-500">
        <Briefcase className="w-6 h-6" />
        <span className="font-bold tracking-widest text-sm">B2B PROJECT LOUNGE</span>
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
        안전이 검증된 동아리에게<br />실무를 제안하세요.
      </h1>
      <p className="text-gray-400 font-medium text-lg max-w-xl mb-10">
        100% 신원 및 활동 투명성이 입증된 <strong className="text-white">오렌지 뱃지 동아리</strong>만 접근할 수 있는 익스클루시브 프로젝트 게시판입니다. 동아리와의 B2B 협업으로 기업의 태스크를 해결하세요.
      </p>
      
      {/* Action Area for Companies */}
      <div className="bg-white text-black p-6 border border-white max-w-xl">
        <h3 className="font-black text-xl mb-2 flex items-center gap-2">
          <Building className="w-5 h-5" /> 기업이신가요?
        </h3>
        <p className="text-gray-600 font-medium text-sm mb-4">대학생 동아리와의 협업 일감을 등록하고 검증된 제안을 받아보세요.</p>
        <button onClick={onProjectReg} className="w-full bg-orange-500 border border-black py-3 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
          우리 기업 프로젝트 등록하기 <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>

    {/* Right Stat Panel */}
    <div className="w-full md:w-80 flex flex-col relative z-10">
      <div className="flex-1 border-b border-gray-800 p-8 flex flex-col justify-center bg-gray-900/50">
        <p className="text-sm font-bold text-gray-400 mb-2">현재 모집 중인 프로젝트</p>
        <div className="text-5xl font-black text-white flex items-end gap-2">
          12<span className="text-2xl text-orange-500 mb-1">건</span>
        </div>
      </div>
      <div className="flex-1 p-8 flex flex-col justify-center bg-gray-900/50">
        <p className="text-sm font-bold text-gray-400 mb-2">누적 매칭 완료 프로젝트</p>
        <div className="text-5xl font-black text-white flex items-end gap-2">
          385<span className="text-2xl text-gray-500 mb-1">건</span>
        </div>
      </div>
    </div>
  </section>
);

const ProjectRow = ({ project, onProposal }: any) => {
  const isOpen = project.status === 'OPEN';
  
  return (
    <div className={`flex flex-col lg:flex-row border-b border-black group transition-colors ${isOpen ? 'hover:bg-orange-50/50 bg-white' : 'bg-gray-100 opacity-75'}`}>
      
      {/* 1. 기본 정보 영역 */}
      <div className="p-6 lg:w-5/12 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-1 text-xs font-black border border-black ${isOpen ? 'bg-green-400 text-black' : 'bg-gray-400 text-white'}`}>
            {project.status === 'OPEN' ? project.deadline : '모집마감'}
          </span>
          <span className="px-2 py-1 text-xs font-bold border border-black bg-white">{project.category}</span>
          <span className="text-sm font-bold text-gray-500 ml-2">{project.company}</span>
        </div>
        <h3 className="text-2xl font-black leading-tight mb-3 group-hover:text-orange-600 transition-colors">
          {project.title}
        </h3>
        <div className="flex gap-2 flex-wrap">
          {project.tags.map((tag: string) => (
            <span key={tag} className="text-xs font-bold text-gray-500">{tag}</span>
          ))}
        </div>
      </div>

      {/* 2. 조건/리워드 영역 */}
      <div className="p-6 lg:w-4/12 border-t lg:border-t-0 lg:border-l border-black flex flex-col justify-center gap-4 bg-gray-50 group-hover:bg-transparent transition-colors">
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> 리워드/지원</p>
          <p className="font-black text-base text-black">{project.reward}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> 동아리 필수 요건</p>
          <p className="font-bold text-sm text-gray-700">{project.requirements}</p>
        </div>
      </div>

      {/* 3. 액션 버튼 영역 */}
      <div className="p-6 lg:w-3/12 border-t lg:border-t-0 lg:border-l border-black flex items-center justify-center bg-white">
        {isOpen ? (
          <button onClick={() => onProposal(project)} className="w-full bg-black text-white font-bold py-4 border border-black hover:bg-orange-500 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
            🔶 이 프로젝트 수주 제안
          </button>
        ) : (
          <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-4 border border-black cursor-not-allowed">
            모집이 완료되었습니다
          </button>
        )}
      </div>
      
    </div>
  );
};

const SuccessShowcase = () => (
  <section className="border-b border-black bg-black text-white overflow-hidden py-16">
    <div className="px-6 md:px-10 mb-10 text-center flex flex-col items-center">
      <Award className="w-12 h-12 text-orange-500 mb-4" />
      <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">매칭 성공 사례</h2>
      <p className="font-medium text-gray-400 max-w-2xl">
        기업의 실무 과제를 OURCLUB의 검증된 동아리들이 훌륭하게 완수해 낸 실제 사례들입니다.
      </p>
    </div>
    
    <div className="flex overflow-x-auto px-6 md:px-10 gap-6 snap-x hide-scrollbar pb-8">
      {SUCCESS_CASES.map(caseItem => (
        <div key={caseItem.id} className="min-w-[300px] md:min-w-[400px] border border-white bg-black group hover:-translate-y-2 transition-all snap-center cursor-pointer">
          <div className="h-48 border-b border-white overflow-hidden">
            <img src={caseItem.img} alt={caseItem.title} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-black mb-2 text-orange-500">{caseItem.title}</h3>
            <p className="font-medium text-gray-300 leading-relaxed">{caseItem.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default function B2BLounge() {
  const [activeFilter, setActiveFilter] = useState('전체보기');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const filteredProjects = PROJECTS_DATA.filter(project =>
    activeFilter === '전체보기' ? true : project.category === activeFilter
  );

  const handleProposal = (project: any) => {
    setSelectedProject(project);
    setIsPropModalOpen(true);
  };

  return (
    <>
      <LoungeHero onProjectReg={() => setIsRegModalOpen(true)} />
      <SuccessShowcase />

      <section className="bg-gray-100 py-12 md:py-16 flex-1 border-b border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-[600px]">
            
            <div className="border-b border-black">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 border-b border-black">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Briefcase className="w-6 h-6" /> 프로젝트 탐색
                </h2>
                
                <div className="flex bg-white border border-black max-w-md w-full">
                  <input
                    type="text"
                    placeholder="프로젝트, 기업명 검색..."
                    className="flex-1 px-4 py-2 outline-none font-bold placeholder:text-gray-400 text-sm"
                  />
                  <button className="bg-black text-white px-4 hover:bg-orange-500 hover:text-black transition-colors flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex overflow-x-auto hide-scrollbar bg-white items-center p-2">
                <div className="flex px-4 gap-2">
                  {FILTERS.map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`whitespace-nowrap px-4 py-2 font-bold border border-black text-sm transition-colors ${
                        activeFilter === filter
                          ? 'bg-black text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 bg-white">
              {filteredProjects.map(project => (
                <ProjectRow key={project.id} project={project} onProposal={handleProposal} />
              ))}
              
              {filteredProjects.length === 0 && (
                <div className="flex-1 p-16 flex items-center justify-center">
                   <div className="text-center text-gray-500 font-bold flex flex-col items-center">
                     <Filter className="w-10 h-10 mb-4 opacity-50" />
                     해당 카테고리에 현재 등록된 프로젝트가 없습니다.
                   </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-black bg-white flex justify-center gap-2 mt-auto">
               <button className="w-10 h-10 border border-black font-bold flex items-center justify-center bg-black text-white">1</button>
               <button className="w-10 h-10 border border-black font-bold flex items-center justify-center hover:bg-gray-100 bg-white">2</button>
            </div>

          </div>
        </div>
      </section>

      <Modal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title="기업 프로젝트 등록">
        <div className="py-4">
          <p className="font-bold text-gray-700 mb-6 leading-relaxed">
            기업 프로젝트를 등록하시려면 기업용 계정 로그인이 필요합니다.
            <br />
            (현재 준비 중인 기능입니다.)
          </p>
          <button onClick={() => setIsRegModalOpen(false)} className="w-full bg-black text-white font-bold py-3 border border-black hover:bg-orange-500 hover:text-black transition-colors">
            확인
          </button>
        </div>
      </Modal>

      <Modal isOpen={isPropModalOpen} onClose={() => setIsPropModalOpen(false)} title="프로젝트 수주 제안">
        <div className="py-4">
          <p className="font-bold text-black mb-2 flex items-center gap-2">
            <span className="text-orange-500">[{selectedProject?.company}]</span>
          </p>
          <p className="text-xl font-black border-b border-gray-200 pb-4 mb-4">
            {selectedProject?.title}
          </p>
          <p className="font-bold text-gray-700 mb-6 leading-relaxed">
            해당 프로젝트에 제안서를 보내시겠습니까?<br />제안서를 보내려면 동아리 권한 로그인이 필요합니다.
          </p>
          <button onClick={() => setIsPropModalOpen(false)} className="w-full bg-black text-white font-bold py-3 border border-black hover:bg-orange-500 hover:text-black transition-colors">
            로그인 하러가기
          </button>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
