-- ─────────────────────────────────────────────────────────────
-- 지원자 단계 이동 시 인앱 알림 (이메일 발송 대체)
--  운영진이 칸반에서 지원자 단계를 옮기며 "알림 보내기"를 선택하면
--  application_stage_log 에 email_sent=true 로 기록되는데,
--  그 INSERT 를 받아 지원자에게 인앱 notifications 를 생성한다.
--  (이메일 발송 인프라 대신 인앱 알림으로 전 흐름 통일. email_* 컬럼은
--   메시지 저장소로 그대로 재사용 — 추후 이메일 발송 추가 시 동일 데이터 활용.)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_applicant_stage_move()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_title   text;
BEGIN
  -- "알림 보내기"를 선택한 이동만 통지
  IF NOT COALESCE(NEW.email_sent, false) THEN
    RETURN NEW;
  END IF;

  -- 지원자(auth user) 조회
  SELECT user_id INTO v_user_id
  FROM public.recruitment_applications
  WHERE id = NEW.application_id;

  -- 계정 없는 지원(user_id NULL)은 인앱 알림 대상 아님
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_title := COALESCE(NULLIF(btrim(NEW.email_subject), ''),
                      '지원 상태가 ''' || NEW.to_stage || '''(으)로 변경됐어요');

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    v_user_id,
    'application_status',
    v_title,
    NEW.email_body,
    '/mypage'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_applicant_stage_move ON public.application_stage_log;
CREATE TRIGGER trg_notify_applicant_stage_move
  AFTER INSERT ON public.application_stage_log
  FOR EACH ROW EXECUTE FUNCTION public.notify_applicant_stage_move();
