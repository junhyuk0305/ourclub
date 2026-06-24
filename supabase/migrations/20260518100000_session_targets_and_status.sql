-- Phase B Step 8-DB: 출석 세션 분리 / 정확한 출석률 모수
-- 1) sessions.target_generations: 대상 기수 목록 (예: {"13기","14기"})
-- 2) session_targets: 세션별 출석 대상 부원 (예외처리된 후) - 출석률 산정 분모
-- 3) attendances.status: '공결' 추가 (출석인정)

-- ─────────────────────────────────────────────────────────────
-- 1) sessions 확장
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS target_generations text[] DEFAULT '{}';

COMMENT ON COLUMN public.sessions.target_generations IS '대상 기수 목록 (예: {"13기","14기"})';

-- ─────────────────────────────────────────────────────────────
-- 2) session_targets 테이블
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_targets (
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES public.club_members(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, member_id)
);

COMMENT ON TABLE public.session_targets IS
  '출석률 산정 모수: 세션 생성 시 예외처리 후의 출석 대상 부원';

CREATE INDEX IF NOT EXISTS session_targets_session_idx ON public.session_targets(session_id);
CREATE INDEX IF NOT EXISTS session_targets_member_idx  ON public.session_targets(member_id);

ALTER TABLE public.session_targets ENABLE ROW LEVEL SECURITY;

-- SELECT: 해당 클럽의 부원 모두 (자기가 대상인지 확인 가능)
DROP POLICY IF EXISTS "세션 대상자 조회" ON public.session_targets;
CREATE POLICY "세션 대상자 조회" ON public.session_targets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_members cm
      JOIN public.sessions s ON s.id = session_targets.session_id
      WHERE s.club_id = cm.club_id
        AND cm.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- INSERT/DELETE: 운영진만
DROP POLICY IF EXISTS "세션 대상자 추가" ON public.session_targets;
CREATE POLICY "세션 대상자 추가" ON public.session_targets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.club_members cm
      JOIN public.sessions s ON s.id = session_targets.session_id
      WHERE s.club_id = cm.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "세션 대상자 삭제" ON public.session_targets;
CREATE POLICY "세션 대상자 삭제" ON public.session_targets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_members cm
      JOIN public.sessions s ON s.id = session_targets.session_id
      WHERE s.club_id = cm.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 3) attendances.status 에 '공결' 추가
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.attendances
  DROP CONSTRAINT IF EXISTS attendances_status_check;
ALTER TABLE public.attendances
  ADD CONSTRAINT attendances_status_check
  CHECK (status IN ('출석','지각','결석','공결'));
