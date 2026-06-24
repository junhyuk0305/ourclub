import { useEffect, useRef, useState } from 'react';

/* 공용 스크롤 리빌 트리거 (단일 출처).
   모든 위젯의 등장/리빌/카운트업이 동일한 시점에 발동하도록 통일한다.
   threshold:0 + rootMargin 하단 -15% → 요소 상단이 뷰포트 약 85% 지점을 지날 때 발동
   (= 화면 하단에서 살짝 올라오면 시작). 기존엔 0.15/0.2/0.3 으로 제각각이라
   위젯마다 발동 시점이 달라 통일감이 없었다. */
export const REVEAL_IO: IntersectionObserverInit = { threshold: 0, rootMargin: '0px 0px -15% 0px' };

/* 공용 '스크롤 인뷰' 훅 (WEBBUILDER_MASTER_PLAN Track B §4-1)
   IntersectionObserver 로 요소가 뷰포트에 들어오면 한 번 true 가 되고 관찰을 끊는다.
   StatsBlock 카운트업·등장 리빌 등 위젯이 공유한다(인라인 IO 중복 제거용). */
export function useInView<T extends HTMLElement = HTMLElement>(options?: IntersectionObserverInit): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* IO 미지원 환경(구형/SSR)에서는 즉시 노출로 폴백 */
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { ...REVEAL_IO, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}
