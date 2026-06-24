-- ─────────────────────────────────────────────────────────────
-- 불합격 통보 보장 — 지원자 결과 통보를 합격↔불합격 대칭으로 (JOURNEY_AUDIT Tier3 ①)
--
--  배경: notify_applicant_stage_move 는 운영진이 '알림 보내고 이동'(email_sent=true)을
--    골랐을 때만 인앱 알림을 만들었다. 그래서 '알림 없이 이동'으로 지원자를
--    불합격(탈락/거절) 단계로 옮기면 지원자는 결과를 영영 알 수 없었다(고스팅).
--    합격은 promote_applicant_to_member 가 토글과 무관하게 'membership' 알림을
--    이미 보장하지만, 불합격에는 그런 보장이 없었다(비대칭).
--
--  수정: 통지 조건을 'email_sent=true' OR '불합격 키워드 단계'로 확장한다.
--    · 불합격 단계 판정은 앱(RecruitDashboard/RecruitAnalytics)과 동일한 키워드
--      (불합격/탈락/거절/reject)로 to_stage 를 부분일치 검사.
--    · 운영진이 작성한 제목/본문이 있으면 그대로 쓰고, 없으면(=알림 없이 이동)
--      기본 안내 문구로 보낸다.
--
--  중복 안전성:
--    · 같은 트리거(stage_log INSERT 1회 = 트리거 1회) 한 곳만 고치므로 자기중복 없음.
--    · 합격 보장(promote_applicant_to_member)은 '마지막 단계'에서만 발화 →
--      불합격 키워드 단계와 겹치지 않는다.
--  트리거 정의(trg_notify_applicant_stage_move)는 그대로 두고 함수 본문만 교체.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_applicant_stage_move()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_title     text;
  v_body      text;
  v_is_reject boolean;
BEGIN
  -- 불합격(탈락/거절) 종착 여부 — 앱의 REJECT_KEYWORDS 와 동일 규칙
  v_is_reject := NEW.to_stage ILIKE '%불합격%'
              OR NEW.to_stage ILIKE '%탈락%'
              OR NEW.to_stage ILIKE '%거절%'
              OR NEW.to_stage ILIKE '%reject%';

  -- '알림 보내기'를 선택한 이동, 또는 불합격(결과 통보가 보장돼야 하는 종착)만 통지.
  -- 불합격은 운영진이 '알림 없이 이동'을 골라도 지원자가 결과를 알 수 있게 항상 보낸다.
  IF NOT COALESCE(NEW.email_sent, false) AND NOT v_is_reject THEN
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

  -- 제목/본문: 운영진이 작성한 값이 있으면 그대로, 없으면 기본 안내.
  v_title := COALESCE(
    NULLIF(btrim(NEW.email_subject), ''),
    CASE WHEN v_is_reject
      THEN '모집 결과를 전해드려요'
      ELSE '지원 상태가 ''' || NEW.to_stage || '''(으)로 변경됐어요'
    END
  );

  v_body := COALESCE(
    NULLIF(btrim(NEW.email_body), ''),
    CASE WHEN v_is_reject
      THEN '아쉽게도 이번 모집에서는 함께하지 못하게 되었어요. 소중한 시간 내어 지원해주셔서 진심으로 감사합니다.'
      ELSE NULL
    END
  );

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    v_user_id,
    'application_status',
    v_title,
    v_body,
    '/mypage'
  );

  RETURN NEW;
END;
$$;
