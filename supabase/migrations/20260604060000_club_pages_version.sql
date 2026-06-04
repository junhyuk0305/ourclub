-- ─────────────────────────────────────────────────────────────
-- club_pages 낙관적 잠금(Optimistic Concurrency) — 동시 편집 유실 방지
--  운영진은 한 동아리에 복수 존재 가능(handover 는 본인만 강등) → 같은
--  club_pages 행을 두 명이 동시에 편집할 수 있다. 기존 자동저장은 조건 없이
--  통째로 덮어써(last-write-wins) 한쪽 작업이 조용히 사라졌다.
--  version 정수를 두어 "내가 읽은 버전 그대로일 때만" 저장하도록 가드한다.
--  (timestamp 대신 정수 → 동시 ms 충돌·시계 오차 영향 없음)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.club_pages
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;
