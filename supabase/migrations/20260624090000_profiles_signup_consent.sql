-- 회원가입 시 이용약관·개인정보처리방침 동의 기록
--
-- profiles 본체와 handle_new_user 트리거는 원격 스키마에 있으므로(이 repo의 base 마이그레이션은 빈 파일),
-- 여기서는 동의 시각 컬럼만 추가한다. 트리거가 동의값을 채우지 못하므로 NULL 허용으로 두고,
-- 클라이언트가 로그인 직후 본인 행 UPDATE(기존 own-row 정책)로 backfill 한다.
-- 신규 가입은 회원가입 화면에서 필수 동의를 받으며, 기존(가입 이전) 회원은 NULL로 남는다.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_agreed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_agreed_at timestamptz;

COMMENT ON COLUMN public.profiles.terms_agreed_at   IS '서비스 이용약관 동의 시각 (회원가입 시 기록)';
COMMENT ON COLUMN public.profiles.privacy_agreed_at IS '개인정보처리방침 동의 시각 (회원가입 시 기록)';
