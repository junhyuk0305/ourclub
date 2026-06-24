-- Phase A Step 1: 부원 명단 관리 확장
-- 1) profiles 에 생년월일, 학적상태 추가 (phone/university/major 는 기존 존재)
-- 2) club_members 에 role_function 추가
--    - position (직책: 회장/팀장/팀원) 과 구분
--    - role_function (업무 역할: 기획/디자인/개발/마케팅 등)

-- ─────────────────────────────────────────────────────────────
-- profiles 확장
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS academic_status text;

-- 학적상태 enum check (NULL 허용)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_academic_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_academic_status_check
  CHECK (academic_status IS NULL OR academic_status IN ('재학','휴학','수료','졸업'));

COMMENT ON COLUMN public.profiles.birthdate IS '생년월일 (운영진 View 전용 노출)';
COMMENT ON COLUMN public.profiles.academic_status IS '학적 상태: 재학/휴학/수료/졸업';

-- ─────────────────────────────────────────────────────────────
-- club_members 확장
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.club_members
  ADD COLUMN IF NOT EXISTS role_function text;

COMMENT ON COLUMN public.club_members.role_function IS
  '업무 역할(기획/디자인/개발/마케팅 등). position(직책: 회장/팀장)과 구분.';
