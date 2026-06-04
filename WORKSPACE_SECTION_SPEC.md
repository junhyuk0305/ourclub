# Workspace 1-Page — 섹션/그리드 배치 구조 개편 명세서

> 작성일 2026-06-01 · 대상: `src/pages/admin/Workspace.tsx`, `src/components/blockKit.tsx`, `src/components/ClubPageRenderer.tsx`, `src/components/admin/BlockPropertiesPanel.tsx`
>
> 이 문서는 기존 `SECTION_WRAPPER_PLAN.md`를 **대체(supersede)** 한다. 차이점: ① 섹션이 children flat이 아니라 **행(row)→컬럼(column)→위젯 스택** 3계층을 갖는다, ② 기존 `layoutContainer` 위젯을 섹션이 흡수하고 팔레트에서 제거한다, ③ 모든 그리드형 위젯을 4열로 통일한다.

---

## 0. 결정된 사항 (사용자 확정)

| # | 항목 | 결정 |
|---|------|------|
| D1 | 섹션 내부 그리드 모델 | **행 → 컬럼(1~4) → 위젯 스택**. 각 컬럼은 위젯을 세로로 여러 개 쌓을 수 있다. |
| D2 | 기존 `layoutContainer`의 **정적 그리드** | **섹션으로 대체.** 멤버·레이아웃이 만들던 겹치는 정적 격자는 전부 섹션이 담당. layoutContainer의 grid 모드는 제거. |
| D3 | 셀(컬럼)에 위젯 넣는 방식 | **`+` 버튼 + 전면 드래그앤드롭 병행.** 프로토타입(`__section_structure_prototype.html`) 확정. native HTML5 DnD, 위젯은 **드래그 핸들**로 잡음(내부 편집과 충돌 방지). |
| D4 | "5grid 이상 삭제" 범위 | **모든 그리드형 위젯 최대 4열로 통일.** (실제 변경 대상: `layoutContainer` cols의 `6` 옵션·cell colSpan max 6) |
| D5 | `layoutContainer`의 **탭/캐러셀** (필수 기능) | **"탭·캐러셀" 전용 위젯으로 리프레임.** grid 모드만 제거하고 탭·캐러셀 모드는 유지(기존 코드 재사용). 팔레트 라벨 변경. → 겹침 해소 + 고유 기능 보존. |
| D6 | 컬럼 수 축소 시 위젯 | **경고 후 삭제.** (잘려나가는 컬럼에 위젯 있으면 확인 다이얼로그) |
| D7 | 컬럼 내 위젯 편집 affordance | **컬럼 내에도 미니 툴바 재구현** (선택/삭제/복제/↑↓ + text 인라인 편집). 단일 렌더 코어 유지. |
| D8 | 컬럼 간 위젯 이동 | **드래그앤드롭** (컬럼↔컬럼, 섹션↔top-level, 위젯 위에 놓으면 그 앞 삽입). 프로토타입 확정. |
| D9 | 반응형 collapse | **모바일 1열, 태블릿 2열** (기본). 3·4열 행은 뷰포트에 맞춰 자동 축소. |

---

## 1. 목표

현재 빌더는 블록이 완전 flat 배열이며, 그리드는 `layoutContainer`라는 별도 위젯이 "셀(제목/본문/이미지 필드)"로만 표현한다. 임의 위젯을 그리드 칸에 넣을 수 없고, 멤버·통계·갤러리·layoutContainer가 서로 비슷한 그리드를 만들어 **기능이 겹친다.**

목표: **2계층 배치 모드**를 도입한다.

1. **전체 레이아웃 → 위젯** (기존 그대로, flat)
2. **전체 레이아웃 → 섹션 → 행 → 컬럼 → 위젯** (신규)

섹션은 배경(단색/그라디언트/이미지/워터마크/데코)을 갖고, 그 안에 여러 행을 쌓으며, 각 행은 1~4 컬럼으로 나뉘고, 각 컬럼에는 임의 위젯을 세로로 쌓는다. 첨부 이미지의 모든 배치(좌측 큰 위젯 + 우측 2~4개 스택, 비대칭 폭 등)를 이 모델로 표현한다.

---

## 2. 데이터 모델

### 2-1. 최상위 배열

```ts
type TopLevelItem = WidgetBlock | SectionBlock;
blocks: TopLevelItem[];   // 기존 flat 위젯과 섹션이 한 배열에 공존
```

기존 flat 위젯은 그대로 top-level에 남는다(모드 1). 섹션은 모드 2.

### 2-2. 섹션 / 행 / 컬럼

```ts
interface SectionBlock {
  id: string;
  type: 'section';
  // ── 배경 (기존 BlockPropertiesPanel의 section 배경 옵션 재사용) ──
  bgType?: 'color' | 'gradient' | 'image';
  bgColor?: string;
  bgGradient?: { from: string; to: string; angle: number };
  bgImage?: string;
  bgOverlay?: number;            // 0~90
  bgWatermark?: { text; fontSize; opacity; position; color };  // 선택
  bgShape?: { type; size; color; x; y; opacity; ... };         // 선택
  // ── 레이아웃 ──
  paddingY?: number;             // 0~200, default 80
  paddingX?: number;             // 0~120, default 32
  gap?: number;                  // 행 간 간격 0~80, default 32
  maxWidth?: number;             // content-box 폭, 선택
  rows: SectionRow[];
}

interface SectionRow {
  id: string;
  cols: 1 | 2 | 3 | 4;           // 이 행의 컬럼 수
  gap?: number;                  // 컬럼 간 간격 0~80, default 24
  colRatios?: number[];          // 선택: 비대칭 폭. 예 [2,1]. 길이 === cols. 없으면 균등(1fr).
  columns: SectionColumn[];      // length === cols
}

interface SectionColumn {
  id: string;
  widgets: WidgetBlock[];        // 기존 위젯 블록 스택 (section 타입은 금지 — 중첩 불가)
}
```

- `WidgetBlock` = 현재 존재하는 모든 위젯 타입(text, image, stats, members, gallery, button, …). **단 `section`·`layoutContainer`는 컬럼 안에 넣을 수 없다.**
- 비대칭 폭(이미지의 좌측 큰 위젯)은 `colRatios: [2,1]` 같은 식으로 표현. 높이 차이는 컬럼별 위젯 스택 개수로 자연 표현(CSS grid `align-items: start`).
- **ID 규칙**: 모든 id는 페이지 내 전역 고유. 생성 시 `Date.now()+카운터` 또는 `crypto.randomUUID()` 권장(현재 `Date.now()` 단독은 빠른 연속 생성 시 충돌 위험 → 보강).

### 2-3. DB 변경

**없음.** `club_pages.blocks` JSONB에 `type:'section'` 항목이 추가될 뿐. 하위 호환.

---

## 3. 렌더링 (단일 코어 유지 — WIDGET_CRITERIA §0-5)

`blockKit.tsx`의 `BlockBody` 디스패처에 `case 'section'` 추가. 신규 `SectionBlock` 컴포넌트:

```
SectionBlock
 └ 배경 래퍼 (resolveBackground: color/gradient/image+overlay, watermark, shape)
   └ content-box (maxWidth, paddingX, paddingY)
     └ rows.map → 행 div (display:grid, gridTemplateColumns: colRatios||repeat(cols,1fr), gap)
        └ columns.map → 컬럼 div (display:flex, flexDirection:column, gap)
           └ widgets.map → <BlockBody block={widget} ctx={...}/>  (재귀)
```

- **읽기/편집 동일 코어**: 공개 렌더(`ctx.edit=false`)와 에디터(`ctx.edit=true`) 모두 같은 `SectionBlock`을 쓴다. 편집 모드에서만 행/컬럼/위젯 추가·삭제 affordance를 오버레이.
- **반응형**: 태블릿/모바일 뷰포트에서 `cols >= 2` 행은 자동으로 1열(또는 2열)로 collapse. (`@media` 또는 viewportMode 기반)

---

## 4. 에디터 UX (Workspace 캔버스)

### 4-1. 섹션 추가
- 좌측 팔레트 / inter-block `+` 메뉴에 **"섹션"** 항목 추가. 추가 시 기본값:
  ```ts
  { type:'section', bgType:'color', bgColor:'#f9fafb', paddingY:80, paddingX:32, gap:32,
    rows:[ { id, cols:1, gap:24, columns:[ { id, widgets:[] } ] } ] }
  ```

### 4-2. 섹션 내부 조작
- **행 추가**: 섹션 하단 "+ 행 추가" → 컬럼 수(1~4) 선택 → 빈 컬럼 생성.
- **행 컬럼 수 변경**: 행 선택 시 속성 패널에서 1~4 Seg. 컬럼 수 줄이면 잘려나가는 컬럼의 위젯은 마지막 컬럼으로 병합(데이터 손실 방지) 또는 경고 후 삭제 — *§7 열린 결정*.
- **행 순서 변경**: ↑↓ 버튼 + (단순) D&D.
- **행 삭제**: 행 툴바 삭제 버튼. 내부 위젯 있으면 확인.
- **컬럼에 위젯 추가**: 빈 컬럼에 `[+]` → 위젯 피커(팔레트에서 section·layoutContainer·header 제외) → 컬럼 widgets에 push.
- **컬럼 내 위젯**: 선택/삭제/복제/↑↓ 이동(미니 툴바). 컬럼 간 이동은 "이동" 드롭다운 또는 ↑↓로 컬럼 경계 넘기기 — *§7 열린 결정*.

### 4-3. 선택 상태
- 현재 `selectedBlockId` 단일 state 유지하되, **selection은 위젯/행/섹션 3종**을 구분해야 함. 제안: `selected: { kind:'widget'|'row'|'section', id }`. 속성 패널이 kind에 따라 분기.

---

## 5. 속성 패널

| 선택 대상 | 패널 내용 |
|-----------|-----------|
| 섹션 | 배경(단색/그라디언트/이미지+오버레이/워터마크/데코) · paddingY · paddingX · gap(행 간) · maxWidth |
| 행 | 컬럼 수(1~4 Seg) · 컬럼 간 gap · colRatios(비대칭 폭 프리셋: 균등 / 2:1 / 1:2 / 3:1 …) |
| 위젯 | 기존 위젯별 패널 그대로 |

섹션 배경 옵션은 `BlockPropertiesPanel.tsx`에 **이미 구현돼 있는** section 분기(bgWatermark/bgShape 등 — 1086줄 파일에 존재)를 재사용·연결.

---

## 6. layoutContainer 리프레임 & 그리드 4열 통일 (D2, D4, D5)

1. **layoutContainer → "탭·캐러셀" 위젯으로 리프레임**:
   - grid 모드 제거. mode Seg를 `[tabs, carousel]`만 남긴다(기본값 tabs). 정적 격자는 섹션이 담당.
   - 팔레트 라벨을 `레이아웃 컨테이너` → **`탭·캐러셀`**(아이콘 유지)로 변경.
   - `BlockBody`의 `case 'layoutContainer'`는 **그대로 둔다**(탭/캐러셀 렌더 + 기존 grid 데이터 하위 호환). grid 모드로 저장된 기존 블록은 계속 렌더되지만 신규는 tabs/carousel만 생성.
   - cell colSpan/rowSpan UI는 grid 전용이므로 패널에서 숨김(데이터는 보존).
2. **4열 cap**:
   - `BlockPropertiesPanel.tsx:337` cols Seg에서 `{v:'6'}` 제거 → `[1,2,3,4]` (캐러셀 "한 번에 보일 카드 수" 상한).
   - `:447` cell `colSpan` max `6` → `4` (UI 숨기더라도 값 clamp).
   - stats/members/gallery cols는 이미 2·3·4 (변경 없음). featureList 1·2 (변경 없음).
   - 신규 섹션 행 cols는 1~4로 설계.

---

## 7. 열린 결정사항 — 전부 확정됨 ✅

| Q | 결정 | 반영 |
|---|------|------|
| Q1 탭/캐러셀 회귀 | layoutContainer를 "탭·캐러셀" 위젯으로 리프레임 유지 | D5 / §6 |
| Q2 컬럼 축소 시 위젯 | 경고 후 삭제 | D6 |
| Q3 컬럼 내 편집 | 컬럼 내 미니 툴바 재구현 | D7 |
| Q4 컬럼 간 이동 | "다른 컬럼으로" 드롭다운 | D8 |
| Q5 반응형 | 모바일 1열 / 태블릿 2열 | D9 |

---

## 8. 영향 파일 & 작업 계획

| 파일 | 변경 |
|------|------|
| `blockKit.tsx` | `SectionBlock` 컴포넌트 신규 + `BlockBody`에 `case 'section'` 추가. 섹션 배경 resolve 헬퍼. |
| `ClubPageRenderer.tsx` | 변경 거의 없음(BlockBody가 섹션을 처리하므로 자동). 반응형 CSS 추가. |
| `Workspace.tsx` | ① nested 경로 기반 CRUD 헬퍼 ② 섹션/행/컬럼 캔버스 UI ③ 선택 상태 3종화 ④ PALETTE에 section 추가 + layoutContainer를 "탭·캐러셀"로 리프레임 |
| `BlockPropertiesPanel.tsx` | 행 선택 패널 신규. section 분기 rows 대응. cols 4 cap, colSpan 4 cap. |

### 구현 순서 (verify 포함)

```
1. 데이터 모델 + 타입 + 하위호환 로더
   → verify: 기존 club_pages(flat·layoutContainer 포함) 로드 시 오류 없음
2. blockKit: SectionBlock 렌더 (read 모드) + BlockBody case 추가
   → verify: 손수 만든 section JSON이 공개 페이지에서 배경+행+컬럼+위젯 정상 렌더
3. Workspace: nested CRUD 헬퍼 (locate/update/insert/delete/duplicate/move, 불변성)
   → verify: 단위 동작별 상태가 올바르게 갱신(undo/redo 포함)
4. Workspace: 섹션 캔버스 UI (행 추가/삭제/순서, 컬럼 + 버튼 위젯 피커, 위젯 미니 툴바)
   → verify: 이미지의 비대칭 배치를 클릭만으로 재현 가능
5. 속성 패널: 섹션·행 패널 + 4열 cap + layoutContainer 팔레트 제거
   → verify: 속성 변경이 캔버스+공개 양쪽 즉시 반영, 5·6열 옵션 사라짐
6. 반응형 collapse + 빈 컬럼/행 placeholder + QA
   → verify: 모바일 뷰포트 collapse, 빈 컬럼 안내, 알 수 없는 타입 무크래시
```

예상: Step3(nested CRUD)·Step4(캔버스 UI)가 가장 큰 비중·리스크. 전체 중규모.

---

## 9. 리스크

| 항목 | 리스크 | 대응 |
|------|--------|------|
| nested 상태 불변성 | rows/columns/widgets 3중 배열 mutation 누락 | 경로 기반 헬퍼 + structuredClone/전개로 deep copy |
| 위젯 ID 충돌 | 전역 고유성 깨지면 선택·편집 오작동 | id 생성 보강(counter/uuid) |
| 단일 렌더 코어 drift | 섹션 시각을 Workspace에 따로 그리면 미반영 버그 | 섹션도 BlockBody(edit 모드) 단일 코어로 |
| 인라인 편집(Q3) | 컬럼 내 text 편집 affordance 누락 | §7 Q3 결정 후 구현 |
| 기능 회귀(Q1) | 탭/캐러셀 상실 | §7 Q1 결정 |
```
