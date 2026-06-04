import React, { useEffect, useRef, useState } from 'react';

/* ─── Design tokens ─── */
const GOLD    = '#B8965A';
const BLACK   = '#0E0E0E';
const WARM_WH = '#FAF8F5';
const BEIGE   = '#E8DED3';
const GREY    = '#7A7368';
const SERIF   = "'Noto Serif KR', 'Georgia', 'Times New Roman', serif";
const SANS    = "'Noto Sans KR', 'Apple SD Gothic Neo', -apple-system, system-ui, sans-serif";

/* ─── Scroll-reveal wrapper ─── */
const Reveal: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  children: React.ReactNode;
}> = ({ className = '', style = {}, delay = 0, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

/* ─── Label chip (재사용) ─── */
const Label: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
    <div style={{ width: 36, height: 1, backgroundColor: light ? 'rgba(184,150,90,0.7)' : GOLD }} />
    <span style={{ color: light ? 'rgba(184,150,90,0.85)' : GOLD, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>
      {children}
    </span>
  </div>
);

/* ─── Gallery card with hover ─── */
const GalleryCard: React.FC<{ src: string; label: string; delay: number }> = ({ src, label, delay }) => {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', cursor: 'zoom-in' }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.75s cubic-bezier(0.16,1,0.3,1)', transform: hov ? 'scale(1.07)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 55%)', opacity: hov ? 1 : 0, transition: 'opacity 0.35s ease', pointerEvents: 'none' }}>
          <span style={{ position: 'absolute', bottom: 20, left: 20, color: 'white', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>{label}</span>
        </div>
      </div>
    </Reveal>
  );
};

/* ─── Team card with hover ─── */
const TeamCard: React.FC<{ name: string; role: string; img: string; delay: number }> = ({ name, role, img, delay }) => {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay}>
      <div style={{ cursor: 'pointer' }}>
        <div style={{ aspectRatio: '3/4', overflow: 'hidden', backgroundColor: '#1A1A1A' }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
        >
          <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: hov ? 'grayscale(0%) brightness(1)' : 'grayscale(20%) brightness(0.88)', transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.7s cubic-bezier(0.16,1,0.3,1), filter 0.5s ease' }} />
        </div>
        <div style={{ paddingTop: 18 }}>
          <div style={{ color: 'white', fontWeight: 900, fontSize: 16, marginBottom: 5 }}>{name}</div>
          <div style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>{role}</div>
        </div>
      </div>
    </Reveal>
  );
};

/* ─── Data ─── */
const GALLERY = [
  { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&q=85', label: '브랜드 아이덴티티' },
  { src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=700&q=85', label: '전략 세션' },
  { src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=85', label: '팀 협업' },
  { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=85', label: '스튜디오' },
  { src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=85', label: '프레젠테이션' },
  { src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=85', label: '전시 & 네트워킹' },
];

const TEAM = [
  { name: '김채원', role: '회장 · 브랜드 전략', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
  { name: '박준호', role: '부회장 · 크리에이티브', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { name: '이소연', role: '기획팀장', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80' },
  { name: '최민준', role: '디자인팀장', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
];

const STATS = [
  { num: '32', unit: '+', label: '누적 프로젝트', sub: 'Brand & Design', dark: true },
  { num: '68', unit: '명', label: '활동 인원',     sub: '25기 포함',    dark: false },
  { num: '80', unit: '%', label: '현업 취업률',    sub: '졸업생 기준',  dark: false },
  { num: '6',  unit: '년', label: '활동 역사',     sub: '2019 ~ 현재',  dark: true },
];

export default function ClubDemoPage() {
  /* Load Korean fonts */
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div style={{ fontFamily: SANS, backgroundColor: WARM_WH, color: BLACK, overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════
          1. HERO — split dark / image
      ═══════════════════════════════════════ */}
      <section className="vd-hero" style={{ display: 'grid', gridTemplateColumns: '55% 45%', minHeight: '100vh', position: 'relative' }}>

        {/* Left dark panel */}
        <div style={{ backgroundColor: BLACK, padding: 'clamp(60px,8vw,120px) clamp(40px,6vw,80px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '100vh', position: 'relative' }}>

          {/* Floating nav */}
          <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px clamp(40px,6vw,80px)', zIndex: 10 }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: '0.1em', fontFamily: SANS }}>VISTA</span>
            <div className="vd-nav" style={{ display: 'flex', gap: 32 }}>
              {['소개', '활동', '팀', '지원하기'].map(item => (
                <span key={item}
                  style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.02em', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                >{item}</span>
              ))}
            </div>
          </nav>

          {/* Copy block */}
          <div>
            <Label light>Visual &amp; Brand Strategy</Label>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(42px,5.5vw,80px)', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 28px' }}>
              디자인으로<br />세상을<br />설득합니다
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 15, lineHeight: 1.9, maxWidth: 380, marginBottom: 48, fontWeight: 300 }}>
              VISTA는 브랜드 전략과 크리에이티브 디자인으로<br />시장을 이끄는 대학생 연합 동아리입니다.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button
                style={{ padding: '15px 36px', backgroundColor: GOLD, color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: SANS, transition: 'background-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#9e7e48')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = GOLD)}
              >
                25기 지원하기
              </button>
              <button
                style={{ padding: '15px 28px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', letterSpacing: '0.06em', fontFamily: SANS, transition: 'border-color 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                포트폴리오 보기
              </button>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ position: 'absolute', bottom: 40, left: 'clamp(40px,6vw,80px)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Scroll</span>
          </div>
        </div>

        {/* Right image panel */}
        <div className="vd-hero-img" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
          <img
            src="https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&q=90"
            alt="VISTA Studio"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.32) 100%)' }} />
          {/* Floating badge */}
          <div style={{ position: 'absolute', bottom: 40, right: 40, backgroundColor: 'white', padding: '22px 28px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 900, color: BLACK, lineHeight: 1 }}>25기</div>
            <div style={{ fontSize: 11, color: GOLD, marginTop: 8, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>모집 중 · D-12</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          2. TICKER
      ═══════════════════════════════════════ */}
      <div style={{ backgroundColor: GOLD, padding: '15px 0', overflow: 'hidden', userSelect: 'none' }}>
        <div style={{ display: 'flex', animation: 'vd-ticker 24s linear infinite', whiteSpace: 'nowrap' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', paddingRight: 80, flexShrink: 0 }}>
              ✦ 브랜드 전략 동아리&nbsp;&nbsp;✦ 2019년 창립&nbsp;&nbsp;✦ 누적 프로젝트 32건&nbsp;&nbsp;✦ 현업 취업률 80%&nbsp;&nbsp;✦ 기업 파트너십 8곳&nbsp;&nbsp;✦ 25기 모집중
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          3. ABOUT + STATS GRID
      ═══════════════════════════════════════ */}
      <section className="vd-2col" style={{ backgroundColor: WARM_WH, padding: 'clamp(80px,11vw,160px) clamp(40px,8vw,120px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <Reveal>
          <Label>About VISTA</Label>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(30px,3.5vw,52px)', fontWeight: 900, lineHeight: 1.18, letterSpacing: '-0.01em', margin: '0 0 22px' }}>
            브랜딩이 전부다<br />전략적으로 아름답게
          </h2>
          <p style={{ color: GREY, fontSize: 16, lineHeight: 1.9, margin: '0 0 40px' }}>
            VISTA는 단순한 포트폴리오를 넘어 실제 시장에서 통하는 브랜드를 만들어냅니다. 매 기수마다 기업 클라이언트와의 실전 프로젝트를 진행하며, 브랜드 전략부터 비주얼 아이덴티티까지 전 과정을 직접 경험합니다.
          </p>
          <a href="#"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: BLACK, fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textDecoration: 'none', paddingBottom: 4, borderBottom: `2px solid ${BLACK}`, transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = GOLD; el.style.borderColor = GOLD; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = BLACK; el.style.borderColor = BLACK; }}
          >
            VISTA 소개 더보기 →
          </a>
        </Reveal>

        <Reveal delay={0.15}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ backgroundColor: s.dark ? BLACK : BEIGE, padding: 'clamp(28px,3vw,44px) clamp(20px,2.5vw,32px)' }}>
                <div style={{ fontFamily: SERIF, fontSize: 'clamp(40px,4vw,58px)', fontWeight: 900, color: s.dark ? 'white' : BLACK, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {s.num}<span style={{ fontSize: '0.42em', fontWeight: 400, letterSpacing: 0 }}>{s.unit}</span>
                </div>
                <div style={{ marginTop: 14, color: s.dark ? 'rgba(255,255,255,0.6)' : GREY, fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                <div style={{ color: s.dark ? 'rgba(255,255,255,0.28)' : '#9B8F85', fontSize: 11, marginTop: 5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════
          4. GALLERY
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: 'white', paddingTop: 'clamp(80px,10vw,120px)', paddingBottom: 'clamp(80px,10vw,120px)' }}>
        <Reveal style={{ textAlign: 'center', padding: '0 clamp(40px,8vw,120px)', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, backgroundColor: GOLD }} />
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>활동 갤러리</span>
            <div style={{ width: 28, height: 1, backgroundColor: GOLD }} />
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3.5vw,46px)', fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 16px' }}>다양한 활동들</h2>
          <p style={{ color: GREY, fontSize: 15, lineHeight: 1.7, margin: 0 }}>브랜드 전략 · 비주얼 아이덴티티 · 실전 프로젝트 · 네트워킹</p>
        </Reveal>

        <div className="vd-gallery" style={{ padding: '0 clamp(16px,3vw,48px)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {GALLERY.map((item, i) => (
            <GalleryCard key={i} src={item.src} label={item.label} delay={i * 0.06} />
          ))}
        </div>

        <Reveal style={{ textAlign: 'center', marginTop: 52 }}>
          <button
            style={{ padding: '14px 44px', backgroundColor: BLACK, color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: SANS, transition: 'background-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = BLACK)}
          >
            모든 활동 보기
          </button>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════
          5. FEATURED PROJECT (dark)
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F0EAE2', padding: 'clamp(80px,10vw,120px) clamp(40px,8vw,120px)' }}>
        <Reveal style={{ marginBottom: 48 }}>
          <Label>Featured Project</Label>
        </Reveal>
        <div className="vd-2col-flush" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 520 }}>
          <Reveal style={{ overflow: 'hidden', position: 'relative' }}>
            <img
              src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900&q=85"
              alt="Featured Project"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 520, transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1)' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </Reveal>
          <Reveal delay={0.1} style={{ backgroundColor: BLACK, padding: 'clamp(40px,5vw,72px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '7px 16px', backgroundColor: GOLD, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 32 }}>
                24기 대표 프로젝트
              </div>
              <h3 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,2.8vw,40px)', fontWeight: 900, color: 'white', lineHeight: 1.25, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
                로컬 F&amp;B 브랜드<br />'온도:씨'<br />브랜드 리뉴얼
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.44)', fontSize: 15, lineHeight: 1.88, fontWeight: 300, margin: 0 }}>
                6주간의 리서치와 아이덴티티 작업을 통해 신규 고객 유입률 40% 상승. 브랜드 전략부터 패키지 디자인, SNS 런칭 캠페인까지 전 과정을 VISTA가 주도했습니다.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 36, marginBottom: 36, flexWrap: 'wrap' }}>
                {[['기간', '6주'], ['역할', '브랜딩 + 디자인'], ['결과', '매출 +40%']].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{k}</div>
                    <div style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: GOLD, fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', background: 'none', border: `1px solid ${GOLD}`, padding: '12px 24px', cursor: 'pointer', fontFamily: SANS, transition: 'background-color 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = GOLD; }}
              >
                케이스 스터디 보기 ↗
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          6. HOW WE WORK
      ═══════════════════════════════════════ */}
      <section className="vd-2col" style={{ backgroundColor: 'white', padding: 'clamp(80px,10vw,120px) clamp(40px,8vw,120px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <Reveal>
          <Label>매주 목요일</Label>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(28px,3.2vw,48px)', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.01em', margin: '0 0 20px' }}>
            스터디에서<br />실무까지<br />한 기수 안에
          </h2>
          <p style={{ color: GREY, fontSize: 16, lineHeight: 1.9, margin: '0 0 36px' }}>
            이론만 배우는 동아리는 이제 그만. VISTA는 매주 실제 클라이언트 브리핑을 기반으로 세션을 운영하며, 졸업 전 최소 2개의 실전 프로젝트 경험을 보장합니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              '매주 목요일 저녁 브랜드 세션 (90분)',
              '기업 클라이언트와의 실전 프로젝트 (반기별)',
              '현업 브랜드 매니저 멘토링 프로그램',
              '연 1회 포트폴리오 전시회 개최',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 22, height: 22, backgroundColor: GOLD, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                  <div style={{ width: 7, height: 7, backgroundColor: 'white', borderRadius: '50%' }} />
                </div>
                <span style={{ color: '#3A3A3A', fontSize: 15, lineHeight: 1.65, fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12} style={{ position: 'relative' }}>
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=85"
            alt="스튜디오"
            style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', bottom: -20, left: -20, backgroundColor: BLACK, padding: '20px 28px', zIndex: 1 }}>
            <div style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>VISTA STUDIO</div>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>매주 목요일 19:00 — 21:00</div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════
          7. TEAM
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: BLACK, padding: 'clamp(80px,10vw,120px) clamp(40px,8vw,120px)' }}>
        <Reveal style={{ marginBottom: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Label light>Core Team</Label>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3.2vw,48px)', fontWeight: 900, color: 'white', letterSpacing: '-0.01em', margin: 0 }}>25기 운영진</h2>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 14, fontWeight: 500 }}>총 12명</span>
          </div>
        </Reveal>
        <div className="vd-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {TEAM.map((m, i) => (
            <TeamCard key={i} name={m.name} role={m.role} img={m.img} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          8. TESTIMONIAL
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F0EAE2', padding: 'clamp(80px,10vw,120px) clamp(40px,8vw,120px)', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: SERIF, fontSize: 'clamp(80px,12vw,140px)', lineHeight: 0.72, color: BEIGE, fontWeight: 900, marginBottom: 36, userSelect: 'none' }}>"</div>
          <blockquote style={{ fontFamily: SERIF, fontSize: 'clamp(20px,2.5vw,34px)', fontWeight: 700, lineHeight: 1.55, color: BLACK, maxWidth: 780, margin: '0 auto 36px', letterSpacing: '-0.01em' }}>
            VISTA에서 보낸 1년이 4년 대학생활 중 가장 밀도 있는 시간이었습니다. 클라이언트 앞에서 브리핑하던 그 경험이 지금의 저를 만들었어요.
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}` }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: BLACK }}>김채원</div>
              <div style={{ color: GOLD, fontSize: 13, fontWeight: 500, marginTop: 4 }}>VISTA 23기 · 現 (주)HS애드 브랜드플래너</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════
          9. RECRUIT CTA
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: BLACK, padding: 'clamp(80px,10vw,140px) clamp(40px,8vw,120px)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        {[640, 440, 280].map((size, i) => (
          <div key={i} style={{ position: 'absolute', right: '-80px', top: '50%', transform: 'translateY(-50%)', width: size, height: size, borderRadius: '50%', border: `1px solid rgba(184,150,90,${0.05 + i * 0.04})`, pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700 }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: GOLD, padding: '9px 20px', marginBottom: 40 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white' }} />
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>현재 모집중 · D-12</span>
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(56px,9vw,110px)', fontWeight: 900, color: 'white', lineHeight: 0.98, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
              25기<br />모집합니다
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, lineHeight: 1.88, margin: '0 0 52px', maxWidth: 460, fontWeight: 300 }}>
              2026년 하반기 VISTA 25기 정기 모집. 브랜드 전략, 크리에이티브 디자인에 관심 있는 누구든 지원 가능합니다. 서류 마감 6월 30일.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                style={{ padding: '18px 52px', backgroundColor: GOLD, color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: SANS, transition: 'background-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#9e7e48')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = GOLD)}
              >
                지원서 작성하기
              </button>
              <button
                style={{ padding: '18px 36px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', letterSpacing: '0.04em', fontFamily: SANS, transition: 'border-color 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                모집 공고 보기
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          10. FOOTER
      ═══════════════════════════════════════ */}
      <footer style={{ backgroundColor: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(36px,4vw,56px) clamp(40px,8vw,120px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 18, letterSpacing: '0.1em', marginBottom: 8, fontFamily: SANS }}>VISTA</div>
            <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: 13 }}>Visual &amp; Brand Strategy Club · Est. 2019</div>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {['인스타그램', '노션', '포트폴리오', '문의하기'].map(item => (
              <span key={item}
                style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.32)')}
              >{item}</span>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>© 2026 VISTA · Powered by OURCLUB</div>
        </div>
      </footer>

      {/* ─── Keyframes & responsive ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vd-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        @media (max-width: 960px) {
          .vd-hero      { grid-template-columns: 1fr !important; }
          .vd-hero-img  { display: none !important; }
          .vd-nav       { display: none !important; }
          .vd-2col      { grid-template-columns: 1fr !important; gap: 48px !important; }
          .vd-2col-flush{ grid-template-columns: 1fr !important; }
          .vd-4col      { grid-template-columns: repeat(2, 1fr) !important; }
          .vd-gallery   { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .vd-gallery { grid-template-columns: 1fr !important; }
        }
      ` }} />
    </div>
  );
}
