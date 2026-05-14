import React, { useState } from 'react';
import { X, Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react';

interface Props {
  block: any;
  onUpdate: (field: string, value: any) => void;
  onDeselect: () => void;
  onDelete: () => void;
  themeHex: Record<string, string>;
  activeTheme: string;
}

/* ── small reusable controls ── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{children}</div>
);

const Row = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex gap-2 items-center ${className}`}>{children}</div>
);

const Seg = ({ options, value, onChange }: { options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex w-full">
    {options.map(({ v, label }) => (
      <button key={v} onClick={() => onChange(v)}
        className={`flex-1 py-1.5 text-[10px] font-black border-y border-r first:border-l first:rounded-l last:rounded-r transition-colors
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
        className="flex-1 font-mono text-xs outline-none bg-transparent uppercase" placeholder="#000000" />
    </div>
  </div>
);

const Slider = ({ label, value, min, max, step = 1, unit = 'px', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) => (
  <div>
    <Row className="mb-1 justify-between">
      <Label>{label}</Label>
      <span className="text-[10px] font-black text-gray-500">{value}{unit}</span>
    </Row>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-orange-500 cursor-pointer" />
  </div>
);

const NumInput = ({ label, value, onChange, unit = 'px', min, max }: {
  label: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number;
}) => (
  <div>
    <Label>{label}</Label>
    <div className="flex items-center border border-gray-200 rounded overflow-hidden">
      <input type="number" value={value || 0} min={min} max={max}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 text-xs font-bold outline-none px-2 py-1.5 bg-white" />
      <span className="px-2 text-[10px] font-bold text-gray-400 bg-gray-50 border-l border-gray-200 shrink-0">{unit}</span>
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
    <div className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-3">{title}</div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const WIDGET_LABELS: Record<string, string> = {
  text: '텍스트 블록', button: '동적 CTA 버튼', faq: 'FAQ 아코디언',
  timeline: '타임라인', heroSlider: '히어로 슬라이더', layoutContainer: '레이아웃 컨테이너',
  image: '이미지', spacer: '여백', divider: '구분선',
};

export const BlockPropertiesPanel: React.FC<Props> = ({ block, onUpdate, onDeselect, onDelete, themeHex, activeTheme }) => {
  /* slider: which slide is being edited in the properties panel */
  const [propSlideIdx, setPropSlideIdx] = useState(0);
  /* layoutContainer: which cell is being edited */
  const [activeCellIdx, setActiveCellIdx] = useState(0);

  const slides: any[] = block.slides || [];
  const slide = slides[Math.min(propSlideIdx, slides.length - 1)];
  const updSlide = (field: string, val: any) => {
    const upd = slides.map((s: any, i: number) => i === propSlideIdx ? { ...s, [field]: val } : s);
    onUpdate('slides', upd);
  };
  const moveSlide = (from: number, to: number) => {
    const arr = [...slides]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m);
    onUpdate('slides', arr);
    setPropSlideIdx(to);
  };
  const removeSlide = (idx: number) => {
    const arr = slides.filter((_: any, i: number) => i !== idx);
    onUpdate('slides', arr);
    setPropSlideIdx(Math.max(0, idx - 1));
  };

  const cells: any[] = block.cells || [];
  const cell = cells[Math.min(activeCellIdx, cells.length - 1)];
  const updCell = (field: string, val: any) => {
    const upd = cells.map((c: any, i: number) => i === activeCellIdx ? { ...c, [field]: val } : c);
    onUpdate('cells', upd);
  };

  return (
    <aside className="w-72 border-l border-black bg-white flex flex-col overflow-y-auto shrink-0 shadow-[-3px_0_0_0_rgba(0,0,0,0.08)] z-10">

      {/* Header */}
      <div className="px-4 py-3 border-b border-black sticky top-0 bg-white z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-black text-xs">{WIDGET_LABELS[block.type] ?? block.type}</div>
            <div className="text-[9px] font-mono text-gray-300 mt-0.5">widget_{block.id}</div>
          </div>
          <button onClick={onDeselect} className="p-1.5 border border-gray-200 hover:border-black rounded transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
        {/* Tab row (design only for now) */}
        <div className="flex gap-0 mt-2.5 border-b border-gray-200 -mx-4 px-4">
          <div className="py-1.5 text-[10px] font-black border-b-2 border-orange-500 text-orange-500 pr-3">디자인</div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-0 flex-1">

        {/* ──────── TEXT ──────── */}
        {block.type === 'text' && (<>
          <Section title="레이아웃 & 크기">
            <NumInput label="최대 너비 (Max Width)" value={block.maxWidth || 0} onChange={v => onUpdate('maxWidth', v || undefined)} unit="px" />
            <div>
              <Label>여백 (Padding)</Label>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="위 (Top)" value={block.paddingTop ?? block.paddingY ?? 32} onChange={v => onUpdate('paddingTop', v)} unit="px" />
                <NumInput label="아래 (Bottom)" value={block.paddingBottom ?? block.paddingY ?? 32} onChange={v => onUpdate('paddingBottom', v)} unit="px" />
                <NumInput label="좌 (Left)" value={block.paddingLeft ?? 40} onChange={v => onUpdate('paddingLeft', v)} unit="px" />
                <NumInput label="우 (Right)" value={block.paddingRight ?? 40} onChange={v => onUpdate('paddingRight', v)} unit="px" />
              </div>
            </div>
          </Section>

          <Section title="타이포그래피">
            <div className="grid grid-cols-2 gap-2">
              <NumInput label="글자 크기" value={block.fontSize ?? 16} onChange={v => onUpdate('fontSize', v)} unit="px" min={8} max={200} />
              <div>
                <Label>굵기 (Weight)</Label>
                <select value={block.fontWeight ?? 400} onChange={e => onUpdate('fontWeight', Number(e.target.value))}
                  className="w-full border border-gray-200 rounded text-xs font-bold py-1.5 px-2 outline-none bg-white">
                  {[100,200,300,400,500,600,700,800,900].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <Slider label="줄 간격 (Line Height)" value={block.lineHeight ?? 1.7} min={1} max={3} step={0.1} unit="×" onChange={v => onUpdate('lineHeight', v)} />
            <Slider label="자간 (Letter Spacing)" value={block.letterSpacing ?? 0} min={-0.1} max={0.3} step={0.01} unit="em" onChange={v => onUpdate('letterSpacing', v)} />
          </Section>

          <Section title="텍스트 색상">
            <ColorPicker value={block.textColor || '#111827'} onChange={v => onUpdate('textColor', v)} />
          </Section>

          <Section title="배경 & 정렬">
            <ColorPicker label="배경색" value={block.bgColor || '#ffffff'} onChange={v => onUpdate('bgColor', v === '#ffffff' ? '' : v)} />
            <div>
              <Label>정렬</Label>
              <Seg options={[{v:'left',label:'좌'},{v:'center',label:'중'},{v:'right',label:'우'},{v:'justify',label:'양쪽'}]} value={block.align||'left'} onChange={v => onUpdate('align', v)} />
            </div>
          </Section>

          <Section title="애니메이션">
            <div>
              <Label>등장 효과</Label>
              <Seg options={[{v:'none',label:'없음'},{v:'fadeIn',label:'페이드'},{v:'slideUp',label:'위로'},{v:'slideIn',label:'좌로'}]} value={block.animation||'none'} onChange={v => onUpdate('animation', v)} />
            </div>
          </Section>

          <Section title="SEO 시맨틱 태그">
            <div className="grid grid-cols-3 gap-1">
              {['h1','h2','h3','h4','h5','h6','p'].map(t => (
                <button key={t} onClick={() => onUpdate('seoTag', t)}
                  className={`py-1.5 text-[10px] font-black border rounded transition-colors ${(block.seoTag||'p')===t ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400 text-gray-500'}`}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </Section>
        </>)}

        {/* ──────── HERO SLIDER ──────── */}
        {block.type === 'heroSlider' && (<>
          <Section title="슬라이더 설정">
            <Slider label="높이 (Height)" value={block.height ?? 60} min={30} max={100} step={5} unit="vh" onChange={v => onUpdate('height', v)} />
            <div>
              <Label>메인 카피 크기</Label>
              <NumInput label="" value={block.h1Size ?? 48} onChange={v => onUpdate('h1Size', v)} unit="px" />
            </div>
            <div>
              <Label>서브 카피 크기</Label>
              <NumInput label="" value={block.subtitleSize ?? 18} onChange={v => onUpdate('subtitleSize', v)} unit="px" />
            </div>
            <div>
              <Label>전환 애니메이션</Label>
              <Seg options={[{v:'slide',label:'슬라이드'},{v:'fade',label:'페이드'}]} value={block.slideAnim||'slide'} onChange={v => onUpdate('slideAnim', v)} />
            </div>
          </Section>

          <Section title="슬라이드 관리">
            <div className="flex flex-col gap-1">
              {slides.map((s: any, i: number) => (
                <div key={s.id} className={`flex items-center gap-1 px-2 py-1.5 border rounded cursor-pointer transition-colors ${i === propSlideIdx ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-400'}`}
                  onClick={() => setPropSlideIdx(i)}>
                  <span className="text-[10px] font-black text-gray-400 w-4">{i + 1}</span>
                  <span className="text-[10px] font-bold flex-1 truncate">{s.h1?.split('\n')[0] || `슬라이드 ${i + 1}`}</span>
                  <button onClick={e => { e.stopPropagation(); if (i > 0) moveSlide(i, i - 1); }} disabled={i === 0} className="p-0.5 hover:text-orange-500 disabled:opacity-20 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={e => { e.stopPropagation(); if (i < slides.length - 1) moveSlide(i, i + 1); }} disabled={i === slides.length - 1} className="p-0.5 hover:text-orange-500 disabled:opacity-20 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                  {slides.length > 1 && <button onClick={e => { e.stopPropagation(); removeSlide(i); }} className="p-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>}
                </div>
              ))}
              <button onClick={() => { const ns = { id: Date.now().toString(), bgType: 'color', bgValue: '#111', overlayOpacity: 0, h1: '새 슬라이드', subtitle: '', ctaText: '지원하기', ctaShow: true, align: 'center' }; onUpdate('slides', [...slides, ns]); setPropSlideIdx(slides.length); }}
                className="py-1.5 border border-dashed border-gray-200 hover:border-orange-400 text-gray-400 hover:text-orange-500 text-[10px] font-bold flex items-center justify-center gap-1 rounded transition-colors">
                <Plus className="w-3 h-3" /> 슬라이드 추가
              </button>
            </div>
          </Section>

          {slide && (<>
            <Section title={`슬라이드 ${propSlideIdx + 1} - 배경`}>
              <div>
                <Label>배경 타입</Label>
                <Seg options={[{v:'color',label:'단색'},{v:'gradient',label:'그라디언트'},{v:'image',label:'이미지'}]} value={slide.bgType||'color'} onChange={v => updSlide('bgType', v)} />
              </div>
              {slide.bgType !== 'image' && <ColorPicker label="배경색" value={slide.bgValue||'#111111'} onChange={v => updSlide('bgValue', v)} />}
              {slide.bgType === 'image' && (
                <div>
                  <Label>이미지 URL</Label>
                  <input type="text" value={slide.bgValue||''} onChange={e => updSlide('bgValue', e.target.value)} placeholder="https://..." className="w-full border border-gray-200 rounded text-xs px-2 py-1.5 outline-none focus:border-orange-400" />
                </div>
              )}
              {slide.bgType === 'image' && <Slider label="오버레이 불투명도" value={slide.overlayOpacity??0} min={0} max={90} unit="%" onChange={v => updSlide('overlayOpacity', v)} />}
            </Section>

            <Section title={`슬라이드 ${propSlideIdx + 1} - 콘텐츠`}>
              <div>
                <Label>텍스트 정렬</Label>
                <Seg options={[{v:'left',label:'좌'},{v:'center',label:'중'},{v:'right',label:'우'}]} value={slide.align||'center'} onChange={v => updSlide('align', v)} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={slide.ctaShow !== false} onChange={e => updSlide('ctaShow', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5" />
                <span className="text-xs font-bold">CTA 버튼 표시</span>
              </label>
            </Section>
          </>)}
        </>)}

        {/* ──────── LAYOUT CONTAINER ──────── */}
        {block.type === 'layoutContainer' && (<>
          <Section title="컨테이너 설정">
            <div>
              <Label>컬럼 수</Label>
              <Seg options={[{v:'1',label:'1열'},{v:'2',label:'2열'},{v:'3',label:'3열'},{v:'4',label:'4열'}]} value={String(block.cols||2)} onChange={v => onUpdate('cols', Number(v))} />
            </div>
            <Slider label="간격 (Gap)" value={block.gap ?? 20} min={0} max={80} step={4} onChange={v => onUpdate('gap', v)} />
            <Slider label="세로 여백" value={block.paddingY ?? 40} min={0} max={160} step={8} onChange={v => onUpdate('paddingY', v)} />
            <ColorPicker label="배경색" value={block.bgColor||'transparent'} onChange={v => onUpdate('bgColor', v)} />
          </Section>

          <Section title="셀 애니메이션">
            <div>
              <Label>등장 효과 (순차 적용)</Label>
              <Seg options={[{v:'none',label:'없음'},{v:'fadeIn',label:'페이드'},{v:'slideUp',label:'위로'},{v:'slideIn',label:'좌로'}]} value={block.cellAnimation||'none'} onChange={v => onUpdate('cellAnimation', v)} />
            </div>
          </Section>

          <Section title="셀 편집">
            <div className="flex gap-1 flex-wrap">
              {cells.map((_: any, i: number) => (
                <button key={i} onClick={() => setActiveCellIdx(i)}
                  className={`px-2.5 py-1 text-[10px] font-black border rounded transition-colors ${activeCellIdx === i ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400 text-gray-500'}`}>
                  셀 {i + 1}
                </button>
              ))}
            </div>
            {cell && (<>
              <ColorPicker label="셀 배경색" value={cell.bgColor||'#ffffff'} onChange={v => updCell('bgColor', v)} />
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="안쪽 여백" value={cell.padding ?? 24} onChange={v => updCell('padding', v)} unit="px" />
                <NumInput label="모서리 둥글기" value={cell.borderRadius ?? 8} onChange={v => updCell('borderRadius', v)} unit="px" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="테두리 두께" value={cell.borderWidth ?? 1} onChange={v => updCell('borderWidth', v)} unit="px" />
                <ColorPicker label="테두리 색" value={cell.borderColor||'#e5e7eb'} onChange={v => updCell('borderColor', v)} />
              </div>
              <div>
                <Label>텍스트 정렬</Label>
                <Seg options={[{v:'left',label:'좌'},{v:'center',label:'중'},{v:'right',label:'우'}]} value={cell.align||'left'} onChange={v => updCell('align', v)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="제목 크기" value={cell.titleSize ?? 18} onChange={v => updCell('titleSize', v)} unit="px" />
                <NumInput label="본문 크기" value={cell.textSize ?? 14} onChange={v => updCell('textSize', v)} unit="px" />
              </div>
              <ColorPicker label="제목 색상" value={cell.titleColor||'#111827'} onChange={v => updCell('titleColor', v)} />
              <ColorPicker label="본문 색상" value={cell.textColor||'#374151'} onChange={v => updCell('textColor', v)} />
              <div>
                <Label>셀 이미지 URL</Label>
                <input type="text" value={cell.imgSrc||''} onChange={e => updCell('imgSrc', e.target.value)} placeholder="https://..." className="w-full border border-gray-200 rounded text-xs px-2 py-1.5 outline-none focus:border-orange-400" />
              </div>
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
          <Section title="클릭 액션">
            <div className="flex flex-col gap-1">
              {[['url','URL 페이지 이동'],['scroll','섹션 스크롤 (Anchor)'],['modal','지원 폼 모달']] as const}
              {([['url','URL 페이지 이동'],['scroll','섹션 스크롤'],['modal','지원 폼 모달']] as [string,string][]).map(([t,label]) => (
                <button key={t} onClick={() => onUpdate('actionType', t)}
                  className={`py-2 px-3 text-left text-[10px] font-bold border rounded transition-colors flex items-center gap-2 ${(block.actionType||'modal')===t ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${(block.actionType||'modal')===t ? 'bg-orange-400' : 'bg-gray-300'}`} />
                  {label}
                </button>
              ))}
              {(block.actionType === 'url') && (
                <input type="text" value={block.actionUrl||''} onChange={e => onUpdate('actionUrl', e.target.value)} placeholder="https://..."
                  className="mt-1 w-full border border-gray-200 rounded text-xs px-2 py-1.5 outline-none focus:border-orange-400" />
              )}
            </div>
          </Section>

          <Section title="디자인">
            <div>
              <Label>크기 프리셋</Label>
              <Seg options={[{v:'s',label:'S'},{v:'m',label:'M'},{v:'l',label:'L'}]} value={block.btnSize||'m'} onChange={v => onUpdate('btnSize', v)} />
            </div>
            <ColorPicker label="배경색" value={block.btnBg || (themeHex[activeTheme] || '#f97316')} onChange={v => onUpdate('btnBg', v)} />
            <ColorPicker label="텍스트 색상" value={block.btnTextColor||'#ffffff'} onChange={v => onUpdate('btnTextColor', v)} />
            <Slider label="모서리 둥글기" value={block.radius ?? 0} min={0} max={32} onChange={v => onUpdate('radius', v)} />
            <Slider label="세로 여백" value={block.paddingY ?? 32} min={0} max={120} step={8} onChange={v => onUpdate('paddingY', v)} />
          </Section>

          <Section title="배경">
            <ColorPicker label="섹션 배경색" value={block.bgColor||''} onChange={v => onUpdate('bgColor', v)} />
          </Section>
        </>)}

        {/* ──────── FAQ ──────── */}
        {block.type === 'faq' && (<>
          <Section title="디자인">
            <div>
              <Label>아이콘 스타일</Label>
              <Seg options={[{v:'plus',label:'＋ / −'},{v:'arrow',label:'↑ / ↓'}]} value={block.iconStyle||'plus'} onChange={v => onUpdate('iconStyle', v)} />
            </div>
            <ColorPicker label="열림 배경색" value={block.openBg||'#fff7ed'} onChange={v => onUpdate('openBg', v)} />
            <Slider label="모서리 둥글기" value={block.borderRadius ?? 0} min={0} max={20} onChange={v => onUpdate('borderRadius', v)} />
          </Section>
          <Section title="SEO">
            <label className="flex items-start gap-2 cursor-pointer border border-gray-200 rounded p-3 hover:border-gray-400 transition-colors">
              <input type="checkbox" checked={block.enableSchema||false} onChange={e => onUpdate('enableSchema', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold">FAQPage 구조화 데이터</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Schema.org 마크업으로 구글 검색 최적화</div>
              </div>
            </label>
          </Section>
        </>)}

        {/* ──────── TIMELINE ──────── */}
        {block.type === 'timeline' && (<>
          <Section title="디자인">
            <ColorPicker label="활성 노드 색상" value={block.activeColor||'#f97316'} onChange={v => onUpdate('activeColor', v)} />
            <ColorPicker label="연결선 색상" value={block.lineColor||'#111827'} onChange={v => onUpdate('lineColor', v)} />
          </Section>
          <Section title="레이아웃">
            <div>
              <Label>정렬 방식</Label>
              {([['vertical-left','수직 좌측 정렬'],['vertical-center','수직 교차 정렬'],['horizontal','수평 슬라이드']] as [string,string][]).map(([l,label]) => (
                <button key={l} onClick={() => onUpdate('layout', l)}
                  className={`w-full mt-1 py-2 px-3 text-left text-[10px] font-bold border rounded transition-colors ${(block.layout||'vertical-left')===l ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400 text-gray-500'}`}>
                  {label}
                </button>
              ))}
            </div>
          </Section>
        </>)}

        {/* ──────── IMAGE ──────── */}
        {block.type === 'image' && (<>
          <Section title="이미지">
            <div>
              <Label>이미지 URL</Label>
              <input type="text" value={block.src||''} onChange={e => onUpdate('src', e.target.value)} placeholder="https://images.unsplash.com/..."
                className="w-full border border-gray-200 rounded text-xs px-2 py-1.5 outline-none focus:border-orange-400" />
            </div>
            <div>
              <Label>Alt 텍스트 (접근성)</Label>
              <input type="text" value={block.alt||''} onChange={e => onUpdate('alt', e.target.value)} placeholder="이미지 설명"
                className="w-full border border-gray-200 rounded text-xs px-2 py-1.5 outline-none focus:border-orange-400" />
            </div>
            <div>
              <Label>클릭 링크 URL</Label>
              <input type="text" value={block.href||''} onChange={e => onUpdate('href', e.target.value)} placeholder="https://..."
                className="w-full border border-gray-200 rounded text-xs px-2 py-1.5 outline-none focus:border-orange-400" />
            </div>
            {block.href && (
              <div>
                <Label>링크 대상</Label>
                <Seg options={[{v:'_blank',label:'새 탭'},{v:'_self',label:'현재 탭'}]} value={block.linkTarget||'_blank'} onChange={v => onUpdate('linkTarget', v)} />
              </div>
            )}
          </Section>
          <Section title="레이아웃 & 크기">
            <Slider label="너비 (Width)" value={block.width ?? 100} min={10} max={100} step={5} unit="%" onChange={v => onUpdate('width', v)} />
            <Slider label="모서리 둥글기" value={block.radius ?? 0} min={0} max={32} onChange={v => onUpdate('radius', v)} />
            <Slider label="세로 여백" value={block.paddingY ?? 16} min={0} max={120} step={8} onChange={v => onUpdate('paddingY', v)} />
            <div>
              <Label>Object Fit</Label>
              <Seg options={[{v:'cover',label:'Cover'},{v:'contain',label:'Contain'},{v:'fill',label:'Fill'}]} value={block.objectFit||'cover'} onChange={v => onUpdate('objectFit', v)} />
            </div>
          </Section>
          <Section title="배경">
            <ColorPicker label="섹션 배경색" value={block.bgColor||''} onChange={v => onUpdate('bgColor', v)} />
          </Section>
        </>)}

        {/* ──────── SPACER ──────── */}
        {block.type === 'spacer' && (<>
          <Section title="여백 설정">
            <Slider label="높이 (Height)" value={block.height ?? 64} min={8} max={320} step={8} onChange={v => onUpdate('height', v)} />
            <ColorPicker label="배경색" value={block.bgColor||''} onChange={v => onUpdate('bgColor', v)} />
          </Section>
        </>)}

        {/* ──────── DIVIDER ──────── */}
        {block.type === 'divider' && (<>
          <Section title="구분선 스타일">
            <div>
              <Label>선 스타일</Label>
              <Seg options={[{v:'solid',label:'실선'},{v:'dashed',label:'점선'},{v:'dotted',label:'점점'}]} value={block.style||'solid'} onChange={v => onUpdate('style', v)} />
            </div>
            <ColorPicker label="선 색상" value={block.color||'#e5e7eb'} onChange={v => onUpdate('color', v)} />
            <Slider label="선 두께" value={block.thickness ?? 1} min={1} max={8} onChange={v => onUpdate('thickness', v)} />
            <Slider label="선 너비" value={block.width ?? 100} min={10} max={100} step={5} unit="%" onChange={v => onUpdate('width', v)} />
            <Slider label="세로 여백" value={block.paddingY ?? 24} min={0} max={120} step={8} onChange={v => onUpdate('paddingY', v)} />
          </Section>
          <Section title="배경">
            <ColorPicker label="섹션 배경색" value={block.bgColor||''} onChange={v => onUpdate('bgColor', v)} />
          </Section>
        </>)}

        {/* ── Delete ── */}
        <div className="pt-4 mt-2 border-t border-gray-100">
          <button onClick={onDelete}
            className="w-full py-2 border border-red-200 text-red-400 hover:border-red-500 hover:bg-red-50 hover:text-red-600 font-bold text-xs transition-colors rounded flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> 위젯 삭제
          </button>
        </div>
      </div>
    </aside>
  );
};
