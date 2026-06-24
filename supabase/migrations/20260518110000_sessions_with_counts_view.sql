-- Phase B Step 9: 세션별 출석 통계 view
-- AttendanceList 에서 출석률·대상수를 한번에 가져오기 위한 view.
-- RLS 는 underlying sessions 테이블 정책을 따른다.

DROP VIEW IF EXISTS sessions_with_counts;

CREATE VIEW sessions_with_counts
WITH (security_invoker = true)
AS
SELECT
  s.*,
  COALESCE(t.target_count, 0)::int   AS target_count,
  COALESCE(a.attended_count, 0)::int AS attended_count
FROM sessions s
LEFT JOIN (
  SELECT session_id, COUNT(*) AS target_count
  FROM session_targets
  GROUP BY session_id
) t ON t.session_id = s.id
LEFT JOIN (
  SELECT session_id, COUNT(*) AS attended_count
  FROM attendances
  WHERE status = '출석'
  GROUP BY session_id
) a ON a.session_id = s.id;

COMMENT ON VIEW sessions_with_counts IS
  '세션별 출석 대상수·출석 인원 집계. RLS 는 base sessions 정책을 따름.';
