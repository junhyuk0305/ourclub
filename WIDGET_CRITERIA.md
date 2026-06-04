# 웹빌더 위젯 고도화 기준

> 실제 기업 랜딩 페이지 수준의 자유도를 갖되, **위젯 수는 늘리지 않는다.**
> 위젯의 "세부 옵션 × 위젯 간 조합"으로 모든 레퍼런스를 표현할 수 있어야 한다.

---

## 0. 원칙

### 0-1. 최소·고유연 원칙
- 신규 위젯은 **기존 위젯과 그 어떤 조합으로도 표현 불가능할 때**만 추가한다.
- "이런 레이아웃이 있으니 이런 위젯을 만든다" → **금지**. 항상 "이 패턴은 기존 위젯의 어떤 옵션 조합으로 표현되는가"부터 검토한다.

### 0-2. 자유도 보존 원칙
- 레퍼런스에 등장한 색·형태를 **그대로 박제하지 않는다**. 예) "이 사이트는 오렌지 원형 데코를 쓴다" → 위젯에 "오렌지 원형 데코" 옵션을 박지 말 것. 대신 `섹션 배경 데코(shape: circle/blob/rect, color, size, position)`처럼 일반화된 파라미터로.

### 0-3. 안전 한계 원칙
- 모든 수치 입력은 **min / max** 를 갖는다. UI를 깨뜨리는 값(예: paddingY: 9999)은 입력 단계에서 차단한다.
- 모든 이미지는 **포맷·용량·해상도 검증**을 통과해야 업로드된다.

### 0-4. 디폴트 우선 원칙
- 사용자가 아무 설정도 안 해도, **기업 랜딩 페이지 수준의 디자인이 나오게** 디폴트값을 잡는다. 옵션은 디폴트를 깨고 싶을 때만 만진다.

### 0-5. 실시간 반영 원칙 (단일 렌더 코어)
- 우측 속성 패널에서 편집 가능한 **모든 prop은 중앙 에디터 캔버스에서 즉시 반영**되어야 한다. "공개 페이지에선 보이는데 에디터에선 안 보임" = **규칙 위반**.
- 이를 구조적으로 보장하기 위해 **블록 시각 렌더는 단일 코어(`ClubPageRenderer`)** 가 책임진다. 에디터 캔버스는 이 코어를 `edit` 모드로 호출하여 인라인 편집 오버레이(텍스트 입력·추가/삭제 affordance)만 얹는다.
  - 공개 렌더: `renderBlock(block, { edit: undefined })` → 읽기 전용.
  - 에디터 렌더: `renderBlock(block, { edit: { onUpdate, ... } })` → 동일 시각 + 편집 가능.
- **렌더 코어를 둘로 복제 금지.** 패널·에디터·퍼블릭 세 곳의 prop 집합은 항상 일치해야 하며, 시각 표현이 두 파일에 중복 구현되면 drift(미반영 버그)가 재발한다.
- 신규 옵션 추가 PR 체크리스트: ① 패널 입력 추가 → ② 단일 렌더 코어에서 그 prop 소비 → ③ `edit` 모드/읽기 모드 양쪽에서 동일하게 보이는지 확인. 셋 중 하나라도 빠지면 머지 금지.

---

## 1. 레퍼런스 패턴 인벤토리

8개 레퍼런스에서 반복 등장한 **섹션 단위 패턴 = 14가지**.

| # | 패턴 | 등장 레퍼런스 | 핵심 시각 요소 |
|---|------|----------------|----------------|
| P1 | 풀블리드 히어로 + 텍스트 오버레이 | 23718, 22317, 22114 | 영상/큰 이미지 + 좌·중·우 정렬 텍스트 |
| P2 | 타이포 히어로 + 데코 셰이프 | 24154, 24474, 21175 | 대형 도형(원/블롭) + 가운데 카피 |
| P3 | 벤토 히어로 (2~3 셀, 비대칭) | 24474, 20945 | 텍스트 카드 1 + 이미지 카드 N, 크기 불균등 |
| P4 | 통계 스트립 | 24154, 22114 | 큰 숫자 + 라벨 가로 배치 |
| P5 | 카드 그리드 (3~6, 균등) | 전부 | 동일 크기 카드 N열 |
| P6 | 비대칭 벤토 그리드 | 24474, 22317, 20945 | 1 + N, 또는 가변 colspan |
| P7 | 탭 필터 섹션 | 23796, 23718, 22114, 22317 | 탭 헤더 + 탭별 콘텐츠 영역 |
| P8 | 카드 캐러셀 (자동/수동) | 24474 | 좌/우 화살표 + 일시정지 + 도트 |
| P9 | 다이어그램/플로우 | 21175(플로우차트), 22114(원형) | 노드 + 라인 — 일반적으로 이미지 업로드로 처리 |
| P10 | 분할 섹션 (이미지+텍스트) | 23718, 22114 | 좌우 분할, 풀블리드 옵션 |
| P11 | 인용/창립자 카드 | 22317 | 아바타 + 따옴표 텍스트 + 출처 |
| P12 | 링크 행 (라벨 + 화살표) | 23718, 22317 | 가로 나열되는 텍스트 + 화살표 → |
| P13 | 백그라운드 워터마크 텍스트 | 23796, 23718, 22114 | 거대한 ghost 텍스트가 섹션 뒤에 깔림 |
| P14 | 풀블리드 CTA 배너 | 24474, 22317 | 어두운 배경 + 카피 + 원형 화살표 버튼 |

---

## 2. 패턴 → 위젯 매핑 (조합만으로 달성)

신규 위젯 추가 없이 기존 15개로 모두 표현 가능해야 한다. **`section`(SECTION_WRAPPER_PLAN.md 진행 중)** 은 컨테이너 역할이므로 모든 패턴의 외피로 사용된다.

| 패턴 | 외피 | 내부 위젯 구성 | 필요 옵션 (이미 있음 / 추가 필요) |
|------|------|----------------|-----------------------------------|
| P1 풀블리드 히어로 | (없음) | `heroSlider` 단일 슬라이드 | ✅ 이미 가능 |
| P2 타이포 히어로 + 셰이프 | `section` (bgShape) | `text` (큰 폰트) | ⚠ section에 **데코 셰이프** 옵션 필요 |
| P3 벤토 히어로 | `section` | `layoutContainer` | ⚠ layoutContainer에 **셀별 colspan/rowspan** 필요 |
| P4 통계 스트립 | `section` | `stats` | ✅ |
| P5 균등 카드 그리드 | `section` | `layoutContainer` | ✅ |
| P6 비대칭 벤토 | `section` | `layoutContainer` | ⚠ 셀 colspan 필요 (P3와 동일) |
| P7 탭 필터 섹션 | `section` | `layoutContainer` 탭모드 | ⚠ layoutContainer에 **`mode: tabs`** 필요 |
| P8 카드 캐러셀 | `section` | `layoutContainer` 캐러셀 모드 | ⚠ layoutContainer에 **`mode: carousel`** 필요 |
| P9 다이어그램 | `section` | `image` (다이어그램 이미지) | ✅ (제작은 사용자가 외부 도구로) |
| P10 분할 섹션 | (없음) | `splitSection` | ✅ |
| P11 인용 | `section` | `quote` | ✅ |
| P12 링크 행 | `section` | `layoutContainer` 1행 + 각 셀 = `text + arrow` | ⚠ **셀 클릭 시 href** 옵션 필요 (셀 자체가 링크) |
| P13 워터마크 텍스트 | `section` (bgWatermark) | 임의 | ⚠ section에 **bg 워터마크 텍스트** 옵션 필요 |
| P14 풀블리드 CTA 배너 | (없음) | `splitSection` (풀블리드, 텍스트 1 + 원형 버튼) | ⚠ splitSection의 **CTA 버튼 형태(원형/직사각형)** 옵션 |

**결론**: 신규 위젯 0개. **section / layoutContainer / splitSection 세 위젯의 옵션 강화만으로** 14개 패턴 전부 커버.

---

## 3. 위젯별 필수 기능 기준

> 기준 = "이 위젯이 충분히 유연하다고 말하려면 갖춰야 할 옵션 목록".
> ✅ = 이미 구현 / 🆕 = 추가 필요 / ⚙ = 디폴트 강화 필요

### 3-1. `section` (SECTION_WRAPPER_PLAN.md 기반)
컨테이너 위젯. 모든 비-히어로 콘텐츠의 외피.

| 옵션 | 상태 | 비고 |
|------|------|------|
| 배경 색 | ✅ | |
| 배경 그라디언트 (from/to/angle) | ✅ | |
| 배경 이미지 + overlay opacity | ✅ | |
| paddingY (0~200px) | ✅ | |
| 내부 gap (0~80px) | ✅ | |
| **워터마크 텍스트 (P13)** | 🆕 | text / fontSize(60~400px) / opacity(0~30%) / position(top-left,center,right) / color |
| **데코 셰이프 (P2)** | 🆕 | shape: none/circle/blob/square / size(100~1200px) / color / position(x,y %) / opacity / z-order(back/front) |
| 최대 너비 (max-width, content-box 폭) | 🆕 | 720 / 960 / 1200 / 1440 / full |
| 가로 패딩 (paddingX) | 🆕 | 0~120px |

### 3-2. `heroSlider`
풀블리드 첫인상 영역. 슬라이드 1~8.

| 옵션 | 상태 | 비고 |
|------|------|------|
| 높이 (30~100vh) | ✅ | |
| 슬라이드별 bg (color/gradient/image) | ✅ | |
| 슬라이드별 overlay opacity | ✅ | |
| h1 / subtitle / CTA / 정렬 | ✅ | |
| slideAnim (slide/fade) | ✅ | |
| 자동재생 + interval | ✅ (state 있음) | UI 노출 누락 — ⚙ 패널에 노출 필요 |
| **CTA 모양 (원형/직사각형/언더라인)** | 🆕 | P14 풀블리드 CTA 처리용 — 또는 splitSection에 위임 |
| **슬라이드 dot/arrow 표시 토글** | 🆕 | 단일 슬라이드 시 자동 숨김은 이미 동작 |
| **ken-burns / parallax 효과 (선택)** | 🆕 | optional |

### 3-3. `layoutContainer` (가장 큰 강화 대상)
P3 / P5 / P6 / P7 / P8 / P12 의 핵심. 이 위젯이 **벤토·탭·캐러셀·링크행** 까지 다 처리한다.

| 옵션 | 상태 | 비고 |
|------|------|------|
| cols 1~4 | ✅ | ⚙ 6열까지 확장 권장 |
| gap, paddingY, bgColor | ✅ | |
| 셀 단위 bg/padding/radius/border/align/title/text/img/imgPosition | ✅ | |
| **셀 colspan / rowspan (P3, P6)** | 🆕 | 각 셀에 `colSpan: 1~4`, `rowSpan: 1~3` |
| **모드 = grid / tabs / carousel (P7, P8)** | 🆕 | 동일 데이터(cells)를 다른 방식으로 표시 |
| **tabs 모드: 탭 라벨, 활성탭 색, 탭 위치(top/left)** | 🆕 | |
| **carousel 모드: autoplay, interval, arrow/dot 표시, 일시정지 버튼** | 🆕 | |
| **셀 hover 효과 (none/scale/lift/border)** | 🆕 | 카드 그리드의 표준 인터랙션 |
| **셀 클릭 href (P12)** | 🆕 | 셀 전체를 링크로 만드는 옵션 (target 포함) |
| **셀에 화살표 아이콘 표시 (P12)** | 🆕 | 라이트 아이콘 + 우측 정렬 |

### 3-4. `splitSection`
P10, P14, P1 일부.

| 옵션 | 상태 | 비고 |
|------|------|------|
| 이미지 좌/우, ratio 40/50/60 | ✅ | |
| fullBleed, minHeight | ✅ | |
| 뱃지, 제목, 본문, CTA | ✅ | |
| **이미지 영역 = 영상 임베드(youtube/vimeo) 옵션** | 🆕 | 영상이 풀블리드 히어로처럼 보이게 |
| **CTA 모양 (P14 원형 화살표 버튼)** | 🆕 | `ctaShape: rect / pill / circle-arrow / underline` |
| **텍스트 영역 vertical-align (top/center/bottom)** | 🆕 | |
| **이미지 = 비디오 대체 시 자동재생/음소거/loop** | 🆕 | |

### 3-5. `text`
| 옵션 | 상태 | 비고 |
|------|------|------|
| fontSize 8~200 / weight / lineHeight / letterSpacing / color | ✅ | |
| align, paddingTop/Bottom/Left/Right, maxWidth | ✅ | |
| animation(fadeIn/slideUp/slideIn/none) | ✅ | |
| SEO 시맨틱 태그 (h1~h6, p) | ✅ | |
| **인라인 강조(highlight color span)** | 🆕 | P2 풀블리드 카피의 일부 단어 강조용. 마크다운 `==text==` 또는 `**text**` → 테마 색 span 변환 |
| **gradient text** | 🆕 | 큰 타이포에 필수 (P2) — fill: solid / gradient |
| **text-shadow / stroke (outline)** | 🆕 | 풀블리드 이미지 위 가독성 보강 |

### 3-6. `image`
| 옵션 | 상태 | 비고 |
|------|------|------|
| src, alt, href, linkTarget | ✅ | |
| width %, radius, objectFit, paddingY | ✅ | |
| **maxHeight 옵션 (현재 500px 고정)** | 🆕 | 사용자가 200~1200px 조절 |
| **aspectRatio 강제 (1:1 / 16:9 / 4:3 / 21:9 / auto)** | 🆕 | 다이어그램 등 깨지면 안 됨 |
| **로딩 placeholder (skeleton/blur)** | 🆕 | LCP 최적화 |
| **hover 효과 (none / zoom / lift / overlay)** | 🆕 | |

### 3-7. `stats`
| 옵션 | 상태 | 비고 |
|------|------|------|
| layout(strip/cards) | ✅ | |
| cols 2~4 / valueSize / labelSize / 색상 | ✅ | |
| 카드 강조 라인 / cardBg / borderColor | ✅ | |
| count-up animation | ✅ | |
| **단위(prefix/suffix) 분리 입력** | ⚙ | 현재 `value` 문자열에 섞여 들어감. `value:number + prefix + suffix`로 분리 권장 |
| **아이콘: 이모지 + lucide 아이콘 선택** | ⚙ | 현재 이모지만 |

### 3-8. `members`
| 옵션 | 상태 | 비고 |
|------|------|------|
| cols 2~4 / imgStyle(circle/square) | ✅ | |
| accentStyle(none/top-line/ring) | ✅ | |
| 멤버 이름/역할/한줄/SNS/사진 | ✅ | |
| **소셜 링크 다중 (GitHub/Email/LinkedIn …)** | 🆕 | 현재 단일 sns 필드. 아이콘 자동 매칭 |
| **카드 hover 시 추가 정보 노출** | 🆕 | optional |

### 3-9. `gallery`
| 옵션 | 상태 | 비고 |
|------|------|------|
| layout(grid/featured) | ✅ | |
| cols 2~4 / gap / radius | ✅ | |
| 라이트박스 + 키보드 ← → | ✅ | |
| **masonry / bento(불규칙 높이) 옵션** | 🆕 | P3, P6의 이미지-only 변형용 |
| **이미지별 캡션** | 🆕 | alt 외에 사용자에게 보이는 caption 필드 |
| **이미지 클릭 href (라이트박스 비활성 모드)** | 🆕 | |

### 3-10. `quote`
| 옵션 | 상태 | 비고 |
|------|------|------|
| align(left/center) / maxWidth / paddingY / bgColor | ✅ | |
| fontSize / textColor / accentColor | ✅ | |
| attribution / avatarSrc | ✅ | |
| **인용 부호 스타일 (none/double/single/asian「」)** | 🆕 | P11처럼 부호 생략 옵션도 필요 |
| **인용문 + 출처 분리 카드 vs 인라인** | 🆕 | optional |

### 3-11. `faq`
| 옵션 | 상태 | 비고 |
|------|------|------|
| iconStyle(plus/arrow) | ✅ | |
| openBg / borderRadius | ✅ | |
| FAQPage 스키마 마크업 | ✅ | |
| **카테고리/탭 분류 (다수 FAQ 그룹)** | 🆕 | optional, 대형 FAQ에서 필요 |

### 3-12. `timeline`
| 옵션 | 상태 | 비고 |
|------|------|------|
| layout(vertical-left/center/horizontal) | ✅ | |
| activeColor / lineColor | ✅ | |
| **노드 이미지/아이콘 옵션** | 🆕 | 단순 번호 외 |

### 3-13. `button`
| 옵션 | 상태 | 비고 |
|------|------|------|
| actionType(url/scroll/modal) | ✅ | |
| btnSize(s/m/l) / 색 / radius / paddingY | ✅ | |
| **버튼 모양(rect/pill/circle-arrow/underline)** | 🆕 | P14, P12 대응 |
| **secondary 옵션(outline 스타일)** | 🆕 | |

### 3-14. `video`
| 옵션 | 상태 | 비고 |
|------|------|------|
| YouTube/Vimeo URL → embed | ✅ | |
| radius / paddingY / bgColor | ✅ | |
| **autoplay / muted / loop / controls 토글** | 🆕 | bg video 활용에 필요 |
| **풀블리드 모드** | 🆕 | |

### 3-15. `spacer`, `divider`
- 단순 위젯. 옵션 추가 불필요. 다만 spacer 높이 max 320 → **640px**로 확장 권장 (large 섹션 사이용).

---

## 4. 최우선 강화 항목 (Top 5)

레퍼런스 14개 패턴 중 **10개 패턴**이 이 5개 강화에 달려있다.

1. **`section` 위젯에 워터마크 텍스트 + 데코 셰이프 옵션** (P2, P13 → 4개 레퍼런스)
2. **`layoutContainer` 셀 colspan/rowspan** (P3, P6 → 3개 레퍼런스, 벤토의 핵심)
3. **`layoutContainer` 탭 모드** (P7 → 4개 레퍼런스, 모든 기업 사이트 단골)
4. **`layoutContainer` 캐러셀 모드 + 셀 hover/href** (P8, P12)
5. **`text` 위젯의 그라디언트/인라인 강조** (P2 풀블리드 타이포)

---

## 5. 예외처리 / 안전 한계 규칙

### 5-1. 수치 입력 clamp 테이블

| 항목 | 최소 | 최대 | 기본 | 검증 시점 |
|------|------|------|------|----------|
| `paddingY` (모든 위젯) | 0 | 200 | 위젯별 상이 | input change |
| `paddingX`, `gap` | 0 | 120 | 24~40 | input change |
| `fontSize` (text) | 8 | 200 | 16 | ⚠ 200 초과 시 모바일 깨짐 경고 |
| `fontSize` (워터마크) | 60 | 400 | 200 | |
| `lineHeight` | 1.0 | 3.0 | 1.7 | |
| `letterSpacing` | -0.1em | 0.3em | 0 | |
| `borderRadius` | 0 | 64 | 위젯별 | |
| `thickness` (divider) | 1 | 10 | 1 | |
| `height` (heroSlider) | 30vh | 100vh | 60vh | |
| `height` (spacer) | 8 | 640 | 64 | |
| `maxWidth` | 200 | 2400 | 위젯별 | |
| `minHeight` (splitSection fullBleed) | 200 | 900 | 520 | |
| `imgHeight` (cell) | 80 | 600 | 180 | |
| `cols` (layout/stats/members/gallery) | 1 | 6 | 3 | |
| `slides` 수 (heroSlider) | 1 | 8 | 1 | 9번째 추가 비활성 |
| `cells` 수 (layoutContainer) | 1 | 12 | 3 | |
| `items` 수 (stats) | 2 | 6 | 3 | ✅ (현재 6 제한 있음) |
| `items` 수 (members) | 1 | 24 | 3 | 24 초과 시 페이지네이션 권장 경고 |
| `items` 수 (faq) | 1 | 30 | 3 | |
| `items` 수 (timeline) | 1 | 12 | 3 | |
| `images` 수 (gallery) | 1 | 50 | 4 | 50 초과 시 lazy-load 강제 |
| `overlay opacity` | 0 | 90 | 0 | |
| `width %` (image, divider) | 10 | 100 | 100 | |
| `interval` (heroSlider/carousel) | 2000ms | 15000ms | 5000 | |

**구현 가이드**:
- `NumInput` / `Slider` 컴포넌트에 항상 `min` / `max` 전달.
- 사용자가 직접 type 입력 시도 `onChange`에서 `Math.min(Math.max(v, min), max)` clamp.
- clamp가 발생하면 토스트 "최대 N까지 입력 가능합니다" 안내.

### 5-2. 이미지 검증

업로드 시점에 단계별 검증:

1. **포맷**: `image/jpeg`, `image/png`, `image/webp` 만 허용. `svg` 는 별도 sanitize 후만 허용 (XSS).
2. **용량**: 최대 **10MB**. 초과 시 거절 + "5MB 이하 권장" 메시지.
3. **해상도 (px)**:
   - 최소: 200 × 200 (작은 이미지 → 화질 깨짐)
   - 최대: 6000 × 6000 (그 이상이면 자동 리사이즈 또는 거절)
   - Hero 슬라이드: 1920×1080 권장 (warning)
   - 멤버 아바타: 1:1 권장 (warning if abs(w/h - 1) > 0.2)
   - 갤러리: aspectRatio 제한 시 자동 crop 또는 letterbox 옵션
4. **자동 최적화 (권장)**:
   - 업로드 시 webp 변환 (jpeg quality 85)
   - 큰 이미지 자동 리사이즈 (long edge 2400px cap)
5. **로딩 실패 폴백**: `<img onerror>` → "이미지를 표시할 수 없습니다" 스켈레톤.

### 5-3. 텍스트 길이 제한

| 필드 | 최대 | 초과 시 |
|------|------|--------|
| Hero h1 (한 슬라이드) | 80자 | 반려 |
| Hero subtitle | 200자 | 반려 |
| Hero/splitSection CTA 텍스트 | 20자 | 반려 |
| Stats value | 12자 | 반려 |
| Stats label | 30자 | warning |
| Member name | 40자 | 반려 |
| Member role | 40자 | warning |
| Member bio | 200자 | 반려 |
| FAQ question | 200자 | warning |
| FAQ answer | 4000자 | 반려 |
| Quote text | 600자 | warning |
| Cell title | 60자 | warning |
| Cell text | 600자 | warning |
| Text 위젯 본문 | 8000자 | warning |

> `반려` = 입력 단계에서 차단, `warning` = 입력 허용 + 우측에 노란 인디케이터.

### 5-4. 색상·접근성 검증

- **WCAG AA 대비** (배경색 ↔ 텍스트 색): 4.5:1 미만이면 속성 패널에 노란 경고 "텍스트가 잘 안 보일 수 있습니다".
- **invalid hex**: `#fff` / `#ffffff` 만 허용. 길이 4/7이 아닌 입력은 onBlur 시점에 직전 valid 값으로 롤백.
- **theme 색 폴백**: `accentColor` 가 비어있으면 활성 테마 색.

### 5-5. URL / 링크 검증

- 외부 URL: `^https?://` 미충족 시 자동 `https://` prefix 또는 반려.
- YouTube/Vimeo URL: 정규식 매칭 실패 시 입력 패널에 빨간 라인 + 메시지 "지원하지 않는 URL". 임베드 실패 방어.
- 내부 스크롤 타겟(`actionType: scroll`): `actionTarget`이 페이지에 실제 존재하는 selector인지 저장 직전 검증.

### 5-6. 레이아웃 무결성

- **다중 heroSlider 경고**: 한 페이지에 heroSlider 가 2개 이상이면 상단에 경고 배너.
- **section nest 금지**: section 안에 다시 section 삽입 차단 (SECTION_WRAPPER_PLAN Step 3 참조).
- **layoutContainer cols × cells 일치성**: `cols=3`인데 cells가 2개면, 마지막 행 자동 정렬 + 우측 placeholder (편집 모드 한정).
- **고스트 셀**: cells 배열이 비면 "셀이 없는 컨테이너입니다" placeholder 출력. 퍼블릭 렌더에선 빈 렌더링.
- **maxWidth > 페이지 contentWidth**: clamp 또는 warning.

### 5-7. 성능 / 로딩

- **이미지 lazy-load**: 첫 화면(첫 hero) 이외의 모든 이미지 `loading="lazy"` 자동 부여.
- **첫 hero 슬라이드 bg는 preload**: LCP 최적화. `<link rel="preload" as="image">` 자동 주입.
- **gallery 50장 초과**: virtualized rendering or pagination 강제.
- **carousel autoplay**: 페이지가 inactive 탭일 때 일시정지 (IntersectionObserver + Page Visibility).
- **animation prefers-reduced-motion**: `@media (prefers-reduced-motion: reduce)` 시 모든 진입 애니메이션 비활성.

### 5-8. 저장/마이그레이션 안전

- block JSON에 정의되지 않은 `type`이 들어오면 `default: null` (현재 구현 ✅). 사용자에게는 "알 수 없는 위젯이 1개 있습니다" 인디케이터 표시.
- 필수 필드 누락 시 기본값으로 채우고 콘솔에 경고. 빈 렌더 vs 크래시 사이에서 빈 렌더 선택.
- structuredClone / 전개로 nested 상태 변경 시 referential identity 깨짐 방지 (SECTION_WRAPPER_PLAN Risk 표 참조).

### 5-9. 미발견 위험 (선제 점검 권장)

분석 중 추가로 식별된 잠재 이슈:

1. **iframe 동영상 권한**: `allow="autoplay"` 지정 시 일부 브라우저에서 muted 강제. autoplay 옵션 켜면 muted 자동 ON.
2. **풀블리드 + 모바일**: P1, P14 풀블리드 이미지는 모바일에서 잘림. art-direction (모바일 전용 이미지 src) 옵션 권장.
3. **워터마크 텍스트의 selectable 여부**: ghost 텍스트가 마우스 드래그 시 선택되면 UX 거슬림. `user-select: none` 강제.
4. **데코 셰이프의 overflow**: section 밖으로 튀어나오는 도형은 부모에 `overflow: hidden` 또는 명시적 clip 필요. 옵션화.
5. **gradient 텍스트 + 작은 폰트**: 16px 미만에서 그라디언트 텍스트는 가독성 떨어짐 → 24px 미만이면 warning.
6. **count-up animation 음수/소수**: 현재 정수 / 1자리 소수만 처리. 큰 소수(예: 3.1415926) 입력 시 표시 깨질 수 있음 → `value` 숫자 분리 필드 권장 (5-3과 연결).
7. **theme color 적용 누락**: 일부 위젯이 hardcode된 `#f97316` fallback을 가짐. activeTheme 변경 시 즉시 반영되도록 일관화 필요.
8. **i18n / RTL**: 현재 한국어 only 가정. RTL 환경에서 timeline horizontal · arrow 방향 깨짐 (현재 스코프 외, 메모만).
9. **이미지 alt 누락 SEO**: 접근성 + SEO 점수. 빈 alt 저장 시 속성 패널에 약한 인디케이터.
10. **drag-and-drop nested**: SECTION_WRAPPER_PLAN Risk 표대로 native nested D&D 회피 — 섹션 내는 ↑↓ 버튼만.

---

## 6. 다음 액션 (구현 시 우선순위)

| Step | 작업 | 의존 |
|------|------|------|
| 1 | SECTION_WRAPPER_PLAN.md 완료 (section 위젯) | 없음 |
| 2 | section 에 워터마크 텍스트 + 데코 셰이프 옵션 추가 | Step 1 |
| 3 | layoutContainer 셀 colspan/rowspan + 셀 href + hover | 없음 (병렬 가능) |
| 4 | layoutContainer 탭 모드 / 캐러셀 모드 | Step 3 |
| 5 | text 위젯 그라디언트 + 인라인 강조 | 없음 |
| 6 | splitSection 영상 임베드 옵션 + CTA 모양 옵션 | 없음 |
| 7 | 5-1 ~ 5-7 예외처리 일괄 적용 (NumInput/Slider clamp + 이미지 검증 + lazy-load + reduced-motion) | 위 전부 |

---

## 7. 검증 체크리스트 (구현 완료 판단 기준)

이 기준을 통과해야 "충분히 유연한 위젯 시스템" 이라 부른다.

- [ ] 8개 레퍼런스의 모든 섹션이 **신규 위젯 추가 없이** 위 14개 패턴 매핑표 그대로 재현 가능
- [ ] 모든 수치 입력이 5-1 clamp 범위를 벗어나지 않음 (e2e 테스트 1개)
- [ ] 10MB 이상 이미지 업로드 거절, 200×200 미만 거절, webp 자동 변환 동작
- [ ] WCAG AA 대비 4.5:1 미만일 때 속성 패널에 경고 표시
- [ ] 첫 hero 이미지가 `<link rel=preload>` 로 노출 (Lighthouse LCP 개선)
- [ ] `prefers-reduced-motion` 환경에서 모든 진입 애니메이션 정지
- [ ] 알 수 없는 block type 이 와도 페이지 크래시하지 않고 인디케이터만 표시
- [ ] 한 페이지에 heroSlider 2개 이상이면 경고 배너 노출
- [ ] 워터마크/데코 셰이프가 section 밖으로 안 튀어나옴 (overflow 처리)

---

_이 문서는 8개 gdweb 레퍼런스(`str_no=20945, 21175, 22114, 22317, 23718, 23796, 24154, 24474`) 분석을 기반으로 작성됨. 새 레퍼런스가 추가되면 §1 패턴 인벤토리부터 갱신할 것._
