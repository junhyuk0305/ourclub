import React, { useEffect, useRef, useState } from 'react';

// 각 자릿수를 슬롯 머신 릴처럼 스핀시키는 단일 컴포넌트
function DigitReel({
  target,
  triggerDelay,
  duration,
  active,
}: {
  target: number;
  triggerDelay: number;
  duration: number;
  active: boolean;
}) {
  const [go, setGo] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setGo(true), triggerDelay);
    return () => clearTimeout(t);
  }, [active, triggerDelay]);

  // 릴 시퀀스: 0→9 를 SPINS 번 반복 후 목표 숫자로 착지
  const SPINS = 3;
  const items: number[] = [];
  for (let c = 0; c < SPINS; c++) {
    for (let i = 0; i <= 9; i++) items.push(i);
  }
  items.push(target); // 마지막 = 최종 착지 숫자
  const endIdx = items.length - 1; // 30

  return (
    // overflow:hidden 이 릴의 '창문' 역할
    <span
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        height: '1.1em',
        lineHeight: '1.1em',
        verticalAlign: 'bottom',
      }}
    >
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: go ? `translateY(calc(${-endIdx} * 1.1em))` : 'translateY(0)',
          // ease-out cubic: 처음엔 빠르게, 마지막엔 부드럽게 감속
          transition: go
            ? `transform ${duration}ms cubic-bezier(0.0, 0.0, 0.15, 1.0)`
            : 'none',
          willChange: 'transform',
        }}
      >
        {items.map((d, i) => (
          <span
            key={i}
            style={{
              display: 'block',
              height: '1.1em',
              lineHeight: '1.1em',
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export interface NumberTickerProps {
  /** 최종적으로 표시할 숫자 */
  value: number;
  /** 추가 className (font-size 등을 부모에서 제어) */
  className?: string;
  /** 전체 애니메이션 지속 시간(ms). 기본 1800 */
  duration?: number;
  /** 자릿수 간 딜레이 스태거(ms). 기본 120 */
  stagger?: number;
}

/**
 * 슬롯 머신(Number Ticker) 이펙트 컴포넌트.
 * - 뷰포트에 진입하는 순간 애니메이션 시작 (IntersectionObserver)
 * - 각 자릿수가 0→9 를 3번 스핀 후 목표값에 ease-out 으로 착지
 * - font-size 는 부모에서 제어 (em 단위로 자동 대응)
 */
export function NumberTicker({
  value,
  className = '',
  duration = 1800,
  stagger = 120,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 레이아웃 안정 후 살짝 딜레이를 줘서 flash 방지
          setTimeout(() => setActive(true), 200);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const digits = String(value).split('').map(Number);

  return (
    <span
      ref={ref}
      className={`inline-flex ${className}`}
      style={{ lineHeight: '1.1em' }}
    >
      {digits.map((d, i) => (
        <DigitReel
          key={i}
          target={d}
          triggerDelay={i * stagger}
          duration={duration}
          active={active}
        />
      ))}
    </span>
  );
}
