# 보안 점검 보고서 (Security Review)

> 작성: CSO 관점 / OWASP Top 10 + STRIDE 기반 · 검토일 2026-06-04
> 대상: OurClub 전체 코드베이스 (React + Supabase) · 중점: **사용자별 권한(Authorization)**
> 검증 수단: 소스/마이그레이션 정적 분석 **+ 원격 DB 카탈로그 직접 점검(2026-06-04 완료)**.

---

## 0. 요약 (Executive Summary)

**전반 등급: ✅ 양호 (권한 모델은 견고)** — 원격 점검 결과 **이전 Critical 2건(자가 승격·마스터 자가등록)은 DB에서 차단 확인**. **정보 노출(Info Disclosure, Medium)도 2026-06-23 probe로 차단 확인**(핵심 3테이블 anon=`[]`). 남은 이슈는 레거시 테이블 정리·rate limit·로깅 보강(Medium 이하).

| 영역 | 상태 |
|------|------|
| 시크릿/키 관리 | ✅ 양호 (anon 키만 클라이언트, service_role 노출 없음, `.env` 미추적) |
| 권한 모델 설계 | ✅ 양호 (클럽 단위 RLS + `global_admins` 멤버십, `role` 자가편집 불가) |
| RPC 함수 호출자 검증 | ✅ 양호 (`handover`·`approve_club_registration` 모두 권한 체크) |
| XSS 방어 | ✅ 양호 (richtext=DOMPurify, markdown=escapeHtml 선처리) |
| **RLS 적용** | ✅ **검증 완료** (public 34개 테이블 전부 RLS ON, 권한상승 차단 확인 → §1) |
| **정보 노출** | ✅ **차단 확인** (`club_members`·`sessions.attendance_code`·`attendances` anon=`[]` → §1b · 레거시 테이블만 잔여) |
| Rate limit / DoS | 📋 미비 |
| 로깅/모니터링 | 📋 부분 (Sentry 있으나 일부 누락) |

---

## 1. ✅ 검증 완료 — 권한 상승 차단 확인 (이전 Critical 해소)

> 2026-06-04 원격 카탈로그(`pg_policy`/`pg_class`) 직접 조회로 확정. 이전 판본에서 "검증 불가"로 표기했던 Critical 2건은 **DB가 올바르게 막고 있음**.

**근거 (실제 정책)**
- `club_members` **UPDATE** `USING (EXISTS … cm.user_id=auth.uid() AND cm.role='운영진')` → 부원은 자기 행을 수정 못 함. **자가 승격 불가** ✅
- `club_members` **INSERT** `WITH CHECK (… cm.role='운영진')` → 운영진만 멤버 추가. **자가 운영진 등록 불가** ✅
- `global_admins` 정책은 **SELECT(본인만)뿐, INSERT/UPDATE/DELETE 정책 없음** → RLS 기본 deny로 **마스터 자가등록 불가** ✅
- public 테이블 **34개 전부 RLS ON** (`relrowsecurity=false` 0개).

**남은 경미 사항**
- `club_members` UPDATE 정책에 `WITH CHECK` 없음 → 운영진이 멤버를 다른 `club_id`로 옮기는 등의 엣지 변경 가능(클럽 내 신뢰 주체라 Low). `WITH CHECK` 추가 권장.

---

## 1b. ⚠️ Medium — 정보 노출 (Information Disclosure): 익명 전체공개 테이블

> ✅ **[차단 확인 — 2026-06-23]** `scripts/verify_rls.sh`(anon 키 probe) 실행 결과 **`club_members`·`sessions.attendance_code`·`attendances` 모두 `[]` 반환(차단됨)**, `clubs`는 공개 유지. 세 테이블엔 시드 회원 데이터가 존재하므로 `[]` = **제한 SELECT 정책이 라이브로 작동 중**이라는 확정 증거(과거의 `USING(true)` 상태가 아님). 의도한 보안 목표(익명 노출 차단)는 **달성된 상태**.
>
> 정책 정의는 `supabase/migrations/20260623000000_security_restrict_anon_reads.sql`(SECURITY DEFINER 헬퍼 `app_is_club_member`/`app_is_club_admin`/`app_is_global_admin` + 스코프 SELECT 3종 + club_members UPDATE WITH CHECK 보강)에 문서화. 적용은 대시보드 SQL 에디터 경유로 추정(원격 `schema_migrations` 추적 테이블이 비어 있어 CLI `db push` 이력과 desync).
>
> **⚠️ 운영 주의:** 원격 마이그레이션 이력이 비어 있어 `supabase db push` 시 전체 재적용을 시도 → **금지**. 향후 CLI 적용 전 `supabase migration repair --status applied <version>...` 로 이력을 먼저 정합화할 것.
>
> **남은 작업:** ① 인증 사용자(부원/운영진)의 정상 조회·학생 코드 체크인이 회귀 없는지 1회 확인(probe는 anon만 검증). ② `pulse_responses`는 데이터 없음(현재 안전). ③ `applications/events/projects` 레거시 미사용 시 DROP — 미처리.

**근거(과거)**: 본래 SELECT 정책이 `USING (true)`라 로그인 없이(anon 키) 전체 조회가 가능했던 것으로 보고됨. **현재는 위 probe로 차단 확인됨.**

| 테이블 | 노출 | 비고 |
|--------|------|------|
| **`club_members`** | `user_id, role, display_name, display_university, position` 등 **회원 명단 PII** | 🟠 명단이 인터넷에 공개 |
| **`sessions`** | **`attendance_code`(출석 코드)** 전체 | 🟠 비회원이 출석 코드 취득 → 출석 무결성 |
| `attendances` | 출석 기록 전체 | 🟡 |
| `pulse_responses` | 설문 응답(score, feedback) | 🟡 익명 설문이면 부적절 |
| `applications`, `events`, `projects` | 전체 조회 + 일부 INSERT `true` | 🟡 레거시 테이블 — 사용 안 하면 제거 |

> 의도된 공개로 판단: `clubs, recruitments, club_pages, b2b_projects, post_likes, pulse_surveys`.

**공격 시나리오**: 공격자가 anon 키(프론트에 공개)로 `GET /rest/v1/club_members?select=*` → 전 동아리 회원 명단 수집. `sessions?select=attendance_code` → 출석 코드 수집 후 비회원 출석.

**조치 (기능 영향 검토 후 마이그레이션)**:
- `club_members` SELECT를 **"같은 동아리 구성원 또는 운영진/마스터"**로 제한. (공개 명단이 필요한 화면이 있으면 공개용 뷰로 컬럼 최소화 노출)
- `sessions` SELECT에서 `attendance_code`를 일반 조회에서 제외(별도 컬럼 RLS 또는 뷰 분리), 또는 출석 시점에만 RPC로 검증.
- `applications/events/projects` 미사용이면 **DROP**, 사용 중이면 정책 조임.

---

## 2. 📋 설계 노트 — 클라이언트 가드는 UI 전용, 실제 경계는 RLS

**현황 (원격 검증 후 재평가 — 위험도 하향)**
- 라우트 가드 `isMaster`/`isAdmin`(`App.tsx`)은 **화면 라우팅만** 제어. 데이터 접근은 RLS가 책임.
- 클라이언트 직접 `insert/update/delete` **98곳**이 RLS에 의존 → **RLS가 전 테이블 ON으로 확인되어(§1) 경계는 유효**. 쓰기 정책도 운영진/본인 스코프로 걸려 있음.

**남은 권고 (정보노출 §1b 제외)**
- **쓰기 정책 일부 `WITH CHECK` 보강**: `club_members` UPDATE 등 `WITH CHECK` 없는 정책은 변경 후 상태를 재검증하지 않음 → 추가 권장.
- 2개 이상 행/테이블을 함께 바꾸는 민감 변경(승격·승인·정산)은 클라이언트 직접 mutation 대신 **RPC(SECURITY DEFINER + 호출자 검증)**로 이전 — `handover_club_admin` 패턴을 표준으로.

---

## 3. 📋 Medium

### M1. Rate limiting / brute-force / DoS 방어 부재 — OWASP A04/A07
- 공개 엔드포인트(동아리 지원 `ClubApply`, 가입신청, 로그인)에 앱레벨 rate limit 없음. 자동화 스팸 지원·무차별 로그인 시도 가능.
- 조치: Supabase Auth의 로그인 시도 제한 확인 + 공개 폼에 캡차/서버측 throttle(Edge Function) 도입 검토.

### M2. 로깅/모니터링 부분적 — OWASP A09
- Sentry는 `main.tsx`에서 초기화됨(✅). 그러나 React `ErrorBoundary` 미사용 → 렌더 크래시가 화이트스크린.
- `console.*` 18곳 — 민감정보(사용자/동아리 식별자) 콘솔 노출 가능, Sentry로 미연동.
- 조치: 주요 라우트 `Sentry.ErrorBoundary` 래핑, `console.error` → 구조화 리포팅, 민감정보 로깅 점검.

### M3. 감사 추적(Repudiation) 부분적
- `application_stage_log`, `reviewed_by` 등 일부 감사 컬럼 존재(✅). 그러나 권한 변경(운영진 양도·승격)에 대한 일관된 감사 로그는 미확인.
- 조치: `handover_club_admin`·승격·동아리 승인에 actor/시각 기록 표준화.

---

## 4. STRIDE 분석

| 위협 | 시나리오 | 위험도 | 대응 |
|------|----------|--------|------|
| **S**poofing | anon 키는 공개값 — 신원은 JWT(`auth.uid()`)로만 결정 | Low | RLS가 `auth.uid()` 기반이면 OK (✅ 패턴 확인됨) |
| **T**ampering | 클라이언트가 `club_members.role` 직접 변조 | **High** | §1 — RLS `with_check`로 role 자가변경 차단 |
| **R**epudiation | 운영진 권한 변경 부인 | Medium | M3 — 감사 로그 표준화 |
| **I**nfo Disclosure | 타 동아리 멤버/지원자 프로필 조회(IDOR) | **High** | RLS가 `club_id` 스코프인지 전수 확인(정책은 club_id join 사용 — ✅ 설계는 양호) |
| **D**oS | 공개 지원/로그인 폼 자동화 남용 | Medium | M1 — rate limit/캡차 |
| **E**levation | `global_admins` 자가 INSERT로 마스터 승격 | **Critical** | §1 — INSERT deny 확인 |

---

## 5. 🛡 위협 모델 / 데이터 흐름

```
[브라우저 / 공격자]
   │  anon 키(공개) + 사용자 JWT
   │  ※ 98곳의 직접 insert/update/delete가 이 경로로 나감
   ▼  TLS (Supabase 관리: ✅)
[Supabase PostgREST]
   │  ◀── 유일한 권한 경계 = RLS  ★여기가 뚫리면 끝 (§1)
   │      - auth.uid() 기반 (✅)
   │      - club_id 스코프 (✅ 설계)
   │      - club_members RLS = repo서 검증불가 (🚨)
   ▼
[PostgreSQL]
   │  RPC(SECURITY DEFINER): handover/approve = 호출자 검증 O (✅)
   │  base 스키마 RLS = 버전관리 밖 (🚨 감사 불가)
   ▼
[Storage: club_pages 버킷]  ← 버킷 정책 별도 확인 권장
```

---

## 6. ✅ 잘 되어 있는 것 / False Positives (다음 리뷰서 제외)

**견고한 부분**
- 클라이언트는 **anon 키만** 사용, `service_role` 키 소스 노출 없음. `.env` git 미추적(`.env.example`만 추적).
- 마스터 권한이 `profiles`의 자가편집 컬럼이 아니라 **별도 `global_admins` 테이블 멤버십** — 권한상승 표면을 줄인 좋은 설계.
- RPC 함수 호출자 검증 양호: `handover_club_admin`(운영진 확인), `approve_club_registration`(`global_admins` 확인 후 `RAISE EXCEPTION '권한이 없습니다'`).
- RLS 정책이 **클럽 단위(`club_id` join)**로 스코프됨 → 운영진 A가 동아리 B 데이터에 접근 불가(IDOR 방어 설계).

**오탐(검토했으나 위험 아님)**
- `dangerouslySetInnerHTML` 7곳 중 5곳(`ClubPageRenderer`, `Workspace`, `B2BLounge`, `ClubDemoPage`, `Home`)은 **정적 CSS 상수 `<style>` 주입** — 사용자 입력 아님.
- `blockKit.tsx`의 richtext 출력은 **DOMPurify.sanitize** 적용.
- `MarkdownViewer`의 `parseMarkdown`은 **`escapeHtml` 선처리 후** 마크다운 변환 → 원시 HTML 차단(저장형 XSS 아님).
- `post_likes` SELECT `USING (true)` — 좋아요 수 공개는 의도된 설계로 판단(Low, 수용 가능).

---

## 7. 권고 우선순위 & 회귀 방지

| 순위 | 조치 | 이유 |
|------|------|------|
| 1 | **라이브 DB에서 §1 SQL 실행** → `club_members`/`global_admins`/`profiles` RLS·정책 확인 | 전체 보안의 단일 실패점. 5분이면 안전/위험 판명 |
| 2 | `supabase db pull`로 **base 스키마를 repo에 캡처** | RLS를 PR에서 검증 가능하게 — 모든 후속 보안의 전제 |
| 3 | 쓰기 대상 전 테이블 RLS 커버리지 전수표 작성 | §2 — 98개 직접 mutation의 실제 방어선 확인 |
| 4 | 민감 멀티스텝 변경을 RPC로 이전 + 감사 로그 | §2·M3 |
| 5 | `Sentry.ErrorBoundary` + console 정리 + rate limit | M1·M2 |

**CI/회귀 방지**
- DB 스키마/정책을 repo로 관리한 뒤, PR에서 RLS 변경을 필수 리뷰 대상으로 지정.
- 권한 우회 시나리오(자가 운영진 승격, 타 동아리 데이터 접근)를 **통합 테스트로 고정**(anon 키로 차단되는지 자동 검증).

---

## 부록: 사용자별 권한 모델 (현재 파악된 구조)

| 역할 | 결정 방식 | 권한 범위 |
|------|----------|-----------|
| 익명 | JWT 없음 | 공개 페이지 조회 |
| 인증 사용자 | `auth.uid()` | 본인 프로필/지원/알림 |
| 부원 | `club_members.role = '부원'` | 소속 동아리 일반 기능 |
| 운영진 | `club_members.role = '운영진'` (클럽별) | 해당 동아리 관리(지원자/멤버/세션/모집) |
| 마스터 | `global_admins` 멤버십 | 전체 동아리·등록 승인 |
| 기업(corp) | corp 컨텍스트 | B2B 영역 |

> 설계상 운영진 권한은 **클럽 단위로 격리**되어 있어 횡적 권한확대가 제한됨(양호). 핵심 리스크는 "이 모델을 강제하는 RLS가 실제 DB에 올바르게 존재하는가"이며, 그 검증이 §1.
