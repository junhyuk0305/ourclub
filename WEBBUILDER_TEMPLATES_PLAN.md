# 1-Page 웹빌더 — 템플릿(전체 / 섹션별) 기능 기획안

> 목적: 빈 캔버스에서 시작하는 부담을 없애기 위해 **완성형 템플릿**을 제공한다.
> 두 단위로 나눈다 — ① **전체 페이지 템플릿**(한 번에 페이지 통째), ② **섹션 템플릿**(기능별로 추려진 한 덩어리만 삽입).
> 작성일: 2026-06-04. 대상 파일: `src/pages/admin/Workspace.tsx`, `src/components/blockKit.tsx`.

---

## 0. 한 줄 결론

> 우리는 이미 **완성형 페이지 데이터**를 가지고 있다 — `supabase/migrations/...seed_*_v4.sql` 의 codewave / agency / brutalist 시드가 그것이다. 이 JSON들을 **앱 내부 템플릿 레지스트리(`src/lib/templates/`)로 옮겨**, 전체 페이지는 "통째로 적용", 그 안의 섹션들은 "기능별로 한 덩어리씩 삽입"하게 만든다. **신규 위젯·신규 렌더 코어는 없다.** 기존 `mkSection`/`makeWidget` 스키마 그대로의 데이터 묶음 + `regenIds`(id 재생성) + `BlockBody` 미니 렌더(썸네일)만 재사용한다.

핵심 설계 원칙(기존 메모리 정책과 일치):
- **새 위젯 금지.** 템플릿 = 기존 위젯/섹션 데이터의 *조합 프리셋*일 뿐. ([[feedback_builder_dev_style]])
- **렌더 단일코어 유지.** 썸네일도 공개 페이지와 동일한 `BlockBody`/`SectionBlock`을 축소 렌더 → drift 불가. ([[project_webbuilder_sections]])
- **데이터 모델 불변.** 저장 형태 `club_pages.blocks/draft = { config, blocks[] }` 그대로.

---

## 1. 두 가지 템플릿의 정의와 차이

| 구분 | 전체 페이지 템플릿 | 섹션 템플릿 |
|---|---|---|
| 단위 | 페이지 1개 = `{ config, blocks[] }` 전체 | 블록 1개(주로 `section`) 또는 소수 블록 |
| 적용 결과 | **현재 페이지를 통째로 교체**(config 포함) | 현재 위치에 **한 덩어리 삽입**(나머지 유지) |
| 진입점 | 좌측 레일 "템플릿" 버튼 → 갤러리 모달 → `전체` 탭 | 같은 모달 → `섹션` 탭 (스크린샷 형태) |
| 대표 예 | 코드웨이브(다크 테크), 에이전시(라이트), 브루탈리스트 | 메인 히어로 A/B/C, 팀 소개 3종, FAQ 2종 … |
| 분류 축 | 분위기/업종(테마 단위) | **기능**(메인·소개·팀·연혁·혜택·프로세스·FAQ·프로모션) |

> 두 템플릿은 **같은 데이터 형식**을 공유한다. 전체 템플릿은 "그 페이지의 모든 섹션", 섹션 템플릿은 "그중 한 섹션"일 뿐이다. 그래서 한 레지스트리에서 둘 다 파생시킬 수 있다.

---

## 2. 데이터 모델 — 템플릿 레지스트리

### 2-1. 저장 위치 (결정 필요 → 권장안 명시)

| 옵션 | 내용 | 장 / 단 | 권장 |
|---|---|---|---|
| **A. TS 정적 레지스트리** `src/lib/templates/` | 템플릿 JSON을 코드로 들고 있음 | 버전관리·타입체크·즉시 로드·시드와 동일 패턴 / 비개발자가 못 늘림 | **v1 채택** |
| B. DB 테이블 `page_templates` | 운영자가 큐레이션 | 무중단 추가·갤러리화 / 스키마·RLS·관리 UI 비용 | v2 이후 |

→ **v1은 A.** 이미 만든 `seed_*_v4.sql` 의 JSON을 그대로 TS 모듈로 이관하면 끝. (SQL↔앱 중복은 v1 한정 감수, 단일 출처화는 v2에서 DB로 통합.)

### 2-2. 타입 정의

```ts
// src/lib/templates/types.ts
export interface SectionTemplate {
  id: string;                 // 'hero-darktech', 'team-3col' …
  category: TemplateCategory; // '메인' | '소개' | '팀' | ...
  name: string;              // 패널 표시명
  desc?: string;             // 한 줄 설명
  block: any;                // 단일 블록(section/widget) — mkSection 스키마와 동일
  tags?: string[];           // 'dark' | 'light' | 'image-bg' …
}

export interface PageTemplate {
  id: string;                // 'codewave', 'agency', 'brutalist'
  name: string;              // '코드웨이브 — 다크 테크'
  desc?: string;
  config: any;               // activeTheme, contentWidth, pageBgColor …
  blocks: any[];             // 전체 블록 배열
  tags?: string[];
}

export type TemplateCategory =
  | '메인' | '소개' | '팀' | '연혁' | '혜택' | '프로세스' | 'FAQ' | '프로모션' | '통계';
```

```
src/lib/templates/
  types.ts
  index.ts            // PAGE_TEMPLATES, SECTION_TEMPLATES export + getByCategory()
  pages/
    codewave.ts       // seed_agency_codewave_v4.sql 의 JSON 이관
    agency.ts
    brutalist.ts
  sections/
    main.ts           // 히어로 변형 N종
    about.ts
    team.ts           // 스크린샷의 '팀 소개' 변형들
    history.ts        // 연혁(timeline)
    benefits.ts       // 복지/혜택
    process.ts        // 채용/모집 프로세스
    faq.ts
    promo.ts          // 프로모션/CTA
```

### 2-3. 삽입 로직 — 전부 기존 함수 재사용

| 동작 | 재사용 함수 (이미 `Workspace.tsx`에 존재) |
|---|---|
| id 전체 재생성(중복 방지) | `regenIds(node)` — 섹션은 행/열/위젯까지 재귀, 위젯은 자체 id만 |
| 섹션/위젯 top-level 삽입 | `handleAddBlock` 패턴 / `commit([...앞, nb, ...뒤], true)` |
| 선택 위치 기준 삽입 | `selectedBlockId` 다음 인덱스 (현 `handleAddBlock` 로직 동일) |
| 전체 페이지 교체 | `commit(newBlocks.map(regenIds), true)` + config setter 일괄 적용 |

> **신규 코드 최소.** 섹션 삽입은 `handleAddBlock('section')`이 `mkSection()` 대신 `regenIds(template.block)`을 넣는 변형 하나면 된다.

---

## 3. 섹션 템플릿 카테고리 (기능 축)

스크린샷의 좌측 목록을 그대로 채택 + 우리 동아리/모집 도메인 보강:

| 카테고리 | 핵심 위젯 구성 | 변형 예시 |
|---|---|---|
| **메인** | `section` + text(리빌 h1) + button + 배경이미지/KenBurns | 풀블리드 히어로 · 좌우 2단 · 미니멀 타이포 |
| **소개** | `section` 2단(비대칭) + text + image | 매니페스토 · 이미지+문단 · 인용 |
| **팀** | `section` + layoutContainer(grid) **또는** 3열 row + image+text | 카드 3열 · 사진 강조 · 리스트형 (← 스크린샷) |
| **연혁** | `timeline`(horizontal/vertical) | 가로 빅넘버 · 세로 라인 |
| **혜택** | `section` 다열 + text(아이콘 대용 이모지) | 3열 그리드 · 2열 강조 |
| **프로세스** | `timeline` (지원→과제→인터뷰→합류) | 4단계 가로 · 번호형 |
| **FAQ** | `faq` (line/numbered) | 라인형 · 박스형 |
| **프로모션** | `section` + countdown/stats/button | 마감 카운트다운 · CTA 배너 · 통계 strip |
| **통계** | `stats` (strip/grid, 카운트업) | 4지표 strip · 2x2 |

> v1은 **카테고리당 2~3 변형**으로 시작(총 ~20개). 시드 v4 3종에서 섹션을 뽑으면 대부분 자동 확보된다.

---

## 4. UI / UX

### 4-1. 좌측 레일 (요청사항: 위젯 + 버튼 *아래*에 템플릿 버튼)

현재 `aside.w-14` 에는 위젯추가(+) 버튼 1개뿐. 그 **바로 아래**에 템플릿 버튼을 추가한다.

```
┌────┐
│ ＋ │  ← 위젯 추가 (기존)
│추가│
├────┤
│ ▦  │  ← 템플릿 (신규)  · LayoutTemplate 아이콘
│템플│
└────┘
```

- 동일한 12px·border-2 스타일 유지, `setTemplateModalOpen(true)` 호출.
- 빈 캔버스 안내(현 `위젯 추가하기` 버튼) 옆에도 "템플릿으로 시작" 보조 버튼 추가 → 첫 진입 전환율↑.

### 4-2. 템플릿 갤러리 모달 (스크린샷 구조)

```
┌─────────────────────────────────────────────────────────┐
│  템플릿                                              [✕]   │
│ ┌──────────┬──────────────────────────────────────────┐ │
│ │ [전체]    │   ▦ 미리보기 카드 (라이브 축소 렌더)        │ │
│ │ [섹션]    │   ┌────────┐ ┌────────┐ ┌────────┐       │ │
│ │──────────│   │ 변형 A  │ │ 변형 B  │ │ 변형 C  │       │ │
│ │ 메인     │   └────────┘ └────────┘ └────────┘       │ │
│ │ 소개     │                                            │ │
│ │ 팀 소개  │◀ 선택  hover 시 [+ 추가] 오버레이           │ │
│ │ 연혁     │                                            │ │
│ │ 혜택     │                                            │ │
│ │ 프로세스 │                                            │ │
│ │ FAQ      │                                            │ │
│ │ 프로모션 │                                            │ │
│ └──────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- 상단 **탭 2개**: `전체` / `섹션`.
  - `전체` 탭: 페이지 템플릿 카드 그리드 → 클릭 시 **교체 확인 다이얼로그**.
  - `섹션` 탭: 좌측 **카테고리 리스트**(스크린샷) + 우측 변형 썸네일 그리드 → 클릭 시 즉시 삽입.
- 카드 hover: `[+ 추가]` / `[이 템플릿으로 시작]` 오버레이 + 외곽선(브랜드 오렌지/블랙 그림자, 기존 모달 톤과 통일).

### 4-3. 썸네일 전략 (결정 필요 → 권장안 명시)

| 옵션 | 방식 | 장 / 단 | 권장 |
|---|---|---|---|
| **A. 라이브 축소 렌더** | `<BlockBody>`/`SectionBlock`을 `transform: scale()` 컨테이너에 `pointer-events:none`로 | 자산관리 0 · 항상 최신 · 테마 정확 · 단일코어 정책 일치 | **채택** |
| B. 정적 PNG | 템플릿마다 캡처 이미지 | 렌더 가볍 / 캡처 파이프라인 + 변경 시 drift | 보류 |

→ **A 채택.** 단, 카드가 많으면 `content-visibility:auto` 또는 IntersectionObserver 지연 마운트로 초기 렌더 비용 관리. 이미지 배경은 unsplash URL 그대로(이미 시드가 외부 URL 사용).

### 4-4. 삽입/교체 동작 규칙

- **섹션 삽입 위치**: 현재 선택 블록 *다음*. 선택 없으면 맨 끝. (현 `handleAddBlock` 동일)
- **전체 교체**: 기존 블록이 있으면 `window.confirm("현재 페이지 내용이 템플릿으로 교체됩니다. 계속할까요?")`. config(테마·폭·배경)도 함께 적용. 빈 캔버스면 확인 없이 적용.
- **적용 후**: 삽입된 첫 블록 `setSelectedBlockId` + `scrollIntoView`(기존 `newBlockIdRef` 메커니즘 재사용).
- **undo 1스텝**: `commit(next, true)` 한 번으로 처리 → Ctrl+Z 한 번에 되돌림.

---

## 5. 구현 단계 (검증 기준 포함)

```
1. 레지스트리 골격 → 검증: types.ts + index.ts 타입체크 통과, 빈 배열 export
2. 시드 v4 → TS 이관 (pages/*.ts 3종) → 검증: 한 페이지를 콘솔에서 commit() 해 정상 렌더
3. 섹션 추출 (sections/*.ts ~20개) → 검증: 각 block을 단독 삽입 시 BlockBody 에러 없음
4. 좌측 레일 '템플릿' 버튼 + 모달 셸 → 검증: 열림/닫힘, 탭 전환
5. 섹션 탭(카테고리+썸네일) + 삽입 → 검증: 삽입 후 id 유일성·undo 1스텝
6. 전체 탭 + 교체 확인 + config 적용 → 검증: 테마/폭까지 반영, 빈/비빈 분기
7. 라이브 썸네일 지연 마운트 → 검증: 20+ 카드에서 첫 렌더 끊김 없음
```

각 단계 산출물은 `tsc` 클린 + dev 서버 렌더 확인을 통과 기준으로 삼는다.

---

## 6. 미결 결정 사항 (사용자 확인 요청)

1. **시드 SQL 운명** — 템플릿을 앱으로 옮긴 뒤, 기존 데모 시드(codewave/frame/vibe-design 등 실제 동아리 페이지)는 **그대로 둘지 / 정리할지?** (템플릿과 실데이터는 별개라 둬도 무방하나 중복 관리 부담)
2. **v1 변형 개수** — 카테고리당 2개로 가볍게 vs 3개로 풍성하게 (스크린샷은 3개 그리드).
3. **전체 교체 시 config 적용 범위** — 테마·폭·배경까지 전부 덮을지, 블록만 갈아끼울지(테마는 유지).
4. **권한** — 모든 동아리에 동일 템플릿 노출(v1) vs 인증/등급별 노출(v2).

---

## 8. 디자인 언어 → 빌더 실현가능성 매핑

> 핵심 원칙: **템플릿 = 데이터 프리셋.** 새 위젯/렌더 엔진 없이 *지금 렌더되는 12위젯 + 섹션 속성*으로 표현 가능한 것만 "템플릿"으로 만든다. 표현이 안 되는 스타일은 솔직히 ⛔로 두고, 엔진이 필요한 항목은 `WEBBUILDER_ANIMATION_PLAN.md` 트랙으로 넘긴다(여기서 만들지 않음).

표기: ✅ 지금 가능 · 🔶 부분(근사치로 흉내) · ⛔ 엔진/위젯 선행 필요

### 8-1. 시각 스타일 30종

| 가능 | 스타일 | 우리 빌더에서 구현 수단 |
|---|---|---|
| ✅ | 미니멀리즘 | 1열 섹션 + 큰 paddingY + 위젯 최소 |
| ✅ | 화이트 스페이스 | paddingY/maxWidth 크게, gap 넓게 |
| ✅ | 플랫 디자인 | bgType=color, 그림자 off |
| ✅ | 모노크롬 | activeTheme 단일 hex + 무채색 텍스트 |
| ✅ | 타이포그래피 중심 | text fontSize 90+/weight900 + textReveal char |
| ✅ | 브루탈리즘 | 검은고딕 폰트 + 굵은 보더 + 비정렬 + 원색(기존 시드 보유) |
| ✅ | 다크 모드 | pageBgColor #07070b + 포인트 hex(기존 codewave 보유) |
| ✅ | 네온 글로우 | button btnTemplate=neon + btnShadow=glow + textStroke |
| ✅ | 스위스 디자인 | 그리드 row + colRatios 비대칭 + 타이포 위계 |
| ✅ | 모션 헤비 | textReveal·animation·bgKenBurns·ticker 조합 |
| ✅ | 뉴 모던 | globalFont=함렛/본명조 + 큰 여백 + 미세 리빌 |
| 🔶 | 맥시멀리즘 | bgWatermark + bgShape + ticker 다중(꽉 채움 근사) |
| 🔶 | 팝 아트 | 원색 섹션 교차 + 굵은 타이포(패턴 이미지는 불가) |
| 🔶 | 그라디언트 | 섹션 bgGradOverlay(이미지 위)만 — 순수 mesh 배경 채움은 ⛔ |
| 🔶 | 일러스트/콜라주 | image 위젯에 사용자가 소스 제공 시만 |
| 🔶 | 추상/유기적 형태 | bgShape blob/circle(데코 한정, 콘텐츠 곡선 마스킹 ⛔) |
| 🔶 | 레트로/빈티지 | 색/폰트 선택으로 톤만 |
| ⛔ | 네오·글래스·스큐어·클레이모피즘 | 위젯 그림자/블러/질감 속성 없음 → 위젯 확장 필요 |
| ⛔ | 머티리얼 | elevation 체계 없음 |
| ⛔ | 픽셀아트·핸드드로잉·커스텀아이콘 | 전용 에셋/폰트 필요 |
| ⛔ | 홀로그래픽·다이내믹컬러·노이즈/그레인 | 셰이더/오버레이 엔진 필요 |

→ **즉시 제작 가능 11종**이 우리의 "디자인 언어 팔레트"다. 🔶는 위 11종 안에 액센트로 녹인다. ⛔는 이번 범위 밖.

### 8-2. 레이아웃 구조 15종

| 가능 | 구조 | 구현 수단 |
|---|---|---|
| ✅ | 싱글 컬럼 / 분할 스크린 / 그리드 / 카드 / 하이브리드 그리드 / 매거진 / 비대칭 | 섹션 row cols(1~4) + colRatios + layoutContainer(grid) |
| ✅ | 풀스크린 히어로 | section bgImage + paddingY 200+ + contentWidth=full |
| ✅ | Z·F 패턴 | 위젯 배치 가이드(데이터로 표현) |
| 🔶 | 수평 스크롤 | layoutContainer carousel(섹션 단위 가로는 ⛔) |
| 🔶 | 패럴랙스 | bgKenBurns 근사(진짜 scroll-parallax는 애니플랜 A9) |
| ⛔ | 대시보드/사이드바 | 랜딩페이지 비대상 |
| ⛔ | 메이슨리 / 중첩(overlap) | 전용 레이아웃 엔진 필요 |

### 8-3. 인터랙션 15종

| 가능 | 인터랙션 | 구현 수단 |
|---|---|---|
| ✅ | 스크롤 진입 리빌 | text/section animation·textReveal |
| ✅ | 마퀴(무한 띠) | divider variant=ticker |
| ✅ | 탭 / 캐러셀 / 아코디언(FAQ) | layoutContainer tabs·carousel, faq |
| ✅ | 카운트업 | stats animate |
| ✅ | 호버 효과 | button btnHover, layoutContainer cellHover |
| 🔶 | 스크롤 스냅 | smoothScroll 토글 근사 |
| ⛔ | 패럴랙스/핀/스크럽 · 마이크로인터랙션 · 게이미피케이션 · DnD · 무한스크롤 | 애니메이션 엔진(A1·A3·A4) 또는 비대상 → `WEBBUILDER_ANIMATION_PLAN.md` |

---

## 9. 전체 페이지 템플릿 카탈로그 (실제 제작 목록)

각 템플릿 = **하나의 완결된 디자인 언어**(스타일 + 레이아웃 + 인터랙션 + 폰트 + 컬러). 위 ✅ 팔레트만으로 구성.

| # | 템플릿명 | 스타일 조합 | 레이아웃 | 폰트/컬러 | 추천 동아리 | 상태 |
|---|---|---|---|---|---|---|
| T1 | **다크 테크** | 다크모드+네온글로우+모션헤비 | 풀스크린 히어로·비대칭 2단 | 산세리프 / #07070b·오렌지 | 개발·IT·창업 | ✅ 시드 보유(codewave_v4) |
| T2 | **에디토리얼 스위스** | 타이포중심+스위스+미니멀 | 매거진 비대칭·그리드 | 산세리프 / 라이트·앰버 | 디자인·기획·학술 | ✅ 시드 보유(agency_v4) |
| T3 | **브루탈리즘** | 브루탈+맥시멀 액센트 | 비정렬·굵은 보더 | 검은고딕 / 원색 | 예술·밴드·실험 | ✅ 시드 보유(brutalist_v4) |
| T4 | **미니멀 화이트** | 미니멀+화이트스페이스 | 싱글컬럼·넓은 여백 | 산세리프 / 화이트·1포인트 | 봉사·교양·연합 | 🆕 신규 |
| T5 | **뉴 모던 클래식** | 뉴모던+모노크롬 | 분할 스크린·비대칭 | 함렛/본명조 / 아이보리·먹색 | 인문·전통·문화 | 🆕 신규 |
| T6 | **비비드 캠퍼스** | 팝아트 액센트+모션헤비 | 카드 그리드·티커 | 산세리프 / 비비드 듀오톤 | 동아리연합·축제·홍보 | 🆕 신규 |

> **v1 권장 = 6종.** 기존 시드 3종(T1~T3)을 앱 레지스트리로 이관하면 절반은 즉시 확보. 신규 3종(T4~T6)만 새로 저작. 각 템플릿은 아래 §10 섹션들의 *해당 스타일 변형*을 조립해 만든다.

각 전체 템플릿의 기본 섹션 흐름(공통 골격, 스타일만 다름):
```
메인(히어로) → 티커 → 소개/매니페스토 → 통계 → 피처/프로젝트 → 인용 →
혜택/트랙 → 프로세스(timeline) → FAQ → 프로모션(CTA)
```

---

## 10. 섹션 템플릿 카탈로그 (카테고리 × 스타일 변형)

스크린샷의 좌측 카테고리 구조 그대로. 각 변형에 **어떤 위젯으로 만들지 + 어느 전체템플릿과 어울리는지** 명시. (v1 = ★ 표시 우선 제작 ~20개)

| 카테고리 | 변형 | 위젯 구성 | 어울리는 템플릿 |
|---|---|---|---|
| **메인** | ★다크 풀블리드 | section(bgImage+KenBurns+watermark) + text(char리빌 h1) + button(neon) | T1 |
| | ★스플릿 에디토리얼 | section 2단(1:1) + text + image | T2,T5 |
| | 브루탈 초대형 | section + text(검은고딕 100+, textStroke) | T3 |
| | ★미니멀 센터 | section(여백 大) + text(word리빌) + button(outline) | T4 |
| **소개** | ★비대칭 매니페스토 | section 2단(1:2) + text 라벨 + text 본문 | T1,T2 |
| | 인용 강조 | section + text(대형, highlight ==강조==) | T5,T3 |
| **팀** | ★카드 3열 | section 3단 row(image + text 이름/역할) | 전체 |
| | 사진 강조 | layoutContainer(grid, imgPosition top) | T6 |
| | 리스트형 | section 1단 + text 반복 | T4 |
| **연혁** | ★가로 빅넘버 | timeline(horizontal, nodeStyle bigNum) | T1,T2 |
| | 세로 라인 | timeline(vertical) | T5 |
| **혜택** | ★3열 그리드 | section 3단 row(text 이모지+제목+설명) | 전체 |
| | 2열 강조 | section 2단(1:1) + text | T4,T5 |
| **프로세스** | ★4단계 번호형 | timeline(horizontal, bigNum, 지원→과제→인터뷰→합류) | 전체 |
| **FAQ** | ★라인 넘버형 | faq(faqStyle line, numbered, arrow) | T1,T2 |
| | 박스형 | faq(box, plus) | T4,T6 |
| **프로모션** | ★마감 카운트다운 | countdown + button | 전체 |
| | CTA 배너 | section(bgImage+watermark) + text(char리빌) + button(solid) | T1,T6 |
| | 통계 스트립 | stats(strip, 카운트업 4지표) | T2 |

> **주의(렌더 정합성):** divider의 `quote`/`label` variant와 layoutContainer `grid` 신규생성은 패널 미지원이지만, **템플릿은 사전 저작 JSON이라 렌더는 정상**(BlockBody가 grid/ticker 렌더). 인용은 변형 안정성을 위해 divider-quote 대신 **text 위젯**으로 만든다.

---

## 11. v1 범위 & 우선순위 (확정 2026-06-04)

```
[확정] 전체 6종(T1~T3 이관 + T4~T6 신규)
[확정] 섹션 ~20개(★표 + 비-★ 변형 = 카테고리당 2~3종)
[제외] 🔶 mesh그라디언트 채움 · ⛔ 전 항목(모피즘/메이슨리/패럴랙스 엔진) → 애니플랜 트랙
```
제작 순서: ① 시드 3종 이관(가장 빠른 가치) → ② 섹션 추출(이관본에서 자동 확보) → ③ 신규 T4~T6 저작 → ④ §10 표의 전 변형(~20개) 보강.

---

## 12. 위젯 디자인 프리셋 (3번째 템플릿 계층)

> 템플릿은 **3계층**이다 — ① 전체 페이지 · ② 섹션 · ③ **위젯 1개의 디자인 프리셋**.
> ③은 좌측 갤러리가 아니라 **우측 속성 패널**에서, 선택한 위젯의 "디자인만" 한 번에 바꾸는 프리셋이다.

### 12-1. 현황 — 이미 절반은 구현돼 있다

코드에 **프리셋 메커니즘이 이미 존재**한다(확장만 하면 됨):

| 위젯 | 기존 프리셋 | 위치 |
|---|---|---|
| **button** | **12종** — 솔리드·그라디언트·샤인·입체·글래스·아웃라인·소프트·고스트·네온·알약·잉크·링크 | `BTN_TEMPLATES` + `BtnTemplateModal` |
| **faq** | **6종** — 박스 기본·라인 에디토리얼·미니멀 대형·다크 라인·컴팩트 박스·번호 미니멀 | `FAQ_PRESETS` |

적용 방식: 프리셋 = **관련 필드 전체를 지정한 번들**을 `onUpdate('__merge', {...preset, <widget>Template: id})` 로 한 번에 패치. → **이 패턴을 그대로 다른 디자인 위젯에 복제**한다. 신규 위젯·신규 렌더 0.

### 12-2. 메커니즘(확장 설계)

```ts
// src/lib/widgetPresets.ts  — 위젯 타입별 프리셋 레지스트리
export const WIDGET_PRESETS: Record<string, WidgetPreset[]> = {
  text:   [...], stats: [...], timeline: [...], divider: [...],
  layoutContainer: [...], countdown: [...], image: [...], section: [...],
  // button·faq 는 기존 BTN_TEMPLATES·FAQ_PRESETS 를 이 형식으로 흡수(단일 출처화)
};
interface WidgetPreset { id: string; label: string; desc: string;
  patch: (accent: string) => Record<string, any>; }  // accent=activeTheme hex
```
- 우측 패널 **최상단에 "디자인 프리셋" 행** 추가(버튼의 템플릿 모달과 동일 UX) → 칩 미리보기 + 모달/Seg에서 선택.
- preset은 **디자인 필드만** 패치(텍스트 내용·항목 데이터는 보존). accent 컬러는 현재 테마(`activeTheme`) 주입 → 테마 바꾸면 프리셋도 톤 따라감.

### 12-3. 위젯별 프리셋 카탈로그 (고도화 목록)

"디자인을 제공하는 위젯"별로, 실제 존재하는 속성만 묶어 프리셋화한다.

| 위젯 | 신규 프리셋(제안) | 핵심 패치 필드 |
|---|---|---|
| **text** | ★히어로 헤드라인 / ★섹션 타이틀 / 아웃라인 임팩트 / ★에디토리얼 본문 / 라벨·오버라인 / 강조 인용 | fontSize·fontWeight·lineHeight·letterSpacing·textReveal·animation·textStroke·highlightColor |
| **stats** | ★미니멀 스트립 / ★대형 임팩트(다크) / 카드 그리드 | layout(strip/cards)·valueSize·valueColor·labelColor·cols·animate·countDuration |
| **timeline** | ★가로 빅넘버 / ★세로 라인 / 미니멀 링 / 점 컴팩트 | layout·nodeStyle(number/dot/ring/bigNum)·activeColor·lineColor·nodeAnim |
| **divider** | ★헤어라인 / 점선 소프트 / ★이모지 티커 / 역방향 슬림 티커 | variant·style·thickness·color / tickerItems·separator·speed·tickerReverse·tickerFade |
| **layoutContainer** | ★탭 언더라인 / ★카드 캐러셀 / 그리드 카드(레거시) | mode·tabStyle·cardStyle·cellHover·cellAnimation·cols |
| **countdown** | ★박스 다크 / 대형 플랫 / 콜론 인라인 | cdStyle(boxed/plain/minimal)·bgColor·textColor·accentColor |
| **image** | ★시네마 와이드 / 폴라로이드 / ★원형 아바타 / 라운드 카드 | aspect·objectFit·radius·width·align |
| **section** | ★다크 히어로 / ★라이트 매니페스토 / 이미지 풀블리드 / 컬러 밴드 | bgType·bgImage·bgKenBurns·bgOverlay·bgWatermark·bgShape·paddingY·maxWidth |
| button · faq | **기존 12·6종 유지** + 단일 출처(`WIDGET_PRESETS`)로 흡수 | (변경 없음) |

> ★ = v1 우선. 위젯당 2~3종이면 충분(과다 선택 부담 회피, [[feedback_builder_dev_style]]). 총 신규 ~22종.

### 12-4. 섹션/페이지 템플릿과의 관계

- **위젯 프리셋은 §10 섹션 템플릿의 "원자(原子)"** 다. 섹션 템플릿을 저작할 때 이 프리셋 번들을 조립하면 일관성이 자동 확보된다(같은 "히어로 헤드라인" 프리셋을 여러 섹션이 공유).
- 따라서 제작 순서상 **위젯 프리셋을 먼저 정의**하면 섹션·페이지 템플릿 저작이 빨라진다.

### 12-5. v1 범위(위젯 프리셋)

```
[확정] button·faq 기존 프리셋을 WIDGET_PRESETS 로 통합(단일 출처)
[확정] text·stats·timeline·divider·image·section ★프리셋(위젯당 2~3종, ~16종) 신규
[권장] layoutContainer·countdown 프리셋 추가
[UI]   우측 패널 최상단 '디자인 프리셋' 행(버튼 템플릿 모달 패턴 재사용)
```

---

## 13. 비범위 (이번엔 안 함)

- DB 기반 템플릿 관리 UI, 사용자 정의 템플릿 저장("내 페이지를 템플릿으로").
- 신규 위젯·신규 애니메이션(별도 `WEBBUILDER_ANIMATION_PLAN.md` 트랙).
- 템플릿 미리보기 전체화면(모달 카드 썸네일로 충분, 필요 시 v2).
