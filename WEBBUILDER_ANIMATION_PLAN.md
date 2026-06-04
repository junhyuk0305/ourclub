# 레퍼런스급 1-page 빌더 — 디자인 패턴 분석 & 인터랙션 발전 기획

> 한국 웹디자인 큐레이션 갤러리 캡처에서 대표 25개 기업 사이트를 선별 → 공식 URL 검증 → 원본 HTML/JS 번들에서 라이브러리 시그니처를 직접 grep해 분석.
> 목적: 이 사이트들과 "비슷한 수준"의 1-page를 만들 수 있는 웹빌더로 발전시키기 위한 **기능 매핑 + 인터랙티브 애니메이션 카탈로그 + 기존 위젯 발전 기획**.
> 분석 일자: 2026-06-04. 라이브러리 단서는 raw 소스 실측(확정), 효과의 화면 위치는 일부 추정(본문 표기).

---

## 0. 한 줄 결론

> **고퀄리티의 정체는 "콘텐츠"가 아니라 "스크롤 연출"이다.** 25개 중 상위 티어는 예외 없이 `Lenis(관성 스크롤) + GSAP ScrollTrigger(scrub/pin) + SplitText(텍스트 리빌) + 풀스크린 히어로` 4종 세트를 깔고 있다. 우리 빌더가 "에이전시급"으로 보이려면 이 4종을 위젯/섹션 속성으로 내장하는 게 1순위다. 나머지(컬러·타이포·그리드)는 이미 우리가 어느 정도 가지고 있다.

> ⛔ **정책: 동영상(`<video>`)은 전면 배제한다.** 레퍼런스의 "비디오 히어로" 패턴은 우리 빌더에서 **이미지 + Ken Burns(느린 줌/팬) + 텍스트 리빌 + 패럴랙스**로 대체한다. 영상 무게/저작권/로딩 비용 없이 동등한 "풀스크린 임팩트"를 낸다. 본 문서의 모든 video 언급은 이 대체안으로 읽는다.

---

## 1. 25개 레퍼런스에서 추출한 "한국 에이전시급 1-page 공식"

### 1-1. 압도적 표준 스택 (실측 빈도)

| 기술 | 역할 | 채택 사이트(실측) | 빈도 |
|---|---|---|---|
| **GSAP + ScrollTrigger** | 스크롤 연동 모션 엔진 (reveal/pin/scrub) | 위메이드, 카카오게임즈, 에비스, 한화에너지, 한화로보틱스, 그린카, 넥스트에어로, GC녹십자, KMAC, 세방, 원텍, 빌라오아시스, STUDIO505 | **13+/25 (모던 사이트 거의 전부)** |
| **Lenis / ScrollSmoother** | 관성(스무스) 스크롤 — "프리미엄 감각"의 토대 | 에비스, 한화에너지, 한화로보틱스, 그린카, GC녹십자, KMAC, 세방, 원텍, STUDIO505 | **9+/25** |
| **Swiper / Slick** | 제품·뉴스·사업영역 캐러셀 | 거의 전부 | **20+/25** |
| **SplitText / Splitting.js / split-type** | 글자·단어 단위 텍스트 리빌·마스크 | 에비스, 한화에너지, 한화로보틱스, 넥스트에어로, 원텍, STUDIO505 | **6+/25** |
| **Odometer / 카운터** | 실적·수치 롤링 카운트업 | 원텍(Odometer), 현대글로비스(주가 티커), IR형 다수 | 다수 |
| **DrawSVG / MotionPath** | SVG 라인 드로잉·경로 모션 | GC녹십자, 원텍 | 상위 티어 |
| **마퀴 / 커스텀 커서 / Lottie** | 크리에이티브 디테일 레이어 | STUDIO505, 에비스 | 차별화층 |

### 1-2. 인터랙션 강도 티어 (참고: "업종"이 아니라 "캠페인성 vs 기관성"이 강도를 가른다)

- **최상위** (풀 GSAP 스위트): 원텍(ScrollSmoother·SplitText·ScrambleText·DrawSVG·Odometer), 한화에너지(pin 8·scrub 8), GC녹십자(Lenis+DrawSVG+MotionPath), 에비스, STUDIO505(WaveSurfer 오디오 파형까지)
- **상위** (Lenis+ScrollTrigger 표준): 한화로보틱스, 넥스트에어로, 그린카, 세방, KMAC, 위메이드, 카카오게임즈
- **중위** (모던 SPA, 모션은 번들 내부): 현대글로비스(Next.js·인터랙티브 맵), GS아트센터(Next.js·에이전시 제작), LG CNS(AEM), KT&G(Next.js·video)
- **하위/정적** (레거시 jQuery): 하이트진로, HD현대마린솔루션, 365mc — **반례. 우리 타깃은 이쪽이 아니다.**

> **시사점:** 우리 빌더의 목표 산출물은 "상위 티어"다. 즉 `관성 스크롤 + 스크롤 트리거 등장 + 풀스크린 히어로`를 기본 문법으로 깔아야 한다.

---

## 2. 핵심 인터랙티브 애니메이션 카탈로그 ★ (최우선 결과물)

> "고퀄로 보이는 부분"의 정체를 12개 named pattern으로 분해. 각 패턴 = 무엇 / 어디서(실측 사이트) / 임팩트 / 구현 난이도 / 빌더 적용 방식.

| # | 패턴 | 정의 | 실측 출처 | 임팩트 | 난이도 |
|---|---|---|---|---|---|
| **A1** | **관성 스무스 스크롤** | 휠 입력을 감속/관성 처리해 부드럽게 흐르는 스크롤 | 에비스·한화E·GC·세방·원텍·그린카 | ★★★ (전체 톤 결정) | 中 (전역 1회) |
| **A2** | **스크롤 진입 리빌** | 뷰 진입 시 fade/slide-up/clip으로 등장 | 전 사이트 | ★★★ | 低 (이미 보유) |
| **A3** | **Sticky Pin 섹션** | 섹션을 화면에 고정한 채 스크롤로 내부 콘텐츠 단계 전개 | 한화E(pin8)·원텍(pinBx)·LG엔솔 | ★★★ (가장 "에이전시"하게 보임) | 高 |
| **A4** | **Scrub 스크롤 연동** | 스크롤 진행도(0~1)에 모션/영상 프레임을 1:1 결박 | 한화E(scrub8)·넥스트에어로 | ★★★ (중공업·테크 시그니처) | 高 |
| **A5** | **텍스트 라인/글자 리빌** | 헤드라인을 줄·단어·글자로 쪼개 stagger 등장(마스크) | 에비스·한화·원텍·STUDIO505 | ★★★ (카피 임팩트) | 中 |
| **A6** | **풀스크린 이미지 히어로 (동영상 대체)** | 이미지 배경 + **Ken Burns(느린 줌/팬)** + 오버레이 그라데이션 + 카피 텍스트 리빌 + SCROLL DOWN. ⛔동영상 미사용 | 위메이드·KT&G·GC·세방(이미지로 대체) | ★★★ | 低 |
| **A7** | **숫자 카운터 / 오도미터** | 실적·수치가 0→목표로 롤링 카운트업 | 원텍(Odometer) | ★★ (이미 보유, 고도화 여지) | 低 (보유) |
| **A8** | **Stagger 그리드 리빌** | 카드/리스트가 시차를 두고 순차 등장 | 한화·전 사이트 | ★★ (보유, 하드코딩) | 低 (보유) |
| **A9** | **Parallax 레이어** | 배경/전경이 다른 속도로 이동해 깊이감 | 한화E(yPercent8)·다수 | ★★ | 中 |
| **A10** | **SVG 라인 드로잉 / 모션패스** | 선이 그려지거나 요소가 경로 따라 이동(분자·네트워크·파이프라인) | GC(DrawSVG)·원텍 | ★★ (테크·제약 차별화) | 高 |
| **A11** | **무한 마퀴 띠** | 텍스트/로고가 무한 흐름 | STUDIO505·커넥트웨이브(로고) | ★★ (보유: Ticker) | 低 (보유) |
| **A12** | **커스텀 커서 / Lottie 마이크로** | 마우스 추종 커서, 아이콘 마이크로 모션 | 에비스·STUDIO505(lordIcon) | ★ (디테일 마감) | 中 |

### 카탈로그 우선순위 (빌더 내장 순서)
1. **즉효 + 저비용:** A6(이미지 히어로 + Ken Burns), A2(리빌 고도화), A7·A8·A11(보유 자산 고도화)
2. **차별화 핵심:** A1(스무스 스크롤), A5(텍스트 리빌), A9(parallax)
3. **에이전시 결정타:** A3(pin), A4(scrub), A10(SVG draw) — 고난도지만 "수준 차이"를 만드는 지점
4. **마감 디테일:** A12(커서/Lottie)

---

## 3. 디자인 패턴 → 빌더 기능 매핑 (Gap Analysis)

> 우리 현황 출처: `blockKit.tsx`(WB_STYLE·AnimDiv·블록 11종), `BlockPropertiesPanel.tsx`(속성 패널). 현재는 **순수 CSS 키프레임 6종 + IntersectionObserver 1회 리빌 + hover 3종**. `motion@12`가 설치돼 있으나 **import 안 됨(미사용)**.

| 패턴 | 레퍼런스 빈도 | 우리 현황 | 갭 / 필요 작업 | 우선순위 |
|---|---|---|---|---|
| 스크롤 진입 리빌 (A2) | 100% | ✅ AnimDiv(fadeIn/slideUp/slideIn/zoomIn/pulse/bounceIn), IO 1회 | easing·duration·delay·threshold·방향 **사용자 제어 UI 부재**. clip/mask 리빌 없음 | **P0** |
| 관성 스무스 스크롤 (A1) | 9+/25 | ❌ 없음 | Lenis 전역 도입 + 페이지 설정 토글 | **P0** |
| 풀스크린 이미지 히어로 (A6, 동영상 대체) | 8+/25 | ⚠️ 섹션 이미지 배경은 있으나 정적 | 섹션 배경 이미지에 **Ken Burns**(느린 줌/팬) + 오버레이 그라데이션 옵션. ⛔video 미도입 | **P0** |
| 숫자 카운터 (A7) | 다수 | ✅ StatsBlock(IO+rAF 1500ms) | easing·구분기호·접두/접미·소수 자리 옵션 + 트리거 정교화 | **P1** |
| Stagger 그리드 (A8) | 다수 | ⚠️ `cellIdx*0.08` 하드코딩 | stagger 간격/시작지연 사용자 입력화 | **P1** |
| 텍스트 라인/글자 리빌 (A5) | 6+/25 | ❌ 없음 | 텍스트 블록에 `textReveal`(line/word/char + mask) 옵션 | **P1** |
| 무한 마퀴 (A11) | 다수 | ✅ Ticker(divider) | 로고/이미지 마퀴로 확장, 속도·방향·hover-pause | **P1** |
| Parallax 레이어 (A9) | 다수 | ❌ 없음 | 섹션 배경/이미지 위젯에 `parallaxSpeed` | **P2** |
| Sticky Pin 섹션 (A3) | 상위 티어 | ❌ 없음 | 섹션 `pin`(stick + 내부 step 전개) — GSAP ScrollTrigger 필요 | **P2** |
| Scrub 스크롤 연동 (A4) | 상위 티어 | ❌ 없음 | 위젯 `scrubAnim`(스크롤 진행도 → transform/opacity) | **P2** |
| SVG 라인 드로잉 (A10) | 상위 티어 | ❌ 없음 | 전용 위젯(분자/네트워크/라인) — 후순위 | **P3** |
| 커스텀 커서 / Lottie (A12) | 차별화층 | ❌ 없음 | 페이지 옵션 커스텀 커서 + Lottie 위젯 | **P3** |
| Hover 효과 | 다수 | ✅ lift/scale/border | tilt(3D)·glow·magnetic 추가 | **P2** |
| 페이지 전환 트랜지션 | SPA 사이트 | ❌ (1-page라 해당 약함) | 앵커 스무스 스크롤로 대체 | — |

### 엔진 결정 (중요 트레이드오프)
- **레퍼런스 = GSAP 일색.** 게다가 **2025년 GSAP 전 플러그인(SplitText·ScrollSmoother·DrawSVG·MotionPath 포함)이 상업용까지 100% 무료화**됨 → 도입 비용 장벽 사라짐.
- 그러나 빌더는 **사용자 발행 페이지마다 GSAP를 풀로 싣는 건 성능 부담**. → **2-tier 전략 권장:**
  - **Tier-1 (기본·무라이브러리):** 현재 CSS 키프레임 + IntersectionObserver로 A2/A7/A8/A11 처리. 제로 의존성, 모든 페이지 기본 적용.
  - **Tier-2 (opt-in·지연로드):** 섹션에 A1/A3/A4/A5/A9가 하나라도 켜진 페이지에서만 GSAP+ScrollTrigger+Lenis를 **lazy import**. 안 쓰는 페이지는 0kb.
- `prefers-reduced-motion`은 이미 준수 중 → Tier-2도 동일 가드 적용.

---

## 4. 기존 위젯 애니메이션 발전 기획 (위젯별 Current → Upgrade)

> 원칙(CLAUDE.md §3 surgical): 기존 `AnimDiv`/`WB_STYLE`/속성 패널 구조를 **재사용·확장**하지, 갈아엎지 않는다. 새 속성은 모두 optional(미설정 시 현재 동작 유지).

### 4-1. 공통 인프라 (먼저 깔 것)
1. **`AnimDiv` 고도화** [blockKit.tsx AnimDiv]: 현재 고정 easing/duration → `{ animation, duration, delay, easing, distance, threshold, once }` props 수용. 속성 패널에 "모션" 공통 섹션 신설(현재는 위젯마다 산발적).
2. **전역 스크롤 컨텍스트**: 페이지 설정에 `smoothScroll`(Lenis) on/off. 켜지면 Lenis lazy-init, 끄면 네이티브.
3. **`ScrollReveal` 훅 분리**: StatsBlock의 IO 로직을 `useInView(threshold, once)` 공용 훅으로 추출 → 모든 위젯이 재사용.

### 4-2. 위젯별
| 위젯 | 현재 | 업그레이드 |
|---|---|---|
| **text** | animation 4종 | + `textReveal`(line/word/char·mask), + easing/duration/delay 노출, + 그라데이션 텍스트·하이라이트 스윕 |
| **button** | btnAnim 6종 | + `magnetic`(커서 추종), + hover시 화살표 슬라이드/배경 와이프, + ripple |
| **image** | 정적 | + `parallaxSpeed`, + 진입 clip-reveal(마스크 열림), + hover zoom/tilt(3D) |
| **heroSlider** | 이미지 슬라이드(slide/fade) | + **Ken Burns(느린 줌·팬)**, + 진행 인디케이터 애니메이션, + SCROLL DOWN 큐 (⛔동영상 슬라이드 제외) |
| **stats** | IO+rAF 카운트 | + easing 곡선, + 천단위 구분/접두접미/소수, + odometer 롤링 스타일, + 아이콘 Lottie 동기 재생 |
| **timeline** | 정적 다이어그램 | + 스크롤 진행에 따라 라인 **DrawSVG**식 그려짐, + 노드 stagger 등장 |
| **faq** | grid-rows 0fr↔1fr | (양호) + 아이콘 morph, + 열릴 때 내용 fade-in 시차 |
| **divider/Ticker** | 무한 마퀴 | + **로고/이미지 마퀴**, + hover-pause, + 방향/속도 UI, + edge fade mask |
| **layoutContainer** | cellAnimation·hover | + 카드 3D tilt(마우스), + stagger 간격 노출, + 탭 전환 트랜지션 |
| **section** | bg색·워터마크·shape | + **Ken Burns 배경 이미지**, + parallax 배경, + `pin`(sticky 단계 전개), + scrub 진입 (⛔video 제외) |

---

## 5. 단계별 로드맵

```
P0 ✅ 완료 (즉효·저위험, 라이브러리 0):
  1. ✅ AnimDiv 고도화: duration/easing(프리셋4)/distance 를 CSS변수로 제어 + 신규 리빌 clipUp(마스크)/blurIn/slideRight
  2. ✅ 섹션 배경 Ken Burns(zoom/zoomout/panL/panR) + 하단 그라데이션 오버레이 (⛔동영상 대체)
  3. ✅ 텍스트/버튼 패널에 모션 속성 노출(슬라이더/Seg)

P1 ✅ 완료 (차별화, 라이브러리 0~경량):
  4. ✅ 텍스트 단어/글자 단위 리빌(RevealText, stagger 슬라이더, 하이라이트 보존) — text 위젯 옵션
  5. ✅ stats 카운트 속도 슬라이더 + Ticker 방향/가장자리페이드/hover정지 (기존 위젯 패널 확장)
  6. ✅ Lenis 관성 스무스 스크롤 — 전역 속성 토글(기본 OFF), 공개 페이지에서만 동적 import

P2 (에이전시 결정타, GSAP lazy):  →선행조건: 빌드/실행 환경에서 시각 QA 가능해야 함(아래 주의)
  7. GSAP+ScrollTrigger lazy 로더 (Tier-2 페이지만)
  8. 섹션 parallax / sticky pin
  9. 위젯 scrub 스크롤 연동, 3D tilt/magnetic

P3 (마감 디테일) — 단, ⚠️신규 위젯 추가는 지양(기존 위젯 패널 옵션 우선, 드래그 슬라이더 활용):
  10. SVG 라인 드로잉(timeline 위젯 옵션), Lottie(아이콘 옵션), 커스텀 커서(페이지 옵션)
```

> ⚠️ **개발 원칙(고정):** 새 위젯 타입 남발 금지. 기능은 **기존 위젯 + 우측 속성 패널의 드래그 슬라이더(정도조절 바)** 로 확장한다. P1의 마퀴·텍스트 리빌도 신규 위젯이 아니라 divider/text 위젯의 패널 옵션으로 구현됨.

> 🛠 **빌드 환경 주의:** 현재 `npx vite build`(프로덕션 rollup 번들)가 이 머신에서 네이티브 크래시(`0xC0000409 STATUS_STACK_BUFFER_OVERRUN`)로 종료됨 — **내 변경과 무관(원본 HEAD도 동일 크래시), 기존 환경 이슈**. 개발/검증은 `npm run dev`(esbuild, 정상) + `tsc --noEmit`(정상)로 수행. P2 스크롤 연출은 시각 튜닝이 필수라, 빌드 크래시를 먼저 해결하거나 dev 서버로 QA한 뒤 진행 권장.

### 검증 기준 (CLAUDE.md §4)
- 각 단계: **기존 발행 페이지 시각 회귀 없음**(미설정 위젯은 현재와 동일 렌더).
- 성능: Tier-2 안 쓰는 페이지에 GSAP/Lenis 번들이 **0kb**여야 함(lazy import 검증).
- 접근성: 모든 신규 모션이 `prefers-reduced-motion`에서 비활성.

---

## 부록 A. 25개 레퍼런스 URL + 스택 (실측)

| 기업 | URL | 핵심 스택(실측) | 티어 |
|---|---|---|---|
| 위메이드 | https://www.wemade.com/ | Next.js, GSAP+ScrollTrigger, Swiper, video | 상 |
| 카카오게임즈 | https://www.kakaogamescorp.com/ | Next.js, GSAP+ScrollTrigger, video | 상 |
| 에비스맥주 | https://yebisu.kr/ | GSAP+ScrollTrigger+ScrollTo, Lenis, split-type, ScrollReveal, Swiper | 최상 |
| 하이트진로 | https://www.hitejinro.com/ | jQuery 레거시 (정적) | 하 |
| STUDIO505 | https://studio505.co.kr/ | GSAP, Lenis, AOS, Swiper, splitType, marquee, WaveSurfer, lordIcon | 최상 |
| 빌라오아시스 | https://villaoasis.co.kr/ | Imweb + GSAP3.11+ScrollTrigger, Swiper11 | 중상 |
| HD현대마린솔루션 | https://www.hd-marinesolution.com/ | RequireJS+jQuery (정적) | 하 |
| 한화에너지 | https://hec.hanwha.co.kr/ko | GSAP+ScrollSmoother+ScrollTrigger+SplitText, Lenis, WOW, Swiper (pin8/scrub8) | 최상 |
| 한화로보틱스 | https://hanwharobotics.com/ | GSAP+ScrollTrigger, splitting, Lenis, smooth-scrollbar, Swiper+Slick, Vimeo | 상 |
| 현대글로비스 | https://www.glovis.net/ko/home | Next.js, 인터랙티브 맵, 주가 티커 | 중 |
| 그린카 | https://www.greencar.co.kr/ | GSAP+ScrollTrigger, Lenis, Swiper (Thymeleaf) | 상 |
| 넥스트에어로스페이스 | https://nextaerospace.co.kr/ | GSAP+ScrollTrigger+SmoothScroll, splitting, Swiper+Slick (scrub) | 상 |
| LG CNS | https://www.lgcns.com/ | Adobe AEM, 스크롤 리빌(추정) | 중 |
| LG에너지솔루션 | https://www.lgensol.com/ | 풀스크린 히어로, 스크롤 리빌(추정) | 중 |
| 커넥트웨이브 | https://connectwave.co.kr/ | SVG 다수, '파도' 모티프 모션(추정) | 중 |
| KT&G | https://www.ktng.com/ | Next.js, video 히어로(확인) | 중 |
| 신도리코 | https://www.sindoh.com/ | 슬로건 타이포 리빌(추정) | 중 |
| 도루코 | https://dorco.co.kr/ | 제품 카탈로그형(정적 경향) | 하중 |
| 365mc | https://www.365mc.co.kr/v2/ | slick+swiper+bxslider, jQuery (정적) | 하 |
| GC녹십자 | https://www.gcbiopharma.com/ | Lenis, GSAP+ScrollTrigger+DrawSVG+MotionPath, video, slick | 최상 |
| 삼성바이오에피스 | https://www.samsungbioepis.com/ | fullPage.js(섹션 스냅), Swiper, video | 상 |
| GS아트센터 | https://www.gsartscenter.com/ | Next.js(에이전시 ManualGraphics 제작) | 중 |
| KMAC | https://www.kmac.co.kr/ | Lenis, GSAP+ScrollTrigger, AOS, Swiper+Slick | 상 |
| 세방그룹 | https://www.sebanggroup.com/ | Vue3, Lenis, GSAP+ScrollTrigger, video 20+ | 상 |
| 원텍 | https://wtlaser.com/ | GSAP ScrollSmoother+SplitText+ScrambleText+DrawSVG+MotionPath+Odometer | 최상 |

## 부록 B. 분석 신뢰도 / 한계
- 라이브러리 src·CSS 플러그인은 **raw HTML 직접 grep으로 확정**.
- Next.js 사이트(글로비스·GS아트센터·KT&G 일부)는 번들 난독화로 라이브러리 종류 **추정**.
- 각 효과의 "어느 섹션에 적용"은 GSAP 호출 패턴(pin/scrub/stagger 카운트)+도메인 지식 기반 **추론**(본문 표기).
- **정체 정정:** STUDIO505=음악 레코딩 스튜디오, 빌라오아시스=한옥 터프팅 공방(동명 사이트 다수, 의도 대상과 다르면 재지정 필요).
- 정적 모션의 시각적 정밀 확인이 필요하면 Playwright(`webapp-testing`/`qa` 스킬)로 라이브 렌더 후속 캡처 권장.
