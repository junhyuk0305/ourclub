import React, { useEffect } from 'react';
import { BlockBody, BlockCtx, WB_STYLE, resolveThemeHex, getThemeText, THEME_BG } from './blockKit';

/* 관성 스무스 스크롤(A1) — 페이지 설정에서 켠 경우에만 Lenis 를 동적 import(번들 0kb when off).
   prefers-reduced-motion / 터치 기기는 자연스러운 네이티브 스크롤을 유지한다. */
function useSmoothScroll(enabled?: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let lenis: any; let raf = 0; let cancelled = false;
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }).catch(() => {});
    return () => { cancelled = true; cancelAnimationFrame(raf); lenis?.destroy?.(); };
  }, [enabled]);
}

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
  smoothScroll?: boolean;
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
    contentWidth = '860', pageBgColor = '', globalFont = '', smoothScroll = false,
  } = config;
  useSmoothScroll(smoothScroll);

  const themeColor = resolveThemeHex(activeTheme);
  const isCustomTheme = activeTheme.startsWith('custom:');
  const themeBg = isCustomTheme ? '' : (THEME_BG[activeTheme] || 'bg-brand');
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
          <button onClick={onApply} className={`px-6 py-3 font-black border border-transparent rounded-ctl text-sm shadow-btn hover:-translate-y-0.5 transition-all ${themeBg} ${themeText}`} style={themeStyle}>
            지원하기 →
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: WB_STYLE }} />
    </div>
  );
};
