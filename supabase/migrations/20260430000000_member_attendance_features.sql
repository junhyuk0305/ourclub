-- sessions 테이블에 날짜 컬럼 추가
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS session_date date;

-- ─────────────────────────────────────────────────────────────
-- attendances: 출석 등록 정책 재설정
-- 기존: 부원 본인(코드 인증)만 INSERT 가능
-- 변경: 운영진도 수동 INSERT 가능하도록 추가
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "출석 등록" ON public.attendances;
CREATE POLICY "출석 등록" ON public.attendances
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- 부원 본인: 해당 세션 club의 member_id와 일치
      EXISTS (
        SELECT 1
        FROM public.club_members cm
        JOIN public.sessions s ON s.club_id = cm.club_id
        WHERE cm.id = attendances.member_id
          AND cm.user_id = auth.uid()
      )
      OR
      -- 운영진: 해당 세션이 속한 club의 운영진
      EXISTS (
        SELECT 1
        FROM public.club_members cm
        JOIN public.sessions s ON s.id = attendances.session_id
        WHERE s.club_id = cm.club_id
          AND cm.user_id = auth.uid()
          AND cm.role = '운영진'
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- sessions: 마스터(global_admins) 세션 생성/수정 허용
-- 기존 정책은 club_members.role='운영진'만 허용 → 마스터 계정은
-- club_members 행이 없으므로 INSERT 시 403 발생
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "운영진 세션 생성" ON public.sessions;
CREATE POLICY "운영진 세션 생성" ON public.sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = sessions.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "운영진 세션 수정" ON public.sessions;
CREATE POLICY "운영진 세션 수정" ON public.sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = sessions.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- attendances: 운영진 출석 레코드 삭제 허용
DROP POLICY IF EXISTS "운영진 출석 삭제" ON public.attendances;
CREATE POLICY "운영진 출석 삭제" ON public.attendances
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_members cm
      JOIN public.sessions s ON s.id = attendances.session_id
      WHERE s.club_id = cm.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
  );
