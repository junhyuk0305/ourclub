// 상태 → 뱃지 색상 매핑 통합. 코드베이스 40여 곳에 흩어진 상태색상 맵 대체용.
// 부드러운 상태색(bg/fg 쌍, 테두리 없음 — DESIGN_SYSTEM §1.3). 토큰은 index.css @theme 에 등록.
// Tailwind JIT 는 동적 클래스를 스캔 못 함 → 반드시 '리터럴' 전체 클래스로 보관.

const STATUS_CLASS: Record<string, string> = {
  // 긍정/활성/승인
  '활동중': 'bg-ok-bg text-ok-fg',
  '합격': 'bg-ok-bg text-ok-fg',
  '승인': 'bg-ok-bg text-ok-fg',
  '완료': 'bg-ok-bg text-ok-fg',
  // 대기/보류
  '검토대기': 'bg-warn-bg text-warn-fg',
  '대기중': 'bg-warn-bg text-warn-fg',
  '보완요청': 'bg-warn-bg text-warn-fg',
  // 진행
  '검토중': 'bg-info-bg text-info-fg',
  '진행중': 'bg-info-bg text-info-fg',
  // 부정/거절
  '불합격': 'bg-bad-bg text-bad-fg',
  '반려': 'bg-bad-bg text-bad-fg',
  '거절': 'bg-bad-bg text-bad-fg',
  // 비활성
  '휴면': 'bg-off-bg text-off-fg',
  '탈퇴': 'bg-off-bg text-off-fg',
};

const DEFAULT_CLASS = 'bg-off-bg text-off-fg';

/** 상태 문자열 → `bg/text` Tailwind 리터럴 클래스(부드러운 상태색, 테두리 없음). 미정의 상태는 회색. */
export function statusColor(status: string): string {
  return STATUS_CLASS[status] ?? DEFAULT_CLASS;
}
