import React, { useState, useEffect, useRef, ElementType } from 'react';
import { MessageSquare, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

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

const THEME_HEX: Record<string, string> = {
  'orange-500': '#f97316', 'black': '#000000', 'white': '#ffffff',
  'blue-600': '#2563eb', 'green-600': '#16a34a', 'purple-500': '#a855f7',
};
const THEME_BG: Record<string, string> = {
  'orange-500': 'bg-orange-500', 'black': 'bg-black', 'white': 'bg-white',
  'blue-600': 'bg-blue-600', 'green-600': 'bg-green-600', 'purple-500': 'bg-purple-500',
};
const resolveThemeHex = (t: string) =>
  t.startsWith('custom:') ? t.replace('custom:', '') : (THEME_HEX[t] || '#f97316');
const getThemeText = (t: string) => {
  const hex = resolveThemeHex(t);
  return (t === 'white' || hex === '#ffffff') ? 'text-black' : 'text-white';
};
const getAlignClass = (a?: string) =>
  ({ center: 'text-center', right: 'text-right', justify: 'text-justify' }[a || ''] || 'text-left');

/* ─── Scroll-triggered animation wrapper ─── */
const AnimDiv: React.FC<{
  animation?: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ animation, delay = 0, className = '', style = {}, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // 요소의 15%가 뷰포트 안에 들어왔을 때 트리거
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const hasAnim = animation && animation !== 'none';
  const animClass = hasAnim && inView ? `wb-anim-${animation}` : '';
  const finalStyle: React.CSSProperties =
    hasAnim && inView && delay > 0 ? { ...style, animationDelay: `${delay}s` } : style;

  return (
    <div
      ref={ref}
      className={[animClass, className].filter(Boolean).join(' ')}
      style={finalStyle}
    >
      {children}
    </div>
  );
};

/* ─── FAQ Item (accordion) ─── */
const FaqItem = ({ item, openBg, iconStyle, themeColor }: { item: any; openBg?: string; iconStyle?: string; themeColor?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-gray-50 text-left transition-colors"
      >
        <span className="font-bold flex-1 text-sm">{item.question}</span>
        <span className="shrink-0 font-black text-lg leading-none" style={{ color: themeColor || '#f97316' }}>
          {iconStyle === 'arrow' ? (open ? '↑' : '↓') : (open ? '−' : '+')}
        </span>
      </button>
      {open && (
        <div
          className="px-5 py-4 border-t border-gray-100 text-gray-600 font-medium text-sm leading-relaxed"
          style={{ backgroundColor: openBg || '#fff7ed' }}
        >
          {item.answer}
        </div>
      )}
    </div>
  );
};

/* ─── Hero Slider (animated transitions) ─── */
const HeroSliderBlock = ({ block, activeTheme }: { block: any; activeTheme: string }) => {
  const slides: any[] = block.slides || [];
  const [si, setSi] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const anim = block.slideAnim || 'slide'; // 'slide' | 'fade'

  const goNext = () => setSi(i => (i + 1) % slides.length);
  const goPrev = () => setSi(i => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (block.autoPlay && slides.length > 1) {
      timerRef.current = setInterval(goNext, block.interval || 4000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [block.autoPlay, block.interval, slides.length]);

  if (!slides.length) return null;

  const themeColor = resolveThemeHex(activeTheme);
  const isLight = themeColor === '#ffffff' || activeTheme === 'white';

  return (
    <div className="relative w-full overflow-hidden" style={{ height: `${block.height || 60}vh` }}>
      {slides.map((slide, i) => {
        const bgStyle =
          slide.bgType === 'image' && slide.bgValue
            ? { backgroundImage: `url(${slide.bgValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { backgroundColor: slide.bgValue || '#111111' };

        const slideStyle =
          anim === 'fade'
            ? {
                opacity: i === si ? 1 : 0,
                zIndex: i === si ? 1 : 0,
                transition: 'opacity 0.8s ease',
              }
            : {
                transform: `translateX(${(i - si) * 100}%)`,
                transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                zIndex: 1,
              };

        return (
          <div
            key={slide.id}
            className="absolute inset-0"
            style={{ ...bgStyle, ...slideStyle }}
          >
            {slide.bgType === 'image' && slide.bgValue && (
              <div className="absolute inset-0 bg-black" style={{ opacity: (slide.overlayOpacity || 0) / 100 }} />
            )}
            <div
              className={`relative z-10 h-full flex flex-col justify-center p-8 md:p-12 ${
                slide.align === 'center' ? 'items-center text-center'
                : slide.align === 'right' ? 'items-end text-right'
                : 'items-start text-left'
              }`}
            >
              {slide.h1 && (
                <h1
                  className="font-black text-white leading-tight whitespace-pre-line"
                  style={{ fontSize: `clamp(28px, 5vw, ${block.h1Size || 48}px)` }}
                >
                  {slide.h1}
                </h1>
              )}
              {slide.subtitle && (
                <p className="text-white/70 mt-4" style={{ fontSize: `${block.subtitleSize || 18}px` }}>
                  {slide.subtitle}
                </p>
              )}
              {slide.ctaShow !== false && slide.ctaText && (
                <button
                  className="mt-8 px-8 py-3 font-black text-base border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-none hover:translate-y-1 transition-all"
                  style={{ backgroundColor: themeColor, color: isLight ? '#000' : '#fff' }}
                >
                  {slide.ctaText}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white w-10 h-10 flex items-center justify-center rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white w-10 h-10 flex items-center justify-center rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {slides.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setSi(i)}
                className={`w-2 h-2 rounded-full border border-white transition-all ${
                  i === si ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Timeline Node ─── */
const TlDot = ({ idx, activeColor }: { idx: number; activeColor: string }) => (
  <div
    className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-sm shrink-0 z-10"
    style={
      idx === 0
        ? { backgroundColor: activeColor, color: '#fff', borderColor: activeColor }
        : { backgroundColor: '#fff', color: '#111', borderColor: '#000' }
    }
  >
    {idx + 1}
  </div>
);

/* ─── Main Renderer ─── */
export const ClubPageRenderer: React.FC<ClubPageRendererProps> = ({
  blocks,
  config,
  activeRecruit,
  onApply,
}) => {
  const {
    activeTheme = 'orange-500',
    coverImg = '',
    clubName = '',
    hashtag1 = '',
    hashtag2 = '',
    badgeText = '',
    showFloatingBtn = true,
    contentWidth = '860',
    pageBgColor = '',
    globalFont = '',
  } = config;

  const themeColor = resolveThemeHex(activeTheme);
  const isCustomTheme = activeTheme.startsWith('custom:');
  const themeBg = isCustomTheme ? '' : (THEME_BG[activeTheme] || 'bg-orange-500');
  const themeText = getThemeText(activeTheme);
  const themeStyle = isCustomTheme ? { backgroundColor: themeColor } : {};

  const renderBlock = (block: any) => {
    switch (block.type) {

      case 'text': {
        const Tag = (['h1','h2','h3','h4','h5','h6','p'].includes(block.seoTag)
          ? block.seoTag : 'p') as ElementType;
        const ptop = block.paddingTop ?? block.paddingY ?? 32;
        const pbot = block.paddingBottom ?? block.paddingY ?? 32;
        const pleft = block.paddingLeft ?? 40;
        const pright = block.paddingRight ?? 40;
        return (
          <AnimDiv
            key={block.id}
            animation={block.animation}
            style={{
              backgroundColor: block.bgColor || 'transparent',
              paddingTop: `${ptop}px`, paddingBottom: `${pbot}px`,
              paddingLeft: `${pleft}px`, paddingRight: `${pright}px`,
            }}
          >
            <div style={{ maxWidth: block.maxWidth ? `${block.maxWidth}px` : '100%' }} className="mx-auto">
              <Tag
                className={getAlignClass(block.align)}
                style={{
                  fontSize: `${block.fontSize || 16}px`,
                  fontWeight: block.fontWeight || 400,
                  color: block.textColor || '#111827',
                  lineHeight: block.lineHeight || 1.7,
                  letterSpacing: block.letterSpacing ? `${block.letterSpacing}em` : undefined,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {block.text}
              </Tag>
            </div>
          </AnimDiv>
        );
      }

      case 'heroSlider':
        return <HeroSliderBlock key={block.id} block={block} activeTheme={activeTheme} />;

      case 'layoutContainer':
        return (
          <div
            key={block.id}
            className="wbr-grid-wrap"
            style={{
              backgroundColor: block.bgColor || 'transparent',
              paddingTop: `${block.paddingY || 40}px`,
              paddingBottom: `${block.paddingY || 40}px`,
            }}
          >
            <div
              className="px-4 md:px-8 mx-auto wbr-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${block.cols || 2}, 1fr)`,
                gap: `${block.gap || 20}px`,
              }}
            >
              {(block.cells || []).map((cell: any, cellIdx: number) => {
                const cellAnim = block.cellAnimation;
                const pos = cell.imgPosition || 'top';
                const imgH = cell.imgHeight || 180;
                const cellImg = cell.imgSrc ? (
                  <img
                    src={cell.imgSrc} alt=""
                    className="w-full object-cover shrink-0"
                    style={{ height: `${imgH}px`, borderRadius: pos === 'top' || pos === 'bottom' ? '4px' : undefined }}
                  />
                ) : null;
                const cellContent = (
                  <>
                    <h3
                      className="font-black mb-2"
                      style={{
                        fontSize: `${cell.titleSize || 18}px`,
                        color: cell.titleColor || '#111827',
                        textAlign: cell.align || 'left',
                      }}
                    >
                      {cell.title}
                    </h3>
                    <p
                      className="leading-relaxed"
                      style={{
                        fontSize: `${cell.textSize || 14}px`,
                        color: cell.textColor || '#374151',
                        textAlign: cell.align || 'left',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {cell.text}
                    </p>
                  </>
                );

                /* bg: 배경 이미지 + 텍스트 오버레이 */
                if (pos === 'bg' && cell.imgSrc) {
                  return (
                    <AnimDiv
                      key={cell.id}
                      animation={cellAnim}
                      delay={cellIdx * 0.1}
                      className="wbr-cell relative overflow-hidden"
                      style={{
                        backgroundImage: `url(${cell.imgSrc})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: `${cell.borderRadius || 8}px`,
                        border: `${cell.borderWidth || 1}px solid ${cell.borderColor || '#e5e7eb'}`,
                        minHeight: `${imgH}px`,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: `rgba(0,0,0,${(cell.bgOverlay ?? 40) / 100})` }}
                      />
                      <div className="relative z-10" style={{ padding: `${cell.padding || 24}px` }}>
                        <h3 className="font-black mb-2" style={{ fontSize: `${cell.titleSize || 18}px`, color: '#ffffff', textAlign: cell.align || 'left' }}>{cell.title}</h3>
                        <p className="leading-relaxed" style={{ fontSize: `${cell.textSize || 14}px`, color: 'rgba(255,255,255,0.8)', textAlign: cell.align || 'left', whiteSpace: 'pre-wrap' }}>{cell.text}</p>
                      </div>
                    </AnimDiv>
                  );
                }

                /* left / right: 이미지 + 텍스트 가로 배치 */
                if ((pos === 'left' || pos === 'right') && cell.imgSrc) {
                  return (
                    <AnimDiv
                      key={cell.id}
                      animation={cellAnim}
                      delay={cellIdx * 0.1}
                      className="wbr-cell wbr-cell-lr overflow-hidden"
                      style={{
                        backgroundColor: cell.bgColor || '#fff',
                        borderRadius: `${cell.borderRadius || 8}px`,
                        border: `${cell.borderWidth || 1}px solid ${cell.borderColor || '#e5e7eb'}`,
                        display: 'flex',
                        flexDirection: pos === 'left' ? 'row' : 'row-reverse',
                      }}
                    >
                      <img
                        src={cell.imgSrc} alt=""
                        className="object-cover shrink-0 wbr-cell-lr-img"
                        style={{ width: `${cell.imgWidth || 40}%`, maxHeight: '240px' }}
                      />
                      <div style={{ padding: `${cell.padding || 24}px`, flex: 1 }}>{cellContent}</div>
                    </AnimDiv>
                  );
                }

                /* top (default) / bottom */
                return (
                  <AnimDiv
                    key={cell.id}
                    animation={cellAnim}
                    delay={cellIdx * 0.1}
                    className="wbr-cell"
                    style={{
                      backgroundColor: cell.bgColor || '#fff',
                      padding: `${cell.padding || 24}px`,
                      borderRadius: `${cell.borderRadius || 8}px`,
                      border: `${cell.borderWidth || 1}px solid ${cell.borderColor || '#e5e7eb'}`,
                    }}
                  >
                    {pos !== 'bottom' && cellImg && <div className="mb-4">{cellImg}</div>}
                    {cellContent}
                    {pos === 'bottom' && cellImg && <div className="mt-4">{cellImg}</div>}
                  </AnimDiv>
                );
              })}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div key={block.id} className="px-4 md:px-8 max-w-3xl mx-auto w-full py-10">
            {block.title && (
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-5 h-5 shrink-0" style={{ color: themeColor }} />
                <h2 className="text-2xl font-black">{block.title}</h2>
              </div>
            )}
            <div
              className="border-2 border-black divide-y divide-black overflow-hidden"
              style={{ borderRadius: `${block.borderRadius || 0}px` }}
            >
              {(block.items || []).map((item: any) => (
                <FaqItem key={item.id} item={item} openBg={block.openBg} iconStyle={block.iconStyle} themeColor={themeColor} />
              ))}
            </div>
          </div>
        );

      case 'timeline': {
        const tlLayout = block.layout || 'vertical-left';
        const tlNodes: any[] = block.nodes || [];
        const tlActive = block.activeColor || '#f97316';
        const tlLine = block.lineColor || '#111827';

        const NodeContent = ({ node, right }: { node: any; right?: boolean }) => (
          <div className={right ? 'text-right' : ''}>
            <h3 className="font-black text-base">{node.title}</h3>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{node.desc}</p>
          </div>
        );

        return (
          <div key={block.id} className="px-4 md:px-10 max-w-3xl mx-auto w-full py-10">
            {block.title && (
              <div className="flex items-center gap-3 mb-10">
                <Clock className="w-5 h-5 shrink-0" style={{ color: themeColor }} />
                <h2 className="text-2xl font-black">{block.title}</h2>
              </div>
            )}

            {tlLayout === 'vertical-left' && (
              <div className="relative">
                {tlNodes.length > 1 && (
                  <div className="absolute left-4 top-5 bottom-5 w-0.5" style={{ backgroundColor: tlLine }} />
                )}
                <div className="flex flex-col">
                  {tlNodes.map((node: any, idx: number) => (
                    <div key={node.id} className="flex gap-6 pb-10 last:pb-0">
                      <TlDot idx={idx} activeColor={tlActive} />
                      <div className="flex-1 pt-1"><NodeContent node={node} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tlLayout === 'vertical-center' && (
              <div className="relative">
                {tlNodes.length > 1 && (
                  <div className="absolute left-1/2 top-5 bottom-5 w-0.5 -translate-x-1/2" style={{ backgroundColor: tlLine }} />
                )}
                <div className="flex flex-col">
                  {tlNodes.map((node: any, idx: number) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <div key={node.id} className="flex items-start gap-6 pb-10 last:pb-0">
                        <div className="flex-1 pt-1 min-w-0">
                          {isEven && <NodeContent node={node} right />}
                        </div>
                        <TlDot idx={idx} activeColor={tlActive} />
                        <div className="flex-1 pt-1 min-w-0">
                          {!isEven && <NodeContent node={node} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tlLayout === 'horizontal' && (
              <div className="overflow-x-auto pb-2">
                <div className="relative flex" style={{ minWidth: `${Math.max(tlNodes.length * 140, 300)}px` }}>
                  {tlNodes.length > 1 && (
                    <div
                      className="absolute top-4 h-0.5 z-0"
                      style={{ backgroundColor: tlLine, left: '36px', right: '36px' }}
                    />
                  )}
                  {tlNodes.map((node: any, idx: number) => (
                    <div key={node.id} className="flex-1 flex flex-col items-center gap-3 relative z-10 px-1">
                      <TlDot idx={idx} activeColor={tlActive} />
                      <div className="text-center w-full">
                        <h3 className="font-black text-sm">{node.title}</h3>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{node.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'button': {
        const handleClick = () => {
          if (block.actionType === 'url' && block.actionUrl) {
            window.open(block.actionUrl, '_blank', 'noopener,noreferrer');
          } else if (block.actionType === 'modal' || !block.actionType) {
            onApply?.();
          } else if (block.actionType === 'scroll' && block.actionTarget) {
            document.querySelector(block.actionTarget)?.scrollIntoView({ behavior: 'smooth' });
          }
        };
        const sizeClass =
          block.btnSize === 's' ? 'px-6 py-2 text-xs min-w-[100px]'
          : block.btnSize === 'l' ? 'px-14 py-5 text-xl min-w-[240px]'
          : 'px-10 py-4 text-base min-w-[200px]';
        return (
          <div
            key={block.id}
            className="flex justify-center w-full"
            style={{
              paddingTop: `${block.paddingY || 32}px`,
              paddingBottom: `${block.paddingY || 32}px`,
              backgroundColor: block.bgColor || 'transparent',
            }}
          >
            <button
              onClick={handleClick}
              className={`font-black border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.9)] hover:shadow-none hover:translate-y-1 transition-all ${sizeClass}`}
              style={{
                backgroundColor: block.btnBg || themeColor,
                color: block.btnTextColor || (activeTheme === 'white' ? '#000' : '#fff'),
                borderRadius: `${block.radius || 0}px`,
                letterSpacing: '0.02em',
              }}
            >
              {block.text}
            </button>
          </div>
        );
      }

      case 'image':
        return block.src ? (
          <div
            key={block.id}
            className="w-full flex justify-center px-4 md:px-8"
            style={{
              paddingTop: `${block.paddingY || 16}px`,
              paddingBottom: `${block.paddingY || 16}px`,
              backgroundColor: block.bgColor || 'transparent',
            }}
          >
            {block.href ? (
              <a href={block.href} target={block.linkTarget || '_blank'} rel="noopener noreferrer">
                <img
                  src={block.src} alt={block.alt || ''}
                  style={{
                    width: `${block.width || 100}%`,
                    borderRadius: `${block.radius || 0}px`,
                    objectFit: block.objectFit || 'cover',
                    maxHeight: '500px',
                    display: 'block',
                  }}
                />
              </a>
            ) : (
              <img
                src={block.src} alt={block.alt || ''}
                style={{
                  width: `${block.width || 100}%`,
                  borderRadius: `${block.radius || 0}px`,
                  objectFit: block.objectFit || 'cover',
                  maxHeight: '500px',
                  display: 'block',
                }}
              />
            )}
          </div>
        ) : null;

      case 'spacer':
        return (
          <div
            key={block.id}
            style={{ height: `${block.height || 64}px`, backgroundColor: block.bgColor || 'transparent' }}
          />
        );

      case 'divider':
        return (
          <div
            key={block.id}
            className="w-full px-4 md:px-8"
            style={{
              paddingTop: `${block.paddingY || 24}px`,
              paddingBottom: `${block.paddingY || 24}px`,
              backgroundColor: block.bgColor || 'transparent',
            }}
          >
            <hr style={{
              borderStyle: block.style || 'solid',
              borderTopWidth: `${block.thickness || 1}px`,
              borderColor: block.color || '#e5e7eb',
              width: `${block.width || 100}%`,
              margin: '0 auto',
            }} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ backgroundColor: pageBgColor || '#ffffff', fontFamily: globalFont || undefined }}>

      {/* Global cover */}
      <div className="h-[50vh] md:h-[55vh] bg-gray-900 relative overflow-hidden">
        {coverImg && (
          <img src={coverImg} alt="" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-8 md:p-12">
          <div className="flex gap-2 mb-3">
            {hashtag1 && <span className="px-2.5 py-0.5 font-bold text-xs bg-white text-black">#{hashtag1}</span>}
            {hashtag2 && <span className="px-2.5 py-0.5 font-bold text-xs bg-white text-black">#{hashtag2}</span>}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-1">{clubName}</h1>
          {badgeText && (
            <div
              className={`absolute top-6 right-6 px-4 py-2 font-black text-sm border-2 border-black rotate-3 shadow-[3px_3px_0_0_rgba(255,255,255,0.9)] ${themeBg} ${themeText}`}
              style={themeStyle}
            >
              {badgeText}
            </div>
          )}
        </div>
      </div>

      {/* Sticky recruit bar */}
      <div className="w-full border-b-2 border-black bg-white sticky top-16 z-40">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="font-bold text-sm text-gray-600">
            {activeRecruit ? `${activeRecruit.generation ?? ''} 모집중` : '현재 모집 공고가 없습니다'}
          </div>
          <button
            onClick={activeRecruit ? onApply : undefined}
            disabled={!activeRecruit}
            className={`px-6 py-2.5 text-sm font-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all ${
              activeRecruit
                ? `${themeBg} ${themeText} hover:shadow-none hover:translate-y-0.5`
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
            style={activeRecruit ? themeStyle : {}}
          >
            지원하기
          </button>
        </div>
      </div>

      {/* Blocks */}
      <div
        className="mx-auto"
        style={{ maxWidth: contentWidth === 'full' ? '100%' : `${contentWidth}px` }}
      >
        {blocks.map(renderBlock)}
      </div>

      {/* Floating CTA */}
      {showFloatingBtn && activeRecruit && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={onApply}
            className={`px-6 py-3 font-black border-2 border-black text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all ${themeBg} ${themeText}`}
            style={themeStyle}
          >
            지원하기 →
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wbFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes wbSlideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
        @keyframes wbSlideIn { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:none; } }
        .wb-anim-fadeIn { animation: wbFadeIn 0.7s ease forwards; }
        .wb-anim-slideUp { animation: wbSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .wb-anim-slideIn { animation: wbSlideIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .wb-anim-fadeIn, .wb-anim-slideUp, .wb-anim-slideIn { animation: none; }
        }
        .wbr-cell { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .wbr-cell:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.1); }
        /* Container Query — Workspace 프리뷰에서도 정확히 동작 */
        .wbr-grid-wrap { container-type: inline-size; }
        @container (max-width: 600px) {
          .wbr-grid { grid-template-columns: 1fr !important; }
          .wbr-cell-lr { flex-direction: column !important; }
          .wbr-cell-lr-img { width: 100% !important; max-height: 200px; }
        }
        /* 브라우저 fallback */
        @media (max-width: 640px) {
          .wbr-grid { grid-template-columns: 1fr !important; }
          .wbr-cell-lr { flex-direction: column !important; }
          .wbr-cell-lr-img { width: 100% !important; max-height: 200px; }
        }
      ` }} />
    </div>
  );
};
