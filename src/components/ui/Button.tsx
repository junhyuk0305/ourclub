import React from 'react';

// 인라인 버튼 className 40여 곳 통합용. 지배적 패턴을 variant 로 캡처하고,
// 맞지 않는 곳은 className 으로 덮어쓴다(추가 후 점진 교체). Tailwind 리터럴 클래스만 사용.

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-grad text-white shadow-btn hover:-translate-y-0.5',
  secondary: 'bg-white text-ink border border-sand-300 hover:bg-sand-50',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'bg-transparent text-brand hover:bg-brand-tint',
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`font-bold rounded-ctl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...props}
    />
  );
}
