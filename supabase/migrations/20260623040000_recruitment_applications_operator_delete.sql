-- ─────────────────────────────────────────────────────────────
-- 권한 추가: 운영진/마스터의 지원서 삭제 허용 — QA #3 (삭제 경로 없음)
--
-- 문제: recruitment_applications 에 DELETE 정책이 전혀 없어, 운영진도 개별
--       지원서를 삭제할 수 없다(공고 전체 삭제로 cascade 만 가능, status 변경만 됨).
--       RLS 기본 거부라 DELETE 요청은 0행 처리(조용히 실패)된다.
--
-- 방침: 기존 UPDATE 정책("운영진 지원서 수정")과 동일한 술어로 DELETE 를 허용한다.
--       = 해당 공고가 속한 동아리의 '운영진' 또는 global_admin(마스터).
--       지원자 본인 삭제는 허용하지 않는다(운영진 관리 행위로 한정).
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "운영진 지원서 삭제" ON public.recruitment_applications;
CREATE POLICY "운영진 지원서 삭제" ON public.recruitment_applications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.recruitments r
      JOIN public.club_members cm ON cm.club_id = r.club_id
      WHERE r.id = recruitment_applications.recruitment_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );
