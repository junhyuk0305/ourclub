import { statusColor } from '../../lib/statusColor';

// 상태 뱃지 통합. 색상은 statusColor() 단일 진실원천에서. 지배적 컨벤션(border rounded)만 기본값.
export interface StatusBadgeProps {
  status: string;
  /** 표시 텍스트(미지정 시 status 그대로) */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-bold border rounded ${statusColor(status)} ${className}`}>
      {label ?? status}
    </span>
  );
}
