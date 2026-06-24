-- ─────────────────────────────────────────────────────────────
-- B2B 양방향 리뷰 (HANDOFF M3 마무리)
--   ⑦ 완료 처리 후 기업↔동아리 상호 평점/후기
--   짝 문서: B2B_HANDOFF_FLOW_PLAN.md M3, B2B_RISK_REMEDIATION_PLAN.md §R4(신뢰)
-- 권한: 동아리 운영진은 '동아리' 측 리뷰만, 기업담당자는 '기업' 측 리뷰만 작성.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.b2b_reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.b2b_applications(id) ON DELETE CASCADE,
  author_side    text NOT NULL CHECK (author_side IN ('기업', '동아리')),
  rating         int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (application_id, author_side)          -- 한 측당 1개
);
CREATE INDEX IF NOT EXISTS b2b_reviews_application_idx ON public.b2b_reviews(application_id);

ALTER TABLE public.b2b_reviews ENABLE ROW LEVEL SECURITY;

-- 조회: 동아리 운영진 OR 기업담당자 OR global_admin
CREATE POLICY "리뷰 조회" ON public.b2b_reviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_reviews.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_reviews.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- 작성: 동아리 운영진 → '동아리' 측만 / 기업담당자 → '기업' 측만
CREATE POLICY "리뷰 작성" ON public.b2b_reviews FOR INSERT WITH CHECK (
  (
    author_side = '동아리' AND EXISTS (
      SELECT 1 FROM public.b2b_applications a
      JOIN public.club_members m ON m.club_id = a.club_id
      WHERE a.id = b2b_reviews.application_id
        AND m.user_id = auth.uid() AND m.role = '운영진'
    )
  )
  OR (
    author_side = '기업' AND EXISTS (
      SELECT 1 FROM public.b2b_applications a
      JOIN public.b2b_projects p ON p.id = a.project_id
      JOIN public.corp_members cm ON cm.corp_id = p.corp_id
      WHERE a.id = b2b_reviews.application_id AND cm.user_id = auth.uid()
    )
  )
);

-- 수정: 본인 측 리뷰만(작성 정책과 동일 조건)
CREATE POLICY "리뷰 수정" ON public.b2b_reviews FOR UPDATE USING (
  (
    author_side = '동아리' AND EXISTS (
      SELECT 1 FROM public.b2b_applications a
      JOIN public.club_members m ON m.club_id = a.club_id
      WHERE a.id = b2b_reviews.application_id
        AND m.user_id = auth.uid() AND m.role = '운영진'
    )
  )
  OR (
    author_side = '기업' AND EXISTS (
      SELECT 1 FROM public.b2b_applications a
      JOIN public.b2b_projects p ON p.id = a.project_id
      JOIN public.corp_members cm ON cm.corp_id = p.corp_id
      WHERE a.id = b2b_reviews.application_id AND cm.user_id = auth.uid()
    )
  )
);
