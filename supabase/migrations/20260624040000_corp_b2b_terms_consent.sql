-- ─────────────────────────────────────────────────────────────
-- 기업 가입 신청 시 B2B 거래약관·중개수수료 약정 동의 기록
-- LEGAL_DOCS_PLAN L6 (동의 플로우) — 기업 진입 전 명시적 동의 기록
-- 값이 NULL이면 미동의(레거시 신청), 값이 있으면 동의 시각.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.corp_registration_requests
  ADD COLUMN IF NOT EXISTS b2b_terms_agreed_at timestamptz;

COMMENT ON COLUMN public.corp_registration_requests.b2b_terms_agreed_at IS
  'B2B 프로젝트 거래약관 및 중개·정산 약정에 동의한 시각. NULL이면 미동의(약관 도입 전 레거시 신청).';
