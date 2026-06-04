-- Step 6: 단계 이동 이메일 템플릿
-- 동아리별로 단계별 이메일 본문 템플릿을 저장한다.
-- placeholders: {{name}}, {{recruitment_title}}, {{stage}}

CREATE TABLE IF NOT EXISTS club_email_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name       text NOT NULL,
  stage      text,                    -- 이 템플릿이 기본값인 단계 (NULL 이면 범용)
  subject    text NOT NULL,
  body       text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_club ON club_email_templates(club_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_stage ON club_email_templates(club_id, stage);

ALTER TABLE club_email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "운영진 템플릿 조회" ON club_email_templates;
CREATE POLICY "운영진 템플릿 조회"
ON club_email_templates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_email_templates.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
);

DROP POLICY IF EXISTS "운영진 템플릿 생성" ON club_email_templates;
CREATE POLICY "운영진 템플릿 생성"
ON club_email_templates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_email_templates.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
);

DROP POLICY IF EXISTS "운영진 템플릿 수정" ON club_email_templates;
CREATE POLICY "운영진 템플릿 수정"
ON club_email_templates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_email_templates.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
);

DROP POLICY IF EXISTS "운영진 템플릿 삭제" ON club_email_templates;
CREATE POLICY "운영진 템플릿 삭제"
ON club_email_templates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_email_templates.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
);

-- 단계 이동 로그 (선택적: 실제 이메일 발송 이력)
CREATE TABLE IF NOT EXISTS application_stage_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  from_stage      text,
  to_stage        text NOT NULL,
  email_sent      boolean NOT NULL DEFAULT false,
  email_subject   text,
  email_body      text,
  moved_by        uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stage_log_app ON application_stage_log(application_id);

ALTER TABLE application_stage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "운영진 이동 이력 조회" ON application_stage_log;
CREATE POLICY "운영진 이동 이력 조회"
ON application_stage_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recruitment_applications ra
    JOIN recruitments r ON r.id = ra.recruitment_id
    JOIN club_members cm ON cm.club_id = r.club_id
    WHERE ra.id = application_stage_log.application_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
);

DROP POLICY IF EXISTS "운영진 이동 이력 생성" ON application_stage_log;
CREATE POLICY "운영진 이동 이력 생성"
ON application_stage_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recruitment_applications ra
    JOIN recruitments r ON r.id = ra.recruitment_id
    JOIN club_members cm ON cm.club_id = r.club_id
    WHERE ra.id = application_stage_log.application_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
);
