# DB 스키마 통합 레퍼런스 (Single Source Reference)

> 목적: 마이그레이션을 일일이 열지 않고 **DB 전체 구조를 한 곳에서** 파악.
> 생성: 전체 마이그레이션 정적 분석 + **원격 DB 카탈로그 직접 점검(2026-06-04 검증 완료)**. 스키마 변경 시 이 문서도 갱신할 것.

## ⚠️ 먼저 알아야 할 것
- **base 스키마는 이 repo에 없음**: `20260428041019_remote_schema.sql`이 **빈 파일**. `clubs`, `profiles`, `club_members`, `recruitments`, `sessions` 등은 **원격 DB에서 생성**됨. → 컬럼/정책은 **원격 카탈로그 직접 조회로 검증**(아래 표기된 컬럼은 실측값).
- **✅ RLS 원격 검증 결과(2026-06-04)**: public 테이블 **34개 전부 RLS 활성(ON)**. `club_members` 자가 승격·`global_admins` 자가 등록 모두 **차단 확인**. 단 일부 테이블 SELECT가 `USING(true)`로 **익명 전체공개** → [`../SECURITY_REVIEW.md`](../SECURITY_REVIEW.md) 참조.
- **이 repo 마이그레이션엔 없지만 원격에 존재하는 테이블 12개**가 있음(레거시/별도기능) → §2.8. 완전한 base 캡처는 `supabase db pull` 권장.
- 표기: `(base)` = 원격에서 생성, `(mig)` = 마이그레이션에서 생성, `(remote)` = repo 마이그레이션 밖.

---

## 1. 도메인 맵 (한눈에)

| 도메인 | 테이블 | 뷰 | 함수/트리거 |
|--------|--------|-----|-------------|
| 사용자/인증 | `profiles`(base), `global_admins`(base), `notifications`(mig) | | `delete_own_account`, `notify_*` |
| 동아리 코어 | `clubs`(base), `club_members`(base), `club_alerts`(mig), `club_pages`(base), `club_custom_fields`(mig), `club_member_custom_values`(mig) | | `handover_club_admin` |
| 동아리 등록/가입 | `club_registration_requests`(mig), `club_join_requests`(mig) | | `approve_club_registration`, `notify_registration_status` |
| 모집/지원 | `recruitments`(base), `recruitment_applications`(base), `club_reviews`(mig), `club_email_templates`(mig), `application_stage_log`(mig) | `recruitment_with_counts` | `promote_applicant_to_member`, `notify_applicant_stage_move` |
| 세션/출석 | `sessions`(base), `attendances`(base), `session_targets`(mig) | `sessions_with_counts` | |
| 게시물 | `posts`(base), `post_likes`(mig) | | `update_post_like_count` |
| B2B/기업 | `b2b_projects`(base), `corporations`(remote), `corp_members`(remote), `b2b_applications`(remote) | | |
| 이벤트 | `events`(remote), `event_registrations`(remote) | | |
| 펄스설문 | `pulse_surveys`(remote), `pulse_responses`(remote) | | |
| 기타/레거시 | `users`(remote), `applications`(remote), `projects`(remote), `bookmarks`(remote), `verification_requests`(remote) | | `handle_new_user`, `is_master`, `rls_auto_enable` |
| 스토리지 | `post-images`, `certification-docs`, `club-pages` 버킷 | | |

---

## 2. 테이블 카탈로그

### 2.1 사용자/인증

**`profiles` (base)** — 사용자 프로필
마이그레이션 추가 컬럼: `deleted_at timestamptz`(소프트삭제), `birthdate date`, `academic_status text`, `terms_agreed_at timestamptz`·`privacy_agreed_at timestamptz`(회원가입 동의 기록, 클라이언트 backfill) (+ 일부 추가). 출처: 20260514200000, 20260518000000, 20260624090000

**`global_admins` (base)** — 마스터(전체 관리자) 멤버십. `id = auth.users(id)`. RLS: 본인만 SELECT.

**`notifications` (mig, 20260602010000)** — 인앱 알림. RLS ✅
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid → auth.users | |
| type | text | 'registration_status', 'admin_handover' 등 |
| title / body / link | text | link=클릭 시 이동 경로 |
| is_read | boolean | 기본 false |
| created_at | timestamptz | |
> idx: `notifications_user_unread_idx (user_id, is_read, created_at DESC)`

### 2.2 동아리 코어

**`clubs` (base)** — 동아리. 추가 컬럼: `recruit_page jsonb`(20260517000000), `generations text[]`, `current_generation text`(20260519100000)

**`club_members` (base)** — 동아리 구성원 ★권한의 핵심
- 핵심 컬럼: `club_id`, `user_id`, `role`('운영진'/'부원'), `status`('활동중' 등)
- 추가 컬럼: `role_function text`(20260518000000), `display_name`, `display_university`(20260519000000, 비계정 멤버용)
- ⚠️ **RLS 정책이 repo에 없음** → 보안 검증 필요(SECURITY_REVIEW §1)

**`club_alerts` (mig, 20260512000000)** — 모집 알림 신청. RLS ✅
`id, user_id→auth.users, club_id→clubs, created_at`, UNIQUE(user_id, club_id)
> idx: user_id, club_id

**`club_pages` (base)** — 동아리 1페이지(웹빌더). 추가 컬럼: `draft jsonb`(20260602000000, 초안/공개본 분리). content jsonb(추정).

**`club_custom_fields` (mig, 20260518300000)** — 동아리별 멤버 커스텀 필드 정의. RLS ✅
`id, club_id→clubs, name, display_order int, created_at`, UNIQUE(club_id, name)

**`club_member_custom_values` (mig, 20260518300000)** — 멤버×필드 값. RLS ✅
복합 PK `(member_id→club_members, field_id→club_custom_fields)`, `value text`

### 2.3 동아리 등록/가입

**`club_registration_requests` (mig, 20260514100000)** — 신규 동아리 등록 심사. RLS ✅
- 기본정보: `club_name, club_type, one_line_desc, description, location`
- 인증서류(Storage URL): `registration_doc_url, activity_doc_url, member_list_doc_url, representative_id_url`
- 안전설문: `member_count, has_regular_meeting, meeting_location, has_membership_fee, membership_fee_amount, has_accident_history, accident_description`
- 심사: `status`('검토대기'|'검토중'|'보완요청'|'승인'|'거절'), `reviewer_note, reviewed_at, reviewed_by`(20260602010000)
> idx: user_id, status, created_at DESC

**`club_join_requests` (mig, 20260514100000)** — 기존 동아리 가입 신청. RLS ✅
`id, user_id, club_id, role_title, intro, status`('대기중'|'승인'|'거절')`, reviewed_by, reviewed_at, created_at`, UNIQUE(user_id, club_id)
> idx: user_id, club_id, status

### 2.4 모집/지원 (리크루팅)

**`recruitments` (base)** — 모집 공고. 추가 컬럼: `short_desc`(20260429100000), `recruit_start_date timestamptz, targets text, location text, regular_meeting text, hashtags text[]`(20260517200000). 핵심: `club_id, status, pipeline_stages jsonb`(단계 정의)
> idx: `idx_recruitments_hashtags` GIN(hashtags)

**`recruitment_applications` (base)** — 지원서. 추가 컬럼: `tags text[]`(20260517100000). 핵심: `user_id, recruitment_id, status`(=pipeline 단계값)
> idx: `idx_applications_tags` GIN(tags)

**`club_reviews` (mig, 20260517000000)** — 동아리 후기. RLS ✅
`id, club_id, user_id, rating int(1~5), title, body, generation, result, is_published bool, created_at`, UNIQUE(club_id, user_id, generation)
> idx: club_id, (club_id, is_published)

**`club_email_templates` (mig, 20260517300000)** — 단계별 이메일 템플릿. RLS ✅
`id, club_id, name, stage, subject, body, is_default bool, created_at, updated_at`
> idx: club_id, (club_id, stage)

**`application_stage_log` (mig, 20260517300000)** — 지원자 단계 이동 감사로그. RLS ✅
`id, application_id, from_stage, to_stage, email_sent bool, email_subject, email_body, moved_by, created_at`
> idx: application_id

### 2.5 세션/출석

**`sessions` (base)** — 활동 세션. 추가 컬럼: `session_date date`(20260430000000), `target_generations text[]`(20260518100000)

**`attendances` (base)** — 출석. `status`('출석' 등) 관련 컬럼 추가(20260518100000)

**`session_targets` (mig, 20260518100000)** — 세션 대상자(부분 대상 지정). RLS ✅
복합 PK `(session_id→sessions, member_id→club_members)`
> idx: session_id, member_id

### 2.6 게시물

**`posts` (base)** — 게시물. 추가 컬럼: `images text[]`(20260430200000), `author text`(20260430300000), `like_count int`(20260430400000)

**`post_likes` (mig, 20260430400000)** — 좋아요. RLS ✅(SELECT는 `USING(true)` 공개)
`id, post_id→posts, user_id→auth.users, created_at`, UNIQUE(post_id, user_id)

### 2.7 B2B

**`b2b_projects` (base)** — B2B 프로젝트. 추가 컬럼: `deadline date, required_skills text[]`(20260430100000). 상태 확장 `진행중/완료/중단`(20260624030000)

**핸드오프(매칭 후) 테이블** — `b2b_project_team`(PL·팀원, 민법상 조합), `b2b_contracts`(계약 업로드·기업담당자 연락처, 비공개 `b2b-contracts` 버킷)(20260624030000); `b2b_settlements`(정산: 거래금액·수수료율 10%·납부기한·대금수령/수수료납부 시점·상태)(20260624050000); `b2b_reviews`(양방향 평점 1~5·후기, application·author_side UNIQUE)(20260624065000); `b2b_milestones`(진행 추적·산출물 제출·검수, 비공개 `b2b-deliverables` 버킷)(20260624070000). 미납 판정 `b2b_club_has_overdue(uuid)` + 신규 제안 차단 트리거 `b2b_block_overdue_application`. RLS: 해당 application의 동아리 운영진 OR 프로젝트 소유 기업담당자 OR global_admin(리뷰는 본인 측만 작성).

### 2.8 원격에만 있는 테이블 (repo 마이그레이션 밖, 2026-06-04 카탈로그 검증)

> 모두 RLS ON. ⚠️ 표시는 SELECT가 `USING(true)`(익명 공개). `users/applications/projects`는 `profiles/recruitment_applications/b2b_projects`와 역할이 겹쳐 **레거시/중복 의심 → 사용처 확인 후 정리 후보**.

| 테이블 | 컬럼 | 비고 |
|--------|------|------|
| `corporations` | id, name, business_number, credit_balance int, created_at | 기업(B2B) |
| `corp_members` | id, corp_id, user_id, role | 기업 담당자 |
| `b2b_applications` | id, project_id, club_id, proposal_text, status, submitted_at | 동아리→B2B 지원 |
| `events` | id, host_club_id, title, date, capacity, status, co_host_ids[], cover_url, created_at | ⚠️ INSERT `true`(누구나 생성) |
| `event_registrations` | id, event_id, user_id, status, created_at | 본인만 |
| `pulse_surveys` | id, club_id, title, status, created_at | ⚠️ SELECT `true` |
| `pulse_responses` | id, survey_id, user_id, score int, feedback, submitted_at | ⚠️ SELECT `true`(응답 공개) |
| `bookmarks` | id, user_id, target_type, target_id, created_at | 본인만 |
| `verification_requests` | id, club_id, status, answers jsonb, reviewer_note, submitted_at, reviewed_at | 동아리 인증 |
| `users` 🟥 | id, role, name, phone, school, major, email, verified_at, created_at | **`profiles`와 중복 의심**(role 컬럼 존재). 본인만 RLS |
| `applications` 🟥 | id, club_id, project_id, status, proposal_url, submitted_at | **`b2b_applications` 구버전 의심**. ⚠️ SELECT/INSERT `true` |
| `projects` 🟥 | id, corp_id, title, description, budget, deadline, status, tags[], created_at | **`b2b_projects`와 중복 의심**. ⚠️ SELECT `true` |

---

## 3. 뷰 (Views)

**`recruitment_with_counts` (20260517400000)** `security_invoker=true`
→ `recruitments.*` + `applicant_count`(지원자 수) + `passed_count`(최종 단계 합격자 수, `pipeline_stages` 마지막 단계 기준)

**`sessions_with_counts` (20260518110000)** `security_invoker=true`
→ `sessions.*` + `target_count`(대상자 수) + `attended_count`(status='출석' 수)

---

## 4. 함수 & 트리거

| 함수 | 종류 | 호출자 검증 | 출처 |
|------|------|-------------|------|
| `update_post_like_count()` | 트리거fn | — | 20260430400000 |
| `delete_own_account()` | RPC, SECURITY DEFINER | 본인(auth.uid)만 | 20260514200000 |
| `promote_applicant_to_member()` | 트리거fn, SEC DEFINER | UPDATE RLS가 게이트 | 20260518200000 |
| `notify_registration_status()` | 트리거fn, SEC DEFINER | — | 20260602010000 |
| `approve_club_registration(req_id, ...)` | RPC, SEC DEFINER | **global_admin 확인** ✅ | 20260602010000 |
| `notify_applicant_stage_move()` | 트리거fn, SEC DEFINER | — | 20260604000000 |
| `handover_club_admin(club_id, to_user)` | RPC, SEC DEFINER | **운영진 확인** ✅ | 20260604010000 |

| 트리거 | 테이블 | 시점 |
|--------|--------|------|
| `post_likes_count_trigger` | post_likes | like_count 동기화 |
| `promote_applicant_on_final_status` | recruitment_applications | AFTER INSERT/UPDATE OF status → 합격 시 club_members 자동 등록 |
| `trg_notify_registration_status` | club_registration_requests | AFTER UPDATE OF status → 알림 |
| `trg_notify_applicant_stage_move` | recruitment_applications | 단계 이동 시 알림 |

---

## 5. 스토리지 버킷

| 버킷 | public | 정책 | 출처 |
|------|--------|------|------|
| `post-images` | public | INSERT/DELETE 제한, SELECT 공개 | 20260430200000 |
| `certification-docs` | (등록서류) | 인증 사용자 | 20260514100000 |
| `club-pages` | public + `file_size_limit` | SELECT 공개, INSERT/UPDATE/DELETE는 `auth.uid() IS NOT NULL` | 20260522000000 |

---

## 6. RLS 정책 요약

**마이그레이션에서 RLS 활성화한 테이블(11)**: `post_likes, club_alerts, club_registration_requests, club_join_requests, club_reviews, club_email_templates, application_stage_log, session_targets, club_custom_fields, club_member_custom_values, notifications`

**base 테이블에 정책만 추가**: `profiles, recruitments, recruitment_applications, attendances, sessions, clubs`

**원격 실측(2026-06-04)**: public 테이블 **34개 전부 RLS ON**, 정책 **총 98개** (SELECT/INSERT/UPDATE/DELETE/ALL).
권한 패턴: 대부분 `club_members.role='운영진' AND club_id 일치` **또는** `global_admins`/`is_master()` 멤버십.

**✅ 검증 완료(안전)**:
- `club_members` UPDATE `USING(role='운영진')`, INSERT `WITH CHECK(role='운영진')` → **부원 자가 승격 불가**.
- `global_admins` INSERT 정책 없음 → **마스터 자가 등록 불가**(기본 deny).

**⚠️ 익명 전체공개(SELECT `USING(true)`) 13개 테이블**: `clubs, recruitments, club_pages, b2b_projects, post_likes, pulse_surveys`(의도된 공개) + **`club_members`(회원 PII), `sessions`(attendance_code), `attendances`, `pulse_responses`, `applications`, `events`, `projects`**(정보노출 검토 대상) → SECURITY_REVIEW.

---

## 7. 마이그레이션 → 변경 역인덱스

| 마이그레이션 | 핵심 변경 |
|--------------|-----------|
| 20260428120000_rls_policies | profiles/recruitments/recruitment_applications에 운영진·global_admin 정책 |
| 20260429100000_add_short_desc | recruitments.short_desc |
| 20260430000000_member_attendance_features | sessions.session_date + 출석/세션 정책 |
| 20260430100000_b2b_corp_dashboard | b2b_projects.deadline, required_skills |
| 20260430200000~400000_posts_* | posts.images/author/like_count, post_likes 테이블+트리거, post-images 버킷 |
| 20260512000000_club_alerts | club_alerts 테이블 |
| 20260514100000_club_registration_and_join_requests | 등록/가입 신청 2테이블 + certification-docs 버킷 |
| 20260514200000_delete_own_account | profiles.deleted_at + delete_own_account() |
| 20260515000000/100000_enterprise_homepage* | club_pages **데이터 시드**(스키마 아님) |
| 20260517000000_recruit_page_builder | clubs.recruit_page, club_reviews 테이블 |
| 20260517100000/200000 | recruitment_applications.tags, recruitments 메타 컬럼 |
| 20260517300000_email_templates | club_email_templates, application_stage_log |
| 20260517400000 / 20260518110000 | 뷰 2개 |
| 20260518000000_member_roster_expansion | profiles/club_members 컬럼 |
| 20260518100000_session_targets_and_status | session_targets, sessions/attendances 컬럼 |
| 20260518200000_promote_applicant_trigger | 합격 시 멤버 자동등록 트리거 |
| 20260518300000_club_custom_fields | 커스텀 필드 2테이블 |
| 20260519000000 | club_members 비계정 멤버 컬럼 + 세션 삭제 정책 |
| 20260519100000_club_current_generation | clubs.generations, current_generation |
| 20260520000000 / 20260521000000 | 데모 동아리 **시드**(스키마 아님) |
| 20260522000000_club_pages_bucket | club-pages 버킷 |
| 20260602000000_club_page_draft_publish | club_pages.draft |
| 20260602010000_ops_console_registration_loop | notifications 테이블, 등록 승인 RPC/트리거 |
| 20260604000000_notify_applicant_stage_move | 단계이동 알림 트리거 |
| 20260604010000_handover_club_admin | 운영진 권한 양도 RPC |
| (seed) 20260514000000_seed_dev_hustler_page | 개발용 페이지 **시드** |

---

## 8. 리뷰 메모 (db 스킬 관점)

- **🔴 인덱스 부재(원격 실측)**: 인덱스 없는 FK **21개** 확인. 특히 `club_members(user_id)`·`*(club_id)`는 RLS가 매 쿼리 조회 → seq scan. **→ `20260604050000_fk_indexes.sql`로 보강.**
- **🟠 정보 노출**: `club_members`·`sessions(attendance_code)` 등이 익명 공개(SELECT true). → SECURITY_REVIEW.
- **🟥 중복/레거시 의심**: `users`↔`profiles`, `applications`↔`b2b_applications`, `projects`↔`b2b_projects`. 사용처 확인 후 미사용 테이블 정리(DROP) 검토.
- **🟢 일관성**: `gen_random_uuid()` PK, `created_at` 표준 패턴 양호. 단 `post_likes`만 `uuid_generate_v4()` — 통일 권장.
- **base 스키마 미캡처**: repo 마이그레이션이 원격 base를 재현 못 함(remote_schema 빈 파일 + remote-only 12테이블). `supabase db pull`로 캡처 권장.
- **시드/스키마 혼재**: enterprise/seed 마이그레이션은 데이터 삽입 → 스키마와 분리(`supabase/seed.sql`) 권장.
