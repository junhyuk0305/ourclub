-- ─────────────────────────────────────────────────────────────
-- 모집 최종합격 → 부원 자동 추가 트리거 보강 (외부인→부원 경로 누수 수선 E·D)
--  배경: promote_applicant_to_member() 는 (user_id, club_id) 가 이미
--    존재하면 무조건 skip 했다. 그래서
--    ① 과거 '탈퇴'/'수료' 레코드가 남은 사람은 재지원·재합격해도
--       부원으로 못 돌아왔다(재가입 버그, E).
--    ② 부원이 되는 순간 당사자에게 보장된 통지가 없었다.
--       (stage-move 알림은 운영진이 '알림 보내기'를 켰을 때만, 그것도
--        멤버십이 아닌 '지원 상태' 메시지로만 발송 — 보장 안 됨, D).
--  수정:
--    · 기존 레코드가 '탈퇴'/'수료' 면 status='활동중', role='부원' 으로 되살림.
--      '활동중' 은 건드리지 않음(현직 운영진이 부원으로 강등되는 사고 방지).
--      '활동정지' 도 자동 복귀 대상 아님(운영진이 수동 처리).
--    · 신규 등록·재활성 시에만 당사자에게 '부원이 됐어요' 인앱 알림을 보장.
--    · 단계 되돌림에 따른 자동 회수는 도입하지 않음(현행 유지 — 운영진 수동 제거).
--  트리거(promote_applicant_on_final_status)는 기존 정의를 그대로 사용 —
--  함수 본문만 교체한다(CREATE OR REPLACE).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.promote_applicant_to_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_stage text;
  v_club_id    uuid;
  v_club_name  text;
  v_member     public.club_members%ROWTYPE;
  v_changed    boolean := false;
BEGIN
  -- 변경 없으면 종료 (UPDATE 시)
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS NULL THEN
    RETURN NEW;
  END IF;

  -- 공고의 최종 stage + club_id 조회
  SELECT
    pipeline_stages ->> (jsonb_array_length(pipeline_stages) - 1),
    club_id
  INTO v_last_stage, v_club_id
  FROM public.recruitments
  WHERE id = NEW.recruitment_id
    AND jsonb_typeof(pipeline_stages) = 'array'
    AND jsonb_array_length(pipeline_stages) > 0;

  -- 최종 stage 가 아니면 아무 것도 하지 않는다
  IF v_last_stage IS NULL OR NEW.status <> v_last_stage OR v_club_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 기존 멤버십 조회
  SELECT * INTO v_member
  FROM public.club_members
  WHERE user_id = NEW.user_id
    AND club_id = v_club_id;

  IF NOT FOUND THEN
    -- 신규 부원 등록
    INSERT INTO public.club_members (user_id, club_id, role, status)
    VALUES (NEW.user_id, v_club_id, '부원', '활동중');
    v_changed := true;
  ELSIF v_member.status IN ('탈퇴', '수료') THEN
    -- 재가입: 무조건 부원으로 되살림 (E)
    UPDATE public.club_members
    SET status = '활동중', role = '부원'
    WHERE id = v_member.id;
    v_changed := true;
  END IF;
  -- '활동중'/'활동정지' 는 그대로 둔다 (현직자 강등·정지자 자동복귀 방지)

  -- 신규/재활성 시에만 당사자에게 보장된 통지 (D)
  IF v_changed THEN
    SELECT name INTO v_club_name FROM public.clubs WHERE id = v_club_id;
    v_club_name := COALESCE(v_club_name, '동아리');

    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'membership',
      v_club_name || ' 부원이 되었어요 🎉',
      '마이페이지에서 활동·출결을 확인할 수 있어요.',
      '/mypage'
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.promote_applicant_to_member() IS
  '지원자 status 가 공고 파이프라인의 마지막 단계가 되면 club_members 에 부원 추가/재활성(탈퇴·수료 복귀)하고 당사자에게 인앱 알림';
