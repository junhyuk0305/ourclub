-- ─────────────────────────────────────────────────────────────
-- 무결성 수정: 모집 지원 중복 방지 — QA #2 (중복 지원 레이스)
--
-- 문제: ClubApply 의 중복 방지가 "SELECT(기존 있나) → INSERT" 2단계 앱 로직뿐.
--       원자적이지 않아 더블클릭/동시 탭/네트워크 재시도 시 같은
--       (recruitment_id, user_id) 로 지원서가 2행 이상 INSERT 될 수 있다.
--       (club_join_requests 는 unique 제약이 있어 23505 로 막히는데 지원서만 비대칭.)
--
-- 방침: DB 가 원자적으로 막도록 (recruitment_id, user_id) UNIQUE 인덱스를 건다.
--       기존 중복 데이터가 있으면 인덱스 생성이 실패하므로, 먼저 그룹별로
--       "가장 먼저 제출된 1행"만 남기고 나머지를 정리(dedup)한다.
--       recruitment_applications 의 시간 컬럼은 submitted_at(테이블에 created_at 없음).
-- ─────────────────────────────────────────────────────────────

-- 1) dedup — 그룹별 최초 제출 1행만 보존 (submitted_at 오름차순, 동시각이면 ctid 로 결정)
DELETE FROM public.recruitment_applications a
USING public.recruitment_applications b
WHERE a.recruitment_id = b.recruitment_id
  AND a.user_id = b.user_id
  AND (
        a.submitted_at > b.submitted_at
     OR (a.submitted_at = b.submitted_at AND a.ctid > b.ctid)
  );

-- 2) UNIQUE 인덱스 — 2번째 INSERT 가 DB 단에서 23505 로 거부됨
CREATE UNIQUE INDEX IF NOT EXISTS recruitment_applications_recruitment_user_uniq
  ON public.recruitment_applications (recruitment_id, user_id);
