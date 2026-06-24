/* ─────────────────────────────────────────────────────────────
   섹션 템플릿 갤러리 모달 — 좌측 카테고리 + 우측 라이브 축소 썸네일.
   썸네일은 공개와 동일한 BlockBody 단일코어를 transform:scale 로 줄여 렌더 → drift 불가.
   삽입은 부모(Workspace)의 onInsert(block) 로 위임(regen·commit·선택은 부모가 처리).
   ───────────────────────────────────────────────────────────── */
import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { BlockBody, resolveThemeHex } from '../blockKit';
import { SECTION_TEMPLATES, categoriesInUse, instantiateTemplate, type SectionTemplate, type TemplateCategory } from '../../lib/templates/sections';

const DESIGN_W = 880; // 썸네일을 렌더하는 가상 디자인 폭(공개 contentWidth 근사). 실제 카드 폭에 맞춰 scale.

/* 미리보기는 정적이어야 하므로 등장/리빌/켄번스 등 시간 기반 효과를 제거한다(썸네일에서 글자 사라짐 방지). */
function staticize(node: any): any {
  const n: any = { ...node, textReveal: 'none', animation: undefined, btnAnim: 'none', nodeAnim: undefined, cellAnimation: undefined, bgKenBurns: 'none', bgParallax: 0, autoplay: false };
  if (Array.isArray(n.rows)) {
    n.rows = n.rows.map((r: any) => ({ ...r, columns: (r.columns || []).map((c: any) => ({ ...c, widgets: (c.widgets || []).map(staticize) })) }));
  }
  return n;
}

/* 썸네일 = 880px 디자인 폭에 BlockBody 를 렌더한 뒤 transform:scale 로 카드 폭에 꽉 맞춘다.
   섹션 전체가 잘리지 않도록 ① scale = 카드폭/880(폭 가득) ② 컨테이너 높이 = 렌더높이×scale(전체 노출).
   카드 폭(반응형 그리드)·이미지 로드에 따른 변동은 ResizeObserver 로 재측정한다. */
const Thumb: React.FC<{ tpl: SectionTemplate; activeTheme: string }> = ({ tpl, activeTheme }) => {
  const preview = useMemo(() => staticize(instantiateTemplate(tpl.block)), [tpl]);
  const themeColor = resolveThemeHex(activeTheme);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [h, setH] = useState(160);
  useLayoutEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const s = outer.clientWidth / DESIGN_W;
      setScale(s);
      setH(inner.offsetHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer); ro.observe(inner);
    return () => ro.disconnect();
  }, [preview]);
  return (
    <div ref={outerRef} className="relative w-full overflow-hidden bg-white pointer-events-none" style={{ height: Math.round(h) }}>
      {/* maxWidth:'none' 로 .wb-root{max-width:100%} 규칙을 무력화 → 880px 데스크톱 폭으로 고정 렌더
         (안 그러면 카드 폭으로 줄어 섹션 컨테이너쿼리가 1열로 무너지고 높이도 어긋나 잘린다). */}
      <div ref={innerRef} className="wb-root" style={{ position: 'absolute', top: 0, left: 0, width: DESIGN_W, maxWidth: 'none', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <BlockBody block={preview} ctx={{ activeTheme, themeColor, edit: false }} />
      </div>
    </div>
  );
};

const SectionTemplateModal: React.FC<{
  open: boolean;
  activeTheme: string;
  onClose: () => void;
  onInsert: (block: any) => void;
}> = ({ open, activeTheme, onClose, onInsert }) => {
  const cats = useMemo(() => categoriesInUse(), []);
  const [active, setActive] = useState<TemplateCategory>(cats[0]?.id ?? 'hero');
  if (!open) return null;
  const activeMeta = cats.find(c => c.id === active);
  const items = SECTION_TEMPLATES.filter(t => t.category === active);

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-card shadow-soft-lg w-[900px] max-w-[94vw] h-[82vh] flex flex-col overflow-hidden animate-slide-down" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 btn-grad text-white shrink-0">
          <div>
            <div className="font-black text-base">섹션 템플릿</div>
            <div className="text-[12px] font-bold text-white/80">기업 홈페이지 섹션을 동아리용으로 — 골라서 바로 삽입</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-ctl hover:bg-white/20 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 좌측 카테고리 */}
          <div className="w-44 border-r border-sand-200 shrink-0 overflow-y-auto hide-scrollbar py-2">
            {cats.map(c => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={`w-full text-left px-4 py-2.5 transition-colors border-l-[3px] ${active === c.id ? 'border-brand bg-brand-tint' : 'border-transparent hover:bg-sand-50'}`}>
                <div className={`text-[13px] font-black ${active === c.id ? 'text-ink' : 'text-sand-600'}`}>{c.label}</div>
                <div className="text-[11px] font-bold text-sand-400 leading-tight mt-0.5">{c.hint}</div>
              </button>
            ))}
          </div>

          {/* 우측 변형 그리드 */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-5 bg-sand-50">
            {activeMeta && <div className="text-[12px] font-black text-sand-400 uppercase tracking-widest mb-3">{activeMeta.label}</div>}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(264px, 1fr))' }}>
              {items.map(tpl => (
                <div key={tpl.id} className="group relative border border-sand-200 bg-white rounded-card overflow-hidden hover:border-brand hover:shadow-soft-lg transition-all">
                  <Thumb tpl={tpl} activeTheme={activeTheme} />
                  <div className="px-3 py-2.5 border-t border-sand-100">
                    <div className="text-[13px] font-black text-ink leading-tight">{tpl.name}</div>
                    <div className="text-[11px] font-bold text-sand-400 leading-tight mt-0.5">{tpl.desc}</div>
                  </div>
                  {/* hover 삽입 오버레이 */}
                  <button onClick={() => onInsert(tpl.block)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="flex items-center gap-1.5 px-4 py-2 btn-grad text-white font-black text-xs rounded-ctl shadow-btn">
                      <Plus className="w-3.5 h-3.5" /> 이 섹션 추가
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionTemplateModal;
