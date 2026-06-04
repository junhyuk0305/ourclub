import { Loader } from 'lucide-react';

// 로딩 스피너 통합. 지배적 패턴: lucide Loader + animate-spin + orange.
export interface SpinnerProps {
  /** 아이콘 크기 클래스(기본 w-8 h-8) */
  className?: string;
  /** 가운데 정렬 컨테이너로 감쌀지(기본 false — 아이콘만) */
  center?: boolean;
}

export function Spinner({ className = 'w-8 h-8', center = false }: SpinnerProps) {
  const icon = <Loader className={`${className} animate-spin text-orange-500`} />;
  if (!center) return icon;
  return <div className="flex-1 flex items-center justify-center py-10">{icon}</div>;
}
