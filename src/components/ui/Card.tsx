import React from 'react';

// 브루탈리스트 카드 컨테이너 통합. border-[3px]+하드섀도가 지배적 패턴.
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 하드 섀도 적용 여부(기본 true) */
  shadow?: boolean;
}

export function Card({ shadow = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`border-[3px] border-black bg-white ${shadow ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''} ${className}`}
      {...props}
    />
  );
}
