# Section Wrapper 구현 계획

> 웹빌더에 섹션 개념 도입 — 섹션 배경 위에 여러 위젯을 올리는 구조

---

## 배경 / 목적

현재 웹빌더는 블록이 완전히 flat한 배열로 관리된다. 각 블록이 자체 `bgColor`를 갖기 때문에
여러 위젯이 하나의 배경 위에 올라가는 "섹션" 개념을 표현할 수 없다.

목표: `section` 타입 블록을 도입해 배경(단색/그라디언트/이미지)을 설정하고,
그 안에 여러 위젯을 자유롭게 배치하는 2계층 구조를 구현한다.

---

## 현재 vs 목표 데이터 구조

### 현재 — flat 배열

```ts
blocks: [
  { id, type: 'heroSlider', ... },
  { id, type: 'stats', ... },
  { id, type: 'members', ... },
]
```

### 목표 — section이 children을 품는 nested 구조

```ts
blocks: [
  { id, type: 'heroSlider', ... },           // 기존 블록: top-level 그대로 (하위 호환)
  {
    id, type: 'section',
    bgType: 'gradient',
    bgColor: '#111827',
    bgGradient: { from: '#111827', to: '#1f2937', angle: 135 },
    bgImage: '',
    bgOverlay: 40,
    paddingY: 80,
    gap: 32,
    children: [
      { id, type: 'stats', ... },
      { id, type: 'members', ... },
    ]
  },
  { id, type: 'button', ... },
]
```

---

## 영향받는 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/admin/Workspace.tsx` | state 타입 변경, CRUD 함수 nested 대응, 캔버스 섹션 UI, D&D |
| `src/components/ClubPageRenderer.tsx` | `case 'section'` 추가, children 순회 렌더링 |
| `src/components/admin/BlockPropertiesPanel.tsx` | section 속성 패널 추가 |
| `src/components/admin/SectionCanvas.tsx` | **신규** — 캔버스 내 섹션 컨테이너 UI |

---

## 구현 순서

### Step 1 — 데이터 모델 & 하위 호환 로더 (1~1.5h)

- `SectionBlock` 타입 정의
  ```ts
  interface SectionBlock {
    id: string
    type: 'section'
    bgType?: 'color' | 'gradient' | 'image'
    bgColor?: string
    bgGradient?: { from: string; to: string; angle: number }
    bgImage?: string
    bgOverlay?: number   // 0~100
    paddingY?: number
    gap?: number
    children: any[]
  }
  type TopLevelItem = SectionBlock | BlockItem
  ```
- `loadBlocks()`: `type === 'section'`인 항목만 children 처리, 나머지는 그대로 → 기존 데이터 하위 호환 유지
- `buildPayload()`: 기존 로직 그대로 (nested 포함해서 JSONB에 저장)

**완료 확인**: 기존 club_pages 데이터 로드 시 오류 없음

---

### Step 2 — ClubPageRenderer 섹션 렌더링 (45min~1h)

`src/components/ClubPageRenderer.tsx`에 `case 'section'` 추가:

```tsx
case 'section': {
  const bg = resolveBackground(block); // bgType에 따라 background style 결정
  return (
    <div key={block.id} style={{
      ...bg,
      paddingTop: `${block.paddingY ?? 80}px`,
      paddingBottom: `${block.paddingY ?? 80}px`,
      display: 'flex',
      flexDirection: 'column',
      gap: `${block.gap ?? 32}px`,
    }}>
      {(block.children || []).map((child: any) => renderBlock(child))}
    </div>
  );
}
```

- `resolveBackground(block)`: bgType에 따라 `backgroundColor` / `background: linear-gradient(...)` / `backgroundImage: url(...)`+overlay 반환

**완료 확인**: 섹션 타입 블록이 배경 + 자식 블록들을 올바르게 퍼블릭 렌더링

---

### Step 3 — Workspace 상태 관리 함수 nested 대응 (2~3h)

`Workspace.tsx`의 모든 CRUD 함수를 flat + nested 양쪽 탐색으로 수정:

| 함수 | 변경 내용 |
|------|-----------|
| `upd(id, field, value)` | flat 탐색 → 없으면 section.children 탐색 |
| `handleDeleteBlock(id)` | flat 삭제 → 없으면 section.children에서 삭제 |
| `handleDuplicateBlock(id)` | flat/nested 양쪽 지원 |
| `handleMoveBlock(id, dir)` | 섹션 내 상하 이동 지원 |
| `handleAddBlockToSection(type, sectionId)` | **신규** — 지정 섹션의 children에 블록 추가 |
| `handleMoveBlockBetweenSections(blockId, fromSectionId, toSectionId)` | **신규** — 섹션 간 블록 이동 |
| `handleExtractBlockFromSection(blockId, sectionId)` | **신규** — 섹션에서 꺼내 top-level로 |

**완료 확인**: 각 CRUD 동작이 불변성을 유지하며 상태를 올바르게 갱신

---

### Step 4 — 캔버스 섹션 UI (3~4h)

`SectionCanvas.tsx` 신규 컴포넌트:

```
┌─────────────────────────────────────────┐  ← 점선 테두리 + "섹션" 레이블
│  [배경색 미리보기]                        │
│  ┌───────────────────────────────────┐  │
│  │ stats 블록 (기존 block row UI)    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ members 블록                      │  │
│  └───────────────────────────────────┘  │
│  [+ 이 섹션에 블록 추가]                  │
└─────────────────────────────────────────┘
```

- 섹션 선택 시 툴바: `[배경 편집] [블록 추가] [위/아래] [삭제]`
- 섹션 내 자식 블록은 기존 block row UI 재사용
- 섹션 접기/펼치기 토글

**완료 확인**: 섹션이 시각적으로 구분되고, 내부 블록 선택/편집 가능

---

### Step 5 — Drag-and-Drop 전략 (2~2.5h)

> **결정**: native nested D&D는 event bubbling 문제로 불안정. 아래 전략 채택.

| 대상 | 방식 |
|------|------|
| top-level 아이템(섹션 포함) 순서 변경 | 기존 native D&D 그대로 |
| 섹션 **내** 블록 순서 변경 | ↑↓ 버튼만 사용 |
| 블록 → 다른 섹션 이동 | 툴바 "섹션으로 이동" 드롭다운 |
| top-level 블록 → 섹션으로 편입 | 블록 툴바 "섹션에 넣기" 버튼 |

**완료 확인**: top-level 순서 변경 동작, 섹션 내 ↑↓ 동작, 섹션 간 이동 동작

---

### Step 6 — 섹션 속성 패널 (1.5~2h)

`BlockPropertiesPanel.tsx`에 `block.type === 'section'` 분기 추가:

```
── 배경 ──────────────────
  [단색] [그라디언트] [이미지]  ← Seg 탭
  단색: ColorPicker
  그라디언트: from색 / to색 / 각도 슬라이더
  이미지: ImageUploader + Overlay opacity 슬라이더

── 레이아웃 ───────────────
  세로 여백 (paddingY) 슬라이더
  블록 간 간격 (gap) 슬라이더
```

**완료 확인**: 속성 변경 시 캔버스 + 퍼블릭 렌더러에 즉시 반영

---

### Step 7 — 팔레트 & 기본값 (30min)

- `PALETTE`에 `{ type: 'section', label: '섹션 배경', icon: Layers2 }` 추가
- `handleAddBlock('section')` 기본값:
  ```ts
  {
    type: 'section', bgType: 'color', bgColor: '#f9fafb',
    paddingY: 80, gap: 32,
    children: []
  }
  ```

**완료 확인**: 팔레트에서 섹션 추가 후 내부에 블록 삽입 가능

---

## DB 변경

없음. 기존 `club_pages.blocks` JSONB에 `type: 'section'` 항목이 추가되는 것뿐. 하위 호환.

---

## 리스크

| 항목 | 리스크 | 대응 |
|------|--------|------|
| D&D nested | event bubbling 오작동 | 섹션 내는 ↑↓ 버튼, 섹션 간은 드롭다운 |
| 상태 불변성 | nested 배열 mutation 누락 | 모든 CRUD에서 structuredClone 또는 전개 연산자 deep copy |
| 기존 데이터 | flat blocks 로드 시 section 파싱 충돌 | `type === 'section'`인 항목만 children 처리 |
| selectedBlockId 혼용 | 섹션 ID와 블록 ID 충돌 가능성 | `selectedId` + `selectedSectionId` 2개 state로 분리 |

---

## 예상 소요 시간

| Step | 낙관 | 현실 |
|------|------|------|
| 1 데이터 모델 | 1h | 1.5h |
| 2 렌더러 | 45min | 1h |
| 3 상태 함수 | 1.5h | 3h |
| 4 캔버스 UI | 2h | 4h |
| 5 D&D | 1h | 2.5h |
| 6 속성 패널 | 1h | 2h |
| 7 팔레트 | 30min | 30min |
| **합계** | **~8h** | **~14.5h** |

---

## 세션 시작 체크리스트

새 세션에서 이 파일을 읽은 뒤:

1. `src/pages/admin/Workspace.tsx` 전체 읽기
2. `src/components/ClubPageRenderer.tsx` — `renderBlock` 함수 위치 확인
3. `src/components/admin/BlockPropertiesPanel.tsx` — 섹션 분기 추가 위치 확인
4. Step 1부터 순서대로 구현 시작
