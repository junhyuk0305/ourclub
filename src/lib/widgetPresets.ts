/* ─────────────────────────────────────────────────────────────
   위젯 디자인 프리셋 — 3번째 템플릿 계층(WEBBUILDER_TEMPLATES_PLAN.md §12)
   "선택한 위젯의 디자인만 한 번에" 바꾸는 원자 프리셋 레지스트리.

   원칙(메모리 정책 일치):
   - 새 위젯/새 렌더 0. 기존 위젯의 '디자인 필드'만 묶어 `onUpdate('__merge', patch)` 로 적용.
   - 텍스트 내용·항목 데이터(items/tickerItems/slides 등)는 패치하지 않아 보존된다.
   - accent = 현재 테마색(activeTheme hex) 주입 → 테마를 바꾸면 프리셋 톤도 따라간다.
   - 각 패치는 관련 디자인 필드를 '명시적으로' 지정해 이전 프리셋의 잔여값을 깨끗이 리셋한다
     (아래 button 프리셋과 동일한 예측가능 전환 규칙).

   button·faq 도 여기로 흡수해 '단일 출처'로 통일한다(예전 BtnTemplateModal·FaqTemplateModal 제거).
   button 은 칩 미리보기를 위해 chip 을, 그 외 8종은 라벨·설명만 노출한다.
   ───────────────────────────────────────────────────────────── */

export interface WidgetPreset {
  id: string;
  label: string;
  desc: string;
  /** accent = activeTheme hex. 적용할 디자인 필드 번들을 반환한다. */
  patch: (accent: string) => Record<string, any>;
  /** 모달 칩 미리보기 스타일(있을 때만 칩 노출). 버튼처럼 시각이 중요한 위젯용. */
  chip?: (accent: string) => Record<string, any>;
}

/* 색상 음영 조절 — 그라디언트 톤용(버튼 프리셋). amt>0 밝게, <0 어둡게. */
const shade = (hex: string, amt: number) => {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return hex;
  const ch = (i: number) => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(2)}${ch(4)}`;
};

export const WIDGET_PRESETS: Record<string, WidgetPreset[]> = {
  /* ── 텍스트 ── 타이포 위계 + 등장/리빌을 프리셋에 내장(Track B 연출이 여기 박힘) */
  text: [
    { id: 'heroHeadline', label: '히어로 헤드라인', desc: '초대형 + 글자 리빌',
      patch: () => ({ fontSize: 60, fontWeight: 900, lineHeight: 1.1, letterSpacing: -0.02, textColor: '#0a0a0a',
        textStroke: undefined, textStrokeColor: undefined, bgColor: undefined,
        animation: 'slideUp', animDuration: 0.7, animEasing: 'power', animDistance: 28,
        textReveal: 'char', revealStagger: 0.04, paddingTop: 8, paddingBottom: 8 }) },
    { id: 'sectionTitle', label: '섹션 타이틀', desc: '중형 + 단어 리빌',
      patch: () => ({ fontSize: 34, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.01, textColor: '#111827',
        textStroke: undefined, textStrokeColor: undefined, bgColor: undefined,
        animation: 'slideUp', animDuration: 0.6, animEasing: 'power', animDistance: 20,
        textReveal: 'word', revealStagger: 0.05, paddingTop: 8, paddingBottom: 8 }) },
    { id: 'overline', label: '라벨·오버라인', desc: '작은 강조 캡션(테마색)',
      patch: a => ({ fontSize: 13, fontWeight: 800, lineHeight: 1.4, letterSpacing: 0.18, textColor: a,
        textStroke: undefined, textStrokeColor: undefined, bgColor: undefined,
        animation: 'fadeIn', animDuration: 0.5, animEasing: 'power', textReveal: undefined,
        paddingTop: 4, paddingBottom: 4 }) },
    { id: 'editorialBody', label: '에디토리얼 본문', desc: '넓은 줄간격 가독형',
      patch: () => ({ fontSize: 17, fontWeight: 400, lineHeight: 1.9, letterSpacing: 0, textColor: '#374151',
        textStroke: undefined, textStrokeColor: undefined, bgColor: undefined,
        animation: 'fadeIn', animDuration: 0.6, animEasing: 'power', textReveal: undefined,
        paddingTop: 8, paddingBottom: 8 }) },
    { id: 'outlineImpact', label: '아웃라인 임팩트', desc: '외곽선 초대형 + 글자 리빌',
      patch: () => ({ fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: -0.02, textColor: '#ffffff',
        textStroke: 2, textStrokeColor: '#0a0a0a', bgColor: undefined,
        animation: undefined, textReveal: 'char', revealStagger: 0.03, paddingTop: 8, paddingBottom: 8 }) },
  ],

  /* ── 통계 ── 스트립/카드 + 카운트업 */
  stats: [
    { id: 'minimalStrip', label: '미니멀 스트립', desc: '한 줄 라이트',
      patch: () => ({ layout: 'strip', cols: 4, paddingY: 48, bgColor: '', valueSize: 44, labelSize: 13,
        valueColor: '#0a0a0a', labelColor: '#9ca3af', animate: true, countDuration: 1.6,
        cardBg: undefined, borderColor: undefined, accentLine: undefined }) },
    { id: 'darkImpact', label: '대형 임팩트', desc: '다크 배경 + 테마색 숫자',
      patch: a => ({ layout: 'strip', cols: 3, paddingY: 72, bgColor: '#0a0a0a', valueSize: 64, labelSize: 14,
        valueColor: a, labelColor: '#94a3b8', animate: true, countDuration: 1.8,
        cardBg: undefined, borderColor: undefined, accentLine: undefined }) },
    { id: 'cardGrid', label: '카드 그리드', desc: '상단 강조 라인 카드',
      patch: () => ({ layout: 'cards', cols: 3, paddingY: 56, bgColor: '#ffffff', cardBg: '#f9fafb', borderColor: '#e5e7eb',
        accentLine: true, valueSize: 44, labelSize: 13, valueColor: '#111827', labelColor: '#6b7280',
        animate: true, countDuration: 1.5 }) },
  ],

  /* ── 프로세스(타임라인) ── 노드 스타일 + 순차 등장 */
  timeline: [
    { id: 'horizBigNum', label: '가로 빅넘버', desc: '큰 번호 + 수평',
      patch: a => ({ layout: 'horizontal', nodeStyle: 'bigNum', activeColor: a, lineColor: '#e5e7eb',
        nodeAnim: 'slideUp', nodeStagger: 0.12 }) },
    { id: 'vertLine', label: '세로 라인', desc: '번호 원 + 수직',
      patch: a => ({ layout: 'vertical-left', nodeStyle: 'number', activeColor: a, lineColor: '#111827',
        nodeAnim: 'fadeIn', nodeStagger: 0.12 }) },
    { id: 'minimalRing', label: '미니멀 링', desc: '링 마커 + 교차 수직',
      patch: a => ({ layout: 'vertical-center', nodeStyle: 'ring', activeColor: a, lineColor: '#e5e7eb',
        nodeAnim: 'slideIn', nodeStagger: 0.1 }) },
  ],

  /* ── 구분 요소 ── (항목 텍스트 tickerItems 는 보존, 디자인만) */
  divider: [
    { id: 'hairline', label: '헤어라인', desc: '얇은 실선',
      patch: () => ({ variant: 'line', style: 'solid', color: '#e5e7eb', thickness: 1, width: 100, paddingY: 24, bgColor: '' }) },
    { id: 'dashedSoft', label: '점선 소프트', desc: '짧은 점선 중앙',
      patch: () => ({ variant: 'line', style: 'dashed', color: '#d1d5db', thickness: 2, width: 60, paddingY: 32, bgColor: '' }) },
    { id: 'emojiTicker', label: '이모지 티커', desc: '흐르는 띠(테마색)',
      patch: a => ({ variant: 'ticker', separator: '✦', speed: 24, tickerFontSize: 13, paddingY: 14,
        bgColor: a, textColor: '#ffffff', accentColor: '', tickerReverse: undefined, tickerFade: true, tickerPause: undefined }) },
  ],

  /* ── 이미지 ── 비율/둥글기/너비 프리셋 */
  image: [
    { id: 'cinemaWide', label: '시네마 와이드', desc: '16:9 풀폭',
      patch: () => ({ aspect: '16/9', objectFit: 'cover', radius: 6, width: 100, align: 'center', bgColor: '' }) },
    { id: 'roundedCard', label: '라운드 카드', desc: '4:3 둥근 모서리',
      patch: () => ({ aspect: '4/3', objectFit: 'cover', radius: 16, width: 100, align: 'center', bgColor: '' }) },
    { id: 'circleAvatar', label: '원형 아바타', desc: '1:1 원형 중앙',
      patch: () => ({ aspect: '1/1', objectFit: 'cover', radius: 999, width: 40, align: 'center', bgColor: '' }) },
  ],

  /* ── 섹션 ── 배경 프리셋(워터마크·도형은 보존, 핵심 배경/여백만) */
  section: [
    { id: 'darkHero', label: '다크 히어로', desc: '검정 배경 + 넓은 여백',
      patch: () => ({ bgType: 'color', bgColor: '#0a0a0a', paddingY: 140, paddingX: 32 }) },
    { id: 'lightManifesto', label: '라이트 매니페스토', desc: '흰 배경 + 큰 여백',
      patch: () => ({ bgType: 'color', bgColor: '#ffffff', paddingY: 120, paddingX: 32 }) },
    { id: 'colorBand', label: '컬러 밴드', desc: '테마색 풀폭 밴드',
      patch: a => ({ bgType: 'color', bgColor: a, paddingY: 96, paddingX: 32 }) },
    { id: 'imageFullbleed', label: '이미지 풀블리드', desc: '배경 이미지 + 어둡게 + 줌',
      patch: () => ({ bgType: 'image', bgOverlay: 45, bgKenBurns: 'zoom', paddingY: 160, paddingX: 32 }) },
  ],

  /* ── 버튼 ── 채움/그라디언트/아웃라인 등 디자인 일괄. accent = 테마색. 칩 미리보기 포함.
     각 패치가 관련 필드를 '전부' 지정(미사용은 undefined)해 이전 프리셋 잔여값을 깨끗이 리셋한다. */
  button: [
    { id: 'solid', label: '솔리드', desc: '단색 채움',
      patch: c => ({ btnBg: c, btnGradient: undefined, btnTextColor: '#ffffff', borderWidth: 0, radius: 8, btnShadow: 'none', btnFx: undefined }),
      chip: c => ({ background: c, color: '#fff', borderRadius: 6 }) },
    { id: 'gradient', label: '그라디언트', desc: '톤 그라디언트 채움',
      patch: c => ({ btnGradient: `linear-gradient(135deg, ${shade(c, 26)}, ${shade(c, -30)})`, btnBg: c, btnTextColor: '#ffffff', borderWidth: 0, radius: 10, btnShadow: 'soft', btnFx: undefined }),
      chip: c => ({ background: `linear-gradient(135deg, ${shade(c, 26)}, ${shade(c, -30)})`, color: '#fff', borderRadius: 6 }) },
    { id: 'shine', label: '샤인', desc: '그라디언트 + 광택 스침',
      patch: c => ({ btnGradient: `linear-gradient(135deg, ${shade(c, 16)}, ${shade(c, -24)})`, btnBg: c, btnTextColor: '#ffffff', borderWidth: 0, radius: 8, btnShadow: 'none', btnFx: 'shine' }),
      chip: c => ({ background: `linear-gradient(135deg, ${shade(c, 16)}, ${shade(c, -24)})`, color: '#fff', borderRadius: 6 }) },
    { id: 'press', label: '입체', desc: '하단 그림자 + 누름',
      patch: c => ({ btnBg: c, btnGradient: undefined, btnTextColor: '#ffffff', borderWidth: 0, radius: 8, btnShadow: 'none', btnFx: 'press' }),
      chip: c => ({ background: c, color: '#fff', borderRadius: 6, boxShadow: '0 4px 0 0 rgba(0,0,0,0.25)' }) },
    { id: 'glass', label: '글래스', desc: '반투명 + 블러 (다크 위)',
      patch: c => ({ btnBg: c + '26', btnGradient: undefined, btnTextColor: '#ffffff', borderWidth: 1, borderColor: '#ffffff55', radius: 12, btnShadow: 'none', btnFx: 'glass' }),
      chip: c => ({ background: c + '40', color: '#fff', border: '1px solid #ffffff55', borderRadius: 8 }) },
    { id: 'outline', label: '아웃라인', desc: '투명 + 테두리',
      patch: c => ({ btnBg: 'transparent', btnGradient: undefined, btnTextColor: c, borderWidth: 2, borderColor: c, radius: 8, btnShadow: 'none', btnFx: undefined }),
      chip: c => ({ background: 'transparent', color: c, border: `2px solid ${c}`, borderRadius: 6 }) },
    { id: 'soft', label: '소프트', desc: '연한 톤 배경',
      patch: c => ({ btnBg: c + '1a', btnGradient: undefined, btnTextColor: c, borderWidth: 0, radius: 10, btnShadow: 'none', btnFx: undefined }),
      chip: c => ({ background: c + '1a', color: c, borderRadius: 6 }) },
    { id: 'ghost', label: '고스트', desc: '텍스트 + 화살표',
      patch: c => ({ btnBg: 'transparent', btnGradient: undefined, btnTextColor: c, borderWidth: 0, radius: 8, btnShadow: 'none', btnFx: undefined, btnHover: 'arrow' }),
      chip: c => ({ background: 'transparent', color: c }) },
    { id: 'neon', label: '네온', desc: '다크 + 컬러 글로우',
      patch: c => ({ btnBg: '#0a0a0a', btnGradient: undefined, btnTextColor: c, borderWidth: 2, borderColor: c, radius: 8, btnShadow: 'glow', btnFx: undefined }),
      chip: c => ({ background: '#0a0a0a', color: c, border: `2px solid ${c}`, borderRadius: 5, boxShadow: `0 0 8px ${c}` }) },
    { id: 'pill', label: '알약', desc: '완전 둥근 채움',
      patch: c => ({ btnBg: c, btnGradient: undefined, btnTextColor: '#ffffff', borderWidth: 0, radius: 999, btnShadow: 'soft', btnFx: undefined }),
      chip: c => ({ background: c, color: '#fff', borderRadius: 999 }) },
    { id: 'ink', label: '잉크', desc: '흰 배경 + 검정 오프셋',
      patch: () => ({ btnBg: '#ffffff', btnGradient: undefined, btnTextColor: '#0a0a0a', borderWidth: 2, borderColor: '#0a0a0a', radius: 0, btnShadow: 'hard', btnFx: undefined }),
      chip: () => ({ background: '#fff', color: '#0a0a0a', border: '2px solid #0a0a0a', boxShadow: '3px 3px 0 0 #000' }) },
    { id: 'link', label: '링크', desc: '밑줄형 텍스트',
      patch: c => ({ btnBg: 'transparent', btnGradient: undefined, btnTextColor: c, borderWidth: 0, radius: 0, btnShadow: 'none', btnFx: undefined, btnHover: 'underline' }),
      chip: c => ({ background: 'transparent', color: c, textDecoration: 'underline', textUnderlineOffset: 3 }) },
  ],

  /* ── FAQ ── 변형+아이콘+번호+크기+색을 한 번에. 각 프리셋이 관련 필드를 '전부' 지정(미사용 undefined)해
     박스↔라인 전환 시 openBg·borderRadius·faqLineColor 잔류가 남지 않는다. */
  faq: [
    { id: 'boxed', label: '박스 기본', desc: '검정 박스 + ＋',
      patch: () => ({ faqStyle: undefined, iconStyle: 'plus', faqNumbered: undefined, qSize: 15, qColor: undefined, aColor: undefined, faqLineColor: undefined, openBg: '#fff7ed', borderRadius: 0 }) },
    { id: 'lineEdit', label: '라인 에디토리얼', desc: '얇은 구분선 + 번호 + ↑↓',
      patch: () => ({ faqStyle: 'line', iconStyle: 'arrow', faqNumbered: true, qSize: 19, qColor: '#111827', aColor: '#6b7280', faqLineColor: '#e5e7eb', openBg: undefined, borderRadius: undefined }) },
    { id: 'minimal', label: '미니멀 대형', desc: '보더 거의 없이 큰 질문',
      patch: () => ({ faqStyle: 'plain', iconStyle: 'plus', faqNumbered: true, qSize: 24, qColor: '#0a0a0a', aColor: '#6b7280', faqLineColor: '#eeeeee', openBg: undefined, borderRadius: undefined }) },
    { id: 'darkLine', label: '다크 라인', desc: '다크 섹션용 라이트 텍스트',
      patch: () => ({ faqStyle: 'line', iconStyle: 'arrow', faqNumbered: true, qSize: 19, qColor: '#ffffff', aColor: '#94a3b8', faqLineColor: '#262626', openBg: undefined, borderRadius: undefined }) },
    { id: 'compact', label: '컴팩트 박스', desc: '작고 촘촘한 박스',
      patch: () => ({ faqStyle: undefined, iconStyle: 'plus', faqNumbered: undefined, qSize: 14, qColor: undefined, aColor: undefined, faqLineColor: undefined, openBg: '#f9fafb', borderRadius: 8 }) },
    { id: 'numMinimal', label: '번호 미니멀', desc: '번호 + 얇은 라인',
      patch: () => ({ faqStyle: 'line', iconStyle: 'plus', faqNumbered: true, qSize: 20, qColor: '#111827', aColor: '#6b7280', faqLineColor: '#e5e7eb', openBg: undefined, borderRadius: undefined }) },
  ],
};
