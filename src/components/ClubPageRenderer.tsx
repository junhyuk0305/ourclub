import React from 'react';
import { BlockBody, BlockCtx, WB_STYLE, resolveThemeHex, getThemeText, THEME_BG } from './blockKit';

/* 공개 페이지 렌더러 — 블록 시각은 전부 blockKit 의 BlockBody(read 모드)가 담당한다.
   에디터 캔버스(Workspace)와 동일한 단일 코어를 쓰므로 둘이 갈라질 수 없다.
   (WIDGET_CRITERIA.md §0-5 실시간 반영 원칙) */

interface PageConfig {
  activeTheme?: string;
  coverImg?: string;
  clubName?: string;
  hashtag1?: string;
  hashtag2?: string;
  badgeText?: string;
  showFloatingBtn?: boolean;
  contentWidth?: string;
  pageBgColor?: string;
  globalFont?: string;
  pageTitle?: string;
  pageDesc?: string;
}

interface ActiveRecruit {
  id: string;
  generation: string | null;
  deadline: string | null;
}

interface ClubPageRendererProps {
  blocks: any[];
  config: PageConfig;
  activeRecruit?: ActiveRecruit | null;
  onApply?: () => void;
}

export const ClubPageRenderer: React.FC<ClubPageRendererProps> = ({ blocks, config, activeRecruit, onApply }) => {
  const {
    activeTheme = 'orange-500', showFloatingBtn = true,
    contentWidth = '860', pageBgColor = '', globalFont = '',
  } = config;

  const themeColor = resolveThemeHex(activeTheme);
  const isCustomTheme = activeTheme.startsWith('custom:');
  const themeBg = isCustomTheme ? '' : (THEME_BG[activeTheme] || 'bg-orange-500');
  const themeText = getThemeText(activeTheme);
  const themeStyle = isCustomTheme ? { backgroundColor: themeColor } : {};

  const ctx: BlockCtx = { activeTheme, themeColor, edit: false, onApply, deadline: activeRecruit?.deadline };

  return (
    <div className="wb-root" style={{ backgroundColor: pageBgColor || '#ffffff', fontFamily: globalFont || undefined, overflowX: 'hidden' }}>
      <div className="mx-auto wb-content" style={{ maxWidth: contentWidth === 'full' ? '100%' : `${contentWidth}px` }}>
        {blocks.map(b => <BlockBody key={b.id} block={b} ctx={ctx} />)}
      </div>

      {showFloatingBtn && activeRecruit && (
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={onApply} className={`px-6 py-3 font-black border-2 border-black text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all ${themeBg} ${themeText}`} style={themeStyle}>
            지원하기 →
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: WB_STYLE }} />
    </div>
  );
};
