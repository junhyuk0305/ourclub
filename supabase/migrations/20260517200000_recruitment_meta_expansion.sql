-- Step 2: 공고 메타데이터 확장
-- 스펙: 채용 제목 / 모집 대상 / 모집 시작일+마감일 / 주요 활동지 / 정기 활동일 / 분야 / 공고 해시태그

ALTER TABLE recruitments
  ADD COLUMN IF NOT EXISTS recruit_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS targets text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS regular_meeting text,
  ADD COLUMN IF NOT EXISTS hashtags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN recruitments.recruit_start_date IS '모집 시작일시 (NULL 이면 즉시 시작)';
COMMENT ON COLUMN recruitments.targets IS '모집 대상 (예: 대학생 누구나 / 25학번 이상)';
COMMENT ON COLUMN recruitments.location IS '주요 활동지 (예: 서울 신촌)';
COMMENT ON COLUMN recruitments.regular_meeting IS '정기 활동일 (예: 매주 수 19:00)';
COMMENT ON COLUMN recruitments.hashtags IS '공고 해시태그 배열 (#태그 형식, 검색용)';

CREATE INDEX IF NOT EXISTS idx_recruitments_hashtags
  ON recruitments USING gin (hashtags);

-- deadline 컬럼이 date 라면 timestamptz 로 변환할 수도 있지만, 시간 정보가 들어가있을 수도 있어 변경 없이 유지
