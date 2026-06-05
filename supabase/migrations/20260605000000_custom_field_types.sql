-- ─────────────────────────────────────────────────────────────
-- M3: 커스텀필드 타입 시스템
--  club_custom_fields 에 타입/옵션/필수 컬럼 추가.
--  v1 핵심5(D6): text(단답)·textarea(장문)·number(숫자)·select(단일선택)·date(날짜).
--  값은 기존 club_member_custom_values.value(text) 유지(숫자/날짜/선택 모두 문자열 저장).
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.club_custom_fields
  ADD COLUMN IF NOT EXISTS field_type text    NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS options    jsonb   NOT NULL DEFAULT '[]'::jsonb,  -- 선택형(select) 옵션 문자열 배열
  ADD COLUMN IF NOT EXISTS required   boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.club_custom_fields.field_type IS 'text|textarea|number|select|date (점진 확장)';
COMMENT ON COLUMN public.club_custom_fields.options    IS 'select 타입 옵션 배열(JSON)';

-- 허용 타입 제약 (이후 multiselect/phone/email/url/file 등으로 확장 시 갱신)
ALTER TABLE public.club_custom_fields
  DROP CONSTRAINT IF EXISTS club_custom_fields_field_type_check;
ALTER TABLE public.club_custom_fields
  ADD CONSTRAINT club_custom_fields_field_type_check
  CHECK (field_type IN ('text', 'textarea', 'number', 'select', 'date'));
