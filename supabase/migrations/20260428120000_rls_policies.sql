-- ============================================================
-- 기존 정책 유지 + 누락된 정책 추가
-- 주요 문제: profiles SELECT가 "본인만"이라
--   RecruitAdmin에서 지원자 프로필 JOIN 조회 시 전부 null 반환
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- profiles: 운영진이 지원자 프로필을 JOIN 조회할 수 있도록
-- 기존: 본인만(auth.uid() = id) → RecruitAdmin JOIN 깨짐
-- 추가: 클럽 운영진 또는 global_admin은 지원자 프로필 조회 가능
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT
  USING (
    -- 해당 클럽에 지원한 사람의 프로필을 운영진이 볼 수 있음
    EXISTS (
      SELECT 1
      FROM public.recruitment_applications ra
      JOIN public.recruitments r ON r.id = ra.recruitment_id
      JOIN public.club_members cm ON cm.club_id = r.club_id
      WHERE ra.user_id = profiles.id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (
      SELECT 1 FROM public.global_admins WHERE id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- global_admins: 기존 정책은 "본인만(auth.uid() = id)"
-- checkMasterStatus 는 .eq('id', userId) 로 본인 여부 확인이므로 OK
-- 단, isMaster 사용자가 club_members 없이 recruitments/clubs에 접근하려면
-- clubs/recruitments UPDATE 정책에 global_admins 체크가 없어서 실패
-- → recruitments UPDATE, clubs UPDATE 에 global_admin 예외 추가
-- ─────────────────────────────────────────────────────────────

-- recruitments UPDATE: global_admin 허용 추가
DROP POLICY IF EXISTS "운영진 모집 수정" ON public.recruitments;
CREATE POLICY "운영진 모집 수정" ON public.recruitments
  FOR UPDATE
  USING (
    (EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = recruitments.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = '운영진'
    ))
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- recruitments INSERT: global_admin 허용 추가
DROP POLICY IF EXISTS "운영진 모집 생성" ON public.recruitments;
CREATE POLICY "운영진 모집 생성" ON public.recruitments
  FOR INSERT
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = recruitments.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = '운영진'
    ))
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- recruitment_applications UPDATE: global_admin 허용 추가
-- 기존 정책은 운영진만(role='운영진'), global_admin 제외되어 있음
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "운영진 지원서 수정" ON public.recruitment_applications;
CREATE POLICY "운영진 지원서 수정" ON public.recruitment_applications
  FOR UPDATE
  USING (
    (EXISTS (
      SELECT 1
      FROM public.recruitments r
      JOIN public.club_members cm ON cm.club_id = r.club_id
      WHERE r.id = recruitment_applications.recruitment_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    ))
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );
