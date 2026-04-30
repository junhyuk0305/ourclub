-- b2b_projects: 마감일 + 필요역량 컬럼 추가
ALTER TABLE b2b_projects
  ADD COLUMN IF NOT EXISTS deadline      date,
  ADD COLUMN IF NOT EXISTS required_skills text[] DEFAULT '{}';

-- 기업담당자가 자신의 프로젝트에 들어온 지원서를 조회할 수 있도록
CREATE POLICY "기업담당자 지원서 조회"
ON b2b_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM b2b_projects bp
    JOIN corp_members cm ON cm.corp_id = bp.corp_id
    WHERE bp.id = b2b_applications.project_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM global_admins WHERE id = auth.uid())
);

-- 기업담당자가 지원서 상태를 변경할 수 있도록
CREATE POLICY "기업담당자 지원서 상태 수정"
ON b2b_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM b2b_projects bp
    JOIN corp_members cm ON cm.corp_id = bp.corp_id
    WHERE bp.id = b2b_applications.project_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM global_admins WHERE id = auth.uid())
);
