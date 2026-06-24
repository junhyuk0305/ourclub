-- ─────────────────────────────────────────────────────────────
-- B2B 마일스톤/진행 추적 + 산출물 제출·검수 (HANDOFF M2)
--   ④ 진행 추적(마일스톤) + ⑤ 산출물 제출·검수
--   짝 문서: B2B_HANDOFF_FLOW_PLAN.md M2
-- 권한: 동아리 운영진(생성·진행·제출) + 기업담당자(검수완료) + global_admin
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.b2b_milestones (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   uuid NOT NULL REFERENCES public.b2b_applications(id) ON DELETE CASCADE,
  title            text NOT NULL,
  due_date         date,
  status           text NOT NULL DEFAULT '예정'
                   CHECK (status IN ('예정', '진행중', '제출', '완료')),  -- 제출=산출물 제출, 완료=기업 검수완료
  deliverable_path text,                          -- b2b-deliverables 버킷 객체 경로
  sort             int DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS b2b_milestones_application_idx ON public.b2b_milestones(application_id);

ALTER TABLE public.b2b_milestones ENABLE ROW LEVEL SECURITY;

-- 조회: 동아리 운영진 OR 기업담당자 OR global_admin
CREATE POLICY "마일스톤 조회" ON public.b2b_milestones FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_milestones.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_milestones.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- 생성: 동아리 운영진 OR global_admin (마일스톤 정의는 동아리 권한)
CREATE POLICY "마일스톤 생성" ON public.b2b_milestones FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_milestones.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- 수정: 동아리 운영진(진행·제출) OR 기업담당자(검수완료) OR global_admin
CREATE POLICY "마일스톤 수정" ON public.b2b_milestones FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_milestones.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_milestones.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- 삭제: 동아리 운영진 OR global_admin
CREATE POLICY "마일스톤 삭제" ON public.b2b_milestones FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_milestones.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- ── 산출물 비공개 스토리지 버킷 ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('b2b-deliverables', 'b2b-deliverables', false, 52428800)  -- 50MB
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "b2b-deliverables 조회"
ON storage.objects FOR SELECT
USING (bucket_id = 'b2b-deliverables' AND auth.uid() IS NOT NULL);

CREATE POLICY "b2b-deliverables 업로드"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'b2b-deliverables' AND auth.uid() IS NOT NULL);

CREATE POLICY "b2b-deliverables 수정"
ON storage.objects FOR UPDATE
USING (bucket_id = 'b2b-deliverables' AND auth.uid() IS NOT NULL);
