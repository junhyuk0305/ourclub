-- ─────────────────────────────────────────────────────────────
-- 외래키 인덱스 보강 (성능 최적화)
--  원격 카탈로그 점검(2026-06-04) 결과, 인덱스 없는 FK 21개 발견.
--  특히 club_members(user_id), *(club_id) 는 거의 모든 RLS 정책이
--  매 쿼리마다 조회하는 컬럼이라, 인덱스 부재 시 seq scan 발생.
--  추가만 하므로 무위험. (대용량 테이블은 운영에서 CONCURRENTLY 권장)
-- ─────────────────────────────────────────────────────────────

-- ★ RLS 핫패스 (최우선)
CREATE INDEX IF NOT EXISTS idx_club_members_user_id            ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_user          ON public.club_members(club_id, user_id); -- RLS EXISTS 패턴 커버
CREATE INDEX IF NOT EXISTS idx_recruitments_club_id            ON public.recruitments(club_id);
CREATE INDEX IF NOT EXISTS idx_sessions_club_id                ON public.sessions(club_id);
CREATE INDEX IF NOT EXISTS idx_posts_club_id                   ON public.posts(club_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_applications_user   ON public.recruitment_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_club_pages_club_id              ON public.club_pages(club_id);

-- 나머지 FK 인덱스
CREATE INDEX IF NOT EXISTS idx_application_stage_log_moved_by  ON public.application_stage_log(moved_by);
CREATE INDEX IF NOT EXISTS idx_attendances_member_id           ON public.attendances(member_id);
CREATE INDEX IF NOT EXISTS idx_club_join_requests_reviewed_by  ON public.club_join_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_club_reg_req_reviewed_by        ON public.club_registration_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_club_reviews_user_id            ON public.club_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id              ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id                 ON public.posts(author_id);

-- B2B / 기타 도메인 FK
CREATE INDEX IF NOT EXISTS idx_applications_project_id         ON public.applications(project_id);
CREATE INDEX IF NOT EXISTS idx_b2b_applications_club_id        ON public.b2b_applications(club_id);
CREATE INDEX IF NOT EXISTS idx_b2b_projects_corp_id            ON public.b2b_projects(corp_id);
CREATE INDEX IF NOT EXISTS idx_corp_members_user_id            ON public.corp_members(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id     ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_corp_id                ON public.projects(corp_id);
CREATE INDEX IF NOT EXISTS idx_pulse_responses_user_id         ON public.pulse_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_pulse_surveys_club_id           ON public.pulse_surveys(club_id);
