import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/* 상단 탭(콘텐츠/디자인/모션)을 적용한 위젯 — 점진 적용. 나머지는 기존 평면 레이아웃 유지. */
const TABBED_WIDGETS = new Set(['text', 'button']);
const PANEL_TABS: { v: 'content' | 'design' | 'motion'; label: string }[] = [
  { v: 'content', label: '콘텐츠' }, { v: 'design', label: '디자인' }, { v: 'motion', label: '모션' },
];
import { X, Trash2, ChevronUp, ChevronDown, Plus, Info } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { genId, BlockBody, resolveThemeHex } from '../../components/blockKit';

/* 우측 패널 탭 컨텍스트 — Section 이 자신의 tab 과 활성 탭이 다르면 숨는다.
   '__all__' 이면(탭 미적용 위젯) 모든 Section 을 보여준다(점진 적용 안전장치). */
const PanelTabCtx = React.createContext<string>('__all__');

/* 버튼 디자인 템플릿 선택 모달 — 좁은 우측 패널 대신 넓은 모달에서 큰 미리보기로 고른다. */
const BtnTemplateModal: React.FC<{ primary: string; activeId?: string; onPick: (preset: Record<string, any>, id: string) => void; onClose: () => void }> =
  ({ primary, activeId, onPick, onClose }) => createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto hide-scrollbar border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.85)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-black sticky top-0 bg-white">
          <h3 className="font-black text-base">버튼 디자인 템플릿</h3>
          <button onClick={onClose} className="p-1.5 border border-gray-200 hover:border-black rounded transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BTN_TEMPLATES.map(t => {
            const active = activeId === t.id;
            return (
              <button key={t.id} onClick={() => { onPick(t.preset(primary), t.id); onClose(); }}
                className={`flex flex-col items-center gap-2.5 border-2 rounded-lg p-4 transition-colors ${active ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-black'}`}>
                <span className="font-black inline-flex items-center justify-center" style={{ padding: '10px 22px', fontSize: 13, ...t.chip(primary) }}>버튼</span>
                <span className="text-[13px] font-black text-gray-800">{t.label}</span>
                <span className="text-[11px] font-bold text-gray-400 leading-tight text-center">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );

interface Props {
  block: any;
  onUpdate: (field: string, value: any) => void;
  onDeselect: () => void;
  onDelete: () => void;
  themeHex: Record<string, string>;
  activeTheme: string;
  /** 선택 대상 종류 — 'row' 는 type 필드가 없으므로 별도 전달 */
  kind?: 'widget' | 'section' | 'row' | 'column' | null;
}

/* ── small reusable controls ── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{children}</div>
);

const Row = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex gap-2 items-center ${className}`}>{children}</div>
);

const Seg = ({ options, value, onChange }: { options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex w-full">
    {options.map(({ v, label }) => (
      <button key={v} onClick={() => onChange(v)}
        className={`flex-1 py-1.5 text-[12px] font-black border-y border-r first:border-l first:rounded-l last:rounded-r transition-colors
          ${value === v ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400 text-gray-500'}`}>
        {label}
      </button>
    ))}
  </div>
);

const ColorPicker = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) => (
  <div className="flex flex-col gap-1">
    {label && <Label>{label}</Label>}
    <div className="flex items-center gap-2 border border-gray-200 rounded p-1.5">
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        className="w-8 h-8 cursor-pointer border-0 bg-transparent shrink-0" style={{ borderRadius: '3px' }} />
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        className="flex-1 font-mono text-[14px] outline-none bg-transparent uppercase" placeholder="#000000" />
    </div>
  </div>
);

const clampVal = (v: number, min?: number, max?: number) => {
  let r = v;
  if (typeof min === 'number') r = Math.max(min, r);
  if (typeof max === 'number') r = Math.min(max, r);
  return r;
};

const Slider = ({ label, value, min, max, step = 1, unit = 'px', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) => (
  <div>
    <Row className="mb-1 justify-between">
      <Label>{label}</Label>
      <span className="text-[12px] font-black text-gray-500">{value}{unit}</span>
    </Row>
    <input type="range" min={min} max={max} step={step} value={clampVal(value, min, max)}
      onChange={e => onChange(clampVal(Number(e.target.value), min, max))}
      className="w-full accent-orange-500 cursor-pointer" />
  </div>
);

/* 위젯 개발 규칙: 모든 숫자 입력은 min/max 를 반드시 선언한다(WIDGET_CRITERIA.md §5-1).
   값이 너무 크면 레이아웃이 깨지고, 너무 작으면 렌더 오류가 나므로 입력 단계에서 clamp 한다.
   → min/max 를 필수 props 로 두어 범위 없는 숫자 입력을 타입 단계에서 차단한다. */
const NumInput = ({ label, value, onChange, unit = 'px', min, max }: {
  label: string; value: number; onChange: (v: number) => void; unit?: string; min: number; max: number;
}) => (
  <div>
    <Label>{label}</Label>
    <div className="flex items-center border border-gray-200 rounded overflow-hidden">
      <input type="number" value={value || 0} min={min} max={max}
        onChange={e => onChange(clampVal(Number(e.target.value), min, max))}
        onBlur={e => onChange(clampVal(Number(e.target.value) || 0, min, max))}
        className="flex-1 text-[14px] font-bold outline-none px-2 py-1.5 bg-white" />
      <span className="px-2 text-[12px] font-bold text-gray-400 bg-gray-50 border-l border-gray-200 shrink-0">{unit}</span>
    </div>
  </div>
);

/* 설명 툴팁 — 라벨/섹션 제목 옆 info 아이콘에 호버하면 설명이 뜬다(대표 브랜드 컬러와 동일 패턴).
   인라인 설명문을 대체해 패널을 깔끔하게 유지한다. */
const Tip = ({ text }: { text: string }) => (
  <span className="relative group/tip inline-flex items-center cursor-help" onClick={e => e.stopPropagation()}>
    <Info className="w-3.5 h-3.5 text-gray-300 hover:text-black transition-colors" />
    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-max max-w-[220px] bg-black text-white text-[11px] leading-snug font-bold p-2 rounded opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity text-left z-50 normal-case tracking-normal">
      {text}
    </span>
  </span>
);

/* 접이식 카테고리 — 같은 카테고리에 설정이 여러 개라 길어지므로 기본은 '닫힘'.
   헤더를 누르면 펼친다. 위젯을 새로 선택하면(부모에서 key=block.id 로 리마운트) 다시 닫힘으로 초기화.
   tip 을 주면 제목 옆 info 아이콘 호버로 설명을 보여준다. */
const Section = ({ title, children, tab = 'design', defaultOpen = false, tip }: { title: string; children: React.ReactNode; tab?: 'content' | 'design' | 'motion'; defaultOpen?: boolean; tip?: string }) => {
  const active = React.useContext(PanelTabCtx);
  const [open, setOpen] = useState(defaultOpen);
  if (active !== '__all__' && active !== tab) return null;
  /* 하위 요소가 하나뿐이면 접을 게 없어 토글 대신 정적 헤더로 항상 펼쳐 보여준다. */
  const flat = React.Children.toArray(children).length <= 1;
  if (flat) {
    return (
      <div className="border-b border-gray-100 last:border-0 py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[12px] font-black uppercase tracking-widest text-gray-400">{title}</span>
          {tip && <Tip text={tip} />}
        </div>
        <div className="flex flex-col gap-3">{children}</div>
      </div>
    );
  }
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-3 text-left group">
        <span className="flex items-center gap-1.5">
          <span className="text-[12px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">{title}</span>
          {tip && <Tip text={tip} />}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-300 group-hover:text-black transition-all ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="flex flex-col gap-3 pb-4">{children}</div>}
    </div>
  );
};

/* ── 모션 설정 모달 — 등장/호버/글자리빌을 한 곳에서. 상단에 실제 위젯 라이브 프리뷰(BlockBody).
   값 변경 시 프리뷰가 즉시 재생되고, 박스에 마우스를 올리면 호버 효과가 시연된다. ── */
const MotionModal: React.FC<{ block: any; onUpdate: (f: string, v: any) => void; primary: string; activeTheme: string; onClose: () => void }> =
  ({ block, onUpdate, primary, activeTheme, onClose }) => {
    const [replay, setReplay] = useState(0);
    const [dark, setDark] = useState(false);
    const upd = (f: string, v: any) => { onUpdate(f, v); setReplay(r => r + 1); };
    const ctx: any = { activeTheme, themeColor: primary, edit: false };
    const isText = block.type === 'text';
    const isBtn = block.type === 'button';
    const isCells = block.type === 'layoutContainer';
    return createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
        <div className="bg-white w-full max-w-lg max-h-[88vh] overflow-y-auto hide-scrollbar border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.85)]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-black sticky top-0 bg-white z-10">
            <h3 className="font-black text-base">모션 설정</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setDark(d => !d)} title="배경 전환" className="px-2 py-1 text-[11px] font-black border border-gray-200 rounded hover:border-black">{dark ? '🌙 다크' : '☀️ 라이트'}</button>
              <button onClick={() => setReplay(r => r + 1)} title="다시 재생" className="px-2 py-1 text-[11px] font-black border border-gray-200 rounded hover:border-black">▶ 재생</button>
              <button onClick={onClose} className="p-1.5 border border-gray-200 hover:border-black rounded"><X className="w-4 h-4" /></button>
            </div>
          </div>
          {/* 라이브 프리뷰 */}
          <div className="px-5 pt-4">
            <div className="text-[11px] font-bold text-gray-400 mb-1.5">미리보기 · 마우스를 올리면 호버 효과가 보입니다</div>
            <div className="rounded border border-gray-200 overflow-auto hide-scrollbar flex items-center justify-center" style={{ minHeight: 120, maxHeight: 240, background: dark ? '#0f0f14' : '#ffffff' }}>
              <div key={replay} className="w-full">
                <BlockBody block={block} ctx={ctx} />
              </div>
            </div>
          </div>
          {/* 컨트롤 — 항목 수가 바뀌어도 모달이 출렁이지 않도록 최소 높이 고정 */}
          <div className="p-5 flex flex-col gap-4" style={{ minHeight: 248 }}>
            {(isText || isBtn) && (
              <div className="flex flex-col gap-3">
                <div><Label>등장 효과</Label>
                  {isText
                    ? <Seg options={[{v:'none',label:'없음'},{v:'fadeIn',label:'페이드'},{v:'slideUp',label:'위로'},{v:'slideIn',label:'좌로'},{v:'slideRight',label:'우로'},{v:'clipUp',label:'마스크'},{v:'blurIn',label:'블러'}]} value={block.animation||'none'} onChange={v => upd('animation', v === 'none' ? undefined : v)} />
                    : <Seg options={[{v:'none',label:'없음'},{v:'fadeIn',label:'페이드'},{v:'slideUp',label:'위로'},{v:'zoomIn',label:'확대'},{v:'pulse',label:'맥박'},{v:'bounceIn',label:'바운스'}]} value={block.btnAnim||'none'} onChange={v => upd('btnAnim', v === 'none' ? undefined : v)} />}
                </div>
                {((isText && block.animation && block.animation !== 'none') || (isBtn && block.btnAnim && block.btnAnim !== 'none')) && (<>
                  <div><Label>이징</Label>
                    <Seg options={[{v:'power',label:'부드럽게'},{v:'ease',label:'기본'},{v:'back',label:'탄성'},{v:'linear',label:'일정'}]} value={block.animEasing||'power'} onChange={v => upd('animEasing', v)} />
                  </div>
                  <Slider label="속도" value={block.animDuration ?? 0.6} min={0.2} max={2} step={0.1} unit="s" onChange={v => upd('animDuration', v)} />
                  {isText && ['slideUp','slideIn','slideRight','clipUp'].includes(block.animation) && (
                    <Slider label="이동 거리" value={block.animDistance ?? 24} min={0} max={120} step={4} unit="px" onChange={v => upd('animDistance', v)} />
                  )}
                </>)}
              </div>
            )}
            {isText && (
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
                <div><Label>글자 리빌 (헤드라인)</Label>
                  <Seg options={[{v:'none',label:'없음'},{v:'word',label:'단어'},{v:'char',label:'글자'}]} value={block.textReveal||'none'} onChange={v => upd('textReveal', v === 'none' ? undefined : v)} />
                </div>
                {block.textReveal && block.textReveal !== 'none' && (
                  <Slider label="시차 간격" value={block.revealStagger ?? 0.04} min={0.01} max={0.15} step={0.01} unit="s" onChange={v => upd('revealStagger', v)} />
                )}
              </div>
            )}
            {isBtn && (
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
                <div><Label>마우스 호버 효과</Label>
                  <Seg options={[{v:'none',label:'없음'},{v:'arrow',label:'화살표 →'},{v:'lift',label:'리프트'},{v:'underline',label:'밑줄'}]} value={block.btnHover||'none'} onChange={v => upd('btnHover', v === 'none' ? undefined : v)} />
                </div>
              </div>
            )}
            {isCells && (
              <div className="flex flex-col gap-3">
                <div><Label>셀 등장 효과 (순차)</Label>
                  <Seg options={[{v:'none',label:'없음'},{v:'fadeIn',label:'페이드'},{v:'slideUp',label:'위로'},{v:'slideIn',label:'좌로'}]} value={block.cellAnimation||'none'} onChange={v => upd('cellAnimation', v === 'none' ? undefined : v)} />
                </div>
                <div><Label>셀 마우스 호버</Label>
                  <Seg options={[{v:'none',label:'없음'},{v:'lift',label:'리프트'},{v:'scale',label:'확대'},{v:'border',label:'보더'}]} value={block.cellHover||'none'} onChange={v => upd('cellHover', v === 'none' ? undefined : v)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

const WIDGET_LABELS: Record<string, string> = {
  text: '텍스트 블록', button: '버튼', faq: 'FAQ 아코디언',
  timeline: '프로세스 다이어그램', heroSlider: '슬라이드', layoutContainer: '탭·캐러셀',
  image: '이미지', spacer: '여백', divider: '구분 요소',
  stats: '통계 카운터',
  countdown: '카운트다운', section: '섹션',
};

/* colRatios 프리셋 (행 비율) */
const RATIO_PRESETS: Record<number, { label: string; ratios: number[] | null }[]> = {
  2: [{ label: '균등', ratios: null }, { label: '2:1', ratios: [2, 1] }, { label: '1:2', ratios: [1, 2] }, { label: '3:1', ratios: [3, 1] }],
  3: [{ label: '균등', ratios: null }, { label: '2:1:1', ratios: [2, 1, 1] }, { label: '1:2:1', ratios: [1, 2, 1] }],
  4: [{ label: '균등', ratios: null }],
};

/* hex 색을 밝게(+)/어둡게(-) 보정 — 그라디언트 톤 생성용. 잘못된 입력은 원본 반환. */
const shade = (hex: string, amt: number) => {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return hex;
  const ch = (i: number) => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt)).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(2)}${ch(4)}`;
};
/* 버튼 디자인 템플릿 — preset(c) 가 적용할 필드 묶음, chip(c) 가 미리보기 스타일.
   c = 현재 테마색. 클릭하면 preset 의 모든 필드를 __merge 로 한 번에 적용한다.
   각 preset 은 관련 필드를 '전부' 지정(btnGradient/btnFx/btnShadow 포함, 미사용은 undefined)해
   이전 템플릿의 잔여값을 깨끗이 리셋한다 → 템플릿 전환이 항상 예측 가능하다. */
const BTN_TEMPLATES: { id: string; label: string; desc: string; preset: (c: string) => Record<string, any>; chip: (c: string) => React.CSSProperties }[] = [
  { id: 'solid',    label: '솔리드',   desc: '단색 채움',              preset: c => ({ btnBg: c, btnGradient: undefined, btnTextColor: '#ffffff', borderWidth: 0, radius: 8, btnShadow: 'none', btnFx: undefined }),
    chip: c => ({ background: c, color: '#fff', borderRadius: 6 }) },
  { id: 'gradient', label: '그라디언트', desc: '톤 그라디언트 채움',     preset: c => ({ btnGradient: `linear-gradient(135deg, ${shade(c, 26)}, ${shade(c, -30)})`, btnBg: c, btnTextColor: '#ffffff', borderWidth: 0, radius: 10, btnShadow: 'soft', btnFx: undefined }),
    chip: c => ({ background: `linear-gradient(135deg, ${shade(c, 26)}, ${shade(c, -30)})`, color: '#fff', borderRadius: 6 }) },
  { id: 'shine',    label: '샤인',     desc: '그라디언트 + 광택 스침',  preset: c => ({ btnGradient: `linear-gradient(135deg, ${shade(c, 16)}, ${shade(c, -24)})`, btnBg: c, btnTextColor: '#ffffff', borderWidth: 0, radius: 8, btnShadow: 'none', btnFx: 'shine' }),
    chip: c => ({ background: `linear-gradient(135deg, ${shade(c, 16)}, ${shade(c, -24)})`, color: '#fff', borderRadius: 6 }) },
  { id: 'press',    label: '입체',     desc: '하단 그림자 + 누름',      preset: c => ({ btnBg: c, btnGradient: undefined, btnTextColor: '#ffffff', borderWidth: 0, radius: 8, btnShadow: 'none', btnFx: 'press' }),
    chip: c => ({ background: c, color: '#fff', borderRadius: 6, boxShadow: '0 4px 0 0 rgba(0,0,0,0.25)' }) },
  { id: 'glass',    label: '글래스',   desc: '반투명 + 블러 (다크 위)', preset: c => ({ btnBg: c + '26', btnGradient: undefined, btnTextColor: '#ffffff', borderWidth: 1, borderColor: '#ffffff55', radius: 12, btnShadow: 'none', btnFx: 'glass' }),
    chip: c => ({ background: c + '40', color: '#fff', border: '1px solid #ffffff55', borderRadius: 8 }) },
  { id: 'outline',  label: '아웃라인', desc: '투명 + 테두리',          preset: c => ({ btnBg: 'transparent', btnGradient: undefined, btnTextColor: c, borderWidth: 2, borderColor: c, radius: 8, btnShadow: 'none', btnFx: undefined }),
    chip: c => ({ background: 'transparent', color: c, border: `2px solid ${c}`, borderRadius: 6 }) },
  { id: 'soft',     label: '소프트',   desc: '연한 톤 배경',           preset: c => ({ btnBg: c + '1a', btnGradient: undefined, btnTextColor: c, borderWidth: 0, radius: 10, btnShadow: 'none', btnFx: undefined }),
    chip: c => ({ background: c + '1a', color: c, borderRadius: 6 }) },
  { id: 'ghost',    label: '고스트',   desc: '텍스트 + 화살표',        preset: c => ({ btnBg: 'transparent', btnGradient: undefined, btnTextColor: c, borderWidth: 0, radius: 8, btnShadow: 'none', btnFx: undefined, btnHover: 'arrow' }),
    chip: c => ({ background: 'transparent', color: c }) },
  { id: 'neon',     label: '네온',     desc: '다크 + 컬러 글로우',     preset: c => ({ btnBg: '#0a0a0a', btnGradient: undefined, btnTextColor: c, borderWidth: 2, borderColor: c, radius: 8, btnShadow: 'glow', btnFx: undefined }),
    chip: c => ({ background: '#0a0a0a', color: c, border: `2px solid ${c}`, borderRadius: 5, boxShadow: `0 0 8px ${c}` }) },
  { id: 'pill',     label: '알약',     desc: '완전 둥근 채움',         preset: c => ({ btnBg: c, btnGradient: undefined, btnTextColor: '#ffffff', borderWidth: 0, radius: 999, btnShadow: 'soft', btnFx: undefined }),
    chip: c => ({ background: c, color: '#fff', borderRadius: 999 }) },
  { id: 'ink',      label: '잉크',     desc: '흰 배경 + 검정 오프셋',  preset: () => ({ btnBg: '#ffffff', btnGradient: undefined, btnTextColor: '#0a0a0a', borderWidth: 2, borderColor: '#0a0a0a', radius: 0, btnShadow: 'hard', btnFx: undefined }),
    chip: () => ({ background: '#fff', color: '#0a0a0a', border: '2px solid #0a0a0a', boxShadow: '3px 3px 0 0 #000' }) },
  { id: 'link',     label: '링크',     desc: '밑줄형 텍스트',          preset: c => ({ btnBg: 'transparent', btnGradient: undefined, btnTextColor: c, borderWidth: 0, radius: 0, btnShadow: 'none', btnFx: undefined, btnHover: 'underline' }),
    chip: c => ({ background: 'transparent', color: c, textDecoration: 'underline', textUnderlineOffset: 3 }) },
];

/* FAQ 스타일 템플릿 — 한 클릭으로 변형+아이콘+번호+크기+색을 묶어 적용(__merge 로 원자 적용).
   각 프리셋이 관련 필드를 '전부' 지정(미사용은 undefined)해 이전 선택의 잔여값을 깨끗이 리셋한다. */
const FAQ_TEMPLATES: { id: string; label: string; desc: string; patch: Record<string, any> }[] = [
  { id: 'boxed',     label: '박스 기본',    desc: '검정 박스 + ＋',        patch: { faqStyle: undefined, iconStyle: 'plus',  faqNumbered: undefined, qSize: 15, qColor: undefined, aColor: undefined, faqLineColor: undefined, openBg: '#fff7ed', borderRadius: 0 } },
  { id: 'lineEdit',  label: '라인 에디토리얼', desc: '얇은 구분선 + 번호 + ↑↓', patch: { faqStyle: 'line', iconStyle: 'arrow', faqNumbered: true, qSize: 19, qColor: '#111827', aColor: '#6b7280', faqLineColor: '#e5e7eb' } },
  { id: 'minimal',   label: '미니멀 대형',   desc: '보더 거의 없이 큰 질문', patch: { faqStyle: 'plain', iconStyle: 'plus', faqNumbered: true, qSize: 24, qColor: '#0a0a0a', aColor: '#6b7280', faqLineColor: '#eeeeee' } },
  { id: 'darkLine',  label: '다크 라인',     desc: '다크 섹션용 라이트 텍스트', patch: { faqStyle: 'line', iconStyle: 'arrow', faqNumbered: true, qSize: 19, qColor: '#ffffff', aColor: '#94a3b8', faqLineColor: '#262626' } },
  { id: 'compact',   label: '컴팩트 박스',   desc: '작고 촘촘한 박스',       patch: { faqStyle: undefined, iconStyle: 'plus', faqNumbered: undefined, qSize: 14, qColor: undefined, aColor: undefined, openBg: '#f9fafb', borderRadius: 8 } },
  { id: 'numMinimal',label: '번호 미니멀',   desc: '번호 + 얇은 라인',       patch: { faqStyle: 'line', iconStyle: 'plus', faqNumbered: true, qSize: 20, qColor: '#111827', aColor: '#6b7280', faqLineColor: '#e5e7eb' } },
];
const FaqTemplateModal: React.FC<{ onPick: (patch: Record<string, any>) => void; onClose: () => void }> = ({ onPick, onClose }) => createPortal(
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
    <div className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto hide-scrollbar border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.85)]" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-black sticky top-0 bg-white">
        <h3 className="font-black text-base">FAQ 스타일 템플릿</h3>
        <button onClick={onClose} className="p-1.5 border border-gray-200 hover:border-black rounded"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5 grid grid-cols-2 gap-3">
        {FAQ_TEMPLATES.map(t => (
          <button key={t.id} onClick={() => { onPick(t.patch); onClose(); }}
            className="flex flex-col items-start gap-1.5 border-2 border-gray-200 rounded-lg p-4 text-left hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
            <span className="text-[14px] font-black text-gray-800">{t.label}</span>
            <span className="text-[11px] font-bold text-gray-400 leading-tight">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  </div>,
  document.body
);

export const BlockPropertiesPanel: React.FC<Props> = ({ block, onUpdate, onDeselect, onDelete, themeHex, activeTheme, kind }) => {
  const [propSlideIdx, setPropSlideIdx] = useState(0);
  const [activeCellIdx, setActiveCellIdx] = useState(0);
  const [btnTplOpen, setBtnTplOpen] = useState(false);
  const [faqTplOpen, setFaqTplOpen] = useState(false);
  const [motionOpen, setMotionOpen] = useState(false);
  const tabbed = kind === 'widget' && TABBED_WIDGETS.has(block.type);
  const [panelTab, setPanelTab] = useState<'content' | 'design' | 'motion'>('design');
  useEffect(() => { setPanelTab('design'); }, [block.id]);

  const slides: any[] = block.slides || [];
  const slide = slides[Math.min(propSlideIdx, slides.length - 1)];
  const updSlide = (field: string, val: any) => {
    const upd = slides.map((s: any, i: number) => i === propSlideIdx ? { ...s, [field]: val } : s);
    onUpdate('slides', upd);
  };
  const moveSlide = (from: number, to: number) => {
    const arr = [...slides]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m);
    onUpdate('slides', arr); setPropSlideIdx(to);
  };
  const removeSlide = (idx: number) => {
    const arr = slides.filter((_: any, i: number) => i !== idx);
    onUpdate('slides', arr); setPropSlideIdx(Math.max(0, idx - 1));
  };

  const cells: any[] = block.cells || [];
  const cell = cells[Math.min(activeCellIdx, cells.length - 1)];
  const updCell = (field: string, val: any) => {
    const upd = cells.map((c: any, i: number) => i === activeCellIdx ? { ...c, [field]: val } : c);
    onUpdate('cells', upd);
  };

  const statsItems: any[] = block.items || [];

  const primary = themeHex[activeTheme] || '#f97316';

  return (
    <aside className="w-72 border-l border-black bg-white flex flex-col overflow-y-auto hide-scrollbar shrink-0 shadow-[-3px_0_0_0_rgba(0,0,0,0.08)] z-10">

      {/* Header */}
      <div className="px-4 py-3 border-b border-black sticky top-0 bg-white z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-black text-[14px]">{kind === 'row' ? '행 (Row)' : (WIDGET_LABELS[block.type] ?? block.type)}</div>
            <div className="text-[12px] font-mono text-gray-300 mt-0.5">{kind === 'row' ? 'row' : kind === 'section' ? 'section' : 'widget'}_{block.id}</div>
          </div>
          <button onClick={onDeselect} className="p-1.5 border border-gray-200 hover:border-black rounded transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-4 mt-2.5 border-b border-gray-200 -mx-4 px-4">
          {tabbed
            ? PANEL_TABS.map(t => (
                <button key={t.v} onClick={() => setPanelTab(t.v)}
                  className={`py-1.5 text-[12px] font-black transition-colors ${panelTab === t.v ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-400 hover:text-black'}`}>{t.label}</button>
              ))
            : <div className="py-1.5 text-[12px] font-black border-b-2 border-orange-500 text-orange-500">디자인</div>}
        </div>
      </div>

      <PanelTabCtx.Provider value={tabbed ? panelTab : '__all__'}>
      <div key={block.id} className="p-4 flex flex-col gap-0 flex-1">

        {/* ──────── ROW (행) ──────── */}
        {kind === 'row' && (<>
          <Section title="행 레이아웃">
            <div>
              <Label>컬럼 수</Label>
              <Seg options={[{v:'1',label:'1'},{v:'2',label:'2'},{v:'3',label:'3'},{v:'4',label:'4'}]} value={String(block.cols||1)} onChange={v => onUpdate('__setCols', Number(v))} />
            </div>
            {(block.cols || 1) >= 2 && (
              <div>
                <Label>컬럼 비율</Label>
                <div className="flex flex-wrap gap-1">
                  {(RATIO_PRESETS[block.cols] || []).map(p => {
                    const active = JSON.stringify(block.colRatios ?? null) === JSON.stringify(p.ratios);
                    return (
                      <button key={p.label} onClick={() => onUpdate('colRatios', p.ratios)}
                        className={`px-2.5 py-1 text-[12px] font-black border rounded transition-colors ${active ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400 text-gray-500'}`}>{p.label}</button>
                    );
                  })}
                </div>
              </div>
            )}
            <Slider label="컬럼 간격 (가로)" value={block.gap ?? 24} min={0} max={80} step={4} onChange={v => onUpdate('gap', v)} />
            <Slider label="위젯 간격 (세로)" value={block.rowGap ?? block.gap ?? 24} min={0} max={80} step={4} onChange={v => onUpdate('rowGap', v)} />
          </Section>

          {/* 컬럼 카드화 — 각 컬럼을 카드(배경/보더/라운드)로. 'Frontend/Backend/Product' 같은 카드 그리드를 섹션으로 만든다. */}
          <Section title="카드 스타일" tip="행의 각 컬럼이 카드 형태로 표시됩니다.">
            <Seg options={[{v:'none',label:'없음'},{v:'plain',label:'박스'},{v:'numbered',label:'번호'},{v:'accentTop',label:'상단바'},{v:'minimal',label:'미니멀'}]} value={block.cardStyle||'none'} onChange={v => onUpdate('cardStyle', v === 'none' ? undefined : v)} />
            {(block.cardStyle && block.cardStyle !== 'none') && (<>
              <Slider label="카드 안쪽 여백" value={block.cardPadding ?? 28} min={0} max={64} step={2} onChange={v => onUpdate('cardPadding', v)} />
              <Slider label="모서리 둥글기" value={block.cardRadius ?? 12} min={0} max={32} onChange={v => onUpdate('cardRadius', v)} />
              {block.cardStyle !== 'minimal' && (
                <ColorPicker label="카드 배경" value={block.cardBg||'#ffffff'} onChange={v => onUpdate('cardBg', v)} />
              )}
              {(block.cardStyle === 'plain' || block.cardStyle === 'accentTop') && (
                <ColorPicker label="보더 색" value={block.cardBorderColor||'#e5e7eb'} onChange={v => onUpdate('cardBorderColor', v)} />
              )}
              {(block.cardStyle === 'numbered' || block.cardStyle === 'accentTop' || block.cardStyle === 'minimal') && (
                <ColorPicker label="강조 색 (비우면 테마색)" value={block.cardAccent||''} onChange={v => onUpdate('cardAccent', v)} />
              )}
              <div>
                <Label>마우스 호버</Label>
                <Seg options={[{v:'none',label:'없음'},{v:'lift',label:'리프트'},{v:'scale',label:'확대'},{v:'border',label:'보더'}]} value={block.cardHover||'none'} onChange={v => onUpdate('cardHover', v === 'none' ? undefined : v)} />
              </div>
            </>)}
          </Section>
        </>)}

        {/* ──────── SECTION (섹션) ──────── */}
        {block.type === 'section' && (<>
          <Section title="배경">
            <div>
              <Label>배경 유형</Label>
              <Seg options={[{v:'color',label:'단색'},{v:'gradient',label:'그라디언트'},{v:'image',label:'이미지'}]} value={block.bgType||'color'} onChange={v => onUpdate('bgType', v)} />
            </div>
            {(block.bgType || 'color') === 'color' && (
              <ColorPicker label="배경색" value={block.bgColor || '#f9fafb'} onChange={v => onUpdate('bgColor', v)} />
            )}
            {block.bgType === 'gradient' && (<>
              <ColorPicker label="시작 색" value={block.bgGradient?.from || '#111827'} onChange={v => onUpdate('bgGradient', { ...(block.bgGradient||{}), from: v })} />
              <ColorPicker label="끝 색" value={block.bgGradient?.to || '#1f2937'} onChange={v => onUpdate('bgGradient', { ...(block.bgGradient||{}), to: v })} />
              <Slider label="각도" value={block.bgGradient?.angle ?? 135} min={0} max={360} unit="°" onChange={v => onUpdate('bgGradient', { ...(block.bgGradient||{}), angle: v })} />
            </>)}
            {block.bgType === 'image' && (<>
              <ImageUploader label="배경 이미지" value={block.bgImage || ''} onChange={v => onUpdate('bgImage', v)} />
              <Slider label="어둡게 (오버레이)" value={block.bgOverlay ?? 0} min={0} max={90} unit="%" onChange={v => onUpdate('bgOverlay', v)} />
              <div>
                <Label>Ken Burns (배경 모션)</Label>
                <Seg options={[{v:'none',label:'없음'},{v:'zoom',label:'줌인'},{v:'zoomout',label:'줌아웃'},{v:'panL',label:'팬←'},{v:'panR',label:'팬→'}]} value={block.bgKenBurns||'none'} onChange={v => onUpdate('bgKenBurns', v === 'none' ? undefined : v)} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!block.bgGradOverlay} onChange={e => onUpdate('bgGradOverlay', e.target.checked || undefined)} className="accent-orange-500 w-3.5 h-3.5" />
                <span className="text-[14px] font-bold">하단 그라데이션 (히어로 가독)</span>
              </label>
            </>)}
          </Section>

          <Section title="레이아웃·크기">
            {/* 섹션 콘텐츠는 컨테이너(페이지) 폭을 꽉 채운다. 좌우 inset 은 '가로 여백'으로만 제어 →
                가로 여백 0 = 끝까지 꽉 참. (별도 너비 제한·전체 토글 없음) */}
            <Slider label="세로 여백" value={block.paddingY ?? 80} min={0} max={200} step={8} onChange={v => onUpdate('paddingY', v)} />
            <Slider label="가로 여백" value={block.paddingX ?? 32} min={0} max={120} step={4} onChange={v => onUpdate('paddingX', v)} />
            <Slider label="행 간격" value={block.gap ?? 32} min={0} max={80} step={4} onChange={v => onUpdate('gap', v)} />
          </Section>

          {/* 배경 장식 — 기업급 섹션을 위한 워터마크 고스트 텍스트 + 데코 도형 (공유 SectionDecor 가 렌더) */}
          <Section title="배경 장식">
            <div>
              <Label>워터마크 텍스트</Label>
              <input type="text" value={block.bgWatermark?.text || ''}
                onChange={e => onUpdate('bgWatermark', { ...(block.bgWatermark || {}), text: e.target.value })}
                placeholder="예: DESIGN (비우면 없음)"
                className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
            </div>
            {(block.bgWatermark?.text ?? '').trim() !== '' && (<>
              <Slider label="워터마크 크기" value={block.bgWatermark?.fontSize ?? 200} min={60} max={400} step={10} onChange={v => onUpdate('bgWatermark', { ...(block.bgWatermark || {}), fontSize: v })} />
              <Slider label="워터마크 투명도" value={block.bgWatermark?.opacity ?? 6} min={0} max={30} unit="%" onChange={v => onUpdate('bgWatermark', { ...(block.bgWatermark || {}), opacity: v })} />
              <Slider label="X축 위치" value={block.bgWatermark?.x ?? 50} min={0} max={100} unit="%" onChange={v => onUpdate('bgWatermark', { ...(block.bgWatermark || {}), x: v })} />
              <Slider label="Y축 위치" value={block.bgWatermark?.y ?? 50} min={0} max={100} unit="%" onChange={v => onUpdate('bgWatermark', { ...(block.bgWatermark || {}), y: v })} />
              <ColorPicker label="워터마크 색" value={block.bgWatermark?.color || '#111827'} onChange={v => onUpdate('bgWatermark', { ...(block.bgWatermark || {}), color: v })} />
            </>)}

            <div>
              <Label>장식 도형</Label>
              <Seg options={[{v:'none',label:'없음'},{v:'circle',label:'원'},{v:'blob',label:'블롭'},{v:'square',label:'사각'}]} value={block.bgShape?.type || 'none'} onChange={v => onUpdate('bgShape', { ...(block.bgShape || {}), type: v })} />
            </div>
            {block.bgShape?.type && block.bgShape.type !== 'none' && (<>
              <Slider label="도형 크기" value={block.bgShape?.size ?? 360} min={100} max={1200} step={20} onChange={v => onUpdate('bgShape', { ...(block.bgShape || {}), size: v })} />
              <ColorPicker label="도형 색" value={block.bgShape?.color || '#f97316'} onChange={v => onUpdate('bgShape', { ...(block.bgShape || {}), color: v })} />
              <Slider label="X축 위치" value={block.bgShape?.x ?? 80} min={0} max={100} unit="%" onChange={v => onUpdate('bgShape', { ...(block.bgShape || {}), x: v })} />
              <Slider label="Y축 위치" value={block.bgShape?.y ?? 20} min={0} max={100} unit="%" onChange={v => onUpdate('bgShape', { ...(block.bgShape || {}), y: v })} />
              <Slider label="도형 투명도" value={block.bgShape?.opacity ?? 12} min={0} max={60} unit="%" onChange={v => onUpdate('bgShape', { ...(block.bgShape || {}), opacity: v })} />
            </>)}
          </Section>
        </>)}

        {/* ──────── TEXT ──────── */}
        {block.type === 'text' && (<>
          <Section title="레이아웃·크기">
            <div>
              <Label>여백</Label>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="위" value={block.paddingTop ?? block.paddingY ?? 32} onChange={v => onUpdate('paddingTop', v)} unit="px" min={0} max={200} />
                <NumInput label="아래" value={block.paddingBottom ?? block.paddingY ?? 32} onChange={v => onUpdate('paddingBottom', v)} unit="px" min={0} max={200} />
                <NumInput label="좌" value={block.paddingLeft ?? 0} onChange={v => onUpdate('paddingLeft', v)} unit="px" min={0} max={120} />
                <NumInput label="우" value={block.paddingRight ?? 0} onChange={v => onUpdate('paddingRight', v)} unit="px" min={0} max={120} />
              </div>
            </div>
          </Section>

          <Section title="타이포그래피">
            <div className="grid grid-cols-2 gap-2">
              <NumInput label="글자 크기" value={block.fontSize ?? 16} onChange={v => onUpdate('fontSize', v)} unit="px" min={8} max={200} />
              <div>
                <Label>굵기</Label>
                <select value={block.fontWeight ?? 400} onChange={e => onUpdate('fontWeight', Number(e.target.value))}
                  className="w-full border border-gray-200 rounded text-[14px] font-bold py-1.5 px-2 outline-none bg-white">
                  {[100,200,300,400,500,600,700,800,900].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <Slider label="줄 간격" value={block.lineHeight ?? 1.7} min={1} max={3} step={0.1} unit="×" onChange={v => onUpdate('lineHeight', v)} />
            <Slider label="자간" value={block.letterSpacing ?? 0} min={-0.1} max={0.3} step={0.01} unit="em" onChange={v => onUpdate('letterSpacing', v)} />
          </Section>

          <Section title="색상">
            <ColorPicker label="텍스트 색상" value={block.textColor || '#111827'} onChange={v => onUpdate('textColor', v)} />
          </Section>

          <Section title="테두리">
            <Slider label="외곽선 두께" value={block.textStroke ?? 0} min={0} max={10} step={1} unit="px" onChange={v => onUpdate('textStroke', v || undefined)} />
            {(block.textStroke ?? 0) > 0 && (
              <ColorPicker label="외곽선 색" value={block.textStrokeColor || '#000000'} onChange={v => onUpdate('textStrokeColor', v)} />
            )}
          </Section>

          <Section title="배경">
            <ColorPicker label="배경색" value={block.bgColor || '#ffffff'} onChange={v => onUpdate('bgColor', v === '#ffffff' ? '' : v)} />
            <div className="text-[12px] text-gray-400 font-bold">정렬은 텍스트를 드래그한 뒤 상단 툴바에서 문단 단위로 조정합니다.</div>
          </Section>

          <Section title="모션" tab="motion" tip="모달 미리보기에서 값을 조정하며 즉시 확인합니다.">
            <button onClick={() => setMotionOpen(true)} className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded px-3 py-2.5 hover:border-black transition-colors">
              <span className="text-[13px] font-bold text-gray-600">등장 효과 · 글자 리빌</span>
              <span className="text-[12px] font-black text-orange-500">설정 열기 →</span>
            </button>
          </Section>

          <Section title="콘텐츠" tab="content">
            <div className="text-[13px] text-gray-500 font-bold leading-relaxed">텍스트 내용은 <b className="text-black">캔버스에서 직접 클릭</b>해 편집합니다. 드래그로 선택하면 굵게·정렬·강조색을 바꿀 수 있습니다.</div>
          </Section>

        </>)}

        {/* ──────── HERO SLIDER ──────── */}
        {block.type === 'heroSlider' && (<>
          <Section title="슬라이더 설정">
            <Slider label="높이" value={block.height ?? 60} min={30} max={100} step={5} unit="vh" onChange={v => onUpdate('height', v)} />
            <div>
              <Label>메인 카피 크기</Label>
              <NumInput label="" value={block.h1Size ?? 48} onChange={v => onUpdate('h1Size', v)} unit="px" min={16} max={120} />
            </div>
            <div>
              <Label>서브 카피 크기</Label>
              <NumInput label="" value={block.subtitleSize ?? 18} onChange={v => onUpdate('subtitleSize', v)} unit="px" min={12} max={48} />
            </div>
            <div>
              <Label>세로 위치</Label>
              <Seg options={[{v:'top',label:'상단'},{v:'center',label:'중앙'},{v:'bottom',label:'하단'}]} value={block.vAlign||'center'} onChange={v => onUpdate('vAlign', v === 'center' ? undefined : v)} />
            </div>
            <Slider label="텍스트 영역 너비" value={block.contentMaxW ?? 672} min={360} max={1200} step={20} unit="px" onChange={v => onUpdate('contentMaxW', v)} />
            <div>
              <Label>전환 애니메이션</Label>
              <Seg options={[{v:'slide',label:'슬라이드'},{v:'fade',label:'페이드'},{v:'zoom',label:'줌'}]} value={block.slideAnim||'slide'} onChange={v => onUpdate('slideAnim', v)} />
            </div>
            <div>
              <Label>텍스트 등장</Label>
              <Seg options={[{v:'none',label:'없음'},{v:'slideUp',label:'위로'},{v:'fadeIn',label:'페이드'},{v:'blurIn',label:'블러'}]} value={block.textAnim||'none'} onChange={v => onUpdate('textAnim', v === 'none' ? undefined : v)} />
            </div>
            <div>
              <Label>배경 Ken Burns (이미지)</Label>
              <Seg options={[{v:'none',label:'없음'},{v:'zoom',label:'줌인'},{v:'panL',label:'팬←'},{v:'panR',label:'팬→'}]} value={block.slideKen||'none'} onChange={v => onUpdate('slideKen', v === 'none' ? undefined : v)} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!block.autoPlay} onChange={e => onUpdate('autoPlay', e.target.checked || undefined)} className="accent-orange-500 w-3.5 h-3.5" />
              <span className="text-[14px] font-bold">자동 전환</span>
            </label>
            {block.autoPlay && (
              <Slider label="전환 간격" value={block.interval ?? 4000} min={2000} max={15000} step={500} unit="ms" onChange={v => onUpdate('interval', v)} />
            )}
          </Section>

          <Section title="슬라이드 관리">
            <div className="flex flex-col gap-1">
              {slides.map((s: any, i: number) => (
                <div key={s.id} className={`flex items-center gap-1 px-2 py-1.5 border rounded cursor-pointer transition-colors ${i === propSlideIdx ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-400'}`}
                  onClick={() => setPropSlideIdx(i)}>
                  <span className="text-[12px] font-black text-gray-400 w-4">{i + 1}</span>
                  <span className="text-[12px] font-bold flex-1 truncate">{s.h1?.split('\n')[0] || `슬라이드 ${i + 1}`}</span>
                  <button onClick={e => { e.stopPropagation(); if (i > 0) moveSlide(i, i - 1); }} disabled={i === 0} className="p-0.5 hover:text-orange-500 disabled:opacity-20 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={e => { e.stopPropagation(); if (i < slides.length - 1) moveSlide(i, i + 1); }} disabled={i === slides.length - 1} className="p-0.5 hover:text-orange-500 disabled:opacity-20 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                  {slides.length > 1 && <button onClick={e => { e.stopPropagation(); removeSlide(i); }} className="p-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>}
                </div>
              ))}
              {slides.length < 4 && (
                <button onClick={() => { const ns = { id: genId(), bgType: 'color', bgValue: '#111', overlayOpacity: 0, h1: '새 슬라이드', subtitle: '', href: '', align: 'center' }; onUpdate('slides', [...slides, ns]); setPropSlideIdx(slides.length); }}
                  className="py-1.5 border border-dashed border-gray-200 hover:border-orange-400 text-gray-400 hover:text-orange-500 text-[12px] font-bold flex items-center justify-center gap-1 rounded transition-colors">
                  <Plus className="w-3 h-3" /> 슬라이드 추가 (최대 4)
                </button>
              )}
            </div>
          </Section>

          {slide && (<>
            <Section title={`슬라이드 ${propSlideIdx + 1} - 배경`}>
              <div>
                <Label>배경 유형</Label>
                <Seg options={[{v:'color',label:'단색'},{v:'image',label:'이미지'}]} value={slide.bgType === 'image' ? 'image' : 'color'} onChange={v => updSlide('bgType', v)} />
              </div>
              {slide.bgType !== 'image' && <ColorPicker label="배경색" value={slide.bgValue||'#111111'} onChange={v => updSlide('bgValue', v)} />}
              {slide.bgType === 'image' && (
                <ImageUploader
                  label="배경 이미지"
                  value={slide.bgValue || ''}
                  onChange={v => updSlide('bgValue', v)}
                />
              )}
              {slide.bgType === 'image' && <Slider label="오버레이 불투명도" value={slide.overlayOpacity??0} min={0} max={90} unit="%" onChange={v => updSlide('overlayOpacity', v)} />}
            </Section>

            <Section title={`슬라이드 ${propSlideIdx + 1} - 콘텐츠`}>
              <div>
                <Label>텍스트 정렬</Label>
                <Seg options={[{v:'left',label:'좌'},{v:'center',label:'중'},{v:'right',label:'우'}]} value={slide.align||'center'} onChange={v => updSlide('align', v)} />
              </div>
              <div className="text-[12px] text-gray-400 font-bold">작은 라벨·메인·서브 카피는 캔버스에서 직접 클릭해 편집합니다.</div>
              <div>
                <Label>CTA 버튼 문구 (선택)</Label>
                <input type="text" value={slide.ctaText || ''} onChange={e => updSlide('ctaText', e.target.value)} placeholder="예: 지원하기"
                  className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
              </div>
              {slide.ctaText && (
                <div>
                  <Label>CTA 버튼 링크</Label>
                  <input type="text" value={slide.ctaHref || ''} onChange={e => updSlide('ctaHref', e.target.value)} placeholder="https://..."
                    className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
                </div>
              )}
              <div>
                <Label>슬라이드 클릭 시 이동 URL (선택)</Label>
                <input type="text" value={slide.href || ''} onChange={e => updSlide('href', e.target.value)} placeholder="https://..."
                  className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
              </div>
            </Section>
          </>)}
        </>)}

        {/* ──────── LAYOUT CONTAINER ──────── */}
        {block.type === 'layoutContainer' && (<>
          <Section title="컨테이너 설정">
            <div>
              <Label>표시 모드</Label>
              {/* 정적 그리드는 '섹션' 위젯이 담당 → 신규는 탭/캐러셀만. 기존 grid 데이터는 편집 가능하도록 노출 유지. */}
              <Seg options={block.mode === 'grid' ? [{v:'grid',label:'그리드(레거시)'},{v:'tabs',label:'탭'},{v:'carousel',label:'캐러셀'}] : [{v:'tabs',label:'탭'},{v:'carousel',label:'캐러셀'}]} value={block.mode||'tabs'} onChange={v => onUpdate('mode', v)} />
            </div>
            <div>
              <Label>{block.mode === 'carousel' ? '한 번에 보이는 셀 수' : '컬럼 수'}</Label>
              <Seg options={[{v:'1',label:'1'},{v:'2',label:'2'},{v:'3',label:'3'},{v:'4',label:'4'}]} value={String(block.cols||2)} onChange={v => onUpdate('cols', Number(v))} />
            </div>
            <Slider label="간격" value={block.gap ?? 20} min={0} max={80} step={4} onChange={v => onUpdate('gap', v)} />
            <Slider label="세로 여백" value={block.paddingY ?? 40} min={0} max={200} step={8} onChange={v => onUpdate('paddingY', v)} />
            <Slider label="가로 여백" value={block.paddingX ?? 32} min={0} max={120} step={4} onChange={v => onUpdate('paddingX', v)} />
            <NumInput label="행 높이 (선택, 벤토용)" value={block.rowHeight || 0} onChange={v => onUpdate('rowHeight', v || undefined)} unit="px" min={0} max={600} />
            <ColorPicker label="배경색" value={block.bgColor||'transparent'} onChange={v => onUpdate('bgColor', v)} />
          </Section>

          <Section title="카드 스타일" tip="번호: 대형 인덱스 / 상단바: 강조 보더 / 미니멀: 보더 없이 강조 라인">
            <Seg options={[{v:'plain',label:'기본'},{v:'numbered',label:'번호'},{v:'accentTop',label:'상단바'},{v:'minimal',label:'미니멀'}]} value={block.cardStyle||'plain'} onChange={v => onUpdate('cardStyle', v === 'plain' ? undefined : v)} />
            {(block.cardStyle && block.cardStyle !== 'plain') && (
              <ColorPicker label="강조 색 (비우면 테마색)" value={block.cardAccent||''} onChange={v => onUpdate('cardAccent', v)} />
            )}
          </Section>

          {block.mode === 'tabs' && (
            <Section title="탭 스타일">
              <div>
                <Label>스타일 변형</Label>
                <Seg options={[{v:'filled',label:'채움'},{v:'underline',label:'언더라인'},{v:'minimal',label:'미니멀'}]} value={block.tabStyle||'filled'} onChange={v => onUpdate('tabStyle', v)} />
              </div>
              <div>
                <Label>탭 위치</Label>
                <Seg options={[{v:'top',label:'위'},{v:'left',label:'왼쪽'}]} value={block.tabPosition||'top'} onChange={v => onUpdate('tabPosition', v)} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!block.tabNumbered} onChange={e => onUpdate('tabNumbered', e.target.checked || undefined)} className="accent-orange-500 w-3.5 h-3.5" />
                <span className="text-[14px] font-bold">번호 표시 (01·02)</span>
              </label>
              <ColorPicker label="활성 탭 배경" value={block.activeTabBg || ''} onChange={v => onUpdate('activeTabBg', v)} />
              <ColorPicker label="활성 탭 글자색" value={block.activeTabText || '#ffffff'} onChange={v => onUpdate('activeTabText', v)} />
              <ColorPicker label="비활성 탭 글자색" value={block.tabText || '#6b7280'} onChange={v => onUpdate('tabText', v)} />
              <Slider label="탭 모서리 둥글기" value={block.tabRadius ?? 6} min={0} max={20} onChange={v => onUpdate('tabRadius', v)} />
            </Section>
          )}

          {block.mode === 'carousel' && (
            <Section title="캐러셀 설정">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!block.autoplay} onChange={e => onUpdate('autoplay', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5" />
                <span className="text-[14px] font-bold">자동재생</span>
              </label>
              {block.autoplay && (
                <Slider label="자동재생 간격" value={block.interval ?? 5000} min={2000} max={15000} step={500} unit="ms" onChange={v => onUpdate('interval', v)} />
              )}
            </Section>
          )}

          <Section title="셀 애니메이션·호버">
            <div>
              <Label>등장 효과 (순차 적용)</Label>
              <Seg options={[{v:'none',label:'없음'},{v:'fadeIn',label:'페이드'},{v:'slideUp',label:'위로'},{v:'slideIn',label:'좌로'}]} value={block.cellAnimation||'none'} onChange={v => onUpdate('cellAnimation', v)} />
            </div>
            <div>
              <Label>Hover 효과 (전체 기본값)</Label>
              <Seg options={[{v:'none',label:'없음'},{v:'lift',label:'위로'},{v:'scale',label:'확대'},{v:'border',label:'테두리'}]} value={block.cellHover||'lift'} onChange={v => onUpdate('cellHover', v)} />
            </div>
          </Section>

          <Section title="셀 편집">
            <div className="flex gap-1 flex-wrap">
              {cells.map((_: any, i: number) => (
                <button key={i} onClick={() => setActiveCellIdx(i)}
                  className={`px-2.5 py-1 text-[12px] font-black border rounded transition-colors ${activeCellIdx === i ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400 text-gray-500'}`}>
                  셀 {i + 1}
                </button>
              ))}
            </div>
            {cell && (<>
              {block.mode !== 'tabs' && block.mode !== 'carousel' && (
                <div className="grid grid-cols-2 gap-2">
                  <NumInput label="가로 폭" value={cell.colSpan ?? 1} onChange={v => updCell('colSpan', Math.max(1, Math.min(4, v)))} unit="x" min={1} max={4} />
                  <NumInput label="세로 폭" value={cell.rowSpan ?? 1} onChange={v => updCell('rowSpan', Math.max(1, Math.min(4, v)))} unit="x" min={1} max={4} />
                </div>
              )}
              {block.mode === 'tabs' && (
                <div>
                  <Label>탭 라벨 (비우면 셀 제목 사용)</Label>
                  <input type="text" value={cell.tabLabel || ''} onChange={e => updCell('tabLabel', e.target.value)}
                    placeholder="예: ENVIRONMENTAL" className="w-full border border-gray-200 rounded text-[14px] font-bold px-2 py-1.5 outline-none focus:border-orange-400 uppercase tracking-wider" />
                </div>
              )}
              <div>
                <Label>셀 클릭 링크 URL (선택, 행 전체 클릭 가능)</Label>
                <input type="text" value={cell.href || ''} onChange={e => updCell('href', e.target.value)}
                  placeholder="https://... 또는 #section" className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
              </div>
              {cell.href && (
                <div>
                  <Label>링크 대상</Label>
                  <Seg options={[{v:'_self',label:'현재 탭'},{v:'_blank',label:'새 탭'}]} value={cell.linkTarget||'_self'} onChange={v => updCell('linkTarget', v)} />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!cell.showArrow} onChange={e => updCell('showArrow', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5" />
                <span className="text-[14px] font-bold">→ 화살표 아이콘 표시 (링크 행)</span>
              </label>
              <div>
                <Label>Hover 효과 (셀별 오버라이드)</Label>
                <Seg options={[
                  {v:'',label:'기본'},
                  {v:'none',label:'없음'},
                  {v:'lift',label:'위로'},
                  {v:'scale',label:'확대'},
                  {v:'border',label:'테두리'},
                ]} value={cell.hoverEffect||''} onChange={v => updCell('hoverEffect', v || undefined)} />
              </div>
              <ColorPicker label="셀 배경색" value={cell.bgColor||'#ffffff'} onChange={v => updCell('bgColor', v)} />
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="안쪽 여백" value={cell.padding ?? 24} onChange={v => updCell('padding', v)} unit="px" min={0} max={120} />
                <NumInput label="모서리 둥글기" value={cell.borderRadius ?? 8} onChange={v => updCell('borderRadius', v)} unit="px" min={0} max={64} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="테두리 두께" value={cell.borderWidth ?? 1} onChange={v => updCell('borderWidth', v)} unit="px" min={0} max={12} />
                <ColorPicker label="테두리 색" value={cell.borderColor||'#e5e7eb'} onChange={v => updCell('borderColor', v)} />
              </div>
              <div>
                <Label>텍스트 정렬</Label>
                <Seg options={[{v:'left',label:'좌'},{v:'center',label:'중'},{v:'right',label:'우'}]} value={cell.align||'left'} onChange={v => updCell('align', v)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="제목 크기" value={cell.titleSize ?? 18} onChange={v => updCell('titleSize', v)} unit="px" min={8} max={120} />
                <NumInput label="본문 크기" value={cell.textSize ?? 14} onChange={v => updCell('textSize', v)} unit="px" min={8} max={96} />
              </div>
              <ColorPicker label="제목 색상" value={cell.titleColor||'#111827'} onChange={v => updCell('titleColor', v)} />
              <ColorPicker label="본문 색상" value={cell.textColor||'#374151'} onChange={v => updCell('textColor', v)} />
              <ImageUploader
                label="셀 이미지"
                value={cell.imgSrc || ''}
                onChange={v => updCell('imgSrc', v)}
              />
              {cell.imgSrc && (<>
                <div>
                  <Label>이미지 위치</Label>
                  <Seg
                    options={[{v:'top',label:'위'},{v:'bottom',label:'아래'},{v:'left',label:'좌'},{v:'right',label:'우'},{v:'bg',label:'배경'}]}
                    value={cell.imgPosition||'top'}
                    onChange={v => updCell('imgPosition', v)}
                  />
                </div>
                <Slider label="이미지 높이" value={cell.imgHeight ?? 180} min={80} max={400} step={8} onChange={v => updCell('imgHeight', v)} />
                {(cell.imgPosition === 'left' || cell.imgPosition === 'right') && (
                  <Slider label="이미지 너비 %" value={cell.imgWidth ?? 40} min={20} max={60} step={5} unit="%" onChange={v => updCell('imgWidth', v)} />
                )}
                {cell.imgPosition === 'bg' && (
                  <Slider label="오버레이 불투명도" value={cell.bgOverlay ?? 40} min={0} max={90} unit="%" onChange={v => updCell('bgOverlay', v)} />
                )}
              </>)}
            </>)}
          </Section>
        </>)}

        {/* ──────── BUTTON ──────── */}
        {block.type === 'button' && (<>
          <Section title="콘텐츠 · 링크" tab="content">
            <div>
              <div className="text-[13px] text-gray-500 font-bold leading-relaxed mb-2">버튼 문구는 <b className="text-black">캔버스에서 직접</b> 입력합니다.</div>
              <Label>이동할 URL</Label>
              <input type="text" value={block.actionUrl||''} onChange={e => onUpdate('actionUrl', e.target.value)} placeholder="https://..."
                className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
              <div className="text-[12px] text-gray-400 mt-1 font-bold">버튼 클릭 시 이 주소를 새 탭으로 엽니다.</div>
            </div>
          </Section>

          <Section title="디자인 템플릿">
            <button onClick={() => setBtnTplOpen(true)}
              className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded px-3 py-2.5 hover:border-black transition-colors">
              <span className="flex items-center gap-2">
                <span className="font-black" style={{ padding: '4px 12px', fontSize: 11, ...(BTN_TEMPLATES.find(t => t.id === block.btnTemplate)?.chip(primary) ?? { background: primary, color: '#fff', borderRadius: 4 }) }}>버튼</span>
                <span className="text-[13px] font-bold text-gray-600">{BTN_TEMPLATES.find(t => t.id === block.btnTemplate)?.label ?? '템플릿 선택'}</span>
              </span>
              <span className="text-[12px] font-black text-orange-500">열기 →</span>
            </button>
          </Section>
          {btnTplOpen && (
            <BtnTemplateModal primary={primary} activeId={block.btnTemplate}
              onPick={(preset, id) => onUpdate('__merge', { ...preset, btnTemplate: id })}
              onClose={() => setBtnTplOpen(false)} />
          )}

          <Section title="레이아웃·크기">
            <Seg options={[{v:'s',label:'S'},{v:'m',label:'M'},{v:'l',label:'L'}]} value={block.btnSize||'m'} onChange={v => onUpdate('btnSize', v)} />
          </Section>

          <Section title="색상">
            <ColorPicker label="버튼 색상" value={block.btnBg === 'transparent' ? '' : (block.btnBg || primary)} onChange={v => onUpdate('__merge', { btnBg: v, btnGradient: undefined })} />
            <ColorPicker label="텍스트 색상" value={block.btnTextColor||'#ffffff'} onChange={v => onUpdate('btnTextColor', v)} />
          </Section>

          <Section title="테두리">
            <Slider label="외곽선 두께" value={block.borderWidth ?? 0} min={0} max={8} onChange={v => onUpdate('borderWidth', v)} />
            {(block.borderWidth ?? 0) > 0 && (
              <ColorPicker label="외곽선 색상" value={block.borderColor || primary} onChange={v => onUpdate('borderColor', v)} />
            )}
          </Section>

          <Section title="형태">
            <Slider label="모서리 둥글기" value={block.radius ?? 0} min={0} max={40} onChange={v => onUpdate('radius', v)} />
            <Slider label="세로 여백" value={block.paddingY ?? 32} min={0} max={120} step={8} onChange={v => onUpdate('paddingY', v)} />
          </Section>

          <Section title="배경">
            <ColorPicker label="배경색" value={block.bgColor||''} onChange={v => onUpdate('bgColor', v)} />
          </Section>

          <Section title="모션" tab="motion" tip="모달 미리보기에 마우스를 올려 호버 효과까지 확인합니다.">
            <button onClick={() => setMotionOpen(true)} className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded px-3 py-2.5 hover:border-black transition-colors">
              <span className="text-[13px] font-bold text-gray-600">등장 효과 · 호버</span>
              <span className="text-[12px] font-black text-orange-500">설정 열기 →</span>
            </button>
          </Section>
        </>)}

        {/* ──────── COUNTDOWN ──────── */}
        {block.type === 'countdown' && (<>
          <Section title="스타일">
            <Seg options={[{v:'boxed',label:'박스'},{v:'plain',label:'대형 플랫'},{v:'minimal',label:'콜론 인라인'}]} value={block.cdStyle||'boxed'} onChange={v => onUpdate('cdStyle', v)} />
            {(block.cdStyle && block.cdStyle !== 'boxed') && (
              <ColorPicker label="숫자 색 (비우면 강조색)" value={block.digitColor||''} onChange={v => onUpdate('digitColor', v)} />
            )}
          </Section>
          <Section title="종료 시간">
            <div>
              <Label>종료 일시</Label>
              <input type="datetime-local" value={block.endAt || ''} onChange={e => onUpdate('endAt', e.target.value)}
                className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
              {block.endAt && <button onClick={() => onUpdate('endAt', '')} className="text-[12px] font-bold text-red-400 hover:text-red-600 mt-1">종료 시간 지우기</button>}
            </div>
          </Section>
          <Section title="문구">
            <div>
              <Label>라벨 (마감 전)</Label>
              <input type="text" value={block.label||''} onChange={e => onUpdate('label', e.target.value)} placeholder="예: 마감까지"
                className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
            </div>
            <div>
              <Label>마감 후 문구</Label>
              <input type="text" value={block.expiredText||''} onChange={e => onUpdate('expiredText', e.target.value)} placeholder="예: 마감되었습니다"
                className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
            </div>
          </Section>
          <Section title="색상">
            <ColorPicker label="강조 색 (비우면 테마색)" value={block.accentColor||''} onChange={v => onUpdate('accentColor', v)} />
            <ColorPicker label="텍스트 색" value={block.textColor||'#ffffff'} onChange={v => onUpdate('textColor', v)} />
            <ColorPicker label="배경색" value={block.bgColor||'#0a0a0a'} onChange={v => onUpdate('bgColor', v)} />
            <Slider label="세로 여백" value={block.paddingY ?? 56} min={0} max={160} step={8} onChange={v => onUpdate('paddingY', v)} />
          </Section>
        </>)}

        {/* ──────── FAQ ──────── */}
        {block.type === 'faq' && (<>
          <Section title="템플릿" tip="박스·라인·미니멀·다크 등 스타일을 한 번에 적용합니다.">
            <button onClick={() => setFaqTplOpen(true)} className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded px-3 py-2.5 hover:border-black transition-colors">
              <span className="text-[13px] font-bold text-gray-600">스타일 템플릿</span>
              <span className="text-[12px] font-black text-orange-500">열기 →</span>
            </button>
          </Section>
          {faqTplOpen && <FaqTemplateModal onPick={patch => onUpdate('__merge', patch)} onClose={() => setFaqTplOpen(false)} />}
          <Section title="스타일">
            <div>
              <Label>스타일 변형</Label>
              <Seg options={[{v:'boxed',label:'박스'},{v:'line',label:'라인'},{v:'plain',label:'미니멀'}]} value={block.faqStyle||'boxed'} onChange={v => onUpdate('faqStyle', v)} />
            </div>
            <div>
              <Label>아이콘 스타일</Label>
              <Seg options={[{v:'plus',label:'＋ / −'},{v:'arrow',label:'↑ / ↓'}]} value={block.iconStyle||'plus'} onChange={v => onUpdate('iconStyle', v)} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!block.faqNumbered} onChange={e => onUpdate('faqNumbered', e.target.checked || undefined)} className="accent-orange-500 w-3.5 h-3.5" />
              <span className="text-[14px] font-bold">번호 표시 (01·02)</span>
            </label>
            <Slider label="질문 글자 크기" value={block.qSize ?? ((block.faqStyle||'boxed')==='boxed'?15:(block.faqStyle==='plain'?22:18))} min={13} max={32} onChange={v => onUpdate('qSize', v)} />
            {(block.faqStyle && block.faqStyle !== 'boxed') ? (<>
              <ColorPicker label="질문 색" value={block.qColor||'#111827'} onChange={v => onUpdate('qColor', v)} />
              <ColorPicker label="답변 색" value={block.aColor||'#6b7280'} onChange={v => onUpdate('aColor', v)} />
              <ColorPicker label="구분선 색" value={block.faqLineColor||'#e5e7eb'} onChange={v => onUpdate('faqLineColor', v)} />
            </>) : (<>
              <ColorPicker label="열림 배경색" value={block.openBg||'#fff7ed'} onChange={v => onUpdate('openBg', v)} />
              <Slider label="모서리 둥글기" value={block.borderRadius ?? 0} min={0} max={20} onChange={v => onUpdate('borderRadius', v)} />
            </>)}
          </Section>
        </>)}

        {/* ──────── TIMELINE → 프로세스 다이어그램 ──────── */}
        {block.type === 'timeline' && (<>
          <Section title="레이아웃·크기">
            <div>
              <Label>표시 방식</Label>
              {([['vertical-left','단계 · 수직 좌측'],['vertical-center','단계 · 수직 교차'],['horizontal','단계 · 수평'],['checklist','체크리스트']] as [string,string][]).map(([l,label]) => (
                <button key={l} onClick={() => onUpdate('layout', l)}
                  className={`w-full mt-1 py-2 px-3 text-left text-[12px] font-bold border rounded transition-colors ${(block.layout||'vertical-left')===l ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400 text-gray-500'}`}>
                  {label}
                </button>
              ))}
            </div>
            {block.layout === 'checklist' && (<>
              <div>
                <Label>아이콘 모양</Label>
                <Seg options={[{v:'check',label:'체크 ✓'},{v:'dot',label:'점 ●'}]} value={block.checklistIcon||'check'} onChange={v => onUpdate('checklistIcon', v)} />
              </div>
              <div>
                <Label>열 수</Label>
                <Seg options={[{v:'1',label:'1'},{v:'2',label:'2'},{v:'3',label:'3'}]} value={String(block.cols||1)} onChange={v => onUpdate('cols', Number(v))} />
              </div>
            </>)}
            {block.layout !== 'checklist' && (
              <div>
                <Label>노드(단계 마커) 스타일</Label>
                <Seg options={[{v:'number',label:'번호 원'},{v:'dot',label:'점'},{v:'ring',label:'링'},{v:'bigNum',label:'대형 번호'}]} value={block.nodeStyle||'number'} onChange={v => onUpdate('nodeStyle', v)} />
              </div>
            )}
            <div>
              <Label>단계 순차 등장</Label>
              <Seg options={[{v:'none',label:'없음'},{v:'fadeIn',label:'페이드'},{v:'slideUp',label:'위로'},{v:'slideIn',label:'좌로'}]} value={block.nodeAnim||'none'} onChange={v => onUpdate('nodeAnim', v === 'none' ? undefined : v)} />
            </div>
            {block.nodeAnim && block.nodeAnim !== 'none' && (
              <Slider label="단계 간 지연" value={block.nodeStagger ?? 0.12} min={0} max={0.5} step={0.02} unit="s" onChange={v => onUpdate('nodeStagger', v)} />
            )}
          </Section>
          <Section title="색상">
            <ColorPicker label={block.layout === 'checklist' ? '아이콘 색상' : '활성 노드 색상'} value={block.activeColor||'#f97316'} onChange={v => onUpdate('activeColor', v)} />
            {block.layout !== 'checklist' && <ColorPicker label="연결선 색상" value={block.lineColor||'#111827'} onChange={v => onUpdate('lineColor', v)} />}
          </Section>
        </>)}

        {/* ──────── IMAGE ──────── */}
        {block.type === 'image' && (<>
          <Section title="이미지">
            <ImageUploader
              label="이미지"
              value={block.src || ''}
              onChange={v => onUpdate('src', v)}
            />
            <div>
              <Label>Alt 텍스트 (접근성)</Label>
              <input type="text" value={block.alt||''} onChange={e => onUpdate('alt', e.target.value)} placeholder="이미지 설명"
                className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
            </div>
            <div>
              <Label>클릭 링크 URL</Label>
              <input type="text" value={block.href||''} onChange={e => onUpdate('href', e.target.value)} placeholder="https://..."
                className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400" />
            </div>
            {block.href && (
              <div>
                <Label>링크 대상</Label>
                <Seg options={[{v:'_blank',label:'새 탭'},{v:'_self',label:'현재 탭'}]} value={block.linkTarget||'_blank'} onChange={v => onUpdate('linkTarget', v)} />
              </div>
            )}
          </Section>
          <Section title="레이아웃·크기">
            <Slider label="너비" value={block.width ?? 100} min={10} max={100} step={5} unit="%" onChange={v => onUpdate('width', v)} />
            <div>
              <Label>정렬</Label>
              <Seg options={[{v:'left',label:'왼쪽'},{v:'center',label:'가운데'},{v:'right',label:'오른쪽'}]} value={block.align||'center'} onChange={v => onUpdate('align', v)} />
            </div>
            <div>
              <Label>비율</Label>
              <Seg options={[{v:'auto',label:'원본'},{v:'16/9',label:'16:9'},{v:'4/3',label:'4:3'},{v:'1/1',label:'1:1'},{v:'3/4',label:'3:4'}]} value={block.aspect||'auto'} onChange={v => onUpdate('aspect', v)} />
            </div>
            <Slider label="모서리 둥글기" value={block.radius ?? 0} min={0} max={32} onChange={v => onUpdate('radius', v)} />
            <div>
              <Label>여백</Label>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="위" value={block.paddingTop ?? block.paddingY ?? 0} onChange={v => onUpdate('paddingTop', v)} unit="px" min={0} max={200} />
                <NumInput label="아래" value={block.paddingBottom ?? block.paddingY ?? 0} onChange={v => onUpdate('paddingBottom', v)} unit="px" min={0} max={200} />
                <NumInput label="좌" value={block.paddingLeft ?? 0} onChange={v => onUpdate('paddingLeft', v)} unit="px" min={0} max={200} />
                <NumInput label="우" value={block.paddingRight ?? 0} onChange={v => onUpdate('paddingRight', v)} unit="px" min={0} max={200} />
              </div>
            </div>
            {block.aspect && block.aspect !== 'auto' && (
              <div>
                <Label>Object Fit (채우기 방식)</Label>
                <Seg options={[{v:'cover',label:'Cover'},{v:'contain',label:'Contain'},{v:'fill',label:'Fill'}]} value={block.objectFit||'cover'} onChange={v => onUpdate('objectFit', v)} />
                <div className="text-[12px] text-gray-400 font-bold leading-relaxed mt-1">비율 틀에 이미지를 채우는 방식 — Cover(꽉 채움·가장자리 잘림) / Contain(전체 보임·여백 생김) / Fill(강제로 늘림)</div>
              </div>
            )}
          </Section>
          <Section title="배경">
            <ColorPicker label="섹션 배경색" value={block.bgColor||''} onChange={v => onUpdate('bgColor', v)} />
          </Section>
        </>)}

        {/* ──────── SPACER ──────── */}
        {block.type === 'spacer' && (<>
          <Section title="레이아웃·크기">
            <Slider label="높이" value={block.height ?? 64} min={8} max={320} step={8} onChange={v => onUpdate('height', v)} />
            <ColorPicker label="배경색" value={block.bgColor||''} onChange={v => onUpdate('bgColor', v)} />
          </Section>
        </>)}

        {/* ──────── DIVIDER (구분 요소) ──────── */}
        {block.type === 'divider' && (<>
          <Section title="구분 유형">
            <Seg options={[{v:'line',label:'선'},{v:'ticker',label:'흐르는 띠'}]} value={block.variant||'line'} onChange={v => onUpdate('variant', v)} />
          </Section>

          {block.variant === 'ticker' && (
            <Section title="흐르는 띠">
              <div>
                <Label>항목 (한 줄에 하나)</Label>
                <textarea value={(block.tickerItems || []).join('\n')} onChange={e => onUpdate('tickerItems', e.target.value.split('\n'))}
                  rows={4} placeholder={'브랜드 전략 동아리\n2019년 창립'} className="w-full border border-gray-200 rounded text-[14px] px-2 py-1.5 outline-none focus:border-orange-400 resize-none" />
              </div>
              <div>
                <Label>구분 기호</Label>
                <input type="text" value={block.separator ?? '✦'} onChange={e => onUpdate('separator', e.target.value)}
                  className="w-full border border-gray-200 rounded text-[14px] text-center px-2 py-1.5 outline-none focus:border-orange-400" />
              </div>
              <Slider label="속도 (값 클수록 느림)" value={block.speed ?? 24} min={8} max={80} step={2} unit="s" onChange={v => onUpdate('speed', v)} />
              <NumInput label="글자 크기" value={block.tickerFontSize ?? 13} onChange={v => onUpdate('tickerFontSize', v)} unit="px" min={10} max={32} />
              <Slider label="세로 여백" value={block.paddingY ?? 14} min={4} max={48} onChange={v => onUpdate('paddingY', v)} />
              <ColorPicker label="배경색" value={block.bgColor||'#f97316'} onChange={v => onUpdate('bgColor', v)} />
              <ColorPicker label="글자색" value={block.textColor||'#ffffff'} onChange={v => onUpdate('textColor', v)} />
              <ColorPicker label="기호 색상" value={block.accentColor||''} onChange={v => onUpdate('accentColor', v)} />
              <div>
                <Label>흐름 방향</Label>
                <Seg options={[{v:'normal',label:'왼쪽 ←'},{v:'reverse',label:'오른쪽 →'}]} value={block.tickerReverse?'reverse':'normal'} onChange={v => onUpdate('tickerReverse', v === 'reverse' || undefined)} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!block.tickerFade} onChange={e => onUpdate('tickerFade', e.target.checked || undefined)} className="accent-orange-500 w-3.5 h-3.5" />
                <span className="text-[14px] font-bold">가장자리 페이드</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!block.tickerPause} onChange={e => onUpdate('tickerPause', e.target.checked || undefined)} className="accent-orange-500 w-3.5 h-3.5" />
                <span className="text-[14px] font-bold">마우스 올리면 정지</span>
              </label>
            </Section>
          )}

          {(block.variant||'line') === 'line' && (
            <Section title="선 스타일">
              <div>
                <Label>선 스타일</Label>
                <Seg options={[{v:'solid',label:'실선'},{v:'dashed',label:'점선'},{v:'dotted',label:'점점'}]} value={block.style||'solid'} onChange={v => onUpdate('style', v)} />
              </div>
              <ColorPicker label="선 색상" value={block.color||'#e5e7eb'} onChange={v => onUpdate('color', v)} />
              <Slider label="선 두께" value={block.thickness ?? 1} min={1} max={8} onChange={v => onUpdate('thickness', v)} />
              <Slider label="선 너비" value={block.width ?? 100} min={10} max={100} step={5} unit="%" onChange={v => onUpdate('width', v)} />
            </Section>
          )}

          {(block.variant||'line') === 'line' && (
            <Section title="여백·배경">
              <Slider label="세로 여백" value={block.paddingY ?? 24} min={0} max={160} step={8} onChange={v => onUpdate('paddingY', v)} />
              <ColorPicker label="배경색" value={block.bgColor||''} onChange={v => onUpdate('bgColor', v)} />
            </Section>
          )}
        </>)}

        {/* ──────── STATS ──────── */}
        {block.type === 'stats' && (<>
          <Section title="레이아웃·크기">
            <div>
              <Label>스타일</Label>
              <Seg options={[{v:'strip',label:'스트립'},{v:'cards',label:'카드'}]} value={block.layout||'strip'} onChange={v => onUpdate('layout', v)} />
            </div>
            <div>
              <Label>컬럼 수</Label>
              <Seg options={[{v:'2',label:'2열'},{v:'3',label:'3열'},{v:'4',label:'4열'}]} value={String(block.cols||3)} onChange={v => onUpdate('cols', Number(v))} />
            </div>
            <Slider label="세로 여백" value={block.paddingY ?? 56} min={0} max={160} step={8} onChange={v => onUpdate('paddingY', v)} />
            <ColorPicker label="배경색" value={block.bgColor||'#ffffff'} onChange={v => onUpdate('bgColor', v)} />
            {block.layout === 'cards' && (<>
              <ColorPicker label="카드 배경색" value={block.cardBg||'#f9fafb'} onChange={v => onUpdate('cardBg', v)} />
              <ColorPicker label="카드 테두리색" value={block.borderColor||'#e5e7eb'} onChange={v => onUpdate('borderColor', v)} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={block.accentLine !== false} onChange={e => onUpdate('accentLine', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5" />
                <span className="text-[14px] font-bold">상단 강조 라인 (테마 색상)</span>
              </label>
            </>)}
          </Section>
          <Section title="타이포그래피">
            <NumInput label="숫자 크기" value={block.valueSize ?? 48} onChange={v => onUpdate('valueSize', v)} unit="px" min={16} max={120} />
            <NumInput label="라벨 크기" value={block.labelSize ?? 14} onChange={v => onUpdate('labelSize', v)} unit="px" min={8} max={48} />
            <ColorPicker label="숫자 색상" value={block.valueColor||'#111827'} onChange={v => onUpdate('valueColor', v)} />
            <ColorPicker label="라벨 색상" value={block.labelColor||'#6b7280'} onChange={v => onUpdate('labelColor', v)} />
          </Section>
          <Section title="애니메이션">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={block.animate !== false} onChange={e => onUpdate('animate', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5" />
              <span className="text-[14px] font-bold">스크롤 인뷰 카운트업 애니메이션</span>
            </label>
            {block.animate !== false && (
              <Slider label="카운트 속도" value={block.countDuration ?? 1.5} min={0.5} max={4} step={0.1} unit="s" onChange={v => onUpdate('countDuration', v)} />
            )}
          </Section>
          <Section title="통계 항목">
            <div className="flex flex-col gap-2">
              {statsItems.map((item: any, i: number) => (
                <div key={item.id} className="border border-gray-200 rounded p-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-black text-gray-400">항목 {i + 1}</span>
                    {statsItems.length > 1 && (
                      <button onClick={() => onUpdate('items', statsItems.filter((_: any, j: number) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-[12px]">✕</button>
                    )}
                  </div>
                  <input value={item.icon||''} onChange={e => { const its = statsItems.map((it: any) => it.id === item.id ? { ...it, icon: e.target.value } : it); onUpdate('items', its); }}
                    className="w-full border border-gray-200 rounded text-[14px] px-2 py-1 outline-none focus:border-orange-400" placeholder="아이콘 이모지 (선택, 예: 🎓)" />
                  <div className="text-[12px] text-gray-400 font-bold">숫자·라벨은 중앙 미리보기에서 편집</div>
                </div>
              ))}
              {statsItems.length < 6 && (
                <button onClick={() => onUpdate('items', [...statsItems, { id: genId(), icon: '', value: '0+', label: '새 통계' }])}
                  className="py-1.5 border border-dashed border-gray-200 hover:border-orange-400 text-gray-400 hover:text-orange-500 text-[12px] font-bold flex items-center justify-center gap-1 rounded transition-colors">
                  <Plus className="w-3 h-3" /> 항목 추가
                </button>
              )}
            </div>
          </Section>
        </>)}


        {/* ──────── 공통: 등장 효과 (자체 모션이 없는 위젯에만 단일 섹션으로 노출) ──────── */}
        {['image', 'faq', 'stats', 'countdown', 'divider'].includes(block.type) && (
          <Section title="등장 효과" tab="motion" tip="스크롤로 화면에 들어올 때 한 번 재생됩니다.">
            <Seg options={[{v:'none',label:'없음'},{v:'fadeIn',label:'페이드'},{v:'slideUp',label:'위로'},{v:'clipUp',label:'마스크'}]}
              value={block.animation||'none'} onChange={v => onUpdate('animation', v === 'none' ? undefined : v)} />
            {block.animation && block.animation !== 'none' && (
              <Slider label="속도" value={block.animDuration ?? 0.6} min={0.2} max={2} step={0.1} unit="s" onChange={v => onUpdate('animDuration', v)} />
            )}
          </Section>
        )}

        {/* ── Delete ── */}
        <div className="pt-4 mt-2 border-t border-gray-100">
          <button onClick={onDelete}
            className="w-full py-2 border border-red-200 text-red-400 hover:border-red-500 hover:bg-red-50 hover:text-red-600 font-bold text-[14px] transition-colors rounded flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> 위젯 삭제
          </button>
        </div>
      </div>
      </PanelTabCtx.Provider>
      {motionOpen && (
        <MotionModal block={block} onUpdate={onUpdate} primary={resolveThemeHex(activeTheme)} activeTheme={activeTheme} onClose={() => setMotionOpen(false)} />
      )}
    </aside>
  );
};
