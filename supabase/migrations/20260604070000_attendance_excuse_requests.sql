-- ─────────────────────────────────────────────────────────────
-- M1: 출석 인정 신청·승인 워크플로
--  1) attendance_excuse_requests: 부원이 신청 → 운영진이 승인/반려
--  2) RLS: 본인 신청·조회·취소 / 해당 클럽 운영진 조회·처리 / 마스터
--  3) approve_excuse_request RPC: 승인 + (일자 매칭 세션 있으면) attendances '공결' upsert (D5: 분모 유지·분자 제외)
--  4) notify_excuse_status 트리거: 승인/반려 시 신청자 인앱 알림
-- ─────────────────────────────────────────────────────────────

-- ── 1) 테이블 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_excuse_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES public.club_members(id) ON DELETE CASCADE, -- 신청 부원
  session_id      uuid REFERENCES public.sessions(id) ON DELETE SET NULL,             -- 매칭 세션(없으면 일자 기준 아카이빙)
  excuse_date     date NOT NULL,                                                       -- 출석 인정 요청 일자
  reason_category text NOT NULL,                                                       -- 개인 일정 / 병가 / 교내 일정 / 자격증 시험 / 가족 행사 / 기타
  detail          text,
  file_url        text,                                                                -- 첨부(증빙) Storage URL
  status          text NOT NULL DEFAULT '대기' CHECK (status IN ('대기','승인','반려','취소')),
  reviewer_note   text,
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.attendance_excuse_requests IS
  '출석 인정 신청: 부원 제출 → 운영진 승인/반려. 승인 시 매칭 세션에 공결 기록(분모 유지·분자 제외).';

CREATE INDEX IF NOT EXISTS aer_club_status_idx  ON public.attendance_excuse_requests(club_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS aer_member_idx       ON public.attendance_excuse_requests(member_id);
CREATE INDEX IF NOT EXISTS aer_session_idx       ON public.attendance_excuse_requests(session_id);
CREATE INDEX IF NOT EXISTS aer_reviewed_by_idx   ON public.attendance_excuse_requests(reviewed_by);

ALTER TABLE public.attendance_excuse_requests ENABLE ROW LEVEL SECURITY;

-- ── 2) RLS ───────────────────────────────────────────────────
-- SELECT: 본인(신청 부원) 또는 해당 클럽 운영진 또는 마스터
DROP POLICY IF EXISTS "excuse_select" ON public.attendance_excuse_requests;
CREATE POLICY "excuse_select" ON public.attendance_excuse_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.id = attendance_excuse_requests.member_id
        AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = attendance_excuse_requests.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- INSERT: 본인 소유 멤버십으로만, club 일치, 상태 '대기'로만 생성
DROP POLICY IF EXISTS "excuse_insert_own" ON public.attendance_excuse_requests;
CREATE POLICY "excuse_insert_own" ON public.attendance_excuse_requests
  FOR INSERT
  WITH CHECK (
    status = '대기'
    AND EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.id = attendance_excuse_requests.member_id
        AND cm.user_id = auth.uid()
        AND cm.club_id = attendance_excuse_requests.club_id
    )
  );

-- UPDATE(본인 취소): 본인 + 현재 '대기' 건만, 상태 '취소'로만 변경
DROP POLICY IF EXISTS "excuse_cancel_own" ON public.attendance_excuse_requests;
CREATE POLICY "excuse_cancel_own" ON public.attendance_excuse_requests
  FOR UPDATE
  USING (
    status = '대기'
    AND EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.id = attendance_excuse_requests.member_id
        AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = '취소'
    AND EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.id = attendance_excuse_requests.member_id
        AND cm.user_id = auth.uid()
    )
  );

-- UPDATE(운영진 처리): 해당 클럽 운영진 또는 마스터. 승인은 RPC 권장이나 반려/메모는 직접 UPDATE 허용.
DROP POLICY IF EXISTS "excuse_review_admin" ON public.attendance_excuse_requests;
CREATE POLICY "excuse_review_admin" ON public.attendance_excuse_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = attendance_excuse_requests.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = attendance_excuse_requests.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- DELETE: 마스터만(일반 운영진은 반려로 처리, 부원은 취소로 처리)
DROP POLICY IF EXISTS "excuse_delete_master" ON public.attendance_excuse_requests;
CREATE POLICY "excuse_delete_master" ON public.attendance_excuse_requests
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid()));

-- ── 3) 승인 RPC (원자적: 상태 승인 + 매칭 세션 공결 upsert) ──────
CREATE OR REPLACE FUNCTION public.approve_excuse_request(
  p_request_id uuid,
  p_note       text DEFAULT NULL
)
RETURNS uuid   -- 공결 기록한 session_id (없으면 NULL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req        public.attendance_excuse_requests%ROWTYPE;
  v_session_id uuid;
BEGIN
  SELECT * INTO v_req
  FROM public.attendance_excuse_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;

  -- 해당 클럽 운영진 또는 마스터만 실행 가능
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members cm
    WHERE cm.club_id = v_req.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  ) AND NOT EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid()) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  IF v_req.status <> '대기' THEN RAISE EXCEPTION '이미 처리된 신청입니다.'; END IF;

  -- 매칭 세션 결정: 신청에 세션이 있으면 그대로, 없으면 같은 클럽·같은 일자 세션 자동 탐색
  v_session_id := v_req.session_id;
  IF v_session_id IS NULL THEN
    SELECT s.id INTO v_session_id
    FROM public.sessions s
    WHERE s.club_id = v_req.club_id
      AND s.session_date = v_req.excuse_date
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  -- 매칭 세션이 있으면 공결 기록 (D5: 분모(session_targets) 유지, 분자(출석)엔 미포함)
  IF v_session_id IS NOT NULL THEN
    INSERT INTO public.attendances (session_id, member_id, status)
    VALUES (v_session_id, v_req.member_id, '공결')
    ON CONFLICT (session_id, member_id) DO UPDATE SET status = '공결';
  END IF;

  UPDATE public.attendance_excuse_requests
  SET status        = '승인',
      session_id    = v_session_id,
      reviewer_note = COALESCE(p_note, reviewer_note),
      reviewed_by   = auth.uid(),
      reviewed_at   = now()
  WHERE id = p_request_id;

  RETURN v_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_excuse_request(uuid, text) TO authenticated;

-- ── 4) 상태 변경 시 신청자 알림 ───────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_excuse_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('승인','반려') THEN
    SELECT cm.user_id INTO v_user_id
    FROM public.club_members cm
    WHERE cm.id = NEW.member_id;

    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        v_user_id,
        'attendance_excuse',
        CASE NEW.status
          WHEN '승인' THEN '출석 인정 신청이 승인됐어요'
          WHEN '반려' THEN '출석 인정 신청이 반려됐어요'
        END,
        NEW.reviewer_note,
        '/mypage'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_excuse_status ON public.attendance_excuse_requests;
CREATE TRIGGER trg_notify_excuse_status
  AFTER UPDATE OF status ON public.attendance_excuse_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_excuse_status();
