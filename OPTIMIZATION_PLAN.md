# 최적화 계획 (OPTIMIZATION PLAN)

> 목적: **기능은 그대로 유지**하면서 불필요한 코드를 제거하고, 거대 파일·중복·데이터 접근 분산을 정리해 유지보수 비용을 낮춘다.
> 측정 기준일: 2026-06-04 · 대상: `src/` (81파일 / 26,712줄)
> 검증 수단: `npm run lint` (tsc --noEmit). **자동 테스트 없음** → 작게 쪼개고 매 단계 검증.
> 주의: 현재 `npm run build`는 청크 렌더 단계에서 네이티브 크래시(`0xC0000409`)로 실패 — 최적화와 무관한 선재 이슈. 검증은 `lint`만 사용. (선재 lint 에러 7개 존재 → 새 에러 0개 유지 기준)

---

## 1. 현황 진단 (측정값)

| 지표 | 값 | 의미 |
|------|-----|------|
| 총 소스 | 81파일 / 26,712줄 | |
| 1,000줄+ 파일 | 6개 | 분해 필수 대상 |
| 500줄+ 파일 | ~13개 | 분해 검토 대상 |
| `supabase.from(` 호출 | 53곳 / 48파일 | 데이터 접근이 컴포넌트에 흩어짐 (데이터 계층 부재) |
| `useEffect` / loading 패턴 | 148 / 100 | fetch+로딩+에러 보일러플레이트 반복 |
| `: any` / `as any` | 134 | 타입 안전성 구멍 |
| 날짜 포맷 인라인 | 102곳 | 유틸 1개로 통합 가능 |
| 상태 뱃지 색상 맵 | 42곳 | 프리미티브 부재 |
| 인라인 버튼 className | 41곳 | 프리미티브 부재 |
| `console.*` | 18 | 디버그 잔재 |
| `ui/` 공용 프리미티브 | 5개뿐 (Button·Badge·Card·Table·EmptyState 없음) | 재사용 레이어 미비 |

**핵심 진단**: 기능 부족이 아니라 (a) 거대 파일, (b) 데이터 접근 분산, (c) 공용 컴포넌트/유틸 부재로 인한 중복 — 이 셋이 유지보수 비용의 대부분.

---

## 2. 최적화 규칙 (기준)

### A. 파일 크기
- 페이지/컴포넌트 **300줄 초과 → 분리 검토, 500줄 초과 → 분리 필수**
- 분리 단위 = "한 파일 = 한 책임" (탭 / 모달 / 리스트아이템 / 폼섹션)
- 예외: 순수 정적 데이터 파일(`infoPages.ts` 등)

### B. 중복 제거 (DRY) — "3회 규칙"
- 같은 UI/로직이 **3회 이상 반복 → 공용화**
- 누락 프리미티브를 `ui/`에 먼저 구축: `Button`, `StatusBadge`, `Card`, `EmptyState`, `Spinner`, `Table`
- 인라인 tailwind 버튼/뱃지는 프리미티브로 교체

### C. 데이터 접근 계층
- 컴포넌트에서 `supabase.from` 직접 호출 지양 → `src/api/*.ts`로 집결
- 같은 테이블 쿼리는 한 곳에서 (타입·재사용 일원화)
- fetch+loading+error 3회+ 반복 → `useXxx` 커스텀 훅

### D. 타입 안전성
- `any` 신규 금지, 기존 134개 점진 제거 → DB row 타입을 `src/types/`에 정의

### E. 공용 로직
- 날짜 포맷(102) → `formatDate()` 1개
- 상태색상(42) → `statusColor` 맵 1개

### F. 죽은 코드 / 디버그
- `console.*` 정리, 미사용 import/변수 제거 (예: `App.tsx`의 `TextPage`)

---

## 3. 규칙 위반 → 우선 분해 대상 (1,000줄+ 6개)

| 파일 | 줄 | 분해 방향(실행 시 확정) |
|------|----|------|
| `pages/admin/MembersAdmin.tsx` | 1616 | 리스트 / 멤버 상세 drawer / 필터·툴바 / 일괄작업 / 커스텀필드 + 데이터훅 |
| `components/blockKit.tsx` | 1287 | 블록 타입별 `blockKit/` 폴더로 분리(레지스트리 패턴) |
| `components/admin/recruitment/ApplicantsTab.tsx` | 1170 | 테이블 / 필터 / 지원자 drawer / 단계이동 액션 + 훅 |
| `pages/admin/FormBuilder.tsx` | 1080 | 필드 팔레트 / 필드 에디터 / 미리보기 + 훅 |
| `pages/user/MyPage.tsx` | 1038 | 프로필 / 내 동아리 / 내 지원 / 설정 탭 분리 |
| `pages/admin/RecruitAdmin.tsx` | 1011 | 공고 리스트 / 상세 / 통계 섹션 분리 |

> 500줄대 후속 대상: `Workspace.tsx`(927), `BlockPropertiesPanel.tsx`(822), `ClubRegister.tsx`(742), `ClubRecruit.tsx`(732), `RecruitPageBuilder.tsx`(661), `PostsAdmin.tsx`(644).

---

## 4. 단계별 실행 계획 (위험도 낮은 순, 매 단계 `lint`+`build` 검증)

| 단계 | 내용 | 행동변화 | 검증 |
|------|------|---------|------|
| 0. 안전망 | 현재 `npm run lint` 기준선 확보(선재 에러 7개 기록) | 없음 | 새 에러 0 |
| 1. 무위험 청소 | console 18개·미사용 import/변수·dead code 제거 | 0 | lint(새 에러 0) |
| 2. 공용 레이어 구축 | `ui/`에 Button·StatusBadge·Card·EmptyState·Spinner 추가 + `formatDate`·`statusColor` 유틸 (추가만, 교체 X) | 0 | lint(새 에러 0) |
| 3. 점진 교체 | 인라인 버튼·뱃지·날짜 → 프리미티브/유틸. 한 번에 한 파일, 스냅샷 비교 | 시각 동일 | 파일별 lint |
| 4. 데이터 계층 | `src/api/`로 supabase 쿼리 이동 + 타입화. 큰 페이지부터 | 0 | lint green |
| 5. 대형 파일 분해 | 1,000줄+ 6개 → 책임 단위 분리. 각 분리마다 동작 동일 확인 | 0 | lint + 수동 스모크 |

- 1·2단계는 거의 무위험 → 우선 진행 가능
- 3~5는 파일 단위로 끊어가며 tsc로 회귀 방지

---

## 6. 추가 최적화 관점 (시니어 30년차 관점)

> "대형 파일 분해 / 컴포넌트 재사용"은 **표면(코드 정리)** 최적화다. 아래는 그보다 레버리지가 큰 **구조·런타임·정합성** 관점이며, 모두 이 코드베이스에서 실측으로 확인된 문제다.

### P1. 서버상태 캐싱 도입 (React Query) — ★최고 레버리지
- **근거**: `useEffect` 148 + loading 상태 100 + `supabase.from` 53 = 데이터 패칭/로딩/에러를 컴포넌트마다 손으로 반복.
- **문제**: 같은 데이터를 화면마다 다시 fetch(중복요청·워터폴), 캐시 없음, 화면 이동 시 깜빡임, invalidation 수동.
- **규칙**: 서버에서 오는 데이터는 `useState+useEffect`로 직접 관리하지 않는다 → `@tanstack/react-query`로 캐싱·중복제거·로딩/에러 일원화·`invalidateQueries`.
- **효과**: 규칙 C의 "fetch 보일러플레이트"를 코드 레벨에서 근본 제거(수백 줄↓) + 체감 속도↑. **2·4단계의 토대.**

### P2. 라우트 단위 코드 스플리팅 (React.lazy) — 확인됨: 전부 eager
- **근거**: `App.tsx`가 모든 페이지를 정적 import → 26,712줄이 **단일 번들**. lazy/Suspense 미사용. (이 거대 단일 번들이 현재 build 크래시의 유력 원인 → 코드 스플리팅이 build 복구도 겸할 가능성)
- **규칙**: 라우트 컴포넌트는 `React.lazy(() => import(...))` + `<Suspense>`로 지연 로딩. 특히 `admin/`·`master/`·`corp/`는 일반 사용자가 안 봄 → 분리 이득 큼.
- **효과**: 초기 로딩(LCP) 단축, 사용자별 필요한 청크만 다운로드.

### P3. 트랜잭션·불변식을 DB로 (RPC / 제약 / RLS) — 확인됨: .rpc 3 vs 직접 mutation 98
- **근거**: 클라이언트 직접 `insert/update/delete` 98곳 vs 서버 `.rpc` 3곳. 멀티스텝 변경을 클라이언트에서 순차 `await`로 처리 → 중간 실패 시 **부분 쓰기(데이터 깨짐)**, 동시성 레이스.
- **모범 사례**: `handover_club_admin()` — 승격→강등을 한 트랜잭션으로 묶어 "운영진 0명"을 원천 차단. **이 패턴을 표준으로.**
- **규칙**:
  1. 2개 이상 테이블/행을 함께 바꾸는 변경은 **RPC(트랜잭션)**로 (원자성).
  2. 비즈니스 불변식("운영진 ≥ 1", "정원 초과 금지" 등)은 앱 코드가 아니라 **DB 제약/트리거**로 강제.
  3. 권한 경계는 클라이언트 분기가 아니라 **RLS**가 최종 책임.
- **효과**: 정합성·보안을 앱 곳곳의 if문이 아니라 DB 한 곳에서 보장.

### P4. DB 타입 자동생성으로 `any` 박멸 (supabase gen types) — 확인됨: 자동생성 없음
- **근거**: `: any`/`as any` 134개. `src/types`엔 수동 `recruitment.ts` 하나뿐, DB 스키마 `Database` 타입 없음 → DB 응답이 사실상 무타입.
- **규칙**: 스키마 → 타입을 **수동 작성하지 않는다**. `supabase gen types typescript`로 생성한 `Database` 타입을 단일 진실원천으로, 쿼리 응답에 자동 타입 적용.
- **효과**: 규칙 D(any 제거)를 손이 아니라 **스키마 변경마다 자동 동기화**. 컬럼명 오타·표류를 컴파일 타임에 차단.

### P5. 에러 경계 & 관찰가능성 — 확인됨: Sentry init O, ErrorBoundary X
- **근거**: `main.tsx`에 Sentry는 초기화됐으나 React `ErrorBoundary` 미사용 → **한 화면 렌더 크래시가 앱 전체 화이트스크린**. `console.*` 18개는 Sentry로 안 흘러감.
- **규칙**:
  1. 라우트/주요 구역을 `Sentry.ErrorBoundary`(fallback UI)로 감싼다.
  2. 에러를 `catch`해서 **삼키지 않는다** → 사용자에겐 토스트, 시스템엔 Sentry 리포트.
  3. `console.error` 대신 구조화 로깅/리포팅으로.
- **효과**: 장애가 화이트스크린이 아니라 격리된 fallback + 추적 가능한 리포트로.

> **권장 우선순위**: P4(타입 자동생성)·P1(React Query)는 이후 모든 작업의 **토대** → 2단계 직후 도입. P2·P5는 독립적이라 언제든. P3는 대형 파일 분해(5단계)와 함께 데이터 로직을 RPC로 끌어내릴 때 같이.

---

## 7. 진행 메모
- **[Phase 1 완료]** 디버그 `console.log` 10개 제거(진단용 `console.error`/`console.warn` 8개는 P5에서 Sentry로 라우팅 예정이라 유지) · 죽은 `TextPage` import 제거 · 선재 타입에러 7개 수정(Corp/ClubSetup/FeedbackAdmin 배열캐스트, Stories `.catch` 오용) → **lint 0 에러(green 기준선 확보)**.
- **[Phase 2 완료]** `src/lib/format.ts`(formatDate, 3 preset)·`src/lib/statusColor.ts`(상태→Tailwind 리터럴 클래스 맵) 유틸 + `src/components/ui/`에 Button·StatusBadge·Card·EmptyState·Spinner 프리미티브 추가(교체 없이 추가만). ※Tailwind v4 JIT는 동적 클래스 스캔 불가 → statusColor는 리터럴 전체 클래스로 보관.
- **[Phase 3a 완료]** 날짜 인라인 ~25곳 → `formatDate()` 교체(16개 파일). ko-KR에서 `month:'long'==short`라 medium preset과 동일 출력인 곳까지 포함. **남긴 것**: hour/minute 포함·`year+month`만 있는 포맷(프리셋 미존재), 그리고 파일 내 자체 상대시간 helper(`Stories`/`ClubStories`/`StoryDetail`의 로컬 `formatDate`, `MyPage.notifTimeAgo`)는 이름충돌·관심사 상이로 유지.
- **[Phase 3b 보류]** 상태색상 맵 40여 곳은 파일마다 **색/명도가 제각각**(예: `거절`이 한 곳은 gray-600, statusColor 맵은 red / `검토중`이 yellow vs blue)이라 일괄 교체 시 시각이 바뀜 → "시각 동일" 위반. `statusColor`/`StatusBadge`는 신규 코드용으로만 두고, 기존 맵은 손대지 않음.
- 마이그레이션(`supabase/migrations/`)은 별도 SQL 작업과 병렬 진행 중 → 본 계획에서 제외(손대지 않음).
- 측정 명령(재측정용):
  - 큰 파일: `find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head`
  - any: `grep -rn ": any\|as any" src | wc -l`
  - supabase 직접호출: `grep -rn "supabase.from(" src | wc -l`
