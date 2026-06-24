-- ─────────────────────────────────────────────────────────────
-- 운영진 권한 양도(Handover) — 졸업/승계 시 동아리 주인 소멸 방지
--  호출자(활동중 운영진)가 같은 동아리의 활동중 구성원에게 운영 권한을
--  넘기고 본인은 부원으로 내려간다. 대상 승격 → 본인 강등을 한 트랜잭션으로
--  처리해 "운영진 0명" 상태가 생기지 않도록 한다.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handover_club_admin(
  p_club_id    uuid,
  p_to_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.';
  END IF;
  IF p_to_user_id = v_caller THEN
    RAISE EXCEPTION '본인에게는 양도할 수 없습니다.';
  END IF;

  -- 호출자가 해당 동아리의 활동중 운영진인지
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = p_club_id AND user_id = v_caller
      AND role = '운영진' AND status = '활동중'
  ) THEN
    RAISE EXCEPTION '운영진만 권한을 양도할 수 있습니다.';
  END IF;

  -- 대상이 해당 동아리의 활동중 구성원인지
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = p_club_id AND user_id = p_to_user_id
      AND status = '활동중'
  ) THEN
    RAISE EXCEPTION '대상이 활동중인 동아리 구성원이 아닙니다.';
  END IF;

  -- 대상 → 운영진 (먼저 승격: 항상 운영진 ≥ 1 유지)
  UPDATE public.club_members
  SET role = '운영진'
  WHERE club_id = p_club_id AND user_id = p_to_user_id;

  -- 본인 → 부원
  UPDATE public.club_members
  SET role = '부원'
  WHERE club_id = p_club_id AND user_id = v_caller;

  -- 새 운영진에게 인앱 알림
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    p_to_user_id,
    'admin_handover',
    '운영진 권한을 이양받았어요',
    COALESCE((SELECT name FROM public.clubs WHERE id = p_club_id), '동아리')
      || ' 운영 권한이 위임되었습니다.',
    '/admin/dashboard'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.handover_club_admin(uuid, uuid) TO authenticated;
