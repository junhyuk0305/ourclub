# 페르소나별 서비스 여정 감사 & 개선 계획 (JOURNEY_AUDIT)

작성: 2026-06-23 · 범위: 6개 페르소나 여정의 문제·누락 CTA·안내문구·예외상황 도출 및 개선.

라우팅 게이트(App.tsx): `RequireAuth`(로그인) / `ProtectedRoute`(로그인+프로필완성) / `AdminRoute`(운영진) / `CorpRoute` / `MasterRoute`.
참고: `STORY_ENABLED=false`(스토리 기능 전체 숨김), `/club-register`·`/club-setup`은 `ProtectedRoute`로 보호됨(비로그인 자동 차단).

---

## 1. 페르소나별 진단 요약

### ① 비로그인 방문자
- 로그인 필요 액션이 *왜* 막히는지 안내 없이 `/login`으로 튕김 (Clubs 찜하기 `Clubs.tsx:63` 무안내 리다이렉트).
- ClubDetail 모집 없음/마감 시 CTA가 `pointer-events-none` dead-end (`ClubDetail.tsx:381-390`) — "모집 마감"만 표시, 채용 페이지·관심등록으로 갈 길 없음.
- B2BLounge 수주 제안/기업 등록이 무안내 `/login` 리다이렉트 (`B2BLounge.tsx:310-320`), 검색결과 0건 시 필터 초기화 부재 (`386-393`).
- (정상) ClubRecruit 관심등록·후기 작성은 이미 토스트/모달 안내 처리됨.

### ② 로그인(동아리 미소속)
- `/mypage` 기본 탭이 "지원 내역(빈 상태)" — 단 빈 상태에 `/clubs` CTA 있음(`ApplicationsSection.tsx:44`), RoleNudge 배너가 `/club-setup` 안내(`RoleNudgeBanner.tsx:48`). 막다른 길은 아니나 발견성 낮음.
- 프로필 게이트(`/profile-setup`) 강제 리다이렉트 시 "왜 왔는지" 맥락 부족(`ProfileSetup.tsx`).

### ③ 동아리 등록
- **거절(반려) 상태 미처리**: ClubSetup이 `검토대기/검토중/보완요청`만 조회(`ClubSetup.tsx:53`) → 거절자는 사유도 못 보고 분기 선택 화면으로 떨어짐.
- 파일 업로드 크기/형식 검증 부재(`ClubRegister.tsx:234-242`), 실패 시 일반 메시지.
- (정상) 중복 신청 차단·보완요청 재제출·임시저장 복원은 구현됨.

### ④ 동아리 지원 (예외 최다)
- **(정합성) 폼 작성 중 마감되어도 제출 직전 재확인 없음** — `isExpired`는 렌더 시점만 계산(`ClubApply.tsx:244`), `handleSubmit`은 마감 재확인 안 함 → 마감 모집 지원 성립 가능.
- **이미 부원인데 지원 가능** — 멤버십 체크 없음(`ClubApply.tsx:88-94`).
- (정상) 비로그인/프로필게이트 차단, 중복 방지(클라+UNIQUE 23505), 거짓 성공 방지, 임시저장 status='임시저장' 차단은 모두 구현됨.
- 합격/불합격 통보가 알림 탭 진입에 의존(푸시 없음) → Tier 3.

### ⑤ 동아리 일반 부원
- **동아리 단위 탈퇴 없음**(전체 계정 탈퇴만, `MyPage.tsx:125`) → Tier 3.
- **운영진 연락 채널 전무** → Tier 3.
- 강퇴(활동정지) 시 알림·사유 없음 → Tier 3.
- 출석 세션 0건 안내 모호(세션 미생성 vs 미관리 구분 불가).

### ⑥ 동아리 운영진
- 신규 0건 온보딩 순서 가이드 부재.
- 합격자 일괄처리·통보 약함, 출석 대상 매번 수동 지정 → Tier 3.
- 일반부원 admin URL 접근 시 안내 없이 `/club-setup` 리다이렉트(라우트 가드는 정상, `App.tsx:106`).
- 정정: `DashboardAdmin`의 `/admin/form-builder` CTA는 404가 아님 — `App.tsx:203`에서 `/admin/recruitments`로 리다이렉트됨(다만 간접 경로).

---

## 2. 구현 범위 (사용자 승인: Tier 1 + Tier 2)

### Tier 1 — 프론트 카피·CTA·빈상태 (무백엔드, 저위험)
1. **Clubs 찜하기**: `login_required` 시 무안내 리다이렉트 → 안내 토스트("관심 등록은 로그인 후 이용할 수 있어요"). `Clubs.tsx`
2. **ClubDetail 모집 없음/마감**: dead-end `pointer-events-none` → 채용 페이지로 가는 활성 링크("채용 페이지 보기")로 변경. `ClubDetail.tsx`
3. **B2BLounge**: (a) 검색/필터 0건 시 "필터 초기화" 버튼, (b) 수주 제안 비로그인 시 안내 토스트 후 로그인 이동. `B2BLounge.tsx`

### Tier 2 — 정합성·예외 처리
4. **ClubApply 제출 직전 마감 재확인**: `handleSubmit`에서 `deadline < now`면 차단+토스트. `ClubApply.tsx`
5. **ClubApply 이미 부원 차단**: 활동중 부원이면 지원 폼 대신 안내 화면. `ClubApply.tsx`
6. **ClubSetup 거절 상태 안내**: 최근 거절 신청이 있으면 분기 선택 화면에 사유 배너 + 재신청 유도. `ClubSetup.tsx`
7. **ClubRegister 파일 검증**: 업로드 전 10MB 초과 차단 + 명확한 메시지. `ClubRegister.tsx`
8. **ProfileSetup 진입 사유 안내**: `from`이 있으면 "계속하려면 먼저 프로필을 완성해주세요" 한 줄 추가. `ProfileSetup.tsx`

검증: `tsc` 타입체크 통과(빌드는 프로젝트 관례상 별도).

---

## 3. Tier 3 — 후속 대형 기능 (백엔드/제품 결정 필요, 미착수)

우선순위(사용자 지정): **① 합격/불합격 통보 강화, ② 동아리 단위 탈퇴**.

- **합격/불합격 통보 강화** — ✅ **부분 구현 (2026-06-24, feat6)**. 코드 실측 결과 감사 주장 일부 정정:
  - 인앱 알림 인프라(`notifications` + 헤더 알림벨 unread 점)는 이미 존재. **합격은 이미 보장**(`promote_applicant_to_member` 가 최종합격 시 토글 무관 'membership' 알림).
  - **갭: 불합격 고스팅** — `notify_applicant_stage_move` 가 `email_sent=true`("알림 보내고 이동")일 때만 발송 → '알림 없이 이동'으로 불합격(탈락/거절 키워드 단계) 처리 시 지원자가 결과를 영영 모름.
  - **수정**: [20260624010000_guarantee_reject_notification.sql](supabase/migrations/20260624010000_guarantee_reject_notification.sql) — 통지 조건을 `email_sent` OR `불합격 키워드 단계`로 확장(함수 본문만 교체, 무중복·멱등). UI([EmailMoveModal](src/components/admin/recruitment/applicants/EmailMoveModal.tsx))는 불합격 단계에서 '알림 없이 이동' → '기본 메시지로 통보'로 정직화.
  - **범위 외(별도 결정)**: 이메일/푸시 **자동 발송** — 외부 인프라(메일 프로바이더·시크릿·엣지펑션) 부재로 surgical 변경 불가. 추후 `application_stage_log`(email_subject/body 저장됨)를 소스로 엣지펑션 추가 시 활용.
- **동아리 단위 탈퇴** — ✅ **구현 (2026-06-24, feat6)**. 위계·책임 구조를 코드로 정리한 뒤 그 불변식 위에 얹음:
  - **권한 위계**: `role`(운영진/부원, 이진) × `status`(활동중/수료/탈퇴/활동정지). 워크스페이스는 `운영진 AND 활동중`만(`AdminRoute`). 운영진은 운영진끼리만 늘림(`club_join_requests`/등록승인), 권한은 양도(`handover_club_admin`)로 이동.
  - **불변식(기존 트리거 재사용)**: `prevent_last_admin_removal` 이 "동아리당 활동중 운영진 ≥ 1"을 보장 → **마지막 운영진은 양도 전엔 못 나감**(동아리 고아화 방지 = 책임 앵커).
  - **수정**: RPC [20260624020000_leave_club.sql](supabase/migrations/20260624020000_leave_club.sql) — 본인 활동중 멤버십만 `탈퇴`로(SECURITY DEFINER, 새 RLS 불필요, 트리거가 단독운영진 차단). UI [MembershipHistorySection](src/pages/user/sections/MembershipHistorySection.tsx) — 활동중 멤버십에 '나가기' + 확인 모달, 단독 운영진은 트리거 메시지 노출로 양도 유도.
  - 데이터 손실 없음(상태만 전환, 재합격 시 `탈퇴→활동중` 복귀 기구현). 단독운영진 동아리 폐쇄 경로는 범위 외(별도 작업).
- 운영진↔부원 문의 채널(신규 테이블·RLS·UI).
- 강퇴(활동정지) 알림+사유+이의제기 경로.
- 운영진 신규 0건 온보딩 체크리스트, 합격자 일괄처리, 출석 대상 명단 재사용.

각 항목은 마이그레이션·RLS·RPC 설계가 선행되어야 하며 별도 작업으로 분리.

---

# 2차 감사 (2026-06-24) — 신규 페르소나 발굴 + 기존 6개 재감사

작성: 2026-06-24 · 범위: 1차 6개 페르소나 *외* 2개 페르소나 추가 발굴(⑦기업·⑧마스터) + 기존 6개 페르소나가 1차에서 놓친 문제 재탐색.
방법: 코드 실측(Explore 3-fan-out) 후 모든 주장 직접 검증 — 거짓양성 다수 제거.

## 4. 신규 페르소나

### ⑦ 기업(B2B) 사용자 — *1차 미감사, 신규*
가입(`/corp/register`) → 마스터 승인 → 비즈니스 센터(`/corp/*`) → B2B 라운지(`/b2b`)에서 동아리 탐색·수주 제안. CorpRoute 가드(`App.tsx:121`).

- **(T1·확인됨) 사이드바 죽은 메뉴**: `CorpSidebar.tsx:11,13`의 `초대한 행사`(/corp/events)·`기업/결제 설정`(/corp/settings)은 라우트가 없어 `App.tsx:236` catch-all로 **조용히 대시보드로 튕김**. 클릭해도 같은 화면 → 혼란.
- **(T1·확인됨) B2B 라운지 기업 CTA 오라우팅**: `B2BLounge.tsx:322` `handleCorpAction`이 로그인했으면 무조건 `/corp/dashboard`로 보냄 → 기업담당자 아닌 일반 로그인 유저는 CorpRoute가 **안내 없이 `/login`으로 튕김**(이미 로그인했는데도).
- **(T2·확인됨) 거절(`거절`) 신청자 막다른 길**: `CorpRegister.tsx:22,52`의 `IN_PROGRESS=['검토대기','검토중','보완요청']`에 `거절`이 없어, 거절된 신청자는 `.in(status, IN_PROGRESS)`가 null → **빈 신규 폼**으로 떨어짐. 거절 사유(`reviewer_note`)·재신청 안내 전무. (③ ClubSetup 거절 배너와 동일 패턴인데 기업 흐름만 누락.)
- **(거짓양성 정정)** 사업자등록증 파일 검증 *있음* — `CorpRegister.tsx:269` DocUpload가 10MB 차단. 1차 Explore 주장(검증 부재)은 오류.
- **(T3·제품결정) 미구현 기능**: `/corp/settings`(담당자/결제), `/corp/events`(행사 초대), 크레딧 충전 플로우, 기업 다중 담당자 권한. → 백로그.
- **(T2·제품결정) CorpContext 마스터 혼선**: 마스터가 `/corp` 접근 시 임의 기업으로 초기화(`CorpContext`). 역할 분리 필요. → 백로그.

### ⑧ 마스터(플랫폼 운영자) — *1차 미감사, 신규*
`/master` 대시보드: 동아리 등록 심사(Registrations) · 운영진 합류 심사(JoinRequests) · 기업 심사(CorpRequests) · 동아리/인증 관리(ClubsAdmin). MasterRoute 가드(`App.tsx:112`).

- **(T1/T2·확인됨) 인증 토글 무피드백 + 에러 묵살**: `ClubsAdmin.tsx:40` `toggleCert`는 성공 시 토스트 없음, **에러 시 `if(!error)`로 조용히 무시**(UI·서버 불일치, 새로고침해야 진실 확인). 인증 *해제* 같은 신뢰도 영향 액션에 confirm 없음.
- **(T3·확인됨) 합류 거절 사유 입력·전달 불가**: `JoinRequests.tsx:90`은 거절 시 사유 입력 UI 없음. `club_join_requests`에 **`reviewer_note` 컬럼 자체가 없음**(마이그레이션 `20260514100000` 확인 — 등록요청에만 존재). 신청자는 거절 인앱 알림(`notify_join_decision`)은 받지만 **사유는 영영 모름**. → 마이그레이션(컬럼 추가) + 양쪽 UI 필요.
- **(T2·확인됨) 합류 심사 비원자성·중복미방지**: `JoinRequests.tsx:64`는 `club_members` raw INSERT + 신청서 UPDATE를 분리 실행(트랜잭션 아님, 중복 가드 없음). **운영진 화면(`MembersAdmin.tsx:295`)은 이미 원자 RPC `decide_club_join_request`를 사용** — 마스터 흐름만 구버전. → RPC 재사용으로 통일 권장.
- **(T2·제품결정) CorpRequests 상태 흐름 모호**: `CorpRequests.tsx`에서 `거절` 상태인데도 `최종 승인` 버튼이 공존 → 일방통행 상태머신 필요.
- **(T3) 마스터 권한 캐싱**: `MasterRoute`는 `isMaster`만, AuthContext가 세션 재개 시 재조회 안 함 → 권한 회수 즉시 미반영. → heartbeat/RLS 이중방어.

## 5. 기존 6개 페르소나 재감사 — 결론: 대부분 이미 견고

1차 Tier1+2 구현(커밋됨) 이후 재탐색. Explore가 제기한 항목을 **전수 코드 검증**한 결과 **대부분 거짓양성**(이미 처리됨):

| 재감사 주장 | 검증 결과 |
|---|---|
| Clubs 로드 실패 UI 미렌더 | ❌ 거짓 — `Clubs.tsx:283`에서 error 렌더됨 |
| ClubApply 부원 차단 화면 없음 | ❌ 거짓 — `ClubApply.tsx:237` 구현됨 |
| ClubSetup 거절 배너 없음 | ❌ 거짓 — `ClubSetup.tsx:240` 구현됨 |
| ClubApply 마감 재확인 없음 | ❌ 거짓 — handleSubmit 재확인 구현됨 |
| ClubRegister 파일 검증 없음 | ❌ 거짓 — 10MB 차단 구현됨 |
| AttendanceSection 성공 메시지 리셋 불완전 | ❌ 거짓 — `:174` 입력 변경 시 msg 클리어 |
| AttendanceList 세션 0건 안내 없음 | ❌ 거짓 — `:166` 미생성/필터0건 구분 안내 |
| MembersAdmin 부원 0건 안내 없음 | ❌ 거짓 — `:1003` "아직 등록된 부원이 없습니다" |
| RecruitmentsList 마감일 검증 없음 | ⚠️ 비해당 — 생성은 `임시저장` 초안, 발행 전 설정 |

**잔여 진짜 갭(저가치, 백로그)**: NotificationsSection 쿼리 실패 시 빈 상태로 degrade(에러 구분 없음, `:46`) — 발생 드물고 degrade 허용 가능 → T3.

→ **결론: 1차 감사 대상(6개 페르소나)은 충분히 정돈됨. 2차의 실질 가치는 신규 페르소나 ⑦⑧에 집중.**

## 6. 2차 구현 범위 (Tier1 + 저위험 Tier2, 무마이그레이션)

1. **⑦ CorpSidebar 죽은 메뉴 정직화** — `/corp/events`·`/corp/settings`를 `준비중` 비활성 표시(조용한 튕김 제거). `CorpSidebar.tsx`
2. **⑦ B2BLounge 기업 CTA 라우팅** — 로그인 유저는 `/corp/register`로(등록페이지가 상태별 자동 분기: 기업→대시보드/심사중→대기/그외→폼). `B2BLounge.tsx`
3. **⑦ CorpRegister 거절 안내** — `거절` 상태 조회 추가, 사유(reviewer_note) 표시 + 재신청 버튼. `CorpRegister.tsx`
4. **⑧ ClubsAdmin 인증 토글** — 성공/실패 토스트 + 인증 해제 시 confirm. `ClubsAdmin.tsx`

검증: `tsc` 타입체크 통과.

### Tier 3 백로그 (2차 발굴 · 마이그레이션/제품결정 선행)
- ⑧ 합류 거절 사유: `club_join_requests.reviewer_note` 컬럼 추가 + JoinRequests 입력 UI + 신청자 알림/마이페이지 표시.
- ⑧ 합류 심사 RPC 통일: master/JoinRequests → 기존 `decide_club_join_request` RPC 재사용(원자성·중복가드).
- ⑧ CorpRequests 일방통행 상태머신, 마스터 권한 heartbeat.
- ⑦ /corp/settings·/corp/events·결제·다중담당자, CorpContext 마스터 역할 분리.

---

## 7. 3차 심화 재감사 (2026-06-24) — 기존 6개에서 *놓친* 깊은 결함

지시: "없는 걸 지어내지 말고, 기존 6개 페르소나에서 1차가 *실제로 놓친* 부분을 다시 파라." → 표면(CTA·빈상태)이 아닌 **반쪽 구현·백엔드↔프론트 계약 불일치·DB 불변식 에러의 UX**를 코드 실측으로 추적. 모든 항목 검증 완료.

### ⑤ 일반 부원 — **동아리 단위 탈퇴 UI가 반쪽 구현 → 완전 작동 불가 (HIGH·확인됨)**
원래 Tier3 우선순위 ②였고 "미착수"로 적혀 있었으나, 실측 결과 **백엔드는 이미 배포됨**:
- `leave_club(p_club_id)` RPC([20260624020000_leave_club.sql](supabase/migrations/20260624020000_leave_club.sql)) — 본인 활동중 멤버십을 '탈퇴'로.
- `prevent_last_admin_removal` 트리거([20260623040000_protect_last_admin.sql](supabase/migrations/20260623040000_protect_last_admin.sql)) — 마지막 활동중 운영진의 탈퇴/강등/계정삭제로 동아리가 '운영진 0명' 고아화되는 것을 차단.

그런데 프론트([MembershipHistorySection.tsx](src/pages/user/sections/MembershipHistorySection.tsx))가 **반쪽**:
- `confirmLeave`가 `leave_club({ p_club_id: leaving.club_id })` 호출(`:58`)하는데 **SELECT(`:44`)가 `club_id`를 안 가져옴** → 항상 `undefined`로 호출 → 실패.
- **'나가기' 버튼이 어디에도 없음** → `openLeave` 호출 불가.
- **확인 모달이 렌더되지 않음** → `leaving/busy/leaveError` state와 `LogOut/AlertTriangle/X` import 전부 dead.
→ 메모리상 "구현완료(tsc통과)"로 기록됐지만 실제론 동작 0%. **3개 배선만 채우면 완성**(쿼리에 club_id, 활동중 행에 나가기 버튼, 확인 모달).

### ② 미소속 / ⑤ 부원 — **단독 운영진 계정 탈퇴 시 DB 불변식 에러 raw 노출 (MED·확인됨)**
`delete_own_account`([20260514200000](supabase/migrations/20260514200000_delete_own_account.sql))는 활동중 멤버십을 '탈퇴'로 UPDATE → 호출자가 **어느 동아리든 단독 활동중 운영진이면** `prevent_last_admin_removal` 트리거가 EXCEPTION → **계정 탈퇴 자체가 실패**.
- [MyPage.tsx:160](src/pages/user/MyPage.tsx#L160)는 `deleteAccount()`의 error 문자열을 그대로 반환, [DeleteAccountModal](src/pages/user/sections/DeleteAccountModal.tsx)이 raw 노출.
- 노출 메시지 "마지막 운영진은 **강등하거나 탈퇴**할 수 없습니다…"는 **계정 탈퇴 맥락에선 동아리/강등 언급이 뜬금없어** 사용자가 원인·해법(운영진 권한 양도)을 모름.
→ 탈퇴 모달에서 last-admin 차단을 인지해 "○○ 동아리의 단독 운영진이라 탈퇴할 수 없어요. 먼저 다른 구성원에게 운영진 권한을 넘겨주세요." 로 맥락화.

### 검증으로 *기각*한 의심들 (지어내지 않기 위해 확인)
- RecruitmentsList 공고 삭제 → 지원자 고아화? **삭제 경로 없음**(`.delete()` 부재) → 비해당.
- ClubApply가 탈퇴('탈퇴') 회원의 재지원 막나? **막지 않음이 정상** — isMember는 `status='활동중'`만 체크(`:102`), 나간 사람은 재지원 가능(의도된 동작).

## 8. 3차 구현 범위 (백엔드 준비됨 → 프론트 배선/카피, 무마이그레이션)
1. **⑤ 동아리 단위 탈퇴 UI 완성** — SELECT에 club_id 추가, 활동중 행에 '나가기' 버튼, 확인 모달 렌더(단독 운영진 차단 메시지 노출). `MembershipHistorySection.tsx`
2. **② 계정 탈퇴 단독운영진 에러 맥락화** — last-admin 차단 에러를 사용자 친화 안내로 변환. `DeleteAccountModal.tsx`/`MyPage.tsx`

검증: `tsc` 타입체크 통과.
