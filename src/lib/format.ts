// 날짜 포맷 통합 유틸. 코드베이스에 100곳 흩어진 `new Date(x).toLocaleDateString('ko-KR', ...)` 대체용.
// 인라인과 시각적으로 동일하게: locale 'ko-KR' 고정, preset 으로 자주 쓰는 옵션만 노출.

type DateInput = string | number | Date | null | undefined;

const DATE_PRESETS = {
  short: undefined, // 2026. 6. 4.  (toLocaleDateString 기본)
  medium: { year: 'numeric', month: 'short', day: 'numeric' } as const, // 2026년 6월 4일
  monthDay: { month: 'short', day: 'numeric' } as const, // 6월 4일
} satisfies Record<string, Intl.DateTimeFormatOptions | undefined>;

export type DatePreset = keyof typeof DATE_PRESETS;

/** ISO 문자열·timestamp·Date → 'ko-KR' 지역화 날짜. 빈/잘못된 값은 '' 반환. */
export function formatDate(value: DateInput, preset: DatePreset = 'short'): string {
  if (value == null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ko-KR', DATE_PRESETS[preset]);
}

/** 피드용 상대 시간. 방금 전 / N분 전 / N시간 전 / N일 전, 일주일 넘으면 절대 날짜. */
export function formatRelativeDate(value: DateInput): string {
  if (value == null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 0) return d.toLocaleDateString('ko-KR');
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString('ko-KR');
}
