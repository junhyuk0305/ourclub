# OURCLUB — 디자인 시스템 SSOT

> **문서 목적**: 색·타이포·모서리·그림자·간격·컴포넌트의 단일 기준(SSOT). 모든 화면 UI는 이 문서를 따른다.
> **최종 개정일**: 2026. 06. 24 — 컨셉 **"AB · 따뜻한 세련"** 확정 (네오브루탈리즘 졸업).
> **확인용 데모**: [DESIGN_MASTER.html](DESIGN_MASTER.html) (이 문서의 시각 정본)
> **연관**: 브랜드 메시지·카피는 [OURCLUB_Brand_Identity.md](OURCLUB_Brand_Identity.md), 비주얼은 본 문서.

---

## 0. 컨셉 한 줄

> **"따뜻과 세련 사이"** — 웜 화이트 + 차분한 오렌지 3톤 + 옅은 소프트섀도. 토스의 깔끔함과 당근의 따뜻함 사이.

### 무엇이 바뀌었나 (네오브루탈리즘 → AB)
이전 구현은 **두꺼운 검정 테두리(border-3px)·하드섀도(4~8px)·각진 모서리**의 네오브루탈리즘이었다. 이는 브랜드 보이스("아임웹·토스 / 쉽고 친근 / 학생 운영진이 주인공")와 충돌했고, 순백+순흑 위의 고채도 오렌지가 "쨍하고 차갑게" 느껴졌다.

- **중성색을 웜톤으로**: 순백→웜화이트, 순흑→웜블랙, 회색→샌드 계열. 같은 오렌지가 훨씬 친근해진다.
- **오렌지를 차분하게 + 3톤으로**: `#F97316`(쨍) → 메인 `#EC6A2C` + 악센트 `#F97316` + 피치 `#F9B384`.
- **하드섀도 → 옅은 소프트섀도**: 평상시엔 거의 안 보이고, 호버·핵심에서만 은은하게.
- **각짐 → 둥근 통일**: 컨트롤 12px / 카드 16px.

> 🔒 **유지된 정체성**: 워드마크 **OURCLUB**, 오렌지 계열 강조, 흑백 대비의 골격. (오렌지 hex와 "순흑" 규정은 아래 팔레트로 갱신.)

---

## 1. 컬러 토큰

### 1.1 브랜드 오렌지 (3톤)
| 토큰 | HEX | 용도 |
|------|-----|------|
| `brand` (main) | **#EC6A2C** | 주 버튼·강조 텍스트·포커스 링 |
| `brand-dark` | **#E85F24** | 버튼 그라데이션 끝·hover |
| `brand-accent` | **#F97316** | 인증 뱃지 등 작은 포인트 악센트 |
| `brand-peach` | **#F9B384** | 그라데이션 광원·썸네일 placeholder |
| `brand-tint` | **#FDF2E9** | 연한 배경(칩·CTA·인용 블록) |

> 주 버튼 채움은 그라데이션 `linear-gradient(135deg, #F2782F → #E85F24)`.

### 1.2 웜 중성 (sand) + 잉크
| 토큰 | HEX | 용도 |
|------|-----|------|
| `ink` | **#1F1B18** | 제목·진한 텍스트·검정 면(카테고리 핀) |
| `sand-600` | **#6B6259** | 본문 텍스트 |
| `sand-500` | **#7A7066** | 보조 텍스트 |
| `sand-400` | **#A89E92** | 플레이스홀더·아주 약한 라벨 |
| `sand-300` | **#E6E0D7** | 인풋 테두리 |
| `sand-200` | **#EBE6DF** | 카드·구분 테두리(기본) |
| `sand-100` | **#F3EFE9** | 연한 면(테이블 헤더·세그먼트 배경) |
| `sand-50` | **#FAF8F5** | 페이지 배경 |
| surface | **#FFFFFF** | 카드·표면 |

### 1.3 상태색 (부드러운 톤 — bg/text 쌍, 테두리 생략 기본)
| 상태 | bg | text |
|------|----|----|
| 긍정(활동중·합격·완료) | #E7F3EC | #2F7D4F |
| 대기(검토대기·보완) | #FBF2DD | #9A7515 |
| 진행(검토중·진행중) | #E6EEF9 | #2D5FA6 |
| 부정(불합격·반려) | #FBE9E7 | #B23B2E |
| 비활성(휴면·탈퇴) | #F0ECE6 | #7A7066 |

> 기존 `bg-{c}-100 text-{c}-800 border-{c}-300`(테두리 있고 진한 -800)에서 → **테두리 없이 -700급 부드러운 톤**으로 갱신. `lib/statusColor.ts` 단일 진실원천에서 관리.

---

## 2. 형태 토큰

### 2.1 모서리 (radius)
| 토큰 | 값 | 용도 |
|------|----|----|
| `rounded-md` | 6px | 카테고리 핀 등 작은 직사각 태그 |
| `rounded-ctl` | 12px | 버튼·인풋·칩·작은 뱃지·아이콘칩 |
| `rounded-card` | 16px | 카드·모달·패널 |
| `rounded-full` | — | 점·아바타·단계 인디케이터·토글 |
> ❌ 각짐(rounded-none)·rounded-2xl/3xl 랜덤 혼용 금지.

### 2.2 테두리 (border)
- **기본 단일 규칙**: `1px solid sand-200`(카드·표면), 인풋은 `1px solid sand-300`.
- 강조 구분이 필요하면 색으로(예: `border-brand`), 두께로 풀지 않는다.
- ❌ border-2 / border-[3px] / border-4 변종 제거.

### 2.3 그림자 (shadow) — 옅게, 호버·강조 전용
| 토큰 | 값 | 용도 |
|------|----|----|
| `shadow-soft` | `0 2px 12px rgba(31,27,24,.06)` | 카드 평상시(아주 옅게) |
| `shadow-soft-lg` | `0 10px 28px rgba(236,106,44,.16)` | 카드 hover(오렌지 광) |
| `shadow-btn` | `0 6px 16px rgba(236,106,44,.26)` | 주 버튼 |
> ❌ 하드섀도 `shadow-[Npx_Npx_0_0_#000]` 전면 제거. 오프셋 0 하드섀도는 더 이상 쓰지 않는다.

### 2.4 간격 (spacing)
- 카드 패딩 `p-4`(작은 카드) ~ `p-6`(큰 패널). 섹션 세로 리듬 `py-24 md:py-32`. 카드 갭 `gap-5~6`.

### 2.5 타이포
- 폰트 **Pretendard**. 제목 `font-black`, 강조 `font-bold`, 본문 `font-medium`.
- 본문 색 `sand-600`, 제목 `ink`. 행간 제목 1.1~1.3 / 본문 1.5.

---

## 3. 아이콘
- 라이브러리 **lucide-react** 유지. **strokeWidth는 2.5**로 통일(기본 2는 너무 얇음).
- 상태 아이콘(✓/!/✕ 등)은 연한 상태색 칩(`rounded-ctl`, w-8 h-8) 안에 **굵은 글리프**로. 토스트·인라인 피드백 동일.

---

## 4. 컴포넌트 규칙 (요약)

| 컴포넌트 | 규칙 |
|----------|------|
| **Button** | primary=그라데이션+`shadow-btn`+hover lift / secondary=흰바탕+`border-sand-300` / ghost=투명+`text-brand`+hover `bg-brand-tint` / danger=red-500. radius `ctl`, `font-bold`. |
| **Card** | `bg-white border border-sand-200 rounded-card shadow-soft`. 클릭형은 `hover:shadow-soft-lg hover:-translate-y-1`. |
| **카테고리 핀** | 얇은 직사각 — `ink` 배경, `rounded-md`, `px-2 py-[2px]`, `text-[10px] font-bold`. |
| **상태 뱃지** | `rounded-ctl`, 부드러운 상태색(§1.3), 테두리 없음. |
| **인증 뱃지** | `brand-accent` 칩, 굵은 ✓. |
| **Input/Select/Textarea** | `border-sand-300 rounded-ctl`, 포커스 시 `border-brand` + 오렌지 링(`0 0 0 3px rgba(236,106,44,.15)`). 에러는 `border-red-400` + 빨강 헬퍼텍스트. |
| **Tabs** | 하단 `border-b-2 border-brand`(활성), 비활성 `text-sand-400`. |
| **Segmented** | `bg-sand-100` 트랙 + 활성 알약 `bg-white shadow-soft`. |
| **Table** | 헤더 `bg-sand-50` + `text-sand-500`, 행 구분 `border-sand-200`, hover `bg-sand-50`. |
| **Modal** | `rounded-card shadow-soft-lg`, 헤더 그라데이션. (기존 3px 테두리·8px 하드섀도 폐기) |
| **Toast/Alert** | 흰 바탕 + 상태색 테두리 + 상태 아이콘칩. |
| **Empty/Skeleton** | 중앙 정렬 아이콘+문구+CTA / 스켈레톤 `bg-sand-100 animate-pulse`. |
| **Pagination** | 활성 `btn-grad text-white`, 나머지 `border-sand-300`. |
| **웹빌더 블록** | 제목·본문·버튼·이미지·인용·구분선·리스트·통계 모두 위 토큰 사용(별도 스타일 금지). 인용=`border-l-4 border-brand bg-brand-tint`. |

---

## 5. 적용 순서 (코드 반영 로드맵)
1. **토큰 정의** — `src/index.css`에 `@theme`로 brand/sand/shadow/radius 등록.
2. **프리미티브 갱신** — `components/ui/Button·Card·Modal·StatusBadge·EmptyState` + `lib/statusColor.ts`.
3. **공개 영역** — Home → Clubs(동아리 찾기) → ClubDetail → B2BLounge → Stories.
4. **운영 영역** — admin/corp/master 대시보드·테이블·폼.
5. **웹빌더** — blockKit / widgetPresets / ClubPageRenderer.

> 각 단계는 데모([DESIGN_MASTER.html](DESIGN_MASTER.html))와 대조하며 진행. 토큰 밖 값(임의 hex·하드섀도·border 변종) 금지.

---

*본 문서는 OURCLUB 비주얼의 단일 기준 문서다. UI 변경 시 여기를 먼저 고치고 데모에 반영한 뒤 코드로 옮긴다.*
