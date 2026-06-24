-- Phase D Step 2
-- 동아리별 "현재 활동 기수" 관리
-- 1) clubs.generations    : 운영진이 관리하는 기수 라벨 목록 (예: {'13기','14기'})
-- 2) clubs.current_generation : 현재 활동 중인 기수 (위 목록 중 하나)
-- "기수 마감" 동작은 클라이언트에서 club_members.status 일괄 업데이트로 구현.

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS generations        text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_generation text;

COMMENT ON COLUMN public.clubs.generations IS
  '운영진이 정의한 기수 라벨 목록 (예: {"13기","14기"}). 부원 generation 입력은 이 목록을 선택지로 사용.';
COMMENT ON COLUMN public.clubs.current_generation IS
  '현재 활동 중인 기수 라벨. 부원 명단의 "현재 활동 기수" 탭 필터 기준.';
