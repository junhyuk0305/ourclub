-- Phase D Step 1
-- 1) sessions DELETE 정책 (운영진/마스터)
-- 2) club_members: 계정(user_id) 없이도 부원 추가 가능하도록 display_name / display_university 추가
--    - user_id 를 nullable 로 변경
--    - 이후 OURCLUB 가입 시 user_id 연결 가능

-- ─────────────────────────────────────────────────────────────
-- 1) sessions 삭제 정책
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "운영진 세션 삭제" ON public.sessions;
CREATE POLICY "운영진 세션 삭제" ON public.sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = sessions.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 2) club_members: 계정 없이 추가된 부원 지원
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.club_members
  ADD COLUMN IF NOT EXISTS display_name       text,
  ADD COLUMN IF NOT EXISTS display_university text;

ALTER TABLE public.club_members
  ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.club_members.display_name IS
  '계정 없이 추가된 부원의 이름 (user_id IS NULL 일 때 사용)';
COMMENT ON COLUMN public.club_members.display_university IS
  '계정 없이 추가된 부원의 학교 (user_id IS NULL 일 때 사용)';
