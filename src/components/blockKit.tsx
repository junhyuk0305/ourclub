/* ─────────────────────────────────────────────────────────────────────────
   blockKit — 단일 블록 렌더 코어 (WIDGET_CRITERIA.md §0-5 실시간 반영 원칙)

   공개 페이지(ClubPageRenderer)와 에디터 캔버스(Workspace)가 **동일한** 블록 시각을
   이 한 파일에서 렌더한다. 두 곳에 시각 구현을 복제하지 않는다(= drift 방지).

   - 공개 렌더: <BlockBody block={b} ctx={{ edit:false, ... }} />        → 읽기 전용
   - 에디터 렌더: <BlockBody block={b} ctx={{ edit:true, upd, ... }} />   → 인라인 편집

   ctx.edit 가 true 이면 텍스트 노드가 입력 필드로 바뀌고, 항목 추가/삭제 affordance 가
   노출된다. false 이면 공개 페이지와 픽셀 단위로 동일한 결과를 낸다.
   ───────────────────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useRef, ElementType } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { MessageSquare, Clock, ChevronLeft, ChevronRight, Plus, X, Bold, AlignLeft, AlignCenter, AlignRight, AlignJustify, Baseline, PaintBucket } from 'lucide-react';

/* ── theme / util helpers (단일 소유) ── */
export const THEME_HEX: Record<string, string> = {
  'orange-500': '#f97316', 'black': '#000000', 'white': '#ffffff',
  'blue-600': '#2563eb', 'green-600': '#16a34a', 'purple-500': '#a855f7',
};
export const THEME_BG: Record<string, string> = {
  'orange-500': 'bg-orange-500', 'black': 'bg-black', 'white': 'bg-white',
  'blue-600': 'bg-blue-600', 'green-600': 'bg-green-600', 'purple-500': 'bg-purple-500',
};
export const resolveThemeHex = (t: string) =>
  t.startsWith('custom:') ? t.replace('custom:', '') : (THEME_HEX[t] || '#f97316');
export const getThemeText = (t: string) => {
  const hex = resolveThemeHex(t);
  return (t === 'white' || hex === '#ffffff') ? 'text-black' : 'text-white';
};
/* 배경 hex 의 명도로 가독성 있는 글자색(검/흰)을 고른다. 흰 배경+흰 글자 같은 대비 사고 방지. */
export const readableTextOn = (hex?: string) => {
  if (!hex || hex[0] !== '#') return '#ffffff';
  const h = hex.replace('#', '');
  if (h.length < 6) return '#ffffff';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#000000' : '#ffffff';
};
export const getAlignClass = (a?: string) =>
  ({ center: 'text-center', right: 'text-right', justify: 'text-justify' }[a || ''] || 'text-left');

let _idSeq = 0;
const genId = () => `${Date.now().toString(36)}_${(_idSeq++).toString(36)}`;

/* Parse inline highlight markers `==text==` into colored spans. */
export function renderRichText(text: string, highlightColor?: string): React.ReactNode {
  if (!text) return null;
  if (!text.includes('==')) return text;
  const parts = text.split(/(==[^=]+==)/g);
  return parts.map((p, i) => {
    if (p.startsWith('==') && p.endsWith('==') && p.length > 4) {
      return (
        <span key={i} style={{ color: highlightColor || '#f97316', fontWeight: 'inherit' }}>
          {p.slice(2, -2)}
        </span>
      );
    }
    return p;
  });
}

/* ── shared CSS the core depends on (양쪽 소비자가 주입) ── */
export const WB_STYLE = `
  @keyframes wbFadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes wbSlideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
  @keyframes wbSlideIn { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:none; } }
  @keyframes wbZoomIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
  @keyframes wbPulse { 0% { transform:scale(1); } 20% { transform:scale(1.12); } 40% { transform:scale(1); } 60% { transform:scale(1.08); } 80%,100% { transform:scale(1); } }
  @keyframes wbBounceIn { 0% { opacity:0; transform:translateY(-24px); } 60% { opacity:1; transform:translateY(8px); } 80% { transform:translateY(-4px); } 100% { transform:translateY(0); } }
  .wb-anim-fadeIn { animation: wbFadeIn 0.7s ease forwards; }
  .wb-anim-slideUp { animation: wbSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
  .wb-anim-slideIn { animation: wbSlideIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
  .wb-anim-zoomIn { animation: wbZoomIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
  .wb-anim-pulse { animation: wbPulse 1s ease forwards; }
  .wb-anim-bounceIn { animation: wbBounceIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
  @media (prefers-reduced-motion: reduce) {
    .wb-anim-fadeIn, .wb-anim-slideUp, .wb-anim-slideIn, .wb-anim-zoomIn, .wb-anim-pulse, .wb-anim-bounceIn { animation: none; }
  }
  .wb-content { position: relative; }
  .wb-bleed {
    position: relative; width: 100vw; max-width: 100vw;
    left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw;
  }
  .wb-root, .wb-root * { max-width: 100%; }
  .wb-root h1, .wb-root h2, .wb-root h3, .wb-root p { word-break: keep-all; overflow-wrap: break-word; }
  .wbr-cell-wrap { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
  .wbr-cell-wrap.wbr-hover-lift:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(0,0,0,0.12); }
  .wbr-cell-wrap.wbr-hover-scale:hover { transform: scale(1.03); }
  .wbr-cell-wrap.wbr-hover-border:hover > * { border-color: currentColor !important; }
  .wbr-grid-wrap { container-type: inline-size; }
  @container (max-width: 600px) {
    .wbr-grid { grid-template-columns: 1fr !important; }
    .wbr-cell-lr { flex-direction: column !important; }
    .wbr-cell-lr-img { width: 100% !important; max-height: 200px; }
  }
  @media (max-width: 640px) {
    .wbr-grid { grid-template-columns: 1fr !important; }
    .wbr-cell-lr { flex-direction: column !important; }
    .wbr-cell-lr-img { width: 100% !important; max-height: 200px; }
  }
  @keyframes wbTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .wb-ticker-track { display: inline-flex; flex-wrap: nowrap; white-space: nowrap; animation-name: wbTicker; animation-timing-function: linear; animation-iteration-count: infinite; will-change: transform; }
  @media (prefers-reduced-motion: reduce) { .wb-ticker-track { animation: none; } }
  .wb-gutter { padding-left: clamp(20px, 5vw, 80px); padding-right: clamp(20px, 5vw, 80px); }
  .wb-inner { max-width: 1200px; margin-left: auto; margin-right: auto; }
  /* 리치 텍스트 에디터 placeholder */
  .wb-rich:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
  .wb-rich:focus { outline: none; }
  /* ── 섹션(행→컬럼→위젯) 반응형: 섹션 폭 기준 container query ── */
  .wb-section { container-type: inline-size; }
  @container (max-width: 768px) { .wb-section-row[data-collapse] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; } }
  @container (max-width: 540px) { .wb-section-row[data-collapse] { grid-template-columns: 1fr !important; } }
  /* ── 버튼 위젯: 그림자 변형(정적, hover 효과 없음) ──
     애니메이션은 텍스트와 동일하게 AnimDiv(진입 1회 재생 + 편집 시 미리보기)로 처리한다. */
  .wb-btn-sh-hard { box-shadow: 4px 4px 0 0 rgba(0,0,0,0.9); }
  .wb-btn-sh-soft { box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
  .wb-btn-sh-glow { box-shadow: 0 0 16px 2px var(--wb-btn-c, #f97316); }
`;

/* ─────────────────────────────────────────────
   Edit context + inline-edit primitives
───────────────────────────────────────────── */
export interface BlockCtx {
  activeTheme: string;
  themeColor: string;
  edit: boolean;
  /** 이 블록의 top-level 필드 갱신 (edit 모드 전용) */
  upd?: (field: string, value: any) => void;
  /** 지원 모달 등 액션 (read 모드 전용) */
  onApply?: () => void;
  /** 진행 중 모집 마감일 — countdown 위젯이 read 모드에서 연동 */
  deadline?: string | null;
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();
const autosize = (el: HTMLTextAreaElement | null) => {
  if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
};

/**
 * EditText — read 모드에선 <Tag>{richText}</Tag>, edit 모드에선 동일 style 의 입력 필드.
 * 두 모드가 같은 className/style 을 공유하므로 글꼴·색·크기가 항상 일치한다.
 *  - multiline=true  → 자동 높이 <textarea>
 *  - multiline=false → 한 줄 <input>
 */
/* 리치 텍스트 글꼴 옵션 (전역 글꼴 목록과 동일) */
const RICH_FONTS: { v: string; label: string }[] = [
  { v: '', label: '기본' },
  { v: "'Nanum Gothic', sans-serif", label: '나눔고딕' },
  { v: "'Nanum Myeongjo', serif", label: '나눔명조' },
  { v: 'Georgia, serif', label: 'Georgia' },
  { v: "'Courier New', monospace", label: 'Courier' },
];

const isHtml = (v?: string) => !!v && /<[a-z][\s\S]*>/i.test(v);

/* 값이 HTML 인지 plain 인지에 따라 렌더(읽기 모드 공용).
   저장된 리치텍스트 HTML 은 공개 페이지에 그대로 노출되므로 출력 직전 sanitize 로
   <script>·on* 핸들러 등 악성 마크업을 제거한다(저장형 XSS 방어). 정상 서식은 유지. */
const RichRead: React.FC<{ value?: string; Tag: ElementType; className?: string; style?: React.CSSProperties; highlightColor?: string }> =
  ({ value, Tag, className, style, highlightColor }) => {
    if (isHtml(value)) return <Tag className={className} style={{ ...style, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value!) }} />;
    return <Tag className={className} style={style}>{renderRichText(value || '', highlightColor)}</Tag>;
  };

/**
 * RichEditable — contentEditable 기반 인라인 리치 에디터.
 * 드래그로 선택한 글자에 글자크기/색/배경/글꼴(execCommand)을 적용하고, 정렬은 문단 단위.
 * 저장 형식은 HTML 문자열. (WIDGET_CRITERIA §0-5 — 동일 코어가 read/edit 처리)
 */
const RichEditable: React.FC<{ value?: string; onChange?: (v: string) => void; className?: string; style?: React.CSSProperties; placeholder?: string }> =
  ({ value, onChange, className = '', style, placeholder }) => {
    const ref = useRef<HTMLDivElement>(null);
    const savedRange = useRef<Range | null>(null);
    const lastHtml = useRef<string>(value || '');
    const [active, setActive] = useState(false);
    const [size, setSize] = useState<number | ''>('');

    useEffect(() => {
      const el = ref.current; if (!el) return;
      /* 외부에서 value 가 바뀌면(undo/redo 포함) 포커스 여부와 무관하게 DOM 을 맞춘다.
         일반 타이핑은 value===lastHtml 이라 재동기화되지 않아 캐럿이 튀지 않는다. */
      if ((value || '') !== lastHtml.current) {
        el.innerHTML = value || ''; lastHtml.current = value || '';
      }
    }, [value]);
    useEffect(() => { if (ref.current) { ref.current.innerHTML = value || ''; lastHtml.current = value || ''; } }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const emit = () => { const html = ref.current?.innerHTML || ''; lastHtml.current = html; onChange?.(html); };
    const saveSel = () => {
      const s = window.getSelection();
      if (s && s.rangeCount && ref.current && ref.current.contains(s.anchorNode)) savedRange.current = s.getRangeAt(0).cloneRange();
    };
    const restoreSel = () => {
      const s = window.getSelection();
      if (savedRange.current && s) { s.removeAllRanges(); s.addRange(savedRange.current); }
    };
    const exec = (cmd: string, val?: string) => {
      ref.current?.focus(); restoreSel();
      try { document.execCommand('styleWithCSS', false, 'true'); document.execCommand(cmd, false, val); } catch { /* noop */ }
      emit(); saveSel();
    };
    /* 글자 크기: 포커스를 옮기지 않고(=숫자칸 타이핑 유지) 저장된 Range 를 직접 span 으로 감싼다. */
    const applySize = (px: number) => {
      const range = savedRange.current;
      if (!range || range.collapsed || !ref.current?.contains(range.commonAncestorContainer)) return;
      try {
        const span = document.createElement('span');
        span.style.fontSize = `${px}px`;
        const frag = range.extractContents();
        frag.querySelectorAll('*').forEach(d => { const he = d as HTMLElement; if (he.style && he.style.fontSize) he.style.fontSize = ''; }); // 중첩 방지
        span.appendChild(frag);
        range.insertNode(span);
        // 선택 영역을 새 span 으로 갱신(연속 적용 대비)
        const nr = document.createRange(); nr.selectNodeContents(span);
        savedRange.current = nr.cloneRange();
        const sel = window.getSelection();
        if (sel && document.activeElement === ref.current) { sel.removeAllRanges(); sel.addRange(nr); }
      } catch { /* noop */ }
      emit();
    };
    const noBlur = (e: React.MouseEvent) => e.preventDefault();

    /* 툴바 위치(고정 좌표) — 에디터 위쪽, 공간 없으면 아래쪽 */
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const place = () => {
      const el = ref.current; if (!el) return;
      // 선택 영역(드래그한 글자)의 우상단 기준, 없으면 에디터 기준
      const sel = window.getSelection();
      let r: DOMRect | undefined;
      if (sel && sel.rangeCount && el.contains(sel.anchorNode)) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        if (rect && (rect.width || rect.height)) r = rect;
      }
      if (!r) r = el.getBoundingClientRect();
      const tbW = toolbarRef.current?.offsetWidth || 420;
      const top = r.top > 60 ? r.top - 52 : r.bottom + 8;
      const left = Math.max(8, Math.min(r.right, window.innerWidth - tbW - 8));
      setPos({ top, left });
    };
    useEffect(() => {
      if (!active) return;
      place();
      const h = () => place();
      window.addEventListener('scroll', h, true);
      window.addEventListener('resize', h);
      // 바깥 클릭 시 닫기 (에디터·툴바 외부)
      const onDown = (e: MouseEvent) => {
        const t = e.target as Node;
        if (ref.current?.contains(t) || toolbarRef.current?.contains(t)) return;
        setActive(false); emit();
      };
      document.addEventListener('mousedown', onDown, true);
      return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); document.removeEventListener('mousedown', onDown, true); };
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <>
        {active && createPortal(
          <div ref={toolbarRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 2147483000 }}
            className="flex items-center gap-1.5 px-2.5 py-2 bg-white border border-gray-300 shadow-[0_6px_20px_rgba(0,0,0,0.2)] rounded-lg flex-wrap"
            onClick={e => e.stopPropagation()}>
            <button onMouseDown={noBlur} onClick={() => exec('bold')} className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 hover:border-gray-400 font-black" title="굵게"><Bold className="w-4 h-4" /></button>
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden h-9" title="글자 크기 (선택 영역, 실시간 적용)">
              <input type="number" value={size} placeholder="px" min={8} max={200}
                onMouseDown={saveSel}
                onChange={e => { const v = e.target.value === '' ? '' : Math.min(200, Math.max(8, Number(e.target.value))); setSize(v); if (v !== '') applySize(Number(v)); }}
                className="w-14 text-sm px-2 py-1 outline-none text-center font-bold h-full" />
              <span className="px-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 border-l border-gray-200 h-full flex items-center">px</span>
            </div>
            <label className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 hover:border-gray-400 cursor-pointer relative" title="글자색">
              <Baseline className="w-4 h-4" />
              <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onMouseDown={saveSel} onChange={e => exec('foreColor', e.target.value)} />
            </label>
            <label className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 hover:border-gray-400 cursor-pointer relative" title="글자 배경색">
              <PaintBucket className="w-4 h-4" />
              <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onMouseDown={saveSel} onChange={e => exec('hiliteColor', e.target.value)} />
            </label>
            <select onMouseDown={saveSel} onChange={e => { exec('fontName', e.target.value); e.currentTarget.selectedIndex = 0; }} title="글꼴"
              className="h-9 text-sm px-2 outline-none border border-gray-200 rounded-md font-bold bg-white">
              {RICH_FONTS.map(f => <option key={f.label} value={f.v}>{f.label}</option>)}
            </select>
            <div className="w-px h-6 bg-gray-200 mx-0.5" />
            <button onMouseDown={noBlur} onClick={() => exec('justifyLeft')} className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 hover:border-gray-400" title="왼쪽 정렬(문단)"><AlignLeft className="w-4 h-4" /></button>
            <button onMouseDown={noBlur} onClick={() => exec('justifyCenter')} className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 hover:border-gray-400" title="가운데 정렬(문단)"><AlignCenter className="w-4 h-4" /></button>
            <button onMouseDown={noBlur} onClick={() => exec('justifyRight')} className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 hover:border-gray-400" title="오른쪽 정렬(문단)"><AlignRight className="w-4 h-4" /></button>
            <button onMouseDown={noBlur} onClick={() => exec('justifyFull')} className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 hover:border-gray-400" title="양쪽 정렬(문단)"><AlignJustify className="w-4 h-4" /></button>
          </div>,
          document.body,
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onFocus={() => setActive(true)}
          onInput={emit}
          onKeyUp={() => { saveSel(); place(); }}
          onMouseUp={() => { saveSel(); place(); }}
          onClick={e => e.stopPropagation()}
          className={`wb-rich ${className}`}
          style={{ ...style, whiteSpace: 'pre-wrap', outline: 'none', width: '100%', minHeight: '1.2em', cursor: 'text' }}
        />
      </>
    );
  };

export const EditText: React.FC<{
  ctx: BlockCtx;
  value: string;
  onChange?: (v: string) => void;
  tag?: ElementType;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  highlightColor?: string;
  multiline?: boolean;
  /** read 모드에서 값이 비면 렌더하지 않음 (edit 모드는 항상 렌더) */
  hideWhenEmpty?: boolean;
}> = ({ ctx, value, onChange, tag: Tag = 'p', className = '', style, placeholder, highlightColor, multiline = true, hideWhenEmpty }) => {
  if (ctx.edit) {
    if (multiline) {
      // 멀티라인 자유 텍스트 = 리치 에디터(드래그 선택 서식 + 문단 정렬)
      return <RichEditable value={value} onChange={onChange} className={className} style={style} placeholder={placeholder} />;
    }
    const editStyle: React.CSSProperties = {
      ...style, background: 'transparent', outline: 'none', width: '100%',
      border: '1px solid transparent', borderRadius: 2,
    };
    return (
      <input
        value={value || ''} placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        onClick={stop} onPointerDown={stop}
        className={`${className} focus:border-orange-300`} style={editStyle}
      />
    );
  }
  if (hideWhenEmpty && !value) return null;
  return <RichRead value={value} Tag={Tag} className={className} style={style} highlightColor={highlightColor} />;
};

/** AddButton — edit 모드에서만 보이는 항목 추가 affordance. */
export const AddBtn: React.FC<{ ctx: BlockCtx; label: string; onClick: () => void; dark?: boolean; className?: string }> =
  ({ ctx, label, onClick, dark, className = '' }) => {
    if (!ctx.edit) return null;
    return (
      <button
        onClick={e => { stop(e); onClick(); }}
        className={`inline-flex items-center gap-1 px-3 py-1.5 border border-dashed text-[11px] font-bold transition-colors rounded ${
          dark ? 'border-white/30 text-white/60 hover:text-white hover:border-white/60'
               : 'border-gray-300 text-gray-400 hover:text-black hover:border-black'
        } ${className}`}>
        <Plus className="w-3 h-3" /> {label}
      </button>
    );
  };

/** RemoveBtn — edit 모드에서만 보이는 항목 삭제 affordance. */
export const RemoveBtn: React.FC<{ ctx: BlockCtx; onClick: () => void; className?: string; dark?: boolean }> =
  ({ ctx, onClick, className = '', dark }) => {
    if (!ctx.edit) return null;
    return (
      <button
        onClick={e => { stop(e); onClick(); }}
        className={`text-[10px] font-bold transition-colors ${dark ? 'text-white/40 hover:text-white' : 'text-red-300 hover:text-red-600'} ${className}`}>
        <X className="w-3 h-3" />
      </button>
    );
  };

export { genId, autosize, stop };

/* ─────────────────────────────────────────────
   Decorative overlays + animation wrapper (read=edit 동일)
───────────────────────────────────────────── */
/** 스크롤 진입 애니메이션. edit 모드에선 애니메이션을 끄고 즉시 표시(편집 방해 방지). */
export const AnimDiv: React.FC<{
  animation?: string; delay?: number; className?: string; style?: React.CSSProperties;
  disabled?: boolean; children: React.ReactNode;
}> = ({ animation, delay = 0, className = '', style = {}, disabled, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [editPlay, setEditPlay] = useState(0);
  const firstRun = useRef(true);
  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [disabled]);
  /* edit 모드: 애니메이션 값이 바뀌면 미리보기로 다시 재생 (key 변경 → 리마운트로 CSS 애니메이션 재시작) */
  useEffect(() => {
    if (!disabled) return;
    if (firstRun.current) { firstRun.current = false; return; }
    setEditPlay(p => p + 1);
  }, [animation, disabled]);
  const hasAnim = !!animation && animation !== 'none';
  const playing = disabled ? hasAnim : (hasAnim && inView);
  const animClass = playing ? `wb-anim-${animation}` : '';
  const finalStyle: React.CSSProperties = playing && delay > 0 ? { ...style, animationDelay: `${delay}s` } : style;
  return (
    <div ref={ref} key={disabled ? `${animation}-${editPlay}` : undefined} className={[animClass, className].filter(Boolean).join(' ')} style={finalStyle}>
      {children}
    </div>
  );
};

const HOVER_CLASS: Record<string, string> = {
  none: '', scale: 'wbr-hover-scale', lift: 'wbr-hover-lift', border: 'wbr-hover-border',
};

const ImgPlaceholder: React.FC<{ label: string; style?: React.CSSProperties; className?: string }> = ({ label, style, className = '' }) => (
  <div className={`w-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 ${className}`} style={style}>
    <span className="text-xs font-bold">{label}</span>
  </div>
);

/* ─────────────────────────────────────────────
   Leaf widgets
───────────────────────────────────────────── */
const TextBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const Tag = (['h1','h2','h3','h4','h5','h6','p'].includes(block.seoTag) ? block.seoTag : (block.type === 'heading' ? 'h2' : 'p')) as ElementType;
  const ptop = block.paddingTop ?? block.paddingY ?? 32;
  const pbot = block.paddingBottom ?? block.paddingY ?? 32;
  const pleft = block.paddingLeft ?? 0;
  const pright = block.paddingRight ?? 0;
  const baseStyle: React.CSSProperties = {
    fontSize: `${block.fontSize || 16}px`,
    fontWeight: block.fontWeight || 400,
    color: block.textColor || '#111827',
    lineHeight: block.lineHeight || 1.7,
    letterSpacing: block.letterSpacing ? `${block.letterSpacing}em` : undefined,
    whiteSpace: 'pre-wrap',
    margin: 0,
  };
  if (block.textStroke && block.textStrokeColor) (baseStyle as any).WebkitTextStroke = `${block.textStroke}px ${block.textStrokeColor}`;
  const hl = block.highlightColor || ctx.themeColor;
  return (
    <div style={{ backgroundColor: block.bgColor || 'transparent', paddingTop: `${ptop}px`, paddingBottom: `${pbot}px`, paddingLeft: `${pleft}px`, paddingRight: `${pright}px` }}>
      <div style={{ maxWidth: block.maxWidth ? `${block.maxWidth}px` : '100%' }} className="mx-auto">
        {/* 애니메이션은 글자에만 적용한다(배경/여백은 정적 유지). */}
        <AnimDiv animation={block.animation} disabled={ctx.edit}>
          <EditText ctx={ctx} tag={Tag} value={block.text} onChange={v => ctx.upd?.('text', v)}
            className={getAlignClass(block.align)} style={baseStyle} highlightColor={hl} placeholder="텍스트를 입력하세요..." />
        </AnimDiv>
      </div>
    </div>
  );
};

const BTN_SIZE: Record<string, string> = {
  s: 'px-6 py-2 text-xs min-w-[100px]',
  m: 'px-10 py-4 text-base min-w-[200px]',
  l: 'px-14 py-5 text-xl min-w-[240px]',
};
const ButtonBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const sizeClass = BTN_SIZE[block.btnSize as string] || BTN_SIZE.m;
  const primary = ctx.themeColor;
  const bg = block.btnBg ?? primary;                 // 미설정 시 테마색으로 채움
  const transparent = bg === 'transparent';
  const bw = block.borderWidth ?? 0;
  const borderColor = block.borderColor || primary;
  const textColor = block.btnTextColor || (transparent ? primary : readableTextOn(bg));
  const shadowClass = `wb-btn-sh-${block.btnShadow || 'none'}`;
  const btnStyle: React.CSSProperties = {
    backgroundColor: bg,
    color: textColor,
    borderRadius: `${block.radius || 0}px`,
    border: bw > 0 ? `${bw}px solid ${borderColor}` : 'none',
    letterSpacing: '0.02em',
    ['--wb-btn-c' as any]: borderColor,
  };
  const handleClick = () => {
    if (!block.actionUrl) return;
    const url = /^https?:\/\//i.test(block.actionUrl) ? block.actionUrl : `https://${block.actionUrl}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const base = `font-black text-center ${sizeClass} ${shadowClass}`;
  return (
    <div className="flex justify-center w-full" style={{ paddingTop: `${block.paddingY ?? 32}px`, paddingBottom: `${block.paddingY ?? 32}px`, backgroundColor: block.bgColor || 'transparent' }}>
      {/* 애니메이션은 텍스트와 동일하게 AnimDiv 가 담당: 공개=뷰 진입 1회, 편집=옵션 선택 시 미리보기 재생 (hover 아님) */}
      <AnimDiv animation={block.btnAnim} disabled={ctx.edit} className="inline-flex">
        {ctx.edit ? (
          <input value={block.text || '버튼 텍스트'} onChange={e => ctx.upd?.('text', e.target.value)} onClick={stop} onPointerDown={stop}
            className={`${base} outline-none`} style={btnStyle} />
        ) : (
          <button onClick={handleClick} className={base} style={btnStyle}>
            {block.text}
          </button>
        )}
      </AnimDiv>
    </div>
  );
};

const ImageBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  /* 비율(aspect)을 지정하면 고정 틀이 생겨 object-fit 이 의미를 갖는다.
     '원본(auto)' 이면 너비%만 적용하고 높이는 이미지 본래 비율을 따른다(틀 없음 → object-fit 무효). */
  const aspect = block.aspect && block.aspect !== 'auto' ? String(block.aspect).replace('/', ' / ') : null;
  const widthPct = `${block.width || 100}%`;
  const radius = `${block.radius || 0}px`;
  const align = block.align || 'center';
  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  const wrap = (children: React.ReactNode) => (
    <div className="w-full flex" style={{
      justifyContent: justify,
      paddingTop: `${block.paddingTop ?? block.paddingY ?? 0}px`,
      paddingBottom: `${block.paddingBottom ?? block.paddingY ?? 0}px`,
      paddingLeft: `${block.paddingLeft ?? 0}px`,
      paddingRight: `${block.paddingRight ?? 0}px`,
      backgroundColor: block.bgColor || 'transparent',
    }}>{children}</div>
  );

  if (!block.src) {
    if (!ctx.edit) return null;
    return wrap(
      <div style={{ width: widthPct }}>
        <ImgPlaceholder label="우측 패널에서 이미지를 설정하세요" className={aspect ? '' : 'h-44'}
          style={{ width: '100%', aspectRatio: aspect || undefined, borderRadius: radius }} />
      </div>
    );
  }

  const media = aspect ? (
    <div style={{ width: '100%', aspectRatio: aspect, borderRadius: radius, overflow: 'hidden' }}>
      <img src={block.src} alt={block.alt || ''} loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: block.objectFit || 'cover', display: 'block' }} />
    </div>
  ) : (
    <img src={block.src} alt={block.alt || ''} loading="lazy"
      style={{ width: '100%', borderRadius: radius, display: 'block' }} />
  );

  const linked = (!ctx.edit && block.href)
    ? <a href={block.href} target={block.linkTarget || '_blank'} rel="noopener noreferrer" style={{ display: 'block' }}>{media}</a>
    : media;

  return wrap(<div style={{ width: widthPct }}>{linked}</div>);
};

const SpacerBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => (
  <div className="w-full relative flex items-center justify-center group/sp" style={{ height: `${block.height || 64}px`, backgroundColor: block.bgColor || 'transparent' }}>
    {ctx.edit && (
      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover/sp:opacity-100 transition-opacity border-y border-dashed border-gray-200">
        <input type="range" min={8} max={640} step={8} value={block.height || 64}
          onClick={stop} onPointerDown={stop} onChange={e => ctx.upd?.('height', Number(e.target.value))}
          className="w-40 accent-orange-500 cursor-ew-resize" />
        <span className="text-xs font-bold text-gray-400 w-12">{block.height || 64}px</span>
      </div>
    )}
  </div>
);

/* 흐르는 띠(ticker) — 콘텐츠가 뷰포트보다 좁아도 끊김 없이 무한 반복되도록
   단일 시퀀스 폭과 컨테이너 폭을 측정해 한 묶음(half)이 항상 화면을 덮을 만큼
   시퀀스를 반복한다. 동일한 half 두 개를 이어 붙이고 -50% 만큼 흐르므로 이음매가 없다. */
const TickerView: React.FC<{ block: any }> = ({ block }) => {
  const items: string[] = (block.tickerItems && block.tickerItems.length) ? block.tickerItems : ['항목을 추가하세요'];
  const sep = block.separator ?? '✦';
  const speed = Math.max(8, Math.min(80, block.speed ?? 24));
  const containerRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLSpanElement>(null);
  const [repeat, setRepeat] = useState(2);

  useEffect(() => {
    const measure = () => {
      const cw = containerRef.current?.offsetWidth ?? 0;
      const sw = seqRef.current?.offsetWidth ?? 0;
      if (sw > 0 && cw > 0) setRepeat(Math.max(2, Math.ceil(cw / sw) + 1));
    };
    measure();
    /* 한글 웹폰트 로드 전 측정하면 시퀀스 폭이 어긋날 수 있어 다음 프레임 + 폰트 로드 후 재측정 */
    requestAnimationFrame(measure);
    (document as any).fonts?.ready?.then(measure).catch(() => {});
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [items.join(''), sep, block.tickerFontSize]);

  const seq = (ref?: React.Ref<HTMLSpanElement>) => (
    <span ref={ref} className="inline-flex" style={{ flexShrink: 0 }}>
      {items.map((t, i) => (
        <span key={i} className="inline-flex items-center" style={{ paddingRight: 64, flexShrink: 0 }}>
          <span style={{ color: block.accentColor || 'rgba(255,255,255,0.55)', marginRight: 16 }}>{sep}</span>{t}
        </span>
      ))}
    </span>
  );
  const half = (withRef: boolean) => (
    <span className="inline-flex" style={{ flexShrink: 0 }}>
      {Array.from({ length: repeat }, (_, i) => (
        <React.Fragment key={i}>{seq(withRef && i === 0 ? seqRef : undefined)}</React.Fragment>
      ))}
    </span>
  );

  return (
    <div ref={containerRef} className="w-full overflow-hidden select-none" style={{ backgroundColor: block.bgColor || '#f97316', paddingTop: `${block.paddingY ?? 14}px`, paddingBottom: `${block.paddingY ?? 14}px` }}>
      <div className="wb-ticker-track" style={{ color: block.textColor || '#ffffff', fontSize: `${block.tickerFontSize || 13}px`, fontWeight: 800, letterSpacing: '0.08em', animationDuration: `${speed * repeat}s` }}>
        {half(true)}<span aria-hidden>{half(false)}</span>
      </div>
    </div>
  );
};

const DividerBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  /* 흐르는 띠(ticker) 변형 — 구분 요소에 편입 */
  if (block.variant === 'ticker') return <TickerView block={block} />;
  return (
    <div className="w-full wb-gutter" style={{ paddingTop: `${block.paddingY || 24}px`, paddingBottom: `${block.paddingY || 24}px`, backgroundColor: block.bgColor || 'transparent' }}>
      <hr style={{ borderStyle: block.style || 'solid', borderTopWidth: `${block.thickness || 1}px`, borderColor: block.color || '#e5e7eb', width: `${block.width || 100}%`, margin: '0 auto' }} />
    </div>
  );
};

/* ─────────────────────────────────────────────
   List widgets
───────────────────────────────────────────── */
/** 리스트 필드(items/cells/…)의 항목 갱신/추가/삭제 헬퍼 */
function listOps(ctx: BlockCtx, block: any, field: string) {
  const arr: any[] = block[field] || [];
  return {
    arr,
    set: (next: any[]) => ctx.upd?.(field, next),
    update: (i: number, patch: any) => ctx.upd?.(field, arr.map((x, j) => j === i ? { ...x, ...patch } : x)),
    add: (item: any) => ctx.upd?.(field, [...arr, item]),
    removeAt: (i: number) => ctx.upd?.(field, arr.filter((_, j) => j !== i)),
  };
}

const StatItemView: React.FC<{ item: any; block: any; animate: boolean }> = ({ item, block, animate }) => {
  const isNum = typeof item.value === 'number';
  const rawNum = isNum ? item.value : parseFloat(String(item.value));
  const suffix = isNum ? (item.suffix || '') : String(item.value).replace(/^[\d,. ]+/, '');
  const isDecimal = !Number.isInteger(rawNum);
  const fmtNum = (n: number) => isDecimal ? n.toFixed(1) : Math.round(n).toLocaleString();
  const staticDisplay = isNaN(rawNum) ? String(item.value) : fmtNum(rawNum) + suffix;
  const [display, setDisplay] = useState(staticDisplay);
  const didAnimate = useRef(false);
  useEffect(() => {
    if (!animate || didAnimate.current || isNaN(rawNum)) return;
    didAnimate.current = true;
    const duration = 1500; const start = Date.now(); let raf: number;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(fmtNum(eased * rawNum) + suffix);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {item.icon && <div className="text-3xl leading-none mb-1">{item.icon}</div>}
      <div className="font-black leading-none tabular-nums" style={{ fontSize: `${block.valueSize || 48}px`, color: block.valueColor || '#111827' }}>{display}</div>
      <div className="font-semibold" style={{ fontSize: `${block.labelSize || 14}px`, color: block.labelColor || '#6b7280' }}>{item.label}</div>
    </>
  );
};

const StatsBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (ctx.edit) return;
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, [ctx.edit]);
  const isCards = block.layout === 'cards';
  const accentColor = block.accentLineColor || ctx.themeColor;
  const ops = listOps(ctx, block, 'items');
  return (
    <div ref={ref} className="wbr-grid-wrap" style={{ backgroundColor: block.bgColor || '#ffffff', paddingTop: `${block.paddingY || 56}px`, paddingBottom: `${block.paddingY || 56}px` }}>
      <div className="wb-gutter wb-inner wbr-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${block.cols || 3}, 1fr)`, gap: isCards ? '20px' : '24px' }}>
        {ops.arr.map((item: any, i: number) => {
          const inner = ctx.edit ? (
            <>
              <input value={item.value ?? ''} onChange={e => ops.update(i, { value: e.target.value })} onClick={stop} onPointerDown={stop}
                className="bg-transparent outline-none border-b-2 border-transparent focus:border-orange-400 text-center font-black w-full tabular-nums"
                style={{ fontSize: `${block.valueSize || 48}px`, color: block.valueColor || '#111827', lineHeight: 1 }} />
              <input value={item.label ?? ''} onChange={e => ops.update(i, { label: e.target.value })} onClick={stop} onPointerDown={stop}
                className="bg-transparent outline-none border-b border-transparent focus:border-orange-300 text-center font-semibold w-full"
                style={{ fontSize: `${block.labelSize || 14}px`, color: block.labelColor || '#6b7280' }} />
            </>
          ) : <StatItemView item={item} block={block} animate={seen && block.animate !== false} />;
          return (
            <div key={item.id} className="relative flex flex-col items-center gap-2 text-center" style={isCards ? {
              backgroundColor: block.cardBg || '#f9fafb', borderRadius: `${block.cardRadius ?? 12}px`, padding: 28,
              border: `1px solid ${block.borderColor || '#e5e7eb'}`,
              borderTop: block.accentLine !== false ? `4px solid ${accentColor}` : `1px solid ${block.borderColor || '#e5e7eb'}`,
            } : undefined}>
              {inner}
              {ctx.edit && ops.arr.length > 1 && <RemoveBtn ctx={ctx} onClick={() => ops.removeAt(i)} className="absolute top-1 right-1" />}
            </div>
          );
        })}
      </div>
      {ctx.edit && ops.arr.length < 6 && (
        <div className="flex justify-center mt-4">
          <AddBtn ctx={ctx} label="항목 추가" onClick={() => ops.add({ id: genId(), icon: '', value: '0+', label: '새 통계' })} />
        </div>
      )}
    </div>
  );
};

const FaqRow: React.FC<{ item: any; idx: number; block: any; ctx: BlockCtx; onUpdate: (f: string, v: string) => void; onDelete: () => void }> = ({ item, idx, block, ctx, onUpdate, onDelete }) => {
  const [open, setOpen] = useState(ctx.edit);
  const isArrow = block.iconStyle === 'arrow';
  if (ctx.edit) {
    return (
      <div>
        <div className="flex items-center gap-3 px-5 py-4 bg-white">
          <button onClick={e => { stop(e); setOpen(o => !o); }} className="font-black text-xs text-gray-400 shrink-0 w-5 text-left">{idx + 1}</button>
          <input value={item.question || ''} onChange={e => onUpdate('question', e.target.value)} onClick={stop} onPointerDown={stop}
            className="flex-1 font-bold outline-none bg-transparent text-sm" placeholder="질문을 입력하세요" />
          <button onClick={e => { stop(e); setOpen(o => !o); }} className="text-gray-400 text-sm shrink-0">{isArrow ? (open ? '↑' : '↓') : (open ? '−' : '+')}</button>
          <button onClick={e => { stop(e); onDelete(); }} className="text-red-400 hover:text-red-600 text-xs font-bold shrink-0 ml-1">✕</button>
        </div>
        {open && (
          <div className="px-5 py-4 border-t border-gray-100" style={{ backgroundColor: block.openBg || '#fff7ed' }}>
            <textarea value={item.answer || ''} onChange={e => onUpdate('answer', e.target.value)} onClick={stop} onPointerDown={stop} ref={autosize}
              className="w-full bg-transparent outline-none font-medium text-gray-600 resize-none text-sm leading-relaxed" style={{ overflow: 'hidden', minHeight: '1.5em' }} placeholder="답변을 입력하세요" />
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-gray-50 text-left transition-colors">
        <span className="font-bold flex-1 text-sm">{item.question}</span>
        <span className="shrink-0 font-black text-lg leading-none transition-transform duration-300" style={{ color: ctx.themeColor, transform: open ? (isArrow ? 'rotate(180deg)' : 'rotate(45deg)') : 'rotate(0deg)', display: 'inline-block' }}>{isArrow ? '↓' : '+'}</span>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="px-5 py-4 border-t border-gray-100 text-gray-600 font-medium text-sm leading-relaxed" style={{ backgroundColor: block.openBg || '#fff7ed' }}>{item.answer}</div>
        </div>
      </div>
    </div>
  );
};

const FaqBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const ops = listOps(ctx, block, 'items');
  return (
    <div className="wb-gutter max-w-3xl mx-auto w-full" style={{ paddingTop: `${block.paddingY ?? 80}px`, paddingBottom: `${block.paddingY ?? 80}px`, backgroundColor: block.bgColor || 'transparent' }}>
      {(ctx.edit || block.title) && (
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-5 h-5 shrink-0" style={{ color: ctx.themeColor }} />
          <EditText ctx={ctx} tag="h2" multiline={false} value={block.title} onChange={v => ctx.upd?.('title', v)} className="text-2xl font-black w-full" placeholder="자주 묻는 질문" />
        </div>
      )}
      <div className="border-2 border-black divide-y divide-black overflow-hidden" style={{ borderRadius: `${block.borderRadius || 0}px` }}>
        {ops.arr.map((item: any, i: number) => (
          <FaqRow key={item.id} item={item} idx={i} block={block} ctx={ctx} onUpdate={(f, v) => ops.update(i, { [f]: v })} onDelete={() => ops.removeAt(i)} />
        ))}
      </div>
      {ctx.edit && <div className="mt-3"><AddBtn ctx={ctx} label="FAQ 항목 추가" onClick={() => ops.add({ id: genId(), question: '새 질문', answer: '답변을 입력하세요.' })} className="w-full justify-center !py-2.5" /></div>}
    </div>
  );
};

const TlDot: React.FC<{ idx: number; activeColor: string }> = ({ idx, activeColor }) => (
  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-sm shrink-0 z-10"
    style={idx === 0 ? { backgroundColor: activeColor, color: '#fff', borderColor: activeColor } : { backgroundColor: '#fff', color: '#111', borderColor: '#000' }}>{idx + 1}</div>
);

const TimelineBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const layout = block.layout || 'vertical-left';
  const ops = listOps(ctx, block, 'nodes');
  const active = block.activeColor || '#f97316';
  const line = block.lineColor || '#111827';
  const NodeContent: React.FC<{ node: any; i: number; right?: boolean; small?: boolean }> = ({ node, i, right, small }) => (
    <div className={right ? 'text-right' : (small ? 'text-center w-full' : '')}>
      {ctx.edit ? (
        <>
          <div className={`flex items-start gap-1 ${right ? 'flex-row-reverse' : small ? 'justify-center' : ''}`}>
            <input value={node.title || ''} onChange={e => ops.update(i, { title: e.target.value })} onClick={stop} onPointerDown={stop}
              className={`font-black bg-transparent outline-none border-b border-transparent focus:border-orange-500 ${small ? 'text-sm text-center min-w-0 flex-1' : 'text-base flex-1'} ${right ? 'text-right' : ''}`} placeholder="단계 제목" />
            <RemoveBtn ctx={ctx} onClick={() => ops.removeAt(i)} className="mt-1.5" />
          </div>
          <textarea value={node.desc || ''} onChange={e => ops.update(i, { desc: e.target.value })} onClick={stop} onPointerDown={stop} ref={autosize}
            className={`text-gray-500 w-full bg-transparent outline-none mt-1.5 resize-none border border-transparent focus:border-gray-300 leading-relaxed ${small ? 'text-xs text-center' : 'text-sm'} ${right ? 'text-right' : ''}`} style={{ overflow: 'hidden', minHeight: '1.5em' }} placeholder="설명" />
        </>
      ) : (
        <>
          <h3 className={`font-black ${small ? 'text-sm' : 'text-base'}`}>{node.title}</h3>
          <p className={`text-gray-500 mt-1 leading-relaxed ${small ? 'text-xs' : 'text-sm mt-1.5'}`}>{node.desc}</p>
        </>
      )}
    </div>
  );
  return (
    <div className="wb-gutter max-w-3xl mx-auto w-full overflow-hidden" style={{ paddingTop: `${block.paddingY ?? 80}px`, paddingBottom: `${block.paddingY ?? 80}px`, backgroundColor: block.bgColor || 'transparent' }}>
      {(ctx.edit || block.title) && (
        <div className="flex items-center gap-3 mb-10">
          <Clock className="w-5 h-5 shrink-0" style={{ color: ctx.themeColor }} />
          <EditText ctx={ctx} tag="h2" multiline={false} value={block.title} onChange={v => ctx.upd?.('title', v)} className="text-2xl font-black w-full" placeholder="제목 (비우면 숨김)" />
        </div>
      )}
      {layout === 'checklist' && (
        <div className="wbr-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${block.cols || 1}, minmax(0, 1fr))`, gap: '18px 40px' }}>
          {ops.arr.map((node: any, i: number) => (
            <div key={node.id} className="flex items-start gap-4 min-w-0 group/fli">
              <span className="shrink-0 flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: active, marginTop: 2 }}>
                {(block.checklistIcon || 'check') === 'check'
                  ? <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>
                  : <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#fff', display: 'block' }} />}
              </span>
              <div className="min-w-0 flex-1">
                {ctx.edit ? (
                  <>
                    <div className="flex items-start gap-1">
                      <input value={node.title || ''} onChange={e => ops.update(i, { title: e.target.value })} onClick={stop} onPointerDown={stop}
                        className="font-bold flex-1 min-w-0 bg-transparent outline-none border-b border-transparent focus:border-orange-300" placeholder="항목" />
                      <RemoveBtn ctx={ctx} onClick={() => ops.removeAt(i)} className="mt-1 opacity-0 group-hover/fli:opacity-100 transition-opacity" />
                    </div>
                    <input value={node.desc || ''} onChange={e => ops.update(i, { desc: e.target.value })} onClick={stop} onPointerDown={stop}
                      className="text-sm mt-0.5 w-full bg-transparent outline-none border-b border-transparent focus:border-gray-300 text-gray-400" placeholder="보조 설명 (선택)" />
                  </>
                ) : (
                  <>
                    <div className="font-bold leading-relaxed">{node.title}</div>
                    {node.desc && <div className="text-sm mt-1 text-gray-400">{node.desc}</div>}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {layout === 'vertical-left' && (
        <div className="relative">
          {ops.arr.length > 1 && <div className="absolute left-4 top-5 bottom-5 w-0.5" style={{ backgroundColor: line }} />}
          <div className="flex flex-col">
            {ops.arr.map((node: any, i: number) => (
              <div key={node.id} className="flex gap-6 pb-10 last:pb-0"><TlDot idx={i} activeColor={active} /><div className="flex-1 pt-1 min-w-0"><NodeContent node={node} i={i} /></div></div>
            ))}
          </div>
        </div>
      )}
      {layout === 'vertical-center' && (
        <div className="relative">
          {ops.arr.length > 1 && <div className="absolute left-1/2 top-5 bottom-5 w-0.5 -translate-x-1/2" style={{ backgroundColor: line }} />}
          <div className="flex flex-col">
            {ops.arr.map((node: any, i: number) => {
              const isEven = i % 2 === 0;
              return (
                <div key={node.id} className="flex items-start gap-6 pb-10 last:pb-0">
                  <div className="flex-1 pt-1 min-w-0">{isEven && <NodeContent node={node} i={i} right />}</div>
                  <TlDot idx={i} activeColor={active} />
                  <div className="flex-1 pt-1 min-w-0">{!isEven && <NodeContent node={node} i={i} />}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {layout === 'horizontal' && (
        <div className="overflow-x-auto pb-2">
          <div className="relative flex" style={{ minWidth: `${Math.max(ops.arr.length * 140, 300)}px` }}>
            {ops.arr.length > 1 && <div className="absolute top-4 h-0.5 z-0" style={{ backgroundColor: line, left: '36px', right: '36px' }} />}
            {ops.arr.map((node: any, i: number) => (
              <div key={node.id} className="flex-1 flex flex-col items-center gap-3 relative z-10 px-1"><TlDot idx={i} activeColor={active} /><NodeContent node={node} i={i} small /></div>
            ))}
          </div>
        </div>
      )}
      {ctx.edit && <div className="mt-4"><AddBtn ctx={ctx} label="단계 추가" onClick={() => ops.add({ id: genId(), title: '새 단계', desc: '설명을 입력하세요.' })} /></div>}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Container widgets
───────────────────────────────────────────── */
const mkSlide = () => ({ id: genId(), bgType: 'color', bgValue: '#111111', overlayOpacity: 0, h1: '메인 카피를\n입력하세요', subtitle: '서브 카피를 입력하세요', href: '', align: 'center' });
const mkCell = (n: number) => ({ id: genId(), title: `카드 제목 ${n}`, text: '여기에 내용을 입력하세요.', align: 'left', bgColor: '#ffffff', textColor: '#374151', titleColor: '#111827', titleSize: 18, textSize: 14, padding: 24, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', imgSrc: '', imgPosition: 'top', imgHeight: 180 });

const HeroSliderBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const slides: any[] = block.slides && block.slides.length ? block.slides : [mkSlide()];
  const [si, setSi] = useState(0);
  const anim = block.slideAnim || 'slide';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idx = Math.min(si, slides.length - 1);
  const updSlide = (field: string, val: any) => ctx.upd?.('slides', slides.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  useEffect(() => {
    if (ctx.edit || !block.autoPlay || slides.length <= 1) return;
    timerRef.current = setInterval(() => setSi(i => (i + 1) % slides.length), block.interval || 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ctx.edit, block.autoPlay, block.interval, slides.length]);

  const themeColor = ctx.themeColor;
  const isLight = themeColor === '#ffffff' || ctx.activeTheme === 'white';

  if (ctx.edit) {
    const slide = slides[idx];
    const bgStyle = slide.bgType === 'image' && slide.bgValue
      ? { backgroundImage: `url(${slide.bgValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: slide.bgValue || '#111111' };
    return (
      <div className="relative w-full overflow-hidden" style={{ ...bgStyle, minHeight: `${block.height || 60}vh` }}>
        {slide.bgType === 'image' && slide.bgValue && <div className="absolute inset-0 bg-black" style={{ opacity: (slide.overlayOpacity || 0) / 100 }} />}
        <div className={`relative z-10 flex flex-col justify-center wb-gutter py-8 md:py-12 h-full ${slide.align === 'center' ? 'items-center text-center' : slide.align === 'right' ? 'items-end text-right' : 'items-start text-left'}`} style={{ minHeight: `${block.height || 60}vh` }}>
          <EditText ctx={ctx} tag="h1" value={slide.h1} onChange={v => updSlide('h1', v)} className="font-black text-white leading-tight max-w-2xl" style={{ fontSize: `clamp(28px, 4.5vw, ${block.h1Size || 48}px)` }} placeholder="메인 카피 (H1)" />
          <EditText ctx={ctx} tag="p" value={slide.subtitle} onChange={v => updSlide('subtitle', v)} className="text-white/70 mt-4 max-w-2xl" style={{ fontSize: `clamp(14px, 1.5vw, ${block.subtitleSize || 18}px)` }} placeholder="서브 카피" />
          {slide.href && <div className="mt-6 inline-flex items-center gap-1 text-white/50 text-[11px] font-bold"><span>🔗 클릭 시 이동: {slide.href}</span></div>}
        </div>
        {/* 슬라이드 네비 — 좌상단 명칭 우측(우측 위젯 툴바와 겹치지 않도록) */}
        <div className="absolute top-1 left-16 flex flex-wrap gap-1 z-20">
          {slides.map((_, i) => (
            <button key={i} onClick={e => { stop(e); setSi(i); }} className={`px-2 py-0.5 text-[9px] font-black border border-white/50 transition-colors ${i === idx ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>{i + 1}</button>
          ))}
          {slides.length < 4 && <button onClick={e => { stop(e); ctx.upd?.('slides', [...slides, mkSlide()]); setSi(slides.length); }} className="px-2 py-0.5 text-[9px] font-black border border-white/50 text-white hover:bg-white/20 transition-colors">+ 슬라이드</button>}
          {slides.length > 1 && <button onClick={e => { stop(e); ctx.upd?.('slides', slides.filter((_, i) => i !== idx)); setSi(Math.max(0, idx - 1)); }} className="px-2 py-0.5 text-[9px] font-black border border-white/50 text-white hover:bg-red-500/60 transition-colors">삭제</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: `${block.height || 60}vh` }}>
      {slides.map((slide, i) => {
        const bgStyle = slide.bgType === 'image' && slide.bgValue
          ? { backgroundImage: `url(${slide.bgValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundColor: slide.bgValue || '#111111' };
        const slideStyle = anim === 'fade'
          ? { opacity: i === idx ? 1 : 0, zIndex: i === idx ? 1 : 0, transition: 'opacity 0.8s ease' }
          : { transform: `translateX(${(i - idx) * 100}%)`, transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)', zIndex: 1 };
        return (
          <div key={slide.id} className="absolute inset-0" style={{ ...bgStyle, ...slideStyle }}>
            {slide.bgType === 'image' && slide.bgValue && <div className="absolute inset-0 bg-black" style={{ opacity: (slide.overlayOpacity || 0) / 100 }} />}
            <div className={`relative z-10 h-full flex flex-col justify-center wb-gutter wb-inner py-8 md:py-12 ${slide.align === 'center' ? 'items-center text-center' : slide.align === 'right' ? 'items-end text-right' : 'items-start text-left'} ${slide.href ? 'cursor-pointer' : ''}`}
              onClick={slide.href ? () => window.open(slide.href, '_blank', 'noopener,noreferrer') : undefined}>
              {slide.h1 && <h1 className="font-black text-white leading-tight whitespace-pre-line max-w-full" style={{ fontSize: `clamp(28px, 4.5vw, ${block.h1Size || 48}px)` }}>{renderRichText(slide.h1, themeColor)}</h1>}
              {slide.subtitle && <p className="text-white/70 mt-4 max-w-full" style={{ fontSize: `clamp(14px, 1.5vw, ${block.subtitleSize || 18}px)` }}>{renderRichText(slide.subtitle, themeColor)}</p>}
            </div>
          </div>
        );
      })}
      {slides.length > 1 && (
        <>
          <button onClick={() => setSi(i => (i - 1 + slides.length) % slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white w-10 h-10 flex items-center justify-center rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => setSi(i => (i + 1) % slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white w-10 h-10 flex items-center justify-center rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {slides.map((_, i) => <button key={i} onClick={() => setSi(i)} className={`w-2 h-2 rounded-full border border-white transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`} />)}
          </div>
        </>
      )}
    </div>
  );
};

const LayoutCellInner: React.FC<{ cell: any; block?: any; ctx: BlockCtx; onCell: (field: string, val: any) => void }> = ({ cell, ctx, onCell }) => {
  const pos = cell.imgPosition || 'top';
  const imgH = cell.imgHeight || 180;
  const onBg = pos === 'bg' && cell.imgSrc;
  const cellImg = cell.imgSrc ? <img src={cell.imgSrc} alt="" loading="lazy" className="w-full object-cover shrink-0" style={{ height: `${imgH}px`, borderRadius: pos === 'top' || pos === 'bottom' ? '4px' : undefined }} /> : null;
  const titleEl = (ctx.edit || cell.title) ? (
    <EditText ctx={ctx} tag="h3" multiline={false} value={cell.title} onChange={v => onCell('title', v)}
      className="font-black mb-2 max-w-full" style={{ fontSize: `clamp(14px, 1.6vw, ${cell.titleSize || 18}px)`, color: onBg ? '#ffffff' : (cell.titleColor || '#111827'), textAlign: cell.align || 'left' }} placeholder="카드 제목" />
  ) : null;
  const textEl = (ctx.edit || cell.text) ? (
    <EditText ctx={ctx} tag="p" value={cell.text} onChange={v => onCell('text', v)}
      className="leading-relaxed max-w-full" style={{ fontSize: `clamp(12px, 1.1vw, ${cell.textSize || 14}px)`, color: onBg ? 'rgba(255,255,255,0.8)' : (cell.textColor || '#374151'), textAlign: cell.align || 'left', whiteSpace: 'pre-wrap' }} placeholder="카드 내용" />
  ) : null;
  const arrow = cell.showArrow ? (
    <div className="mt-3 flex items-center" style={{ color: cell.titleColor || ctx.themeColor, justifyContent: cell.align === 'right' ? 'flex-end' : cell.align === 'center' ? 'center' : 'flex-start' }}>
      <span className="text-lg font-black transition-transform group-hover/cell:translate-x-1">→</span>
    </div>
  ) : null;

  if (onBg) {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundImage: `url(${cell.imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: `${cell.borderRadius || 8}px`, border: `${cell.borderWidth || 1}px solid ${cell.borderColor || '#e5e7eb'}`, minHeight: `${imgH}px` }}>
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(cell.bgOverlay ?? 40) / 100})` }} />
        <div className="relative z-10" style={{ padding: `${cell.padding || 24}px` }}>{titleEl}{textEl}{arrow}</div>
      </div>
    );
  }
  if ((pos === 'left' || pos === 'right') && cell.imgSrc) {
    return (
      <div className="wbr-cell-lr overflow-hidden w-full h-full" style={{ backgroundColor: cell.bgColor || '#fff', borderRadius: `${cell.borderRadius || 8}px`, border: `${cell.borderWidth || 1}px solid ${cell.borderColor || '#e5e7eb'}`, display: 'flex', flexDirection: pos === 'left' ? 'row' : 'row-reverse' }}>
        <img src={cell.imgSrc} alt="" loading="lazy" className="object-cover shrink-0 wbr-cell-lr-img" style={{ width: `${cell.imgWidth || 40}%`, maxHeight: '240px' }} />
        <div style={{ padding: `${cell.padding || 24}px`, flex: 1 }}>{titleEl}{textEl}{arrow}</div>
      </div>
    );
  }
  return (
    <div className="w-full h-full" style={{ backgroundColor: cell.bgColor || '#fff', padding: `${cell.padding || 24}px`, borderRadius: `${cell.borderRadius || 8}px`, border: `${cell.borderWidth || 1}px solid ${cell.borderColor || '#e5e7eb'}` }}>
      {pos !== 'bottom' && cellImg && <div className="mb-4">{cellImg}</div>}
      {titleEl}{textEl}{arrow}
      {pos === 'bottom' && cellImg && <div className="mt-4">{cellImg}</div>}
    </div>
  );
};

const LayoutCell: React.FC<{ cell: any; block: any; ctx: BlockCtx; cellIdx: number; onCell: (field: string, val: any) => void; onRemove?: () => void }> = ({ cell, block, ctx, cellIdx, onCell, onRemove }) => {
  const hoverCls = ctx.edit ? '' : (HOVER_CLASS[cell.hoverEffect || (block.cellHover || 'lift')] || '');
  const gridStyle: React.CSSProperties = { gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined, gridRow: cell.rowSpan ? `span ${cell.rowSpan}` : undefined };
  const inner = <LayoutCellInner cell={cell} block={block} ctx={ctx} onCell={onCell} />;
  const body = ctx.edit ? (
    <div className="relative">
      {inner}
      {onRemove && <RemoveBtn ctx={ctx} onClick={onRemove} className="absolute top-1 right-1 z-10" />}
    </div>
  ) : inner;
  if (!ctx.edit && cell.href) {
    return (
      <AnimDiv animation={block.cellAnimation} delay={cellIdx * 0.08} className={`wbr-cell-wrap group/cell ${hoverCls}`.trim()} style={gridStyle}>
        <a href={cell.href} target={cell.linkTarget || '_self'} rel={cell.linkTarget === '_blank' ? 'noopener noreferrer' : undefined} className="block h-full">{inner}</a>
      </AnimDiv>
    );
  }
  return (
    <AnimDiv animation={block.cellAnimation} disabled={ctx.edit} delay={cellIdx * 0.08} className={`wbr-cell-wrap group/cell ${hoverCls}`.trim()} style={gridStyle}>{body}</AnimDiv>
  );
};

const LayoutContainerBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const mode = block.mode || 'grid';
  const ops = listOps(ctx, block, 'cells');
  const cells = ops.arr;
  const cols = block.cols || 2;
  const gap = block.gap ?? 20;
  const paddingY = block.paddingY ?? 80;
  const paddingX = block.paddingX ?? 32;
  const themeColor = ctx.themeColor;
  const onCellField = (i: number) => (field: string, val: any) => ops.update(i, { [field]: val });
  const containerStyle: React.CSSProperties = { backgroundColor: block.bgColor || 'transparent', paddingTop: `${paddingY}px`, paddingBottom: `${paddingY}px`, position: 'relative' };

  const [tabIdx, setTabIdx] = useState(0);
  const [carIdx, setCarIdx] = useState(0);
  const [paused, setPaused] = useState(!block.autoplay);
  /* 패널에서 autoplay 를 토글하면 즉시 반영 (초기값 고정 버그 방지) */
  useEffect(() => { setPaused(!block.autoplay); }, [block.autoplay]);
  useEffect(() => {
    if (ctx.edit || mode !== 'carousel' || paused || cells.length <= cols) return;
    const interval = Math.max(2000, Math.min(15000, block.interval || 5000));
    const t = setInterval(() => setCarIdx(i => (i >= Math.max(0, cells.length - cols) ? 0 : i + 1)), interval);
    return () => clearInterval(t);
  }, [ctx.edit, mode, paused, cells.length, cols, block.interval]);

  const addCellBtn = ctx.edit ? <div className="flex justify-center mt-3"><AddBtn ctx={ctx} label="셀 추가" onClick={() => ops.add(mkCell(cells.length + 1))} /></div> : null;

  // TABS
  if (mode === 'tabs') {
    const tabPos = block.tabPosition || 'top';
    const active = Math.min(tabIdx, cells.length - 1);
    const tabBar = (
      <div className={`flex ${tabPos === 'left' ? 'flex-col' : 'overflow-x-auto'} gap-1.5`} style={{ borderBottom: tabPos === 'top' ? `1px solid ${block.tabBorderColor || '#e5e7eb'}` : undefined, marginBottom: tabPos === 'top' ? '24px' : 0 }}>
        {cells.map((cell: any, i: number) => {
          const isActive = i === active;
          return (
            <button key={cell.id} onClick={e => { stop(e); setTabIdx(i); }} className="px-4 py-2 text-sm font-black transition-colors text-left shrink-0"
              style={{ backgroundColor: isActive ? (block.activeTabBg || themeColor) : 'transparent', color: isActive ? (block.activeTabText || '#ffffff') : (block.tabText || '#6b7280'), borderRadius: `${block.tabRadius ?? 6}px`, whiteSpace: 'nowrap' }}>
              {cell.tabLabel || cell.title || `탭 ${i + 1}`}
            </button>
          );
        })}
      </div>
    );
    const activeCell = cells[active];
    return (
      <div style={containerStyle}>
        <div className="mx-auto wb-gutter" style={{ position: 'relative', zIndex: 1, maxWidth: block.maxWidth ? `${block.maxWidth}px` : undefined }}>
          {tabPos === 'left' ? (
            <div className="flex gap-8"><div style={{ minWidth: '180px' }}>{tabBar}</div><div className="flex-1 min-w-0">{activeCell && <LayoutCellInner cell={activeCell} block={block} ctx={ctx} onCell={onCellField(active)} />}</div></div>
          ) : (
            <>{tabBar}<div key={activeCell?.id} className={ctx.edit ? '' : 'wb-anim-fadeIn'}>{activeCell && <LayoutCellInner cell={activeCell} block={block} ctx={ctx} onCell={onCellField(active)} />}</div></>
          )}
          {ctx.edit && <div className="mt-3 flex gap-2">{cells.length > 1 && <button onClick={e => { stop(e); ops.removeAt(active); setTabIdx(Math.max(0, active - 1)); }} className="px-3 py-1 border border-dashed border-red-200 hover:border-red-400 text-red-300 hover:text-red-500 text-xs font-bold rounded">− 탭 삭제</button>}<AddBtn ctx={ctx} label="탭 추가" onClick={() => { ops.add(mkCell(cells.length + 1)); setTabIdx(cells.length); }} /></div>}
        </div>
      </div>
    );
  }

  // CAROUSEL
  if (mode === 'carousel') {
    const maxIdx = Math.max(0, cells.length - cols);
    const cur = Math.min(carIdx, maxIdx);
    return (
      <div style={containerStyle}>
        <div className="mx-auto wb-gutter" style={{ position: 'relative', zIndex: 1, maxWidth: block.maxWidth ? `${block.maxWidth}px` : undefined }}>
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(calc(${-cur * (100 / cols)}% - ${cur * (gap / cols)}px))`, gap: `${gap}px` }}>
              {cells.map((cell: any, i: number) => (
                <div key={cell.id} className="shrink-0" style={{ width: `calc(${100 / cols}% - ${(gap * (cols - 1)) / cols}px)` }}>
                  <LayoutCell cell={cell} block={block} ctx={ctx} cellIdx={i} onCell={onCellField(i)} onRemove={cells.length > 1 ? () => ops.removeAt(i) : undefined} />
                </div>
              ))}
            </div>
          </div>
          {cells.length > cols && !ctx.edit && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-1.5">{Array.from({ length: maxIdx + 1 }, (_, i) => <button key={i} onClick={() => setCarIdx(i)} className="w-6 h-1 rounded transition-colors" style={{ backgroundColor: i === cur ? (block.activeTabBg || themeColor) : '#d1d5db' }} />)}</div>
              <div className="flex gap-2">
                {block.autoplay && <button onClick={() => setPaused(p => !p)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs font-black hover:bg-gray-100">{paused ? '▶' : '❚❚'}</button>}
                <button onClick={() => setCarIdx(i => (i <= 0 ? maxIdx : i - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-black hover:bg-gray-100">‹</button>
                <button onClick={() => setCarIdx(i => (i >= maxIdx ? 0 : i + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-black hover:bg-gray-100">›</button>
              </div>
            </div>
          )}
          {addCellBtn}
        </div>
      </div>
    );
  }

  // GRID (default)
  return (
    <div className="wbr-grid-wrap" style={containerStyle}>
      <div className="mx-auto wbr-grid" style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: block.rowHeight ? `${block.rowHeight}px` : 'auto', gap: `${gap}px`, position: 'relative', zIndex: 1,
        paddingLeft: block.paddingX != null ? `${paddingX}px` : 'clamp(20px, 5vw, 80px)',
        paddingRight: block.paddingX != null ? `${paddingX}px` : 'clamp(20px, 5vw, 80px)',
        maxWidth: block.maxWidth ? `${block.maxWidth}px` : undefined,
      }}>
        {cells.map((cell: any, i: number) => (
          <LayoutCell key={cell.id} cell={cell} block={block} ctx={ctx} cellIdx={i} onCell={onCellField(i)} onRemove={cells.length > 1 ? () => ops.removeAt(i) : undefined} />
        ))}
      </div>
      {addCellBtn}
    </div>
  );
};

const CD_UNITS: [string, number, string][] = [['days', 86400000, '일'], ['hours', 3600000, '시'], ['mins', 60000, '분'], ['secs', 1000, '초']];
const CountdownBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const acc = block.accentColor || ctx.themeColor;
  /* 종료 시간: 직접 입력(endAt) 우선, 없으면 진행 중 모집 마감일(deadline) */
  const target = block.endAt ? new Date(block.endAt).getTime() : (ctx.deadline ? new Date(ctx.deadline).getTime() : NaN);
  const calc = () => (isNaN(target) ? null : Math.max(0, target - Date.now()));
  const [diff, setDiff] = useState(calc);
  useEffect(() => {
    if (ctx.edit) return;
    const t = setInterval(() => setDiff(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.endAt, ctx.deadline, ctx.edit]);
  const pad = (n: number) => String(n).padStart(2, '0');

  /* 항상 일·시·분·초 모두 표시(고정). */
  const breakdown = (ms: number): [string, number][] => {
    let rem = ms; const out: [string, number][] = [];
    CD_UNITS.forEach(([, unitMs, label]) => {
      out.push([label, Math.floor(rem / unitMs)]); rem = rem % unitMs;
    });
    return out;
  };

  const UnitBoxes = ({ items, edit }: { items: [string, number][]; edit?: boolean }) => (
    <div className="flex items-end justify-center gap-3 flex-wrap">
      {items.map(([unit, val]) => (
        <div key={unit} className="flex flex-col items-center gap-1.5">
          <div className="font-black tabular-nums leading-none px-3 py-3 border-2 border-black" style={{ backgroundColor: acc, color: '#fff', fontSize: edit ? '34px' : 'clamp(24px, 5vw, 34px)', minWidth: '64px' }}>{pad(val)}</div>
          <span className="text-[11px] font-bold" style={{ color: block.textColor || '#ffffff', opacity: 0.6 }}>{unit}</span>
        </div>
      ))}
    </div>
  );

  // edit 모드: 샘플 값으로 미리보기 + 라벨 편집
  if (ctx.edit) {
    const sampleMs = 7 * 86400000 + 12 * 3600000 + 34 * 60000 + 56 * 1000;
    return (
      <div className="w-full text-center" style={{ backgroundColor: block.bgColor || '#0a0a0a', paddingTop: `${block.paddingY ?? 56}px`, paddingBottom: `${block.paddingY ?? 56}px` }}>
        <input value={block.label || ''} placeholder="라벨 (예: 마감까지)" onChange={e => ctx.upd?.('label', e.target.value)} onClick={stop} onPointerDown={stop}
          className="block mx-auto mb-5 text-center bg-transparent outline-none border-b border-transparent focus:border-current font-black tracking-widest text-sm" style={{ color: block.textColor || '#ffffff' }} />
        <UnitBoxes items={breakdown(sampleMs)} edit />
        <div className="mt-5 text-[11px] font-bold" style={{ color: block.textColor || '#ffffff', opacity: 0.4 }}>
          {block.endAt ? `종료: ${String(block.endAt).replace('T', ' ')}` : 'ⓘ 우측 패널에서 종료 시간을 설정하세요.'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-center" style={{ backgroundColor: block.bgColor || '#0a0a0a', paddingTop: `${block.paddingY ?? 56}px`, paddingBottom: `${block.paddingY ?? 56}px` }}>
      {diff && diff > 0 ? (
        <>
          {block.label && <div className="font-black tracking-widest text-sm mb-5" style={{ color: block.textColor || '#ffffff' }}>{block.label}</div>}
          <UnitBoxes items={breakdown(diff)} />
        </>
      ) : (
        <div className="font-black tracking-widest" style={{ color: block.textColor || '#ffffff', fontSize: 'clamp(18px, 3vw, 24px)' }}>{block.expiredText || '마감되었습니다'}</div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Section (전체 레이아웃 → 섹션 → 행 → 컬럼 → 위젯 스택)
   - 공개 렌더는 이 read-only SectionBlock 가 담당 (단일 코어).
   - 에디터 chrome/DnD 는 Workspace 의 SectionEditor 가 담당하되, 위젯 시각은
     동일하게 BlockBody 를 재사용한다 (top-level 위젯과 동일한 분리 구조).
───────────────────────────────────────────── */
export const mkColumn = () => ({ id: genId(), widgets: [] as any[] });
export const mkRow = (cols = 1, colRatios: number[] | null = null) =>
  ({ id: genId(), cols, gap: 24, colRatios, columns: Array.from({ length: cols }, mkColumn) });
export const mkSection = () =>
  ({ id: genId(), type: 'section', bgType: 'color', bgColor: '#f9fafb', paddingY: 80, paddingX: 32, gap: 32, rows: [mkRow(1)] });

/** 섹션 배경 스타일 (색/그라디언트/이미지). 워터마크·셰이프는 별도 컴포넌트로. */
export function resolveSectionBg(block: any): React.CSSProperties {
  const t = block.bgType || 'color';
  if (t === 'gradient' && block.bgGradient) {
    const g = block.bgGradient;
    return { background: `linear-gradient(${g.angle ?? 135}deg, ${g.from || '#111827'}, ${g.to || '#1f2937'})` };
  }
  if (t === 'image' && block.bgImage) {
    return { backgroundImage: `url(${block.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { backgroundColor: block.bgColor || 'transparent' };
}

/** 행 grid-template-columns 계산 (colRatios 우선, 없으면 균등). */
export const rowGridTemplate = (row: any): string =>
  Array.isArray(row.colRatios) && row.colRatios.length === (row.cols || 1)
    ? row.colRatios.map((x: number) => `${x}fr`).join(' ')
    : `repeat(${row.cols || 1}, minmax(0, 1fr))`;

const SectionBlock: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  const rows: any[] = block.rows || [];
  const hasOverlay = block.bgType === 'image' && (block.bgOverlay ?? 0) > 0;
  return (
    <div className="wb-section" style={{ position: 'relative', overflow: 'hidden', ...resolveSectionBg(block) }}>
      {hasOverlay && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${(block.bgOverlay || 0) / 100})`, zIndex: 1 }} />}
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: block.maxWidth ? `${block.maxWidth}px` : '100%', margin: '0 auto',
        paddingTop: `${block.paddingY ?? 80}px`, paddingBottom: `${block.paddingY ?? 80}px`,
        paddingLeft: `${block.paddingX ?? 32}px`, paddingRight: `${block.paddingX ?? 32}px`,
        display: 'flex', flexDirection: 'column', gap: `${block.gap ?? 32}px`,
      }}>
        {rows.map((row: any) => (
          <div key={row.id} className="wb-section-row" data-collapse={(row.cols || 1) >= 2 ? '' : undefined}
            style={{ display: 'grid', gridTemplateColumns: rowGridTemplate(row), gap: `${row.gap ?? 24}px`, alignItems: 'start' }}>
            {(row.columns || []).map((col: any) => (
              <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: `${row.rowGap ?? row.gap ?? 24}px`, minWidth: 0 }}>
                {(col.widgets || []).map((w: any) => <BlockBody key={w.id} block={w} ctx={ctx} />)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   BlockBody — 단일 디스패처
───────────────────────────────────────────── */
export const BlockBody: React.FC<{ block: any; ctx: BlockCtx }> = ({ block, ctx }) => {
  switch (block.type) {
    case 'section':       return <SectionBlock block={block} ctx={ctx} />;
    case 'text':
    case 'heading':       return <TextBlock block={block} ctx={ctx} />;
    case 'heroSlider':    return <HeroSliderBlock block={block} ctx={ctx} />;
    case 'layoutContainer': return <LayoutContainerBlock block={block} ctx={ctx} />;
    case 'faq':           return <FaqBlock block={block} ctx={ctx} />;
    case 'timeline':      return <TimelineBlock block={block} ctx={ctx} />;
    case 'button':        return <ButtonBlock block={block} ctx={ctx} />;
    case 'image':         return <ImageBlock block={block} ctx={ctx} />;
    case 'spacer':        return <SpacerBlock block={block} ctx={ctx} />;
    case 'divider':       return <DividerBlock block={block} ctx={ctx} />;
    case 'stats':         return <StatsBlock block={block} ctx={ctx} />;
    case 'countdown':     return <CountdownBlock block={block} ctx={ctx} />;
    default:              return null;
  }
};
