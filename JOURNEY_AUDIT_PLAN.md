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
- **동아리 단위 탈퇴**: 계정 삭제 없이 특정 동아리만 나가기(`club_members.status='탈퇴'`). (RLS 정책 + MembershipHistory UI) — 미착수
- 운영진↔부원 문의 채널(신규 테이블·RLS·UI).
- 강퇴(활동정지) 알림+사유+이의제기 경로.
- 운영진 신규 0건 온보딩 체크리스트, 합격자 일괄처리, 출석 대상 명단 재사용.

각 항목은 마이그레이션·RLS·RPC 설계가 선행되어야 하며 별도 작업으로 분리.
