import { useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────
   GSAP 스크롤 연출 — Tier-2 lazy 로더 (WEBBUILDER_MASTER_PLAN Track B §4-1)

   원칙:
   - gsap/ScrollTrigger 는 '스크롤 연출이 켜진 페이지'에서만 동적 import → 안 쓰면 번들 0kb.
   - prefers-reduced-motion 이면 전역 가드(연출 미적용).
   - 에디터 캔버스/미리보기에는 적용하지 않는다(스크롤 컨텍스트 없음) — 호출부에서 enabled 로 제어.
   ───────────────────────────────────────────────────────────── */

let _promise: Promise<{ gsap: any; ScrollTrigger: any } | null> | null = null;

/** gsap + ScrollTrigger 를 한 번만 로드/등록하고 캐시한다. 실패 시 null. */
export function loadScrollFx(): Promise<{ gsap: any; ScrollTrigger: any } | null> {
  if (_promise) return _promise;
  _promise = (async () => {
    try {
      const [{ gsap }, stMod] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      const ScrollTrigger = (stMod as any).ScrollTrigger || (stMod as any).default;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    } catch {
      return null;
    }
  })();
  return _promise;
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* 섹션 배경 패럴랙스 — 스크롤에 따라 배경 레이어를 천천히 세로 이동(scrub).
   intensity = 이동 폭(yPercent 절대값). 0/falsy 면 미적용. */
export function useSectionParallax(
  layerRef: React.RefObject<HTMLElement>,
  triggerRef: React.RefObject<HTMLElement>,
  intensity: number,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !intensity || prefersReduced()) return;
    const layer = layerRef.current;
    const trigger = triggerRef.current;
    if (!layer || !trigger) return;

    let tween: any = null;
    let cancelled = false;
    loadScrollFx().then(fx => {
      if (!fx || cancelled) return;
      /* 강도(0~40)를 안전한 yPercent 로 환산 — 레이어가 섹션보다 위·아래 30%씩 크므로(높이 160%),
         이동이 그 여유를 넘지 않도록 보수적으로 스케일(최대 ≈18%)해 가장자리 공백을 막는다. */
      const amt = Math.max(0, Math.min(40, intensity)) * 0.45;
      tween = fx.gsap.fromTo(
        layer,
        { yPercent: -amt },
        {
          yPercent: amt,
          ease: 'none',
          scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });
    return () => {
      cancelled = true;
      if (tween) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
    };
  }, [enabled, intensity, layerRef, triggerRef]);
}
