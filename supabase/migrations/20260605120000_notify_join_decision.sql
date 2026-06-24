-- ─────────────────────────────────────────────────────────────
-- 합류 신청 승인/거절 시 신청자에게 인앱 알림
--  버그: 운영진이 club_join_requests 를 '승인'/'거절' 해도 신청자에게
--    아무 통지가 없어, 신청자는 결과를 모른 채 대기 화면에 머물렀다.
--    (등록 신청은 notify_registration_status 트리거로 이미 알림이 가는데
--     합류 신청만 누락 — 두 흐름의 일관성 회복.)
--  수정: '대기중' → '승인'/'거절' 전이를 받아 notifications 생성.
--    INSERT 정책이 없는 테이블이므로 SECURITY DEFINER 트리거로만 생성.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_join_request_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_name text;
BEGIN
  -- 대기중 → 승인/거절 전이만 통지 (재처리·다른 상태 변경은 제외)
  IF NOT (OLD.status = '대기중' AND NEW.status IN ('승인', '거절')) THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_club_name FROM public.clubs WHERE id = NEW.club_id;
  v_club_name := COALESCE(v_club_name, '동아리');

  IF NEW.status = '승인' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'join_request',
      v_club_name || ' 운영진 합류가 승인됐어요 🎉',
      '이제 동아리 운영 페이지에 접근할 수 있어요.',
      '/admin/dashboard'
    );
  ELSE
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'join_request',
      v_club_name || ' 합류 신청이 거절됐어요',
      '다른 동아리에 합류하거나 새 동아리를 등록해 보세요.',
      '/club-setup'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_join_request_decision ON public.club_join_requests;
CREATE TRIGGER trg_notify_join_request_decision
  AFTER UPDATE OF status ON public.club_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_join_request_decision();
