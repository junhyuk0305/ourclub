-- ─────────────────────────────────────────────────────────────
-- B2B 동의 서버측 강제 (LEGAL_DOCS_PLAN L6 하드닝)
--   UI 체크박스만으로는 악의적 클라이언트가 미동의 insert 가능 →
--   BEFORE INSERT 트리거로 동의 시각 NULL 신규 생성을 차단.
--   * INSERT만 강제(신규 진입). 기존 레거시 행(동의 컬럼 도입 전)의
--     UPDATE는 막지 않음 — 관리자 상태변경 등 정상 흐름 보존.
--   * settlement_r4의 b2b_block_overdue_application 트리거와 동일 패턴.
-- ─────────────────────────────────────────────────────────────

-- ── 기업 가입 신청: B2B 약관 동의 필수 ────────────────────────
CREATE OR REPLACE FUNCTION public.require_corp_b2b_consent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.b2b_terms_agreed_at IS NULL THEN
    RAISE EXCEPTION 'B2B 거래약관·중개·정산 약정 동의가 필요합니다.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_require_corp_b2b_consent ON public.corp_registration_requests;
CREATE TRIGGER trg_require_corp_b2b_consent
  BEFORE INSERT ON public.corp_registration_requests
  FOR EACH ROW EXECUTE FUNCTION public.require_corp_b2b_consent();


-- ── 동아리 제안서: 거래약관·정보제공 동의 필수 ────────────────
CREATE OR REPLACE FUNCTION public.require_b2b_application_consent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.terms_agreed_at IS NULL THEN
    RAISE EXCEPTION '거래약관·중개수수료 약정 및 정보제공 동의가 필요합니다.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_require_b2b_application_consent ON public.b2b_applications;
CREATE TRIGGER trg_require_b2b_application_consent
  BEFORE INSERT ON public.b2b_applications
  FOR EACH ROW EXECUTE FUNCTION public.require_b2b_application_consent();
