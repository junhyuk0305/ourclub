import React from 'react';
import { Palette, Share2, AlertCircle } from 'lucide-react';

interface WorkspacePropertiesProps {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  coverImg: string;
  setCoverImg: (url: string) => void;
  clubName: string;
  setClubName: (name: string) => void;
  hashtag1: string;
  setHashtag1: (tag: string) => void;
  hashtag2: string;
  setHashtag2: (tag: string) => void;
  badgeText: string;
  setBadgeText: (text: string) => void;
  showFloatingBtn: boolean;
  setShowFloatingBtn: (show: boolean) => void;
}

export const WorkspaceProperties: React.FC<WorkspacePropertiesProps> = ({
  activeTheme, setActiveTheme,
  coverImg, setCoverImg,
  clubName, setClubName,
  hashtag1, setHashtag1,
  hashtag2, setHashtag2,
  badgeText, setBadgeText,
  showFloatingBtn, setShowFloatingBtn
}) => {
  return (
    <aside className="w-80 border-l border-black bg-white flex flex-col overflow-y-auto shrink-0 relative shadow-[-4px_0_0_0_rgba(0,0,0,1)] z-10">
      <div className="p-6 border-b border-black sticky top-0 bg-white z-20 flex items-center justify-between">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Palette className="w-5 h-5 text-orange-500" /> 전역 속성 제어
        </h2>
      </div>

      <div className="p-6 flex flex-col gap-8">
        
        {/* Theme Settings */}
        <div className="flex flex-col gap-3">
          <label className="font-black text-sm flex items-center gap-2">대표 브랜드 컬러 <Tooltip text="버튼, 강조 텍스트 등에 공통으로 사용됩니다."/></label>
          <div className="flex gap-2">
            <button onClick={() => setActiveTheme('orange-500')} className={`w-8 h-8 rounded-full bg-orange-500 border border-black hover:scale-110 transition-transform ${activeTheme==='orange-500' ? 'ring-2 ring-black ring-offset-2' : ''}`}></button>
            <button onClick={() => setActiveTheme('black')} className={`w-8 h-8 rounded-full bg-black border border-black hover:scale-110 transition-transform ${activeTheme==='black' ? 'ring-2 ring-black ring-offset-2' : ''}`}></button>
            <button onClick={() => setActiveTheme('blue-600')} className={`w-8 h-8 rounded-full bg-blue-600 border border-black hover:scale-110 transition-transform ${activeTheme==='blue-600' ? 'ring-2 ring-black ring-offset-2' : ''}`}></button>
            <button onClick={() => setActiveTheme('green-600')} className={`w-8 h-8 rounded-full bg-green-600 border border-black hover:scale-110 transition-transform ${activeTheme==='green-600' ? 'ring-2 ring-black ring-offset-2' : ''}`}></button>
            <button onClick={() => setActiveTheme('purple-500')} className={`w-8 h-8 rounded-full bg-purple-500 border border-black hover:scale-110 transition-transform ${activeTheme==='purple-500' ? 'ring-2 ring-black ring-offset-2' : ''}`}></button>
            <button className="w-8 h-8 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors tooltip" title="커스텀 색상 추가">
               <span className="text-gray-500 text-lg leading-none">+</span>
            </button>
          </div>
        </div>

        {/* Global Cover Setting */}
        <div className="flex flex-col gap-3">
          <label className="font-black text-sm">상단 히어로 커버 이미지</label>
          <input 
            type="text" 
            value={coverImg}
            onChange={(e) => setCoverImg(e.target.value)}
            className="w-full p-2 text-sm border border-black font-bold outline-none focus:border-orange-500 bg-gray-50"
          />
          <div className="h-20 bg-gray-200 border border-black w-full overflow-hidden">
            <img src={coverImg} alt="Cover Preview" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-black text-sm">동아리명</label>
          <input 
            type="text" 
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            className="w-full p-2 text-sm border border-black font-bold outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-black text-sm flex items-center gap-2">검색 키워드 태그 <Tooltip text="플랫폼 내 검색 엔진에 노출되는 주요 키워드입니다."/></label>
          <div className="flex gap-2">
            <input type="text" value={hashtag1} onChange={e=>setHashtag1(e.target.value)} className="w-full p-2 text-sm border border-black font-bold" />
            <input type="text" value={hashtag2} onChange={e=>setHashtag2(e.target.value)} className="w-full p-2 text-sm border border-black font-bold" />
          </div>
        </div>

        {/* Safety Badge */}
        <div className="flex flex-col gap-3 pb-6 border-b border-gray-200">
           <label className="font-black text-sm text-green-600 flex items-center gap-1">✅ 오렌지 뱃지 노출 문구</label>
           <input type="text" value={badgeText} onChange={e=>setBadgeText(e.target.value)} className="w-full p-2 text-sm border border-gray-300 bg-green-50 text-green-800 font-bold" />
        </div>

        {/* Sticky Apply Button Toggle */}
        <div className="flex items-center justify-between border border-black p-4 bg-gray-50">
          <div className="flex flex-col">
            <span className="font-black text-sm">하단 고정 '지원버튼'</span>
            <span className="text-xs font-bold text-gray-500">모바일에서 이탈률을 낮춥니다.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={showFloatingBtn} onChange={()=>setShowFloatingBtn(!showFloatingBtn)} className="sr-only peer" />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none border-2 border-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${showFloatingBtn ? 'bg-orange-500' : ''}`}></div>
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 font-bold text-sm text-blue-800">
          모든 블록 컴포넌트는 모바일 환경(가로 640px 이하)에서 자동으로 세로 1단(Auto-Stack)으로 변환되어 렌더링됩니다.
        </div>

      </div>
    </aside>
  );
};

const Tooltip = ({text}: {text: string}) => (
  <span className="relative group/tt flex items-center cursor-help">
    <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 min-w-[200px] bg-black text-white text-xs p-2 font-bold opacity-0 group-hover/tt:opacity-100 pointer-events-none transition-opacity text-center z-50">
      {text}
    </span>
  </span>
);
