-- ─────────────────────────────────────────────────────────────
-- 동아리 단위 탈퇴 — 계정 삭제 없이 특정 동아리 하나만 나가기 (JOURNEY_AUDIT Tier3 ②)
--
--  배경: 지금까지 '나가기'는 전체 계정 탈퇴(delete_own_account)뿐이라,
--    여러 동아리에 속한 사람이 한 동아리만 정리할 길이 없었다.
--  동작: 호출자 본인의 해당 동아리 '활동중' 멤버십을 '탈퇴'로 전환.
--    계정·다른 동아리·이력(출결 등)은 건드리지 않음(상태만 전환, 재합격 시
--    promote_applicant_to_member 가 '탈퇴'→'활동중' 으로 되살림).
--
--  위계·책임: 별도 RLS 불필요 — 기존 불변식 트리거가 그대로 적용된다.
--    · prevent_last_admin_removal(AFTER UPDATE): 마지막 활동중 운영진이
--      탈퇴로 빠져 동아리가 '운영진 0명'이 되면 차단하고, 먼저 권한을
--      양도하라는 메시지를 던진다. → 단독 운영진은 양도 전엔 못 나감.
--    · 부원/복수 운영진 중 1명은 그대로 탈퇴 성립.
--  멱등: 활동중 멤버십이 없으면(이미 탈퇴 등) 조용히 0행 — 재호출 무해.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.leave_club(p_club_id uuid)
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

  -- 본인의 '활동중' 멤버십만 탈퇴로. (마지막 운영진이면 트리거가 차단)
  UPDATE public.club_members
  SET status = '탈퇴'
  WHERE user_id = v_caller
    AND club_id = p_club_id
    AND status = '활동중';
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_club(uuid) TO authenticated;
