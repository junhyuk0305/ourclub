# 1-Page 웹빌더 — 우측 패널 / 섹션 관리 / 위젯 현황

> 1-Page 웹빌더의 **우측 속성 패널 · 전역 속성 제어 · 섹션 레이아웃 관리 모달 · 위젯별 옵션**의 현재 개발 상태와 최근 변경 이력.
> 관련 파일: `src/pages/admin/Workspace.tsx`(에디터 셸·트리 핸들러), `src/components/admin/BlockPropertiesPanel.tsx`(우측 패널), `src/components/admin/WorkspaceProperties.tsx`(전역 속성), `src/components/blockKit.tsx`(공개·에디터 공용 렌더 코어), `src/components/admin/ImageUploader.tsx`(이미지 업로드).
> 원칙: 신규 위젯 남발 금지 → 기존 위젯을 **우측 패널 옵션 + 드래그 슬라이더**로 확장. 공개/에디터는 `blockKit`의 단일 렌더 코어를 공유(drift 방지).

---

## 1. 전역 속성 제어 (`WorkspaceProperties.tsx`)

블록 미선택 시 우측에 표시되는 페이지 전역 설정.

| 항목 | 동작 | 비고 |
|---|---|---|
| **기본 브랜드 색상** | 버튼·강조 텍스트 등 위젯 공통 테마색(`activeTheme`) | 기본값 **검정**(`useState('black')`). 프리셋 5종 + 커스텀 컬러 |
| 본문 최대 너비 | 720 / 860 / 1024 / 전체 | `contentWidth` |
| 페이지 배경색 | 프레임 전체 배경 | `pageBgColor` |
| **기본 글꼴** | 위젯이 만들어내는 콘텐츠 글꼴만 변경 | `globalFont`. **빌더 UI(위젯/행 추가 버튼·툴바)는 고정** — 글꼴은 캔버스 프레임이 아니라 `BlockBody` 래퍼에만 적용 |
| 하단 고정 '지원버튼' | 모바일 이탈 방지 sticky CTA | `showFloatingBtn` |
| **부드러운 스크롤** | 공개 페이지 Lenis 관성 스크롤(기본 OFF) | `smoothScroll`. "부드러운 스크롤 감도를 제공합니다" |

> 글꼴 격리: 캔버스 프레임에서 `fontFamily` 제거 → 각 위젯 콘텐츠(`<BlockBody>`)를 감싸는 래퍼에만 `globalFont` 적용. 공개 렌더의 `.wb-root`가 콘텐츠만 감싸는 것과 동일 원리.

---

## 2. 우측 패널 공통 (`BlockPropertiesPanel.tsx`)

### 공용 컨트롤
- **Slider**(드래그 정도조절 바) — 값 조절 핵심 UX. 모든 숫자 입력은 min/max clamp.
- **ColorPicker** — `allowNone` 지원: 배경 색상에 **"없음(투명)" 버튼**(빈 값 `''` 저장 → 투명). 적용 위젯: 섹션 배경/탭·캐러셀 배경/카드 배경/텍스트 배경/버튼 배경·채움색/이미지 배경.
- **Seg / NumInput / Tip**.
  - **Tip(설명 툴팁)** — `createPortal` + `position:fixed` 로 본문에 띄움 → 우측 패널 `overflow-y-auto` 경계에서 잘리지 않고 항상 위로 표시.
- **접이식 Section** — 자식 2개 이상이면 토글. 토글 가능 항목은 우측에 **chevron 버튼 박스**(열림 시 검정 배경)로 일반 항목과 시각 구분. 자식 1개면 정적 헤더(항상 펼침).
- 일부 위젯(text/button)은 상단 **콘텐츠/디자인/모션 탭**(`TABBED_WIDGETS`).

### 위젯 디자인 프리셋(원자 패치)
- 버튼 `BTN_TEMPLATES`(12종), FAQ `FAQ_TEMPLATES`(6종) — `onUpdate('__merge', 필드번들)`로 한 번에 적용.

---

## 3. 섹션 (Section)

섹션 = 행(row) → 컬럼(1~4) → 위젯 스택 3계층. 우측 패널은 **디자인만**, 레이아웃은 **모달**에서.

### 3-1. 우측 패널 — 디자인 (`SectionDesignControls`)
패널과 (구)모달이 공유하던 공용 컴포넌트. 현재는 패널에서만 사용.
- **배경**: 단색 / 그라디언트 / 이미지
  - 그라디언트 선택 시 **흰색→검정 초기값 즉시 주입**(`__merge`로 `bgGradient` 동시 설정).
  - 이미지: 업로더 + 어둡게(오버레이) + **배경 모션(Ken Burns: 줌인/줌아웃/팬←/팬→)**. 설명 툴팁 포함. (※ '하단 그라데이션' 옵션 제거됨)
- **배경 장식**:
  - **배경 글씨**(구 '워터마크') — 텍스트/크기/투명도/X·Y/색.
  - **장식 도형** — 원 / **삼각형**(clip-path) / 사각. (※ '블롭' 제거)
- ('레이아웃·크기'는 모달로 이동)

### 3-2. 섹션 레이아웃 모달 (`SectionLayoutModal`) — 레이아웃 전용
패널의 **"레이아웃 관리 → 관리 열기"** 버튼으로 오픈. 디자인 탭 없음.
- 상단: **세로 여백 · 가로 여백 · 행 간격** 슬라이더(섹션 레벨).
- **매트릭스 뷰**: 한 프레임 안에 행을 얇은 구분선으로 쌓고, 각 행의 컬럼을 **실제 비율(`colRatios`)대로** 폭 분배 → 실제 레이아웃 그대로 미리보기.
  - 행 툴바: `행 N · 열[1·2·3·4] · 비율 프리셋 · ↑↓ · 🗑`.
  - 칸별: 위젯 칩(이름) + 위/아래 이동 + 삭제, 하단 `+위젯`(허용 위젯 6종 피커).
  - 하단: `행 추가`.
- 구조 변경은 **`__layoutOp`**(addRow/setCols/setRatio/addWidget/delNode/moveRow/moveWidget)로 `Workspace`에 위임. **위젯 추가 시 섹션 선택 유지**(위젯으로 선택이 옮겨가면 모달이 깨짐).

### 3-3. 비율 프리셋 (`RATIO_PRESETS`)
- 2열: 균등 / 2:1 / 1:2 / 3:1 / **1:3**
- 3열: 균등 / 2:1:1 / 1:2:1 / **1:1:2**
- 4열: 균등

### 3-4. 섹션 컬럼에 넣을 수 있는 위젯
`SECTION_EXCLUDED_WIDGETS = {section, faq, timeline, stats, layoutContainer, countdown}` 제외 →
**허용: 텍스트 · 버튼 · 이미지 · 슬라이드 · 구분 요소 · 여백**.

### 3-5. 간격(가로/세로) 독립
- `gap`(컬럼 가로 간격) / `rowGap`(위젯 세로 간격) **완전 분리**(한쪽 조절이 다른 쪽에 영향 없음).
- 컬럼이 1개면 '컬럼 간격(가로)' 슬라이더 숨김.
- 렌더(공개 `SectionBlock` + 에디터 `renderSection`)도 `rowGap ?? 24`로 통일.

### 3-6. 에디터/공개 시각 일치
- 배경 장식: 공용 `SectionDecor`(자체 `overflow:hidden` 레이어).
- **배경 모션(Ken Burns)**: 에디터 섹션은 `overflow:visible`(chrome 노출)이라 scale 레이어가 새어나감 → 에디터에서 **자체 `overflow:hidden` 래퍼**로 감싸 클리핑(공개와 동일). 배경 이미지가 검정으로 나오던 버그 동시 해결.

---

## 4. 캔버스 편집 UX (`Workspace.tsx`)

- **드래그 핸들**: 섹션 내부(nested) 위젯은 컬럼 바깥(`-left-6`), top-level 위젯은 프레임 `overflowX:clip` 때문에 안쪽(`left-0`)에 배치 → 항상 보임.
- 섹션 칸 **`+위젯` 버튼 호버 피드백**(`hover:bg-orange-50`).
- 위젯 선택 라벨·grip·툴바는 hover/선택 시 노출.

---

## 5. 위젯 현황 (12종, `BlockBody` 디스패처)

`section · text · heroSlider · layoutContainer(grid/tabs/carousel) · stats · timeline · faq · image · button · divider · spacer · countdown`

### 텍스트(text)
- 타이포(크기/굵기/줄간격/자간), 색, **외곽선**(두께만 바꿔도 즉시 반영 — 색 미설정 시 검정 기본), 배경(없음 투명), 모션(등장·글자 리빌).
- 인라인 리치 에디터(`RichEditable`): 드래그 선택에 굵게/크기/색/**글자 배경색(하이라이트)**/글꼴. 글자 크기 변경 시 **하이라이트 배경도 함께 스케일**(상위 배경색을 새 size span에 실어 유지).

### 버튼(button)
- 디자인 템플릿 12종, **버튼 색상**(없음 → `transparent` 투명 버튼), 텍스트 색, 테두리, 형태, **배경색(없음)**, 모션.

### 이미지(image) — 6장 참조
- 이미지/Alt/링크, 너비%·정렬·비율·둥글기·여백·object-fit, **배경색(없음)**.
- 업로드/표시 최적화는 §6 참조.

---

## 6. 이미지 위젯 최적화 — 반응형 해상도(srcset)

### 업로드 (`ImageUploader.tsx`)
- 검증: 포맷(JPG/PNG/WebP) · 용량(≤5MB) · 해상도(min/max).
- **이미지 위젯(`onMeta` 전달 시): 반응형 다중 해상도 생성**
  - 후보 너비 `RESPONSIVE_WIDTHS = [640, 1280, 2000]` 중 원본폭/상한(2000) 이하만 생성(업스케일 안 함).
  - 비트맵 1회 디코드 후 각 너비로 다운스케일 → **WebP(q0.85)** 변환 → `{stamp}_{width}.webp`로 각각 업로드.
  - `onMeta({ src: 최대변형, srcSet: "url 640w, url 1280w, …", w, h })` 반환. 실패 시 단일 업로드로 폴백.
- **그 외(섹션 배경·슬라이드·셀 등, `onMeta` 없음)**: 기존 단일 WebP 업로드 유지.

### 데이터 모델 (이미지 블록 신규 필드)
- `src` — 대표(최대) URL(폴백).
- `srcSet` — `"url 640w, url 1280w, url 2000w"` 문자열.
- `natW` / `natH` — 원본 치수(향후 CLS 방지용).
- 직접 URL 입력·삭제 시 `srcSet/natW/natH`는 비움(`__merge`로 함께 undefined) → 잘못된 srcset 방지.

### 렌더 (`ImageBlock`)
- `<img srcSet sizes loading="lazy" decoding="async">`.
- `sizes = (max-width: 1024px) {width}vw, {1024×width%}px` — 이미지 점유 폭(width%)에 맞춰 브라우저가 적정 해상도 선택. aspect 지정/원본 두 분기 모두 적용.

---

## 7. 이번 세션 변경 이력 (Changelog)

**Track C — 위젯 디자인 프리셋 (마스터 플랜 §5 / 템플릿플랜 §12)**
- `src/lib/widgetPresets.ts` 신설: `WIDGET_PRESETS` 레지스트리(text·stats·timeline·divider·image·section, 총 19종). 패치는 디자인 필드만 → 내용/항목 보존, accent=테마색 주입.
- 패널 **최상단 '디자인 프리셋' 행**(`WidgetPresetRow`+`WidgetPresetModal`) — 프리셋 보유 위젯에서만 노출. button·faq 는 기존 전용 모달 유지.

**Track B — 위젯 애니메이션 / GSAP lazy (마스터 플랜 §4)**
- `src/lib/scrollFx.ts`: GSAP+ScrollTrigger **동적 import lazy 로더**(`loadScrollFx`, 캐시) + `useSectionParallax` 훅. 미사용 페이지 번들 0kb, `prefers-reduced-motion`/에디터 가드.
- `src/lib/useInView.ts`: 공용 IntersectionObserver 훅(위젯 재사용).
- **섹션 배경 패럴랙스**: 패널 배경(이미지)에 `bgParallax` 슬라이더. 공개 `SectionBlock`이 별도 레이어 scrub 이동(Ken Burns보다 우선), 에디터는 정적 미리보기. `resolveSectionBg`/Workspace `renderSection`도 패럴랙스 분기 추가.

**Track A — 우측 패널 정돈 (마스터 플랜 §3)**
- **접기/펼치기 토글**: `Workspace.tsx` 우측 패널을 얇은 핸들 바(`‹`/`›`, 항상 노출) + width 슬라이드 래퍼로 감쌈. 접으면 캔버스(`main` flex-1) 풀폭. 상태 `localStorage('wb-panel-open')` 기억.
- **부드러운 전환(motion@12)**: 패널 등장/이탈 width+opacity 슬라이드, 위젯 선택·탭 전환 시 패널 내용 페이드+슬라이드(`BlockPropertiesPanel`의 콘텐츠 컨테이너 key=`block.id:tab`, `WorkspaceProperties` 본문). `useReducedMotion` 가드(즉시 전환). `motion`은 에디터 UI 전용 → 발행 번들 무관.
- **시각 위계 재설계(중앙 프리미티브)**: 공용 `Section` 그룹 헤더를 **진한 굵은 글씨(gray-900) + 좌측 브랜드 액센트 바**로, `Label`을 **연회색 캡션(11px font-bold)** 으로 차등화. 한 곳 수정으로 전 위젯 패널에 3단 위계(그룹헤더→라벨→컨트롤) 일괄 적용. (기존: 둘 다 uppercase·gray라 한국어 타이틀에선 사실상 평평.)


**전역 패널**
- '대표 브랜드 컬러' → **'기본 브랜드 색상'**(기본 검정), 툴팁 갱신.
- '관성 스무스 스크롤' → **'부드러운 스크롤'** + 문구 변경.
- 기본 글꼴이 **빌더 UI를 바꾸지 않고** 위젯 콘텐츠만 바꾸도록 격리.

**섹션 배경/장식**
- 그라디언트 **흰색→검정 초기값 즉시 적용**.
- '워터마크' → **'배경 글씨'** 라벨 전체 변경.
- 배경 이미지 검정 버그 + **배경 모션 안 보임** 수정(에디터 KenBurns 래퍼) + 모션 설명 툴팁.
- **하단 그라데이션 제거**. 장식도형 **블롭 → 삼각형**.

**레이아웃/간격/제한**
- 위젯 간격(세로)·컬럼 간격(가로) **독립 분리**.
- 섹션 컬럼 **위젯 제한**(faq/timeline/stats/탭·캐러셀/카운트다운 차단).
- **비율 프리셋 완전화**(1:3, 1:1:2 추가).

**공통 UX**
- ColorPicker **"없음(투명)"** 옵션(+ 레이아웃 오버플로우 수정).
- Tip 툴팁 **portal화**(클리핑 해결).
- 접이식 **토글 항목 가시성**(chevron 버튼 박스).
- 섹션 밖 위젯 **드래그 핸들 표시** + +위젯 호버 피드백.

**위젯**
- 텍스트 **외곽선 두께만 변경 즉시 반영** + 색 초기값 반영.
- 텍스트 **글자 배경색이 글자 크기 따라 스케일**.
- 버튼/이미지 **배경색 명칭 통일** + 투명 옵션(+ 버튼 채움색 투명).

**섹션 관리 모달**
- 행/열/위젯 배치를 **매트릭스(실제 비율)** 로 보고 편집하는 레이아웃 전용 모달 신설. 레이아웃 설정(여백·행간격)도 모달로 이동, 디자인은 패널 유지.

**이미지 최적화**
- 업로드 시 **반응형 다중 해상도(WebP) 생성** + 렌더 `srcset/sizes/decoding=async`.

---

## 검증
- `tsc --noEmit`: **전체 클린**(Track A·B·C 수정 후 재확인).
- `vite` dev 빌드 클린(`motion/react`·`gsap` 동적 import 정상). gsap 신규 설치(`^3.15`).
- ⏳ **시각 QA(수동, 어드민 로그인 필요):**
  - Track A: 패널 접힘 시 캔버스 풀폭 / 위젯 3종 패널 위계 일관 / 속성 편집 회귀 0.
  - Track C: 6위젯 패널 최상단 '디자인 프리셋' → 선택 시 디자인만 바뀌고 내용 보존.
  - Track B: 섹션 배경 이미지 + 패럴랙스 슬라이더 → **공개(발행) 페이지**에서 스크롤 시 배경 이동(에디터는 정적). 패럴랙스 끈 페이지는 gsap 미로드.
- ⚠️ `MembersAdmin.tsx`의 tsc 에러는 **기존 이슈**(이번 작업 무관, 별도 파일).
- ⚠️ 이 머신은 `vite build` 네이티브 크래시(0xC0000409, 소스 무관 환경 이슈) → 검증은 `npm run dev` + `tsc`로 수행. 시각 QA 권장.
