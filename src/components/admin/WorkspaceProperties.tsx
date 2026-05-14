import React, { useRef } from 'react';
import { Palette, AlertCircle, Search } from 'lucide-react';

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
  contentWidth: string;
  setContentWidth: (w: string) => void;
  pageBgColor: string;
  setPageBgColor: (c: string) => void;
  globalFont: string;
  setGlobalFont: (f: string) => void;
  pageTitle: string;
  setPageTitle: (t: string) => void;
  pageDesc: string;
  setPageDesc: (d: string) => void;
}

const PRESET_THEMES = [
  { key: 'orange-500', bg: 'bg-orange-500' },
  { key: 'black',      bg: 'bg-black' },
  { key: 'blue-600',   bg: 'bg-blue-600' },
  { key: 'green-600',  bg: 'bg-green-600' },
  { key: 'purple-500', bg: 'bg-purple-500' },
];

const THEME_HEX: Record<string, string> = {
  'orange-500': '#f97316', 'black': '#000000',
  'blue-600': '#2563eb', 'green-600': '#16a34a', 'purple-500': '#a855f7',
};

export const WorkspaceProperties: React.FC<WorkspacePropertiesProps> = ({
  activeTheme, setActiveTheme,
  coverImg, setCoverImg,
  clubName, setClubName,
  hashtag1, setHashtag1,
  hashtag2, setHashtag2,
  badgeText, setBadgeText,
  showFloatingBtn, setShowFloatingBtn,
  contentWidth, setContentWidth,
  pageBgColor, setPageBgColor,
  globalFont, setGlobalFont,
  pageTitle, setPageTitle,
  pageDesc, setPageDesc,
}) => {
  const customColorRef = useRef<HTMLInputElement>(null);
  const isCustomTheme = !PRESET_THEMES.some(t => t.key === activeTheme);

  const handleCustomColor = (hex: string) => {
    setActiveTheme(`custom:${hex}`);
  };

  return (
    <aside className="w-72 border-l border-black bg-white flex flex-col overflow-y-auto shrink-0 relative shadow-[-3px_0_0_0_rgba(0,0,0,0.08)] z-10">
      <div className="px-4 py-3 border-b border-black sticky top-0 bg-white z-20 flex items-center justify-between">
        <h2 className="font-black text-xs flex items-center gap-2">
          <Palette className="w-4 h-4 text-orange-500" /> 전역 속성 제어
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-5">

        {/* Theme Settings */}
        <div className="flex flex-col gap-3">
          <label className="font-black text-sm flex items-center gap-2">대표 브랜드 컬러 <Tooltip text="버튼, 강조 텍스트 등에 공통으로 사용됩니다."/></label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_THEMES.map(({ key, bg }) => (
              <button
                key={key}
                onClick={() => setActiveTheme(key)}
                className={`w-8 h-8 rounded-full ${bg} border border-black hover:scale-110 transition-transform ${activeTheme === key ? 'ring-2 ring-black ring-offset-2' : ''}`}
              />
            ))}
            {/* 커스텀 컬러 */}
            <div className="relative">
              <button
                onClick={() => customColorRef.current?.click()}
                title="커스텀 색상"
                className={`w-8 h-8 rounded-full border border-black hover:scale-110 transition-transform flex items-center justify-center overflow-hidden ${isCustomTheme ? 'ring-2 ring-black ring-offset-2' : ''}`}
                style={{ backgroundColor: isCustomTheme ? activeTheme.replace('custom:', '') : '#e5e7eb' }}
              >
                {!isCustomTheme && <span className="text-gray-500 text-lg leading-none font-black">+</span>}
              </button>
              <input
                ref={customColorRef}
                type="color"
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                value={isCustomTheme ? activeTheme.replace('custom:', '') : '#6366f1'}
                onChange={e => handleCustomColor(e.target.value)}
              />
            </div>
          </div>
          {isCustomTheme && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: activeTheme.replace('custom:', '') }} />
              <span className="text-[10px] font-mono text-gray-500 uppercase">{activeTheme.replace('custom:', '')}</span>
            </div>
          )}
        </div>

        {/* Layout Settings */}
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
          <div className="text-[9px] font-black uppercase tracking-widest text-gray-300">페이지 레이아웃</div>

          <div className="flex flex-col gap-2">
            <label className="font-black text-sm flex items-center gap-2">본문 최대 너비 <Tooltip text="데스크톱 기준 페이지 콘텐츠의 최대 너비입니다."/></label>
            <div className="flex gap-1.5">
              {['720', '860', '1024', 'full'].map(w => (
                <button key={w} onClick={() => setContentWidth(w)}
                  className={`px-2.5 py-1.5 text-xs font-black border transition-colors ${contentWidth === w ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}>
                  {w === 'full' ? '전체' : `${w}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-black text-sm">페이지 배경색</label>
            <div className="flex items-center gap-2 border border-gray-300 p-1.5">
              <input type="color" value={pageBgColor || '#ffffff'} onChange={e => setPageBgColor(e.target.value)}
                className="w-8 h-8 cursor-pointer border-0 bg-transparent shrink-0" />
              <input type="text" value={pageBgColor || ''} onChange={e => setPageBgColor(e.target.value)}
                className="flex-1 text-xs font-mono outline-none bg-transparent uppercase" placeholder="#ffffff" />
              {pageBgColor && (
                <button onClick={() => setPageBgColor('')} className="text-gray-400 hover:text-black text-xs shrink-0">✕</button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-black text-sm">기본 글꼴</label>
            <select value={globalFont} onChange={e => setGlobalFont(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 font-bold outline-none focus:border-orange-500 bg-white">
              <option value="">기본 (시스템)</option>
              <option value="'Nanum Gothic', sans-serif">나눔고딕</option>
              <option value="'Nanum Myeongjo', serif">나눔명조</option>
              <option value="Georgia, serif">Georgia (Serif)</option>
              <option value="'Courier New', monospace">Courier (Mono)</option>
            </select>
          </div>
        </div>

        {/* Global Cover Setting */}
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
          <div className="text-[9px] font-black uppercase tracking-widest text-gray-300">히어로 커버</div>
          <label className="font-black text-sm">상단 커버 이미지</label>
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
        <div className="flex flex-col gap-3 pb-4 border-b border-gray-200">
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

        {/* SEO Settings */}
        <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-500" />
            <span className="font-black text-sm text-blue-700">SEO 메타 설정</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500">페이지 제목 (Title)</label>
            <input type="text" value={pageTitle} onChange={e => setPageTitle(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 font-bold outline-none focus:border-orange-500"
              placeholder="동아리명 | OurClub" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500">페이지 설명 (Description)</label>
            <textarea value={pageDesc} onChange={e => setPageDesc(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 font-bold outline-none focus:border-orange-500 resize-none"
              rows={3} placeholder="검색 결과에 표시될 설명을 입력하세요." />
          </div>
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
