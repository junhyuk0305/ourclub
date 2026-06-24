# B2B 매칭 후 핸드오프 플로우 구현 계획 (HANDOFF FLOW)

> 이 문서는 **단독 컨텍스트에서 실행**하기 위한 자립 계획서다. "기업이 동아리를 골랐다 → 그래서 어떻게 진행?"의 **매칭완료 이후 절벽**을 구현하는 작업을 다룬다.
> 짝 문서: `B2B_RISK_REMEDIATION_PLAN.md`, `B2B_LEGAL_DOCS_PLAN.md`. 정산 단계는 RISK R4와, 계약 단계는 LEGAL_DOCS와 연계.

---

## 0. 배경 (필독)

확정 설계: 모델 Y(프로젝트팀 전원 공동·민법상 조합, PL 대표창구) + 책임 한도(계약대금·고의중과실) + 수수료 동아리 부담(대금 수령 후). 직업안정법 방어 위해 'B2B 도급' 프레이밍 + 금지어(채용/구인/구직/인력/소개/알선) 회피.

**현재 구현 상태 (감사 결과):**
- 구현됨: 프로젝트 등록 → 동아리 제안서 지원 → 기업 칸반 검토(미열람→검토중→미팅요청→매칭완료) → 거절.
- `b2b_applications` 상태: 미열람/검토중/미팅요청/매칭완료/거절.
- `b2b_projects` 상태: 모집중/모집마감 **(진행중·완료 없음)**.
- **매칭완료에서 끝.** `src/pages/corp/CorpDashboard.tsx:173` "최종 매칭이 완료되었습니다" 메시지 후 모달 닫히면 **다음 화면 없음.**
- PL/팀 개념: 약관(`/b2b-terms`)에만 존재, **DB·UI 전무.**
- 기업↔동아리 채팅: **없음** (상태값만 있고 소통창구 없음).

관련 파일: `src/pages/corp/CorpDashboard.tsx`, `src/pages/admin/B2BAdmin.tsx`, `src/pages/admin/B2BProposalAdmin.tsx`, `supabase/migrations/20260430100000_b2b_corp_dashboard.sql`.

---

## 1. 목표 라이프사이클 (전체 그림)

```
매칭완료
  → ① 동아리: PL·팀원 지정 (조합 구성)
  → ② 계약 체결 (표준 용역계약서 + 책임 동의서 업로드/서명)
  → ③ 킥오프 (시작일·범위 확정 → b2b_projects '진행중')
  → ④ 진행 추적 (마일스톤/상태, 소통)
  → ⑤ 산출물 제출·검수
  → ⑥ 정산 확인 (기업→동아리 대금 수령, 동아리→OURCLUB 수수료 납부)
  → ⑦ 완료 처리 → 리뷰/평점
```

## 2. DB 스키마 변경

신규 마이그레이션: `supabase/migrations/2026XXXX_b2b_project_execution.sql`

```sql
-- b2b_projects 상태 확장: '모집중'|'모집마감'|'진행중'|'완료'|'중단'
-- (CHECK 제약 또는 enum 갱신)

-- 프로젝트 팀 (PL + 팀원, 민법상 조합)
create table b2b_project_team (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references b2b_applications(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text not null,                -- 'PL' | '팀원'
  share_pct numeric,                 -- 대금 배분 비율
  accepted_at timestamptz,           -- 책임 수락 시점 (PL 필수)
  created_at timestamptz default now()
);

-- 계약 (업로드/상태)
create table b2b_contracts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references b2b_applications(id) on delete cascade,
  doc_url text,                      -- 서명된 계약서 (storage)
  status text default '미체결',      -- '미체결'|'체결완료'
  signed_at timestamptz,
  created_at timestamptz default now()
);

-- 마일스톤/진행
create table b2b_milestones (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references b2b_applications(id) on delete cascade,
  title text, due_date date,
  status text default '예정',        -- '예정'|'진행중'|'완료'
  deliverable_url text,
  created_at timestamptz default now()
);

-- 정산
create table b2b_settlements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references b2b_applications(id) on delete cascade,
  amount numeric,                    -- 거래금액
  fee_pct numeric, fee_amount numeric,
  paid_to_club_at timestamptz,       -- 기업→동아리 대금 수령
  fee_paid_at timestamptz,           -- 동아리→OURCLUB 수수료 납부
  status text default '대기'         -- '대기'|'대금수령'|'수수료납부완료'|'미납'
);

-- 리뷰 (양방향)
create table b2b_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references b2b_applications(id) on delete cascade,
  author_side text,                  -- '기업'|'동아리'
  rating int, comment text,
  created_at timestamptz default now()
);
```

> RLS: 각 테이블은 해당 application의 기업(corp_member)·동아리(운영진/팀원)만 접근. 기존 `md/policy.md` 패턴 따를 것.

## 3. UI 작업

### 기업 측 (`src/pages/corp/`)
- [ ] **프로젝트 상세/진행 페이지** 신설 (매칭완료 후 진입). 매칭된 동아리·PL·연락 단일창구·계약상태·마일스톤·산출물·정산·리뷰.
- [ ] CorpDashboard 칸반의 '매칭완료' 카드 클릭 → 상세 페이지로 이동(현재 막다른 길 해소).

### 동아리 측 (`src/pages/admin/`)
- [ ] **PL·팀원 지정 UI** (매칭완료 직후 필수 게이트): 운영진/부원 중 PL 1명 + 팀원 선택, 배분 비율 입력, PL 책임 수락 버튼 → `b2b_project_team` 기록.
- [ ] **프로젝트 워크스페이스**: 계약 업로드, 마일스톤 관리, 산출물 제출, 정산 확인.

### 공통
- [ ] **소통 창구**: 최소안 = 매칭완료 시 PL↔기업담당자 연락처 상호 공개. 확장안 = 인앱 메신저(별도 스코프).
- [ ] 상태 배지/타임라인 컴포넌트 재사용.

## 4. 단계별 마일스톤

| M | 범위 | 산출 |
|---|---|---|
| **M1 (핵심)** | PL·팀 지정 + 계약 업로드 + 상태 확장(진행중/완료) + 기업 프로젝트 상세 페이지 + 연락처 공개 | "매칭 후 누구와 어떻게" 해소 |
| **M2** | 마일스톤/진행 추적 + 산출물 제출·검수 | 실행 가시성 |
| **M3** | 정산(대금/수수료 확인) + 미납 자동제재(RISK R4) + 양방향 리뷰 | 거래 완결·신뢰 |

## 5. 성공기준
- [ ] 매칭완료 카드 클릭 시 **막다른 길 없이** 프로젝트 상세로 진입
- [ ] 동아리가 PL·팀원을 지정하지 않으면 다음 단계로 못 넘어가는 **게이트** 존재
- [ ] 기업이 PL 연락처/단일창구를 명확히 인지
- [ ] `b2b_projects`가 진행중→완료까지 상태 전이
- [ ] (M3) 정산 미납 시 동아리 신규 매칭 잠금 동작
- [ ] tsc 통과 + RLS로 타 동아리/기업 데이터 격리

## 6. 주의
- 모든 신규 카피에 **금지어(채용/구인/구직/인력/소개/알선) 사용 금지** → '프로젝트/도급/협업/매칭'. (`docs/legal/README.md` 용어 규칙)
- 계약 단계 문서 내용은 `B2B_LEGAL_DOCS_PLAN.md`가 소유. 여기선 업로드·상태 플로우만.
