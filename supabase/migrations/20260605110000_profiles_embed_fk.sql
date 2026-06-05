-- ─────────────────────────────────────────────────────────────
-- 버그 수정: club_reviews / club_join_requests → profiles 임베드 FK 누락
--  증상: PostgREST가 두 테이블과 profiles 사이 FK를 못 찾아
--    `select=...,profiles(name)` 쿼리가 400(PGRST200) → 후기·합류신청이
--    아예 로드되지 않음. (club_members·recruitment_applications 는 FK가 있어 정상)
--  수정: user_id → profiles(id) FK 추가(NOT VALID: 기존행 검증 생략, 카탈로그
--    등록만으로 임베드 해소). 멱등 가드.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_reviews_user_id_profiles_fkey') THEN
    ALTER TABLE public.club_reviews
      ADD CONSTRAINT club_reviews_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_join_requests_user_id_profiles_fkey') THEN
    ALTER TABLE public.club_join_requests
      ADD CONSTRAINT club_join_requests_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
END $$;
