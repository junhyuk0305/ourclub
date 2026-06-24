-- ─────────────────────────────────────────────────────────────
-- 동아리 제안서 제출 시 거래약관·중개수수료 약정·정보제공 동의 기록
-- LEGAL_DOCS_PLAN L6 (동의 플로우) — 동아리 진입 전 명시적 동의 기록
-- 기존: 제안서 화면에 정보제공 동의 체크박스는 있었으나 DB에 미기록.
-- 값이 NULL이면 미동의(약관 도입 전 레거시 제안), 값이 있으면 동의 시각.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.b2b_applications
  ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz;

COMMENT ON COLUMN public.b2b_applications.terms_agreed_at IS
  'B2B 거래약관·중개수수료 약정(동아리 부담) 및 기업 정보제공에 동의한 시각. NULL이면 미동의(약관 도입 전 레거시 제안).';
