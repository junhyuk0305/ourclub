import { useEffect, useRef, useState } from 'react';

/**
 * 큰 목록을 한 번에 다 렌더하지 않고, 바닥 근처로 스크롤하면 점진적으로 늘려 렌더한다.
 * (수천 개의 controlled input/카드를 한꺼번에 마운트해 생기는 프리즈를 막는다.)
 *
 * 동작 보존: 전체 개수가 step 이하인 흔한 경우엔 처음부터 전부 렌더되고 sentinel 도
 * 발화하지 않으므로 기존과 100% 동일하다. 큰 목록에서만 윈도잉이 작동한다.
 * select-all·필터·내보내기 등은 호출부에서 "전체 집합"을 그대로 쓰면 영향 없다.
 *
 * @param total    전체 항목 수(필터 적용 후)
 * @param resetKey 이 값이 바뀌면(검색/필터/탭/재로딩) 보이는 개수를 step 으로 리셋
 * @param step     한 번에 늘릴 개수
 * @returns count(렌더할 개수) 와 sentinelRef(목록 끝에 두면 보일 때 더 불러옴)
 */
export function useIncremental<T extends HTMLElement = HTMLElement>(
  total: number,
  resetKey: unknown,
  step = 60,
) {
  const [count, setCount] = useState(step);
  const sentinelRef = useRef<T | null>(null);

  // 필터/검색/탭 변경 시 처음부터 다시
  useEffect(() => { setCount(step); }, [resetKey, step]);

  // 바닥 sentinel 이 보이면 더 늘림(rootMargin 으로 미리 당겨 끊김 방지)
  useEffect(() => {
    if (count >= total) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setCount(c => Math.min(total, c + step));
        }
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count, total, step]);

  return { count, sentinelRef };
}
