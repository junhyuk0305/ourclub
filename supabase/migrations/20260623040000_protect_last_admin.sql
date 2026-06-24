-- ─────────────────────────────────────────────────────────────
-- 마지막 운영진 보호 — 동아리가 '운영진 0명'으로 고아화되는 것을 차단
--  배경: 권한은 club_members.role 이진값이고, 운영진이면 워크스페이스 전권을
--    갖는다. 그런데 마지막 활동중 운영진이
--      · 명단에서 스스로/서로 '부원'으로 강등되거나
--      · status 를 '탈퇴/수료/활동정지'로 바꾸거나
--      · 계정 탈퇴(delete_own_account → status='탈퇴')하면
--    동아리에 운영진이 한 명도 없게 되어 아무도 운영할 수 없게 된다.
--  불변식: "각 동아리에는 항상 활동중 운영진이 1명 이상 있어야 한다."
--
--  구현: AFTER UPDATE/DELETE 행 트리거.
--    행 단위 BEFORE 트리거는 한 문장이 여러 운영진을 동시에 강등할 때
--    각 행 시점에 다른 행의 변경을 아직 못 봐서(스냅샷) 0명을 못 막는다.
--    AFTER 트리거는 문장의 모든 행 변경이 적용된 뒤 발화하므로,
--    변경 후 동아리의 활동중 운영진 수를 정확히 셀 수 있다.
--
--  cascade 예외: 동아리 자체가 삭제 중이거나 계정이 하드 삭제 중이면(부모 행
--    소멸) 막지 않는다 — 정상적인 삭제를 방해하지 않기 위함.
--    (자기 탈퇴 delete_own_account 는 계정을 남기고 status 만 바꾸므로
--     이 예외에 해당하지 않아 정상적으로 차단된다.)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_admins int;
BEGIN
  -- OLD 가 '활동중 운영진' 이 아니었다면 운영진 수에 영향 없음
  IF NOT (OLD.role = '운영진' AND OLD.status = '활동중') THEN
    RETURN NULL;
  END IF;

  -- UPDATE 후에도 같은 동아리의 '활동중 운영진' 으로 남았다면 영향 없음
  IF TG_OP = 'UPDATE'
     AND NEW.role = '운영진' AND NEW.status = '활동중'
     AND NEW.club_id = OLD.club_id THEN
    RETURN NULL;
  END IF;

  -- 동아리가 이미 삭제됐다면(cascade) 막지 않음
  IF NOT EXISTS (SELECT 1 FROM public.clubs WHERE id = OLD.club_id) THEN
    RETURN NULL;
  END IF;

  -- 계정이 하드 삭제됐다면(cascade) 막지 않음
  IF OLD.user_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
    RETURN NULL;
  END IF;

  -- 변경 적용 후 동아리의 '활동중 운영진' 수
  SELECT count(*) INTO v_active_admins
  FROM public.club_members
  WHERE club_id = OLD.club_id
    AND role = '운영진'
    AND status = '활동중';

  IF v_active_admins = 0 THEN
    RAISE EXCEPTION '마지막 운영진은 강등하거나 탈퇴할 수 없습니다. 먼저 다른 구성원을 운영진으로 지정하거나 권한을 양도하세요.';
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.prevent_last_admin_removal() IS
  '동아리의 활동중 운영진이 0명이 되는 강등/탈퇴/삭제를 차단(고아화 방지). cascade 삭제는 예외.';

DROP TRIGGER IF EXISTS trg_prevent_last_admin_removal ON public.club_members;
CREATE TRIGGER trg_prevent_last_admin_removal
  AFTER UPDATE OR DELETE ON public.club_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_removal();
