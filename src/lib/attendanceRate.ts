// 출석률 단일 기준(SSOT).
// 분모 = 멤버가 대상(session_targets)인 세션 수.
// 분자 = 그 대상 세션 중 status='출석'인 세션 수(지각·결석·공결 제외).
// 대상 세션이 없으면 null(집계 불가) — 운영진 명단/학생 마이페이지가 동일 수치를 보이도록 통일.
export function attendanceRate(
  targetSessionIds: Iterable<string>,
  attendedSessionIds: Iterable<string>,
): number | null {
  const targets = targetSessionIds instanceof Set ? targetSessionIds : new Set(targetSessionIds);
  if (targets.size === 0) return null;
  let attended = 0;
  for (const sid of attendedSessionIds) {
    if (targets.has(sid)) attended += 1;
  }
  return Math.round((attended / targets.size) * 100);
}
