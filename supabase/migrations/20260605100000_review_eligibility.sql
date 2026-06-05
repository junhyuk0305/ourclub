-- ─────────────────────────────────────────────────────────────
-- 채용 페이지 재설계 §5.2: 후기 작성 자격 강화
--  기존 "로그인 사용자 후기 작성"(누구나) → 해당 동아리의
--  ① 부원(club_members, 상태 무관) 또는 ② 지원 이력(recruitment_applications)이
--  있는 사용자만 INSERT 허용. 스팸·허위 후기 차단.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "로그인 사용자 후기 작성" ON public.club_reviews;
CREATE POLICY "후기 작성(부원·지원자)"
ON public.club_reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_reviews.club_id
        AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.recruitment_applications ra
      JOIN public.recruitments r ON r.id = ra.recruitment_id
      WHERE r.club_id = club_reviews.club_id
        AND ra.user_id = auth.uid()
    )
  )
);
