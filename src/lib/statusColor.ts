// 상태 → 뱃지 색상 매핑 통합. 코드베이스 40여 곳에 흩어진 상태색상 맵 대체용.
// Tailwind JIT 는 동적 `bg-${tone}-100` 을 스캔 못 함 → 반드시 '리터럴' 전체 클래스로 보관.
// 지배적 컨벤션: `bg-{c}-100 text-{c}-800 border-{c}-300`. 이 컨벤션을 쓰는 사이트만 교체한다.

const STATUS_CLASS: Record<string, string> = {
  // green — 긍정/활성/승인
  '활동중': 'bg-green-100 text-green-800 border-green-300',
  '합격': 'bg-green-100 text-green-800 border-green-300',
  '승인': 'bg-green-100 text-green-800 border-green-300',
  '완료': 'bg-green-100 text-green-800 border-green-300',
  // yellow — 대기/보류
  '검토대기': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '대기중': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '보완요청': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  // blue — 진행
  '검토중': 'bg-blue-100 text-blue-800 border-blue-300',
  '진행중': 'bg-blue-100 text-blue-800 border-blue-300',
  // red — 부정/거절
  '불합격': 'bg-red-100 text-red-800 border-red-300',
  '반려': 'bg-red-100 text-red-800 border-red-300',
  '거절': 'bg-red-100 text-red-800 border-red-300',
  // gray — 비활성
  '휴면': 'bg-gray-100 text-gray-800 border-gray-300',
  '탈퇴': 'bg-gray-100 text-gray-800 border-gray-300',
};

const DEFAULT_CLASS = 'bg-gray-100 text-gray-800 border-gray-300';

/** 상태 문자열 → `bg/text/border` Tailwind 리터럴 클래스. 미정의 상태는 회색. */
export function statusColor(status: string): string {
  return STATUS_CLASS[status] ?? DEFAULT_CLASS;
}
