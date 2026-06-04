-- ============================================================
-- 1-Page 웹빌더: 초안(draft) / 공개본(published) 분리
--
-- 문제: 지금까지 club_pages.blocks 한 컬럼을 편집 초안과 방문자에게
--       보이는 공개본이 함께 사용 → 자동저장이 곧바로 라이브 페이지를
--       덮어써서 "발행"의 의미가 모호했다.
--
-- 해결: draft 컬럼을 추가해 역할을 분리한다.
--   - draft  : 작업 중인 초안 (자동저장 대상, 방문자에게 노출 안 됨)
--   - blocks : 발행된 공개본 (방문자가 보는 스냅샷, '발행' 시에만 갱신)
--   - published_at : 마지막 발행 시각 (NULL = 아직 발행 안 함 → 기본 소개 페이지 노출)
--
-- 롤백: draft 컬럼만 추가하므로 되돌리려면 `ALTER TABLE club_pages DROP COLUMN draft;`
--       기존 blocks/published_at 의미는 그대로 보존된다(하위 호환).
-- ============================================================

ALTER TABLE public.club_pages
  ADD COLUMN IF NOT EXISTS draft jsonb;

-- 기존 페이지의 현재 내용을 초안의 출발점으로 백필
-- (이미 발행된 페이지는 공개본 == 초안 상태로 시작 → '발행 안 된 변경사항' 없음)
UPDATE public.club_pages
  SET draft = blocks
  WHERE draft IS NULL;
