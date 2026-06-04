-- ─────────────────────────────────────────────────────────────
-- 서비스 운영 콘솔 + 동아리 등록 프로세스 루프 닫기
--  1) notifications: 범용 인앱 알림 테이블
--  2) club_registration_requests 상태 변경 → 신청자 알림 트리거
--  3) 보완요청 건의 신청자 본인 재제출(UPDATE) RLS
--  4) reviewed_by 컬럼 (심사 담당자 기록)
--  5) approve_club_registration RPC (clubs+members+status 원자적 승인)
--  6) clubs 마스터 UPDATE 정책 (운영 콘솔 인증 토글용)
-- ─────────────────────────────────────────────────────────────

-- ── 1) 범용 인앱 알림 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,            -- 'registration_status' 등
  title       text NOT NULL,
  body        text,
  link        text,                     -- 클릭 시 이동 경로
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 조회 / 읽음 처리. INSERT 정책 없음 → 트리거(SECURITY DEFINER)로만 생성.
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id, is_read, created_at DESC);


-- ── 4) 심사 담당자 기록 ───────────────────────────────────────
ALTER TABLE public.club_registration_requests
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);


-- ── 2) 상태 변경 시 신청자에게 알림 ───────────────────────────
CREATE OR REPLACE FUNCTION public.notify_registration_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 마스터가 처리하는 상태로 바뀔 때만 알림 (재제출 시의 '검토대기'는 제외)
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('검토중', '보완요청', '승인', '거절') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'registration_status',
      CASE NEW.status
        WHEN '검토중'   THEN NEW.club_name || ' 등록 심사가 시작됐어요'
        WHEN '보완요청' THEN NEW.club_name || ' 등록에 보완 요청이 있어요'
        WHEN '승인'     THEN NEW.club_name || ' 등록이 승인됐어요 🎉'
        WHEN '거절'     THEN NEW.club_name || ' 등록 신청이 반려됐어요'
      END,
      NEW.reviewer_note,
      CASE WHEN NEW.status = '승인' THEN '/admin/dashboard' ELSE '/club-setup' END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_registration_status ON public.club_registration_requests;
CREATE TRIGGER trg_notify_registration_status
  AFTER UPDATE OF status ON public.club_registration_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_registration_status();


-- ── 3) 보완요청 건의 신청자 본인 재제출 ──────────────────────
-- 본인 소유 + 현재 '보완요청' 상태인 행만 수정 가능, 수정 후 상태는 '검토대기'로만.
DROP POLICY IF EXISTS "registration_requests_owner_resubmit" ON public.club_registration_requests;
CREATE POLICY "registration_requests_owner_resubmit"
  ON public.club_registration_requests
  FOR UPDATE
  USING (auth.uid() = user_id AND status = '보완요청')
  WITH CHECK (auth.uid() = user_id AND status = '검토대기');


-- ── 5) 원자적 승인 RPC ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_club_registration(
  p_request_id uuid,
  p_note       text DEFAULT NULL
)
RETURNS text   -- 생성된 동아리 slug
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req     public.club_registration_requests%ROWTYPE;
  v_club_id uuid;
  v_slug    text;
BEGIN
  -- 마스터만 실행 가능
  IF NOT EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid()) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  SELECT * INTO v_req
  FROM public.club_registration_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
  IF v_req.status = '승인' THEN RAISE EXCEPTION '이미 승인된 신청입니다.'; END IF;

  v_slug := 'club-' || (extract(epoch FROM now()) * 1000)::bigint;

  INSERT INTO public.clubs (slug, name, type, one_line_desc, description, location, is_certified, theme_color)
  VALUES (v_slug, v_req.club_name, v_req.club_type, v_req.one_line_desc, v_req.description, v_req.location, true, '#f97316')
  RETURNING id INTO v_club_id;

  INSERT INTO public.club_members (user_id, club_id, role, status)
  VALUES (v_req.user_id, v_club_id, '운영진', '활동중');

  UPDATE public.club_registration_requests
  SET status      = '승인',
      reviewer_note = COALESCE(p_note, reviewer_note),
      reviewed_by  = auth.uid(),
      reviewed_at  = now()
  WHERE id = p_request_id;

  RETURN v_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_club_registration(uuid, text) TO authenticated;


-- ── 6) 마스터의 동아리 수정 권한 (인증 토글 등) ──────────────
DROP POLICY IF EXISTS "clubs_master_update" ON public.clubs;
CREATE POLICY "clubs_master_update"
  ON public.clubs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid()));
