import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Globe, ClipboardCheck, Briefcase,
  CalendarCheck, Users, Megaphone, LayoutTemplate,
} from 'lucide-react';
import { FadeInText } from '../../components/ui/FadeInText';
import { NumberTicker } from '../../components/ui/NumberTicker';
import { usePublicStats } from '../../hooks/usePublicStats';

// 운영진(Hero Audience) 대상 공개 랜딩.
// 브랜드 SSOT 가치 사다리(①홈페이지 ②운영 ③자생)를 토스·아임웹 결의 친근 톤으로 풀어내고,
// 마지막에 '우리 동아리 시작하기'(/club-setup)로 전환시킨다. (제품 명세표가 아니라 결과/체감 중심)

// ── Hero (비대칭 분할 + 실시간 지표 패널) ─────────────────────────────────────

const Hero = () => {
  const stats = usePublicStats();
  return (
    <section className="relative overflow-hidden bg-sand-50 hero-glow border-b border-sand-200">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#EBE6DF_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
      <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-24 md:py-32 text-center flex flex-col items-center">
        <span className="inline-block px-3 py-1 rounded-ctl bg-brand-tint text-brand-dark font-bold text-sm mb-6">
          동아리·학회를 위한 운영 플랫폼
        </span>
        <FadeInText as="h1" className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
          운영은 가볍게,
          <br />
          <span className="text-brand">결과는 남게.</span>
        </FadeInText>
        <p className="reveal-up text-lg font-medium text-sand-600 mb-10 max-w-xl mx-auto">
          흩어진 카톡·엑셀로 매 학기 리셋되던 운영을 한 곳에서. 우리 동아리 홈페이지를 만들고,
          출석·모집·명단을 한 번에 관리하세요. 그리고 기업과 진짜 프로젝트로 한 단계 더 성장하세요.
        </p>
        <div className="reveal-up flex flex-col items-center gap-3 mb-14">
          <Link
            to="/club-setup"
            className="inline-flex group flex-row items-center gap-4 btn-grad text-white rounded-ctl shadow-btn px-8 py-5 text-xl font-black hover:-translate-y-0.5 transition-all w-fit"
          >
            🚀 우리 동아리 시작하기
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={2.5} />
          </Link>
          <Link to="/clubs" className="text-sm font-bold text-sand-500 hover:text-brand transition-colors w-fit">
            동아리 찾는 학생이신가요? 동아리 둘러보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl text-left">
          <div className="stat-grad border border-sand-200 rounded-card shadow-soft p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-brand" strokeWidth={2.5} />
              <span className="font-bold tracking-widest text-sm text-sand-600">한 곳에서 운영 중</span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-ink mb-2">
              <NumberTicker value={stats?.clubs ?? 0} /><span className="text-2xl text-sand-500 ml-2">팀</span>
            </div>
            <p className="text-sand-600 font-medium">의 동아리·학회가 OURCLUB으로 운영을 해결하고 있어요.</p>
          </div>
          <div className="stat-grad border border-sand-200 rounded-card shadow-soft p-5">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-brand" strokeWidth={2.5} />
              <span className="font-bold tracking-widest text-sm text-sand-600">기업과 함께한 프로젝트</span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-ink mb-2">
              <NumberTicker value={stats?.completedProjects ?? 0} duration={1600} /><span className="text-2xl text-brand ml-2">건</span>
            </div>
            <p className="text-sand-600 font-medium">동아리들이 기업과 함께 완료한 협업 프로젝트입니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── 성과 마퀴 ─────────────────────────────────────────────────────────────────

const MARQUEE = [
  "🎨 디자인 동아리 '모노그램', 홈페이지 오픈 후 신입 지원 3배",
  "📋 IT 동아리 '코드크래프트', 출석 관리 자동화로 운영 시간 70% 절약",
  "💼 마케팅 동아리 '마제스티', 기업 신제품 프로모션 프로젝트 진행",
  "📈 기획 동아리 '플래너스', 모집 지원자 역대 최다 달성",
];

const Marquee = () => (
  <div className="flex overflow-hidden bg-brand-tint py-3 select-none">
    <div className="flex flex-shrink-0 animate-marquee-fc whitespace-nowrap items-center">
      {[...MARQUEE, ...MARQUEE].map((text, i) => (
        <span key={i} className="mx-4 font-bold text-ink text-sm md:text-base flex items-center">
          {text} <span className="mx-4 w-1.5 h-1.5 bg-brand rounded-full inline-block" />
        </span>
      ))}
    </div>
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes marquee-fc { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .animate-marquee-fc { animation: marquee-fc 22s linear infinite; }
    `}} />
  </div>
);

// ── 적(敵) → 전환 (비대칭 헤드 + 페인 카드) ───────────────────────────────────

const PAINS = [
  '카톡 공지는 묻히고, 출석은 매번 손으로',
  '지원서는 구글폼에, 합불 통보는 일일이 손으로',
  '우리 동아리를 보여줄 홈페이지가 없음',
  '매 기수 부원 명단·자료가 사라지고 처음부터 다시',
];

const Pains = () => (
  <section className="border-b border-sand-200 bg-sand-50">
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-center">
      <div className="lg:col-span-2">
        <FadeInText as="h2" className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-[1.05]">
          혹시,
          <br />
          <span className="text-brand">이런 적</span> 없나요?
        </FadeInText>
        <p className="font-medium text-sand-500 text-lg mb-8">
          운영은 본업이 아닌데도, 잡일에 시간을 뺏기고 있다면.
        </p>
        <p className="inline-flex items-center gap-2 text-lg md:text-xl font-black border-l-4 border-brand pl-4">
          OURCLUB은 여기서 시작합니다 — <span className="text-brand">운영을 가볍게.</span>
        </p>
      </div>
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PAINS.map((p, i) => (
          <div
            key={p}
            className="flex items-start gap-3 border border-sand-200 bg-white rounded-card p-5 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all"
          >
            <span className="text-2xl leading-none shrink-0">😮‍💨</span>
            <div>
              <span className="text-xs font-black text-sand-300 block mb-1">0{i + 1}</span>
              <p className="font-bold text-sand-600 leading-snug">{p}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── 가치 사다리 3단 (연결 동선) ───────────────────────────────────────────────

const LADDER = [
  {
    step: '01',
    icon: Globe,
    title: '우리 동아리 홈페이지',
    desc: '복잡한 웹빌더 없이, 우리 동아리만의 홈페이지를 갖습니다. 드디어 밖으로 보여줄 게 생겨요.',
  },
  {
    step: '02',
    icon: ClipboardCheck,
    title: '운영을 한 곳에서',
    desc: '출석·모집·명단을 한 곳에서. 본업도 아닌데 쓰던 시간이 확 줄어듭니다.',
  },
  {
    step: '03',
    icon: Briefcase,
    title: '기업과 진짜 프로젝트로',
    desc: '그들만의 모임이 아니라 진짜 사회로. 기업과의 실전 프로젝트로 돈이든 스펙이든 결과가 남아요.',
  },
];

const Ladder = () => (
  <section className="border-b border-sand-200 bg-white">
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
      <div className="text-brand font-bold tracking-widest text-sm mb-3 flex items-center gap-2">
        <span className="w-3 h-3 bg-brand-accent rounded-md inline-block" />
        운영부터 자생까지
      </div>
      <FadeInText as="h2" className="text-3xl md:text-5xl font-black tracking-tight mb-12 leading-tight">
        한 단계씩, 다음 스텝으로.
      </FadeInText>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LADDER.map(({ step, icon: Icon, title, desc }, i) => (
          <div key={step} className="relative flex">
            <div className="flex-1 border border-sand-200 bg-white rounded-card p-7 flex flex-col shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-ctl bg-brand-tint flex items-center justify-center">
                  <Icon className="w-7 h-7 text-brand" strokeWidth={2.5} />
                </div>
                <span className="text-6xl font-black text-sand-200">{step}</span>
              </div>
              <h3 className="text-xl font-black mb-2 text-ink">{title}</h3>
              <p className="font-medium text-sand-600 leading-relaxed">{desc}</p>
            </div>
            {/* 데스크톱 단계 연결 화살표 */}
            {i < LADDER.length - 1 && (
              <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-ctl bg-white border border-sand-200 shadow-soft items-center justify-center">
                <ArrowRight className="w-4 h-4 text-brand" strokeWidth={2.5} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── 기능 미리보기 (결과 중심, 도트 그리드 배경) ───────────────────────────────

const FEATURES = [
  { icon: CalendarCheck, title: '출석', line: '출석 부르느라 30분, 이제 1분.' },
  { icon: Megaphone, title: '모집', line: '지원서·합불 통보까지 한 흐름으로.' },
  { icon: Users, title: '명단', line: '흩어진 부원 정보, 한 곳에 깔끔하게.' },
  { icon: LayoutTemplate, title: '홈페이지', line: '드래그 몇 번으로 우리 페이지 완성.' },
];

const Features = () => (
  <section className="border-b border-sand-200 bg-sand-50 bg-[radial-gradient(#EBE6DF_1px,transparent_1px)] [background-size:16px_16px]">
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
      <FadeInText as="h2" className="text-3xl md:text-5xl font-black tracking-tight mb-3 leading-tight">
        반복되는 운영 잡일을, 한 번에.
      </FadeInText>
      <p className="font-medium text-sand-500 text-lg mb-12">
        기능을 자랑하지 않습니다. 줄어든 시간으로 증명할게요.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map(({ icon: Icon, title, line }) => (
          <div
            key={title}
            className="border border-sand-200 bg-white rounded-card p-6 flex flex-col gap-3 shadow-soft hover:-translate-y-1 hover:shadow-soft-lg transition-all"
          >
            <div className="w-12 h-12 rounded-ctl bg-brand-tint flex items-center justify-center">
              <Icon className="w-7 h-7 text-brand" strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-ink">{title}</h3>
            <p className="font-bold text-sand-600 text-sm leading-relaxed">{line}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── 최종 CTA ──────────────────────────────────────────────────────────────────

const FinalCTA = () => (
  <section className="border-b border-sand-200 btn-grad text-white relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-100 pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }}
    />
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-20 md:py-28 text-center flex flex-col items-center relative z-10">
      <FadeInText as="h2" className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
        현상 유지 말고,
        <br /> 발전하는 동아리로.
      </FadeInText>
      <p className="font-bold text-white/80 text-lg mb-10 max-w-xl">
        지금 우리 동아리를 만들고, 운영을 한 곳에서 시작하세요.
      </p>
      <Link
        to="/club-setup"
        className="inline-flex group flex-row items-center gap-4 bg-white text-brand-dark rounded-ctl shadow-soft px-10 py-5 text-xl font-black hover:-translate-y-0.5 transition-all"
      >
        🚀 우리 동아리 시작하기
        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={2.5} />
      </Link>
    </div>
  </section>
);

export default function ForClubs() {
  return (
    <>
      <Hero />
      <Marquee />
      <Pains />
      <Ladder />
      <Features />
      <FinalCTA />
    </>
  );
}
