-- Step 7: 채용 통계 view
-- RecruitmentsList에서 applicant_count 별도 쿼리하지 않고 한번에 가져오기 위한 view.
-- RLS 는 underlying recruitments 테이블 정책을 따른다.
-- pipeline_stages 는 jsonb 타입이라 jsonb_array_length / ->> 로 접근한다.

DROP VIEW IF EXISTS recruitment_with_counts;

CREATE VIEW recruitment_with_counts
WITH (security_invoker = true)
AS
SELECT
  r.*,
  COALESCE(c.applicant_count, 0)::int AS applicant_count,
  COALESCE(p.passed_count, 0)::int AS passed_count
FROM recruitments r
LEFT JOIN (
  SELECT recruitment_id, COUNT(*) AS applicant_count
  FROM recruitment_applications
  GROUP BY recruitment_id
) c ON c.recruitment_id = r.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS passed_count
  FROM recruitment_applications ra
  WHERE ra.recruitment_id = r.id
    AND jsonb_typeof(r.pipeline_stages) = 'array'
    AND jsonb_array_length(r.pipeline_stages) > 0
    AND ra.status = (r.pipeline_stages ->> (jsonb_array_length(r.pipeline_stages) - 1))
) p ON true;

COMMENT ON VIEW recruitment_with_counts IS
  '공고별 총 지원자수·합격자수를 미리 집계한 뷰. RLS는 base recruitments 정책을 따름.';
