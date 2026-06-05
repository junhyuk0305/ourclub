import { useEffect, useRef, useState } from 'react';

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
    }, { threshold: 0.3, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}
