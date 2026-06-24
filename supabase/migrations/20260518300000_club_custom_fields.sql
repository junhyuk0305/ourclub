-- Phase C Step 2: 부원 명단 커스텀 필드
-- 동아리별로 운영진이 추가하는 사용자 정의 컬럼 (예: MBTI, 회비 납부 여부)
-- 1) club_custom_fields: 필드 정의 (클럽별)
-- 2) club_member_custom_values: 부원별 값

-- ─────────────────────────────────────────────────────────────
-- 1) 필드 정의 테이블
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_custom_fields (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name          text NOT NULL,
  display_order int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, name)
);

CREATE INDEX IF NOT EXISTS club_custom_fields_club_idx
  ON public.club_custom_fields(club_id, display_order);

COMMENT ON TABLE public.club_custom_fields IS
  '동아리별 부원 명단 커스텀 컬럼 정의 (예: MBTI, 회비 납부)';

ALTER TABLE public.club_custom_fields ENABLE ROW LEVEL SECURITY;

-- 운영진만 모든 작업 가능
DROP POLICY IF EXISTS "운영진 커스텀 필드 조회" ON public.club_custom_fields;
CREATE POLICY "운영진 커스텀 필드 조회" ON public.club_custom_fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_custom_fields.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "운영진 커스텀 필드 추가" ON public.club_custom_fields;
CREATE POLICY "운영진 커스텀 필드 추가" ON public.club_custom_fields
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_custom_fields.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "운영진 커스텀 필드 수정" ON public.club_custom_fields;
CREATE POLICY "운영진 커스텀 필드 수정" ON public.club_custom_fields
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_custom_fields.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "운영진 커스텀 필드 삭제" ON public.club_custom_fields;
CREATE POLICY "운영진 커스텀 필드 삭제" ON public.club_custom_fields
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_custom_fields.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 2) 값 테이블
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_member_custom_values (
  member_id uuid NOT NULL REFERENCES public.club_members(id) ON DELETE CASCADE,
  field_id  uuid NOT NULL REFERENCES public.club_custom_fields(id) ON DELETE CASCADE,
  value     text,
  PRIMARY KEY (member_id, field_id)
);

CREATE INDEX IF NOT EXISTS club_member_custom_values_field_idx
  ON public.club_member_custom_values(field_id);

COMMENT ON TABLE public.club_member_custom_values IS
  '부원별 커스텀 필드 값 (member × field 의 격자)';

ALTER TABLE public.club_member_custom_values ENABLE ROW LEVEL SECURITY;

-- 운영진만 모든 작업 가능 (field_id 를 통해 club 확인)
DROP POLICY IF EXISTS "운영진 커스텀 값 조회" ON public.club_member_custom_values;
CREATE POLICY "운영진 커스텀 값 조회" ON public.club_member_custom_values
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_custom_fields f
      JOIN public.club_members cm ON cm.club_id = f.club_id
      WHERE f.id = club_member_custom_values.field_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "운영진 커스텀 값 추가" ON public.club_member_custom_values;
CREATE POLICY "운영진 커스텀 값 추가" ON public.club_member_custom_values
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.club_custom_fields f
      JOIN public.club_members cm ON cm.club_id = f.club_id
      WHERE f.id = club_member_custom_values.field_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "운영진 커스텀 값 수정" ON public.club_member_custom_values;
CREATE POLICY "운영진 커스텀 값 수정" ON public.club_member_custom_values
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_custom_fields f
      JOIN public.club_members cm ON cm.club_id = f.club_id
      WHERE f.id = club_member_custom_values.field_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "운영진 커스텀 값 삭제" ON public.club_member_custom_values;
CREATE POLICY "운영진 커스텀 값 삭제" ON public.club_member_custom_values
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_custom_fields f
      JOIN public.club_members cm ON cm.club_id = f.club_id
      WHERE f.id = club_member_custom_values.field_id
        AND cm.user_id = auth.uid()
        AND cm.role = '운영진'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );
