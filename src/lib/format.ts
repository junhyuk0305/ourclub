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
