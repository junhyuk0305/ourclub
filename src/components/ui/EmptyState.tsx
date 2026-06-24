import React from 'react';

// 빈 상태(목록 없음) 통합. 아이콘 + 제목 + 보조설명 + 선택 액션.
export interface EmptyStateProps {
  /** lucide 아이콘 등 (선택) */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** 버튼 등 액션 영역 (선택) */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      {icon && <div className="mb-3 text-sand-400">{icon}</div>}
      <p className="font-black text-sand-600">{title}</p>
      {description && <p className="mt-1 text-sm text-sand-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
