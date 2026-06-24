import React from 'react';

// 카드 컨테이너 통합(AB · 따뜻한 세련). 평상시 옅은 soft, 클릭형은 hover 오렌지 섀도+lift.
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 호버 시 오렌지 소프트섀도(soft-lg) + 살짝 떠오름. 클릭형 카드용(기본 true) */
  shadow?: boolean;
}

export function Card({ shadow = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-sand-200 rounded-card shadow-soft transition-all ${shadow ? 'hover:shadow-soft-lg hover:-translate-y-1' : ''} ${className}`}
      {...props}
    />
  );
}
