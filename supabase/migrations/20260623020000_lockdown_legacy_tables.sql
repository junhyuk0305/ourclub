-- ─────────────────────────────────────────────────────────────
-- 보안 수정: 레거시 미사용 테이블 잠금 — SECURITY_REVIEW §1b ③
--
-- 대상: applications / events / projects
--   - SECURITY_REVIEW 보고: SELECT 전체 공개 + 일부 INSERT USING(true) →
--     anon 이 명단/내용 조회 및 스팸 INSERT 가능.
--   - 코드 검증(2026-06-23): src 전역 사용처 0건. 라이브 지원 기능은
--     recruitment_applications 를 사용하며 이 3개 테이블은 죽은 테이블.
--
-- 방침: DROP 대신 "잠금" — RLS ON 유지 + 기존 permissive 정책 전량 제거.
--       RLS 가 켜진 채 정책이 하나도 없으면 기본 deny → anon·authenticated
--       모두 SELECT/INSERT/UPDATE/DELETE 불가. 데이터는 보존(되돌릴 수 있음).
--       사용처가 0건이므로 정책 없이 완전 차단해도 기능 영향 없음.
--
-- ⚠️ 적용: 원격 schema_migrations desync 상태 → 대시보드 SQL 에디터로 수동 실행.
--          (supabase db push 금지 — SECURITY_REVIEW §1b 운영 주의 참조.)
--
-- ⚠️ 재검증(적용 후): anon 키로 아래가 모두 [] 여야 함.
--     GET /rest/v1/applications?select=id
--     GET /rest/v1/events?select=id
--     GET /rest/v1/projects?select=id
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  t   text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['applications', 'events', 'projects'] LOOP
    -- 테이블이 존재할 때만 처리(환경별 일부 부재 가능)
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      -- RLS 강제 ON
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      -- 모든 기존 정책 제거 → 정책 부재 = 기본 deny
      FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t
      LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
      END LOOP;
    END IF;
  END LOOP;
END $$;
