-- ─────────────────────────────────────────────────────────────
-- corp_registration_requests
-- 기업 담당자 가입 신청 (마스터 승인 모델 — 동아리 등록과 동일 패턴)
-- 마스터 승인 시 corporations + corp_members(담당자) 원자적 생성
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corp_registration_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 기업 기본 정보
  corp_name        text NOT NULL,
  business_number  text NOT NULL,
  manager_name     text NOT NULL,
  manager_phone    text,
  website          text,
  description      text,

  -- 사업자등록증 등 (Storage: certification-docs 버킷 재사용, 경로 {user_id}/...)
  business_doc_url text,

  -- 심사
  status           text NOT NULL DEFAULT '검토대기'
                     CHECK (status IN ('검토대기', '검토중', '보완요청', '승인', '거절')),
  reviewer_note    text,
  reviewed_by      uuid REFERENCES auth.users(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.corp_registration_requests ENABLE ROW LEVEL SECURITY;

-- 본인 신청서만 조회 (마스터는 전체)
DROP POLICY IF EXISTS "corp_reg_select" ON public.corp_registration_requests;
CREATE POLICY "corp_reg_select"
  ON public.corp_registration_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- 본인만 INSERT
DROP POLICY IF EXISTS "corp_reg_insert" ON public.corp_registration_requests;
CREATE POLICY "corp_reg_insert"
  ON public.corp_registration_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 마스터만 심사 UPDATE
DROP POLICY IF EXISTS "corp_reg_master_update" ON public.corp_registration_requests;
CREATE POLICY "corp_reg_master_update"
  ON public.corp_registration_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid()));

-- 보완요청 건의 신청자 본인 재제출 (상태는 '검토대기'로만)
DROP POLICY IF EXISTS "corp_reg_owner_resubmit" ON public.corp_registration_requests;
CREATE POLICY "corp_reg_owner_resubmit"
  ON public.corp_registration_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = '보완요청')
  WITH CHECK (auth.uid() = user_id AND status = '검토대기');

CREATE INDEX IF NOT EXISTS corp_reg_req_user_id_idx    ON public.corp_registration_requests(user_id);
CREATE INDEX IF NOT EXISTS corp_reg_req_status_idx     ON public.corp_registration_requests(status);
CREATE INDEX IF NOT EXISTS corp_reg_req_created_at_idx ON public.corp_registration_requests(created_at DESC);


-- ── 상태 변경 시 신청자 인앱 알림 ─────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_corp_registration_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('검토중', '보완요청', '승인', '거절') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'corp_registration_status',
      CASE NEW.status
        WHEN '검토중'   THEN NEW.corp_name || ' 기업 가입 심사가 시작됐어요'
        WHEN '보완요청' THEN NEW.corp_name || ' 기업 가입에 보완 요청이 있어요'
        WHEN '승인'     THEN NEW.corp_name || ' 기업 가입이 승인됐어요 🎉'
        WHEN '거절'     THEN NEW.corp_name || ' 기업 가입 신청이 반려됐어요'
      END,
      NEW.reviewer_note,
      CASE WHEN NEW.status = '승인' THEN '/corp/dashboard' ELSE '/corp/register' END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_corp_registration_status ON public.corp_registration_requests;
CREATE TRIGGER trg_notify_corp_registration_status
  AFTER UPDATE OF status ON public.corp_registration_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_corp_registration_status();


-- ── 원자적 승인 RPC (corporations + corp_members) ─────────────
CREATE OR REPLACE FUNCTION public.approve_corp_registration(
  p_request_id uuid,
  p_note       text DEFAULT NULL
)
RETURNS uuid   -- 생성된 corporation id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req     public.corp_registration_requests%ROWTYPE;
  v_corp_id uuid;
BEGIN
  -- 마스터만 실행 가능
  IF NOT EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid()) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  SELECT * INTO v_req
  FROM public.corp_registration_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
  IF v_req.status = '승인' THEN RAISE EXCEPTION '이미 승인된 신청입니다.'; END IF;

  INSERT INTO public.corporations (name, business_number)
  VALUES (v_req.corp_name, v_req.business_number)
  RETURNING id INTO v_corp_id;

  INSERT INTO public.corp_members (corp_id, user_id, role)
  VALUES (v_corp_id, v_req.user_id, '담당자');

  UPDATE public.corp_registration_requests
  SET status        = '승인',
      reviewer_note = COALESCE(p_note, reviewer_note),
      reviewed_by   = auth.uid(),
      reviewed_at   = now()
  WHERE id = p_request_id;

  RETURN v_corp_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_corp_registration(uuid, text) TO authenticated;
