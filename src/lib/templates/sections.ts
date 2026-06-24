/* ─────────────────────────────────────────────────────────────
   섹션 템플릿 레지스트리 — 1PAGE 웹 디자인 ②계층(WEBBUILDER_TEMPLATES_PLAN.md §10)
   "기업 홈페이지의 단일 섹션"을 동아리 맥락으로 옮긴 완성형 한 덩어리.

   원칙(메모리 정책 일치):
   - 신규 위젯/렌더 0. 기존 12위젯/섹션 스키마의 *데이터 프리셋*일 뿐이다.
     (mkSection / makeWidget / mkCell 와 동일 필드만 사용 → BlockBody 단일코어로 렌더)
   - 저작은 id 없이 한다. 삽입·미리보기 시 instantiateTemplate() 이 모든 노드에
     새 id 를 부여해 중복을 막는다(여러 번 삽입해도 안전).
   - 텍스트·항목 데이터는 편집 가능한 자리표시 카피(브랜드 전략 동아리 톤). 색/여백은
     섹션이 단독으로도 완결돼 보이도록 명시한다(테마색 폴백에 기대지 않음).
   ───────────────────────────────────────────────────────────── */

import { genId } from '../../components/blockKit';

/* 기업 홈페이지 표준 섹션 → 동아리 매핑. 모달 좌측 카테고리 순서/라벨의 단일 출처. */
export type TemplateCategory =
  | 'hero' | 'about' | 'features' | 'stats' | 'process'
  | 'team' | 'portfolio' | 'testimonial' | 'benefits' | 'history' | 'faq' | 'cta';

export const CATEGORY_META: { id: TemplateCategory; label: string; hint: string }[] = [
  { id: 'hero',        label: '메인 히어로',   hint: '첫 화면 — 동아리 한 줄 정체성' },
  { id: 'about',       label: '활동 소개',     hint: '우리가 어떤 활동을 하는지' },
  { id: 'features',    label: '활동 영역',     hint: '트랙·분과를 카드로' },
  { id: 'stats',       label: '성과 지표',     hint: '숫자로 보여주는 활동 성과' },
  { id: 'process',     label: '모집 절차',     hint: '지원 → 합류까지 단계' },
  { id: 'team',        label: '구성원',        hint: '운영진·멤버 소개' },
  { id: 'portfolio',   label: '프로젝트',      hint: '활동 결과·포트폴리오' },
  { id: 'testimonial', label: '부원 후기',     hint: '활동 경험 인용' },
  { id: 'benefits',    label: '활동 혜택',     hint: '들어오면 얻는 것' },
  { id: 'history',     label: '연혁',          hint: '동아리의 걸어온 길' },
  { id: 'faq',         label: '자주 묻는 질문', hint: '지원 전 궁금증 해소' },
  { id: 'cta',         label: '지원 유도',     hint: '마지막 한 번 더 — 지원하기' },
];

export interface SectionTemplate {
  id: string;
  category: TemplateCategory;
  name: string;
  desc: string;
  tags?: string[];
  /** mkSection / makeWidget 스키마와 동일한 단일 블록(section 또는 위젯). id 는 비워둔다. */
  block: any;
}

/* ── 저작 헬퍼 — 위젯 기본값을 채워 보일러플레이트를 줄인다. id 는 instantiate 가 채운다. ── */
const UNSPLASH = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const sec = (props: any, rows: any[]) =>
  ({ type: 'section', bgType: 'color', bgColor: '#ffffff', paddingY: 96, paddingX: 32, gap: 28, ...props, rows });
const row = (cols: number, columns: any[], extra: any = {}) =>
  ({ cols, gap: 32, colRatios: null, columns, ...extra });
const col = (...widgets: any[]) => ({ widgets });
const text = (props: any) =>
  ({ type: 'text', seoTag: 'p', align: 'left', fontSize: 16, fontWeight: 400, textColor: '#111827', lineHeight: 1.7, paddingY: 8, ...props });
const button = (props: any) =>
  ({ type: 'button', actionUrl: '', btnSize: 'm', borderWidth: 0, radius: 8, btnShadow: 'none', btnAnim: 'none', btnTemplate: 'solid', paddingY: 20, ...props });
const image = (props: any) =>
  ({ type: 'image', src: '', alt: '', width: 100, align: 'center', aspect: '4/3', objectFit: 'cover', radius: 12, ...props });
const cell = (props: any) =>
  ({ title: '', text: '', align: 'left', bgColor: '#ffffff', textColor: '#4b5563', titleColor: '#0a0a0a', titleSize: 19, textSize: 14, padding: 28, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', imgSrc: '', imgPosition: 'top', imgHeight: 180, ...props });

export const SECTION_TEMPLATES: SectionTemplate[] = [
  /* ════════════ 메인 히어로 ════════════ */
  {
    id: 'hero-dark-fullbleed', category: 'hero', name: '다크 풀블리드', tags: ['dark', 'image'],
    desc: '배경 이미지 + 큰 헤드라인 + 지원 버튼',
    block: sec(
      { bgType: 'image', bgImage: UNSPLASH('1522071820081-009f0129c71c', 1600), bgOverlay: 58, bgKenBurns: 'zoom', paddingY: 168, gap: 14 },
      [row(1, [col(
        text({ text: 'BRAND STRATEGY CLUB', align: 'center', fontSize: 13, fontWeight: 800, letterSpacing: 0.2, textColor: '#fbbf24', paddingY: 6 }),
        text({ seoTag: 'h1', text: '생각을 브랜드로\n만드는 사람들', align: 'center', fontSize: 58, fontWeight: 900, lineHeight: 1.1, letterSpacing: -0.02, textColor: '#ffffff', textReveal: 'char', revealStagger: 0.035, paddingY: 8 }),
        text({ text: '전략 · 디자인 · 콘텐츠를 한 팀에서 경험하는\n대학생 브랜드 실전 동아리입니다.', align: 'center', fontSize: 18, lineHeight: 1.8, textColor: '#e5e7eb', maxWidth: 620, paddingY: 8 }),
        button({ text: '지원하기', align: 'center', btnBg: '#ffffff', btnTextColor: '#0a0a0a', radius: 999, btnShadow: 'soft', btnSize: 'm', paddingY: 20 }),
      )])],
    ),
  },
  {
    id: 'hero-minimal-center', category: 'hero', name: '미니멀 센터', tags: ['light', 'minimal'],
    desc: '흰 배경 + 단어 리빌 헤드라인 + 아웃라인 버튼',
    block: sec(
      { bgColor: '#ffffff', paddingY: 144, gap: 14 },
      [row(1, [col(
        text({ text: '2019 — NOW', align: 'center', fontSize: 13, fontWeight: 800, letterSpacing: 0.22, textColor: '#9ca3af', paddingY: 6 }),
        text({ seoTag: 'h1', text: '우리는 매 학기\n진짜 프로젝트를 만듭니다', align: 'center', fontSize: 50, fontWeight: 900, lineHeight: 1.12, letterSpacing: -0.02, textColor: '#0a0a0a', textReveal: 'word', revealStagger: 0.05, paddingY: 8 }),
        text({ text: '기획부터 실행까지, 학교 밖에서도 통하는 결과물을 함께 쌓습니다.', align: 'center', fontSize: 17, lineHeight: 1.8, textColor: '#6b7280', maxWidth: 560, paddingY: 8 }),
        button({ text: '활동 둘러보기', align: 'center', btnBg: 'transparent', btnTextColor: '#0a0a0a', borderWidth: 2, borderColor: '#0a0a0a', radius: 8, btnSize: 'm', paddingY: 20 }),
      )])],
    ),
  },

  /* ════════════ 활동 소개 ════════════ */
  {
    id: 'about-split-image', category: 'about', name: '비대칭 매니페스토', tags: ['light', 'image'],
    desc: '좌측 글 + 우측 이미지 2단 구성',
    block: sec(
      { bgColor: '#fafafa', paddingY: 112 },
      [row(2, [
        col(
          text({ text: 'ABOUT US', fontSize: 13, fontWeight: 800, letterSpacing: 0.18, textColor: '#f97316', paddingY: 4 }),
          text({ seoTag: 'h2', text: '같이 만들고,\n같이 성장합니다', fontSize: 34, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.01, textColor: '#111827', paddingY: 8 }),
          text({ text: '혼자서는 막막한 브랜딩을, 매주 모여 함께 기획하고 손으로 만듭니다. 선배의 피드백과 실전 프로젝트로 한 학기 만에 포트폴리오 한 줄이 쌓입니다.', fontSize: 17, lineHeight: 1.9, textColor: '#4b5563', paddingY: 8 }),
        ),
        col(
          image({ src: UNSPLASH('1522071820081-009f0129c71c', 1000), alt: '함께 작업하는 모습', aspect: '4/3', radius: 16, width: 100 }),
        ),
      ], { gap: 48, colRatios: [1, 1] })],
    ),
  },
  {
    id: 'about-dark-manifesto', category: 'about', name: '다크 매니페스토', tags: ['dark', 'minimal'],
    desc: '검정 배경 + 강조 하이라이트 대형 문장',
    block: sec(
      { bgColor: '#0a0a0a', paddingY: 128, gap: 12 },
      [row(1, [col(
        text({ text: 'OUR MISSION', align: 'center', fontSize: 13, fontWeight: 800, letterSpacing: 0.22, textColor: '#fbbf24', paddingY: 6 }),
        text({ seoTag: 'h2', text: '브랜드는 로고가 아니라\n==사람들의 기억==입니다.', align: 'center', fontSize: 40, fontWeight: 800, lineHeight: 1.4, letterSpacing: -0.01, textColor: '#ffffff', highlightColor: '#fbbf24', maxWidth: 720, paddingY: 8 }),
        text({ text: '우리는 그 기억을 설계하는 법을 배우고, 실제로 만들어 봅니다.', align: 'center', fontSize: 17, lineHeight: 1.8, textColor: '#9ca3af', maxWidth: 560, paddingY: 6 }),
      )])],
    ),
  },

  /* ════════════ 활동 영역 (features) ════════════ */
  {
    id: 'features-accenttop-3col', category: 'features', name: '활동영역 3열 카드', tags: ['light'],
    desc: '상단 강조바 카드 3개 — 트랙 소개',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 3, gap: 20, paddingY: 88, bgColor: '#ffffff',
      cardStyle: 'accentTop', cardAccent: '#f97316', cellHover: 'lift', cellAnimation: 'slideUp',
      cells: [
        cell({ title: '🎯 브랜드 전략', text: '시장·타깃 분석부터 포지셔닝까지, 브랜드의 뼈대를 설계합니다.' }),
        cell({ title: '🎨 비주얼 디자인', text: '로고·그래픽·SNS 콘텐츠로 브랜드를 눈에 보이게 만듭니다.' }),
        cell({ title: '✍️ 콘텐츠 기획', text: '캠페인과 스토리로 브랜드의 메시지를 사람들에게 전합니다.' }),
      ],
    },
  },
  {
    id: 'features-numbered-3col', category: 'features', name: '활동영역 번호형', tags: ['light', 'minimal'],
    desc: '대형 인덱스 번호 3단계 — 활동 흐름',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 3, gap: 28, paddingY: 88, bgColor: '#fafafa',
      cardStyle: 'numbered', cardAccent: '#0a0a0a', cellHover: 'none', cellAnimation: 'fadeIn',
      cells: [
        cell({ title: '리서치', text: '레퍼런스를 모으고 문제를 정의합니다. 모든 프로젝트는 질문에서 시작합니다.', bgColor: 'transparent' }),
        cell({ title: '실행', text: '직접 만들어 봅니다. 전략 문서, 디자인, 콘텐츠가 한 학기 안에 나옵니다.', bgColor: 'transparent' }),
        cell({ title: '회고', text: '결과를 공유하고 피드백을 주고받습니다. 다음 시즌의 출발점이 됩니다.', bgColor: 'transparent' }),
      ],
    },
  },

  /* ════════════ 모집 절차 (process) ════════════ */
  {
    id: 'process-horizontal-4', category: 'process', name: '가로 4단계', tags: ['light'],
    desc: '큰 번호 가로 타임라인 — 지원→합류',
    block: {
      type: 'timeline', title: '모집은 이렇게 진행돼요', layout: 'horizontal', nodeStyle: 'bigNum',
      activeColor: '#f97316', lineColor: '#e5e7eb', nodeAnim: 'slideUp', nodeStagger: 0.12,
      nodes: [
        { title: '지원서 접수', desc: '온라인 폼을 작성해 제출합니다.' },
        { title: '서류 검토', desc: '활동 방향과 핏을 확인합니다.' },
        { title: '인터뷰', desc: '편하게 대화하는 짧은 면접입니다.' },
        { title: '합류', desc: 'OT와 함께 첫 프로젝트를 시작합니다.' },
      ],
    },
  },
  {
    id: 'process-vertical-4', category: 'process', name: '세로 라인 4단계', tags: ['light', 'minimal'],
    desc: '번호 원 + 세로 라인 — 지원 절차',
    block: {
      type: 'timeline', title: '지원 절차', layout: 'vertical-left', nodeStyle: 'number',
      activeColor: '#0a0a0a', lineColor: '#111827', nodeAnim: 'fadeIn', nodeStagger: 0.12,
      nodes: [
        { title: '지원서 접수', desc: '관심 분야와 간단한 자기소개를 받습니다.' },
        { title: '서류 검토', desc: '함께할 방향이 맞는지 살펴봅니다.' },
        { title: '인터뷰', desc: '서로를 알아가는 대화 중심 면접입니다.' },
        { title: '최종 합류', desc: '환영 OT 후 정식 부원으로 활동합니다.' },
      ],
    },
  },

  /* ════════════ 부원 후기 (testimonial) ════════════ */
  {
    id: 'testimonial-cards-2col', category: 'testimonial', name: '후기 카드 2열', tags: ['light'],
    desc: '아바타 + 인용 후기 카드 2개',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 2, gap: 20, paddingY: 88, bgColor: '#ffffff',
      cardStyle: 'plain', cellHover: 'lift', cellAnimation: 'slideUp',
      cells: [
        cell({ title: '“포트폴리오가 생겼어요”', text: '막연했던 브랜딩이 진짜 프로젝트로 채워졌어요. 끝나고 남은 결과물이 가장 큰 변화예요.\n\n— 김지원 · 24기', titleSize: 20, bgColor: '#fafafa', borderColor: '#ececec' }),
        cell({ title: '“혼자였다면 못 했을 일”', text: '선배 피드백이 날카롭지만 따뜻했어요. 팀으로 끝까지 완주하는 경험을 했습니다.\n\n— 이도현 · 23기', titleSize: 20, bgColor: '#fafafa', borderColor: '#ececec' }),
      ],
    },
  },
  {
    id: 'testimonial-carousel', category: 'testimonial', name: '후기 캐러셀', tags: ['light'],
    desc: '자동 넘김 후기 슬라이드',
    block: {
      type: 'layoutContainer', mode: 'carousel', cols: 2, gap: 20, paddingY: 88, bgColor: '#fafafa',
      autoplay: true, interval: 5000, cellHover: 'none',
      cells: [
        cell({ title: '박서연 · 22기', text: '“실전 경험이 이력서 한 줄로 끝나지 않고, 면접에서 말할 이야기가 됐어요.”' }),
        cell({ title: '최민준 · 24기', text: '“매주 모여 만드는 리듬이 좋았습니다. 한 학기가 빠르게 지나갔어요.”' }),
        cell({ title: '정하늘 · 23기', text: '“디자인을 1도 모르고 들어왔는데, 지금은 SNS 콘텐츠를 직접 만듭니다.”' }),
        cell({ title: '윤지호 · 24기', text: '“팀으로 끝까지 완주하는 경험. 그게 이 동아리의 진짜 가치예요.”' }),
      ],
    },
  },

  /* ════════════ 지원 유도 (cta) ════════════ */
  {
    id: 'cta-dark-banner', category: 'cta', name: '다크 CTA 배너', tags: ['dark'],
    desc: '검정 배너 + 지원 버튼',
    block: sec(
      { bgColor: '#0a0a0a', paddingY: 104, gap: 12 },
      [row(1, [col(
        text({ seoTag: 'h2', text: '이번 학기, 당신의 브랜드를 만들 차례', align: 'center', fontSize: 34, fontWeight: 900, lineHeight: 1.2, letterSpacing: -0.01, textColor: '#ffffff', textReveal: 'word', revealStagger: 0.05, paddingY: 8 }),
        text({ text: '지원은 5분이면 충분합니다.', align: 'center', fontSize: 17, textColor: '#9ca3af', paddingY: 4 }),
        button({ text: '지금 지원하기', align: 'center', btnBg: '#f97316', btnTextColor: '#0a0a0a', radius: 999, btnShadow: 'soft', btnFx: 'shine', btnSize: 'm', paddingY: 18 }),
      )])],
    ),
  },
  {
    id: 'cta-color-band', category: 'cta', name: '컬러 밴드 CTA', tags: ['vivid'],
    desc: '오렌지 밴드 + 좌측 문구 + 우측 버튼',
    block: sec(
      { bgColor: '#f97316', paddingY: 72 },
      [row(2, [
        col(
          text({ seoTag: 'h2', text: '궁금한 점이 있나요?', fontSize: 28, fontWeight: 900, lineHeight: 1.2, textColor: '#0a0a0a', paddingY: 4 }),
          text({ text: '인스타그램 DM으로 편하게 물어보세요. 모집 일정도 안내해 드려요.', fontSize: 16, lineHeight: 1.7, textColor: '#1f2937', paddingY: 4 }),
        ),
        col(
          button({ text: '문의하기', align: 'center', btnBg: '#0a0a0a', btnTextColor: '#ffffff', radius: 8, btnSize: 'm', paddingY: 28 }),
        ),
      ], { gap: 32, colRatios: [2, 1] })],
    ),
  },

  /* ════════════ 메인 히어로 (사진형 추가) ════════════ */
  {
    id: 'hero-split-photo', category: 'hero', name: '스플릿 + 사진', tags: ['light', 'image'],
    desc: '좌측 카피·버튼 + 우측 큰 사진',
    block: sec(
      { bgColor: '#ffffff', paddingY: 100 },
      [row(2, [
        col(
          text({ text: 'JOIN US 2026', fontSize: 13, fontWeight: 800, letterSpacing: 0.2, textColor: '#f97316', paddingY: 6 }),
          text({ seoTag: 'h1', text: '함께할 때\n더 멀리 갑니다', fontSize: 46, fontWeight: 900, lineHeight: 1.12, letterSpacing: -0.02, textColor: '#0a0a0a', paddingY: 8 }),
          text({ text: '매주 모여 기획하고 만들고 공유합니다. 한 학기가 끝나면 이력서가 아니라 이야기가 남습니다.', fontSize: 17, lineHeight: 1.8, textColor: '#4b5563', paddingY: 8 }),
          button({ text: '지원하기', btnBg: '#0a0a0a', btnTextColor: '#ffffff', radius: 999, btnSize: 'm', paddingY: 14 }),
        ),
        col(
          image({ src: UNSPLASH('1543269865-cbf427effbad', 1100), alt: '함께 활동하는 모습', aspect: '4/5', radius: 18, width: 100 }),
        ),
      ], { gap: 44, colRatios: [1, 1] })],
    ),
  },

  /* ════════════ 활동 영역 (사진형 추가) ════════════ */
  {
    id: 'features-photo-3col', category: 'features', name: '활동영역 사진 카드', tags: ['light', 'image'],
    desc: '사진 + 제목 + 설명 3열 카드',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 3, gap: 20, paddingY: 88, bgColor: '#ffffff',
      cardStyle: 'plain', cellHover: 'lift', cellAnimation: 'slideUp',
      cells: [
        cell({ title: '브랜드 전략', text: '타깃·포지셔닝을 분석해 브랜드의 방향을 잡습니다.', imgSrc: UNSPLASH('1517245386807-bb43f82c33c4', 800), imgPosition: 'top', imgHeight: 168, borderColor: '#ececec' }),
        cell({ title: '비주얼 디자인', text: '로고부터 SNS 콘텐츠까지 직접 손으로 만듭니다.', imgSrc: UNSPLASH('1561070791-2526d30994b5', 800), imgPosition: 'top', imgHeight: 168, borderColor: '#ececec' }),
        cell({ title: '콘텐츠 기획', text: '캠페인과 스토리로 메시지를 사람들에게 전합니다.', imgSrc: UNSPLASH('1542744173-8e7e53415bb0', 800), imgPosition: 'top', imgHeight: 168, borderColor: '#ececec' }),
      ],
    },
  },

  /* ════════════ 구성원 (team) ════════════ */
  {
    id: 'team-3col-photo', category: 'team', name: '운영진 3열', tags: ['light', 'image'],
    desc: '사진 + 이름 + 역할 카드 3개',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 3, gap: 20, paddingY: 88, bgColor: '#fafafa',
      cardStyle: 'plain', cellHover: 'lift', cellAnimation: 'slideUp',
      cells: [
        cell({ title: '김다은', text: '회장 · 브랜드 전략', align: 'center', titleSize: 17, textSize: 13, imgSrc: UNSPLASH('1494790108377-be9c29b29330', 600), imgPosition: 'top', imgHeight: 200, bgColor: '#ffffff', borderColor: '#ececec' }),
        cell({ title: '이준호', text: '부회장 · 디자인 리드', align: 'center', titleSize: 17, textSize: 13, imgSrc: UNSPLASH('1500648767791-00dcc994a43e', 600), imgPosition: 'top', imgHeight: 200, bgColor: '#ffffff', borderColor: '#ececec' }),
        cell({ title: '박서윤', text: '총무 · 콘텐츠 기획', align: 'center', titleSize: 17, textSize: 13, imgSrc: UNSPLASH('1438761681033-6461ffad8d80', 600), imgPosition: 'top', imgHeight: 200, bgColor: '#ffffff', borderColor: '#ececec' }),
      ],
    },
  },
  {
    id: 'team-4col-compact', category: 'team', name: '멤버 4열 컴팩트', tags: ['light', 'image'],
    desc: '사진 + 이름 4명 한 줄',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 4, gap: 16, paddingY: 80, bgColor: '#ffffff',
      cardStyle: 'minimal', cellHover: 'none', cellAnimation: 'fadeIn',
      cells: [
        cell({ title: '김다은', text: '24기 · 전략', align: 'center', titleSize: 15, textSize: 12, imgSrc: UNSPLASH('1494790108377-be9c29b29330', 500), imgPosition: 'top', imgHeight: 150 }),
        cell({ title: '이준호', text: '24기 · 디자인', align: 'center', titleSize: 15, textSize: 12, imgSrc: UNSPLASH('1500648767791-00dcc994a43e', 500), imgPosition: 'top', imgHeight: 150 }),
        cell({ title: '박서윤', text: '23기 · 콘텐츠', align: 'center', titleSize: 15, textSize: 12, imgSrc: UNSPLASH('1438761681033-6461ffad8d80', 500), imgPosition: 'top', imgHeight: 150 }),
        cell({ title: '정시우', text: '23기 · 기획', align: 'center', titleSize: 15, textSize: 12, imgSrc: UNSPLASH('1507003211169-0a1dd7228f2d', 500), imgPosition: 'top', imgHeight: 150 }),
      ],
    },
  },

  /* ════════════ 프로젝트 (portfolio) ════════════ */
  {
    id: 'portfolio-3col', category: 'portfolio', name: '프로젝트 3열', tags: ['light', 'image'],
    desc: '썸네일 + 제목 + 한 줄 + 화살표',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 3, gap: 20, paddingY: 88, bgColor: '#ffffff',
      cardStyle: 'plain', cellHover: 'lift', cellAnimation: 'slideUp',
      cells: [
        cell({ title: '카페 브랜드 리뉴얼', text: '로컬 카페의 아이덴티티를 새로 설계한 프로젝트', imgSrc: UNSPLASH('1559028012-481c04fa702d', 800), imgPosition: 'top', imgHeight: 180, showArrow: true, borderColor: '#ececec' }),
        cell({ title: '교내 축제 캠페인', text: 'SNS 콘텐츠로 참여율 3배를 만든 캠페인', imgSrc: UNSPLASH('1540575467063-178a50c2df87', 800), imgPosition: 'top', imgHeight: 180, showArrow: true, borderColor: '#ececec' }),
        cell({ title: '스타트업 협업', text: '실제 기업과 함께한 브랜드 전략 프로젝트', imgSrc: UNSPLASH('1600880292203-757bb62b4baf', 800), imgPosition: 'top', imgHeight: 180, showArrow: true, borderColor: '#ececec' }),
      ],
    },
  },
  {
    id: 'portfolio-2col-large', category: 'portfolio', name: '프로젝트 2열 대형', tags: ['light', 'image'],
    desc: '큰 썸네일 2개 — 대표작 강조',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 2, gap: 24, paddingY: 88, bgColor: '#fafafa',
      cardStyle: 'plain', cellHover: 'lift', cellAnimation: 'slideUp',
      cells: [
        cell({ title: '브랜드 리브랜딩 — 2025 가을', text: '시장 분석부터 비주얼까지, 한 학기 동안 완성한 대표 프로젝트입니다.', imgSrc: UNSPLASH('1517842645767-c639042777db', 1000), imgPosition: 'top', imgHeight: 240, showArrow: true, titleSize: 20, borderColor: '#ececec' }),
        cell({ title: '캠퍼스 캠페인 — 2025 봄', text: '교내 1,200명이 참여한 콘텐츠 캠페인의 기획과 실행 기록.', imgSrc: UNSPLASH('1552664730-d307ca884978', 1000), imgPosition: 'top', imgHeight: 240, showArrow: true, titleSize: 20, borderColor: '#ececec' }),
      ],
    },
  },

  /* ════════════ 성과 지표 (stats) ════════════ */
  {
    id: 'stats-strip-4', category: 'stats', name: '4지표 스트립', tags: ['light'],
    desc: '카운트업 숫자 4개 한 줄',
    block: {
      type: 'stats', layout: 'strip', cols: 4, paddingY: 64, bgColor: '#0a0a0a',
      valueColor: '#fbbf24', labelColor: '#9ca3af', valueSize: 48, labelSize: 13, animate: true, countDuration: 1.6,
      items: [
        { value: '200+', label: '누적 회원' },
        { value: '52', label: '완성 프로젝트' },
        { value: '7년', label: '운영 역사' },
        { value: '83%', label: '현업 진출률' },
      ],
    },
  },

  /* ════════════ 활동 혜택 (benefits) ════════════ */
  {
    id: 'benefits-3col', category: 'benefits', name: '혜택 3열', tags: ['light'],
    desc: '들어오면 얻는 것 3가지',
    block: {
      type: 'layoutContainer', mode: 'grid', cols: 3, gap: 20, paddingY: 88, bgColor: '#ffffff',
      cardStyle: 'accentTop', cardAccent: '#0a0a0a', cellHover: 'lift', cellAnimation: 'slideUp',
      cells: [
        cell({ title: '🚀 실전 포트폴리오', text: '말로만 듣던 프로젝트를 직접 끝까지 완주합니다.' }),
        cell({ title: '🤝 든든한 네트워크', text: '선배·동료·현업 멘토와 오래가는 관계를 만듭니다.' }),
        cell({ title: '💡 진짜 피드백', text: '결과물에 대한 솔직하고 날카로운 피드백을 받습니다.' }),
      ],
    },
  },

  /* ════════════ 연혁 (history) ════════════ */
  {
    id: 'history-vertical', category: 'history', name: '연혁 세로', tags: ['light'],
    desc: '연도별 발자취 세로 타임라인',
    block: {
      type: 'timeline', title: '걸어온 길', layout: 'vertical-left', nodeStyle: 'ring',
      activeColor: '#f97316', lineColor: '#e5e7eb', nodeAnim: 'fadeIn', nodeStagger: 0.1,
      nodes: [
        { title: '2019', desc: '브랜드 전략 동아리로 창립, 첫 9명의 멤버.' },
        { title: '2021', desc: '교내 축제 공식 브랜딩 파트너로 선정.' },
        { title: '2023', desc: '첫 기업 협업 프로젝트 진행, 누적 30건 돌파.' },
        { title: '2025', desc: '회원 200명, 현업 진출 동문 네트워크 구축.' },
      ],
    },
  },

  /* ════════════ 지원 유도 (이미지 풀블리드 추가) ════════════ */
  {
    id: 'cta-image-fullbleed', category: 'cta', name: '이미지 풀블리드 CTA', tags: ['dark', 'image'],
    desc: '배경 사진 + 어둡게 + 지원 버튼',
    block: sec(
      { bgType: 'image', bgImage: UNSPLASH('1531482615713-2afd69097998', 1600), bgOverlay: 62, paddingY: 128, gap: 12 },
      [row(1, [col(
        text({ seoTag: 'h2', text: '망설이는 사이,\n누군가는 시작합니다', align: 'center', fontSize: 38, fontWeight: 900, lineHeight: 1.18, letterSpacing: -0.01, textColor: '#ffffff', paddingY: 8 }),
        text({ text: '이번 기수 모집이 진행 중입니다. 지금 합류하세요.', align: 'center', fontSize: 17, textColor: '#e5e7eb', paddingY: 4 }),
        button({ text: '지원서 작성하기', align: 'center', btnBg: '#ffffff', btnTextColor: '#0a0a0a', radius: 999, btnShadow: 'soft', btnSize: 'm', paddingY: 16 }),
      )])],
    ),
  },
];

/* ── instantiate — 모든 노드에 새 id 부여(섹션 트리 + 위젯 item 배열까지). 삽입·미리보기 공용. ── */
export function instantiateTemplate(block: any): any {
  return cloneNode(block);
}
function cloneNode(node: any): any {
  const n: any = { ...node, id: genId() };
  if (Array.isArray(n.rows)) {
    n.rows = n.rows.map((r: any) => ({
      ...r, id: genId(),
      columns: (r.columns || []).map((c: any) => ({ ...c, id: genId(), widgets: (c.widgets || []).map(cloneNode) })),
    }));
  }
  for (const k of ['items', 'nodes', 'cells', 'slides']) {
    if (Array.isArray(n[k])) n[k] = n[k].map((it: any) => ({ ...it, id: genId() }));
  }
  return n;
}

/** 템플릿이 1개 이상 존재하는 카테고리만, CATEGORY_META 순서로 반환. */
export function categoriesInUse(): { id: TemplateCategory; label: string; hint: string }[] {
  const used = new Set(SECTION_TEMPLATES.map(t => t.category));
  return CATEGORY_META.filter(c => used.has(c.id));
}
