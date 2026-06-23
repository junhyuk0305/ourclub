# 리크루팅 시스템 — 현행 구현 명세

> 이 문서는 **실제 구현된 동작**을 정리한다. (코드: `src/pages/admin/Recruitment*`,
> `src/components/admin/recruitment/*`, `src/pages/public/ClubApply.tsx`, `ClubRecruit.tsx`)
> 과거 기획(`recru.md` v1)은 폐기됨. 아래 "기획과 달라진 점"에 차이를 명시한다.

## 0. 데이터 구조 (Data Flow)

* **Club (동아리):** 슬러그 기반 공개 채용 페이지 보유 — `/clubs/:slug/recruit`
* **Recruitment (모집 공고):** `recruitments` 테이블.
  * 상태값(`status`): `임시저장` → `진행중` → `마감`
  * 폼: `form_schema`(작성 중 초안 jsonb) + `deployed_form_schema`(발행 스냅샷) + `form_version`(int)
  * 파이프라인: `pipeline_stages`(jsonb) — 컬럼 기본값 `["서류접수","면접","최종합격","불합격"]`
  * **공고 개수 제한 없음** (과거 "최대 3개" 제한은 미구현)
* **Application (지원자):** `recruitment_applications` 테이블.
  * 제출 시 생성, `status`=파이프라인 첫 단계, `answers`(jsonb)
  * 평가 필드: `score`, `interviewer_note`, `interview_questions`(jsonb), `memos`(jsonb), `tags`

> ⚠️ **상태 라벨 혼용 주의:** 발행은 `진행중`으로 설정되지만 일부 집계 쿼리는 `모집중`을 사용한다
> (`DashboardAdmin`). 공개 조회는 `.in('status', ['진행중','모집중'])`로 둘 다 허용해 우회한다.
> 신규 코드는 `진행중`을 정본으로 사용할 것.

## 1. 모집·지원 통합 관리 (Admin)

* **목록:** `/admin/recruitments` — 공고 카드 목록, 생성/복제/상태 관리
* **상세 4탭:** `/admin/recruitments/:id`
  * **지원자(applicants):** 칸반(드래그) + 리스트(정렬·체크박스 일괄) 뷰 토글
  * **공고 수정(info):** 제목·기수·카테고리·기간·소개
  * **지원서 수정(form):** 질문 빌더 + 마크다운 요강 + 발행/재발행
  * **채용 프로세스(pipeline):** 파이프라인 단계 커스텀(추가·삭제·순서)
* **부속 페이지:** 리크루팅 대시보드(`/admin/recruit-dashboard`),
  애널리틱스(`/admin/recruit-analytics`), 채용 랜딩 빌더(`/admin/recruit-page`)
* **레거시 호환:** `/admin/recruit`·`/admin/form-builder` → `/admin/recruitments`로 리다이렉트.
  구버전 직접 접근은 `-legacy` 라우트.

## 2. 폼 빌더 & 버전 관리

* 작성 중 질문은 `form_schema`에 저장(임시저장)
* **최초 발행:** `status='진행중'`, `form_version=1`, `deployed_form_schema=form_schema` 스냅샷
* **재발행:** `form_version` 증가, `deployed_form_schema` 갱신 — 진행 중 지원자 영향 경고 모달 표시
* 공개 지원 폼은 `deployed_form_schema ?? form_schema`를 렌더(발행본 우선)
* 질문 타입: 단답·장문·숫자·이메일·전화·선택·다중선택·파일(10MB)·동의

## 3. 지원자 경험 (Applicant)

* **채용 포털:** `/clubs/:slug/recruit` — 진행중 공고 목록(D-N) + JD 마크다운 모달
* JD 모달의 '지원폼 작성하기' → `/clubs/:slug/apply?rid=<공고id>`
* **상태별 분기(ClubApply):** 비로그인 / 임시저장(미공개) / 모집 시작 전 / 마감 / 중복지원 / 정상
* 기본 정보(이름·연락처·포트폴리오)는 프로필 자동완성 — **재입력 가능**(프로필과 달라질 수 있음)
* 제출 → `recruitment_applications` insert(status=파이프라인 1단계) → 완료 화면

## 4. 파이프라인 관리 (Admin)

* 칸반/리스트에서 단계 이동(드래그 또는 버튼)
* **단계 이동 알림:** 지원자 마이페이지로 **인앱 알림** 전송.
  (※ 실제 이메일 발송은 **미구현 — 추후 지원 예정**. 과거 "이메일 자동 발송" 기재는 폐기)
* 카드: 이름·지원경로·경과일·첨부/코멘트 아이콘
* 상세 모달: 지원서 원본 / 점수·메모(스레드, RPC `add_application_memo`) / 면접 질문 풀 / 태그
* **CSV 내보내기:** 전체/선택 지원자의 기본정보+문항 응답

## 5. 합격자 → 부원 전환

* **자동 아님.** 부원 관리(`/admin/members`)의 **'합격자 끌어오기'**(`PullApplicantsModal`)에서
  최종 단계(예: 합격) 지원자를 선택해 RPC `pull_applicants_to_members`로 `club_members`에 등록(수동)
* 기존 부원이면 `status='활동중'` + 기수 갱신

---

## 기획(v1/v2)과 달라진 점

| 과거 기획 | 현행 구현 |
|---|---|
| 공고 최대 3개 | 제한 없음 |
| URL `/club/{club_id}` | `/clubs/:slug/recruit` (슬러그) |
| 풀페이지 에디터 / 모달 폐기 | 공고 상세 **4탭** 구조로 통합 |
| 상태 이동 시 **이메일** 자동 발송 | **인앱 알림**(이메일은 추후) |
| 칸반 '접수' 단계 실시간 Insert | 제출 후 목록 재조회(폴링/리프레시) |
| 합격 시 부원 자동 편입 | 운영진이 '합격자 끌어오기'로 **수동** 전환 |
