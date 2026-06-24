import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen, Rocket, Bell, Users, Briefcase, ShieldCheck,
  Sparkles, CalendarDays, TrendingUp, FileText, Building2, Award,
  type LucideIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────
// 페이지 하단 슬림 슬라이드 배너 (자사 홍보/공지 · 추후 외부 광고)
//
// presentational only — 데이터 출처(정적 배열 / 추후 banners 테이블)를 모른다.
// 슬림한 1행 구성으로 기존 콘텐츠를 방해하지 않는다. 자세한 규격은 BANNER_SLIDER_PLAN.md.
// ─────────────────────────────────────────────────────────────────────────

export type BannerPage = 'home' | 'recruit' | 'lounge' | 'mypage' | 'workspace';

// DB 직렬화를 위해 아이콘은 문자열 키로 저장 → 여기서 컴포넌트로 매핑.
const ICONS = {
  book: BookOpen, rocket: Rocket, bell: Bell, users: Users,
  briefcase: Briefcase, shield: ShieldCheck, sparkles: Sparkles,
  calendar: CalendarDays, trending: TrendingUp, file: FileText,
  building: Building2, award: Award,
} satisfies Record<string, LucideIcon>;
export type IconKey = keyof typeof ICONS;

export type Slide = {
  id: string;
  theme?: 'light' | 'dark' | 'orange';
  eyebrow?: string;        // 상단 작은 라벨
  title: string;           // 1행 권장 (≤ 24자)
  highlight?: string;      // title 내 강조(오렌지) 문구
  subtitle?: string;       // ≤ 40자
  cta?: { label: string; href: string };   // label ≤ 10자
  iconKey?: IconKey;
  imageUrl?: string;       // 있으면 배경 이미지 + 오버레이(텍스트 흰색)
  // ── 광고 확장 예약 (1차 미사용) ──
  sponsored?: boolean;     // true → '광고' 배지
  startAt?: string;
  endAt?: string;
};

const THEME = {
  light:  { bg: 'bg-white',  text: 'text-ink',   sub: 'text-sand-500', accent: 'text-brand',       chip: 'bg-brand-tint text-brand-dark' },
  dark:   { bg: 'bg-ink',    text: 'text-white', sub: 'text-white/70', accent: 'text-brand-peach',  chip: 'bg-white/10 text-brand-peach' },
  orange: { bg: 'btn-grad',  text: 'text-white', sub: 'text-white/80', accent: 'text-white',        chip: 'bg-white/20 text-white' },
} as const;

// title 내 highlight 문구만 색 강조.
function renderTitle(title: string, highlight: string | undefined, accent: string) {
  const t = title.replace(/\n/g, ' ');
  if (!highlight || !t.includes(highlight)) return t;
  const [head, ...rest] = t.split(highlight);
  return <>{head}<span className={accent}>{highlight}</span>{rest.join(highlight)}</>;
}

function Cta({ cta, theme, image }: { cta: NonNullable<Slide['cta']>; theme: keyof typeof THEME; image: boolean }) {
  // orange(btn-grad) 배너 위에선 흰 버튼, 그 외(흰·ink·이미지)엔 주 그라데이션 버튼.
  const cls = theme === 'orange' && !image
    ? 'bg-white text-brand-dark shadow-soft'
    : 'btn-grad text-white shadow-btn';
  const inner = (
    <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-ctl transition-all hover:-translate-y-0.5 ${cls}`}>
      {cta.label} <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
    </span>
  );
  return cta.href.startsWith('/')
    ? <Link to={cta.href} className="shrink-0">{inner}</Link>
    : <a href={cta.href} target="_blank" rel="noopener noreferrer" className="shrink-0">{inner}</a>;
}

function SlideBody({ s }: { s: Slide }) {
  const image = !!s.imageUrl;
  const theme = s.theme ?? 'light';
  const t = THEME[theme];
  const Icon = s.iconKey ? ICONS[s.iconKey] : null;

  const textCol = image ? 'text-white' : t.text;
  const subCol = image ? 'text-white/80' : t.sub;
  const accentCol = image ? 'text-brand-peach' : t.accent;

  return (
    <div className={`relative w-full h-full overflow-hidden ${image ? 'bg-ink' : t.bg}`}>
      {image && (
        <>
          <img src={s.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/20" />
        </>
      )}
      <div className={`relative h-full flex items-center gap-4 md:gap-5 px-5 md:px-7 ${textCol}`}>
        {Icon && !image && (
          <div className={`hidden sm:flex shrink-0 w-11 h-11 items-center justify-center rounded-ctl ${t.chip}`}>
            <Icon className="w-5 h-5" strokeWidth={2.5} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {s.eyebrow && (
            <p className={`text-[10px] md:text-[11px] font-black tracking-widest uppercase mb-0.5 ${accentCol}`}>{s.eyebrow}</p>
          )}
          <h3 className="text-base md:text-xl font-black leading-tight truncate">
            {renderTitle(s.title, s.highlight, accentCol)}
          </h3>
          {s.subtitle && <p className={`text-xs md:text-sm font-medium truncate mt-0.5 ${subCol}`}>{s.subtitle}</p>}
        </div>
        {s.cta && <Cta cta={s.cta} theme={theme} image={image} />}
      </div>
    </div>
  );
}

export function BannerSlider({ slides, page, className = '' }: {
  slides: Slide[];
  page: BannerPage;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);

  const n = slides.length;
  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // 자동 넘김: reduced-motion이어도 넘기되 전환만 즉시(아래 transition). hover/focus 시 정지.
  useEffect(() => {
    if (paused || n <= 1) return;
    const id = window.setTimeout(() => setIndex(i => (i + 1) % n), 3000);
    return () => window.clearTimeout(id);
  }, [index, paused, n]);

  if (n === 0) return null;

  return (
    <section
      aria-label={`${page} 배너`}
      aria-roledescription="carousel"
      className={`relative overflow-hidden border border-sand-200 rounded-card shadow-soft h-[112px] md:h-[128px] ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={e => { if (e.key === 'ArrowLeft') go(index - 1); if (e.key === 'ArrowRight') go(index + 1); }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      tabIndex={0}
    >
      <div
        className="flex h-full"
        style={{ transform: `translateX(-${index * 100}%)`, transition: reduced ? 'none' : 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {slides.map((s, i) => (
          <div key={s.id} className="w-full shrink-0 h-full relative" aria-hidden={i !== index}>
            {s.sponsored && (
              <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-ctl bg-ink/70 text-white text-[10px] font-black tracking-wider">광고</span>
            )}
            <SlideBody s={s} />
          </div>
        ))}
      </div>

      {n > 1 && (() => {
        const cur = slides[index];
        const onOrange = (cur.theme ?? 'light') === 'orange' && !cur.imageUrl;
        const onLight = (cur.theme ?? 'light') === 'light' && !cur.imageUrl;
        const inactive = onLight ? 'bg-ink/20 hover:bg-ink/40' : 'bg-white/40 hover:bg-white/70';
        // dark(ink)·이미지 위 = 흰 점 / light = brand 점 / orange(btn-grad) 위 흰 점은 대비 약 → ink 점
        const active = onLight ? 'bg-brand' : onOrange ? 'bg-ink' : 'bg-white';
        return (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`${i + 1}번 배너로 이동`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? `w-5 ${active}` : `w-1.5 ${inactive}`}`}
              />
            ))}
          </div>
        );
      })()}
    </section>
  );
}
