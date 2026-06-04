-- Phase 6: 지원자 태그 기능
ALTER TABLE recruitment_applications
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN recruitment_applications.tags IS
  '운영진이 지원자에게 붙이는 태그 (예: #서류합격, #면접예정, #우수지원자)';

CREATE INDEX IF NOT EXISTS idx_applications_tags
  ON recruitment_applications USING gin (tags);
