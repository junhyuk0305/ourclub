-- ─────────────────────────────────────────────────────────────
-- 보안 수정: 익명 정보 노출(Information Disclosure) 차단 — SECURITY_REVIEW §1b
--
-- 문제: club_members / sessions / attendances 의 SELECT 정책이 (대시보드에서)
--       USING(true) 로 만들어져 anon(비로그인)도 전체 조회 가능.
--       - club_members        : 회원 명단 PII(user_id, role, display_name …) 공개
--       - sessions.attendance_code : 출석 코드 노출 → 비회원 부정 출석(무결성)
--       - attendances         : 출석 기록 전체 노출
--   (원격 anon probe로 실제 노출 재확인: 2026-06-23.)
--
-- 방침: 위 3개 테이블 SELECT 를 "본인 / 같은 동아리 구성원 / 운영진 / 마스터"
--       로 제한. 마이그레이션엔 이 테이블들의 스코프 SELECT 정책이 없었으므로
--       (유일 SELECT 정책 = 대시보드 USING(true)) 신규로 작성한다.
--       club_members SELECT 정책이 club_members 를 참조 → RLS 무한재귀 회피를 위해
--       판정 로직은 SECURITY DEFINER 헬퍼로 분리한다.
--
-- 기능 영향(검토 완료):
--   - 학생 출석 체크인(AttendanceSection: sessions.eq(attendance_code))은
--     학생이 해당 동아리 '구성원'이므로 app_is_club_member 로 그대로 통과.
--   - 운영진/마스터 관리 화면은 멤버/운영진/마스터 판정으로 전부 통과.
--   - 익명 공개 페이지(Home/Clubs/ClubDetail)는 이 테이블들을 직접 읽지 않음.
--
-- ⚠️ 적용 후 재검증:
--   anon 키로 아래가 모두 [] 를 반환해야 함.
--     GET /rest/v1/club_members?select=user_id
--     GET /rest/v1/sessions?select=attendance_code
--     GET /rest/v1/attendances?select=id
--   만약 여전히 데이터가 보이면, 대시보드에 cmd='ALL' permissive true 정책이
--   남아있는 것 → SQL 에디터에서
--     SELECT policyname, cmd, qual FROM pg_policies
--      WHERE schemaname='public'
--        AND tablename IN ('club_members','sessions','attendances');
--   로 확인 후 해당 ALL 정책을 DROP 하라(아래 SELECT 드롭 루프는 cmd='SELECT'만 제거함).
-- ─────────────────────────────────────────────────────────────

-- 1) 판정 헬퍼 (SECURITY DEFINER → 참조 테이블 RLS 우회로 재귀 방지) ───────────
CREATE OR REPLACE FUNCTION public.app_is_global_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.app_is_club_member(p_club_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = p_club_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.app_is_club_admin(p_club_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = p_club_id AND user_id = auth.uid() AND role = '운영진'
  );
$$;

CREATE OR REPLACE FUNCTION public.app_owns_member(p_member_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE id = p_member_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.app_session_club_id(p_session_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT club_id FROM public.sessions WHERE id = p_session_id;
$$;

GRANT EXECUTE ON FUNCTION public.app_is_global_admin()      TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.app_is_club_member(uuid)   TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.app_is_club_admin(uuid)    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.app_owns_member(uuid)      TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.app_session_club_id(uuid)  TO authenticated, anon;


-- 2) 기존 SELECT 정책(대시보드 USING(true) 포함) 제거 후 스코프 정책 생성 ───────
--    이 테이블들엔 마이그레이션 기반 스코프 SELECT 정책이 없으므로 cmd='SELECT'
--    전량 제거는 안전(쓰기 정책 INSERT/UPDATE/DELETE 는 건드리지 않음).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('club_members','sessions','attendances')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- club_members: 본인 / 같은 동아리 구성원(명단) / 마스터
CREATE POLICY "club_members_select_scoped" ON public.club_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.app_is_club_member(club_id)
    OR public.app_is_global_admin()
  );

-- sessions: 같은 동아리 구성원(=학생 코드 체크인 포함) / 마스터
CREATE POLICY "sessions_select_scoped" ON public.sessions
  FOR SELECT USING (
    public.app_is_club_member(club_id)
    OR public.app_is_global_admin()
  );

-- attendances: 본인 출석 / 동아리 운영진 / 마스터
CREATE POLICY "attendances_select_scoped" ON public.attendances
  FOR SELECT USING (
    public.app_is_global_admin()
    OR public.app_owns_member(member_id)
    OR public.app_is_club_admin(public.app_session_club_id(session_id))
  );


-- 3) club_members UPDATE 에 WITH CHECK 보강 — SECURITY_REVIEW §2 ───────────────
--    기존 UPDATE 정책엔 WITH CHECK 가 없어 변경 후 상태 미검증
--    (운영진이 멤버를 다른 club_id 로 이동시키는 엣지 변경 가능).
--    앱상 club_members 쓰기는 운영진/마스터 전용(멤버 자가쓰기 없음)이므로
--    USING/WITH CHECK 동일 조건으로 좁힌다. (RPC 들은 SECURITY DEFINER 라 영향 없음)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='club_members' AND cmd='UPDATE'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.club_members', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "club_members_update_admin" ON public.club_members
  FOR UPDATE
  USING (
    public.app_is_club_admin(club_id) OR public.app_is_global_admin()
  )
  WITH CHECK (
    public.app_is_club_admin(club_id) OR public.app_is_global_admin()
  );
