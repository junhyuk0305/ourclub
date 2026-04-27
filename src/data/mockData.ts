export const marqueeEvents = [
  "🔥 마케팅 동아리 '마제스티', 기업 A 신제품 프로모션 성공적 수주 완료",
  "🔒 IT 동아리 '코드크래프트', 14기 운영진 전원 안전 검증 통과",
  "💼 창업 동아리 '스타터스', 시드 투자 유치 및 B2B 협약 체결",
  "🏆 기획 동아리 '플래너스', 13기 누적 회비 100% 투명 공개 달성",
];

export const storyShowcase = [
  { id: 1, tag: "기업 A 프로모션 수주", title: "마케팅 동아리 '마제스티', 3주 만에 B2B 실무 프로젝트 성공적 마무리!", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=500&q=60" },
  { id: 2, tag: "누적 회비 100% 공개", title: "기획 연합 동아리 '플래너스', 1년 치 예산 집행 내역 완벽 증빙", img: "https://images.unsplash.com/photo-1554200876-56c2f25224fa?auto=format&fit=crop&w=500&q=60" },
  { id: 3, tag: "해커톤 공동 주최", title: "IT 동아리 '코드크래프트', 스타트업 B와 전국 규모 해커톤 개최", img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=500&q=60" },
  { id: 4, tag: "신규 오렌지 뱃지", title: "문화예술 동아리 '아티잔', 안전 검증 서류 100% 통과로 뱃지 획득", img: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=500&q=60" },
];

export const homeClubsData = [
  { id: 1, name: "마제스티 (Majesty)", category: "마케팅/기획", badge: true, factor: "B2B 수주", status: "모집중", desc: "실무진과 함께하는 B2B 마케팅 대행 프로젝트", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=300&q=60" },
  { id: 2, name: "코드크래프트", category: "IT/개발", badge: true, factor: "안전 검증", status: "마감", desc: "100% 신원 보장된 개발자 네트워킹", img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=300&q=60" },
  { id: 3, name: "스타터스", category: "창업", badge: true, factor: "경쟁률 탑", status: "모집중", desc: "예비 창업가들의 실전 B2B 검증 요람", img: "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=300&q=60" },
  { id: 4, name: "아티잔", category: "문화/예술", badge: true, factor: "투명성", status: "모집중", desc: "예산 집행률 100% 공개, 투명한 전시 기획", img: "https://images.unsplash.com/photo-1460518451285-83b620bc2472?auto=format&fit=crop&w=300&q=60" },
];

export const CLUBS_DATA = [
  {
    id: 1, name: '마제스티 (Majesty)', category: '마케팅/기획', isRecruiting: true, dDay: 3, badge: true,
    factors: ['예산 공개 100%', 'B2B 수주 3건 이상'], tags: ['#실무마케팅', '#기획'],
    stats: { project: 5, budget: 100, comp: '4:1' },
    img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=500&q=60'
  },
  {
    id: 2, name: '코드크래프트', category: 'IT/개발', isRecruiting: false, dDay: null, badge: true,
    factors: ['예산 공개 100%', '공간 지원/후원'], tags: ['#웹개발', '#해커톤'],
    stats: { project: 2, budget: 100, comp: '2.5:1' },
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=500&q=60'
  },
  {
    id: 3, name: '스타터스', category: '창업', isRecruiting: true, dDay: 10, badge: true,
    factors: ['B2B 수주 3건 이상', '평균 경쟁률 3:1 이상', '공간 지원/후원'], tags: ['#예비창업', '#IR피칭'],
    stats: { project: 8, budget: 85, comp: '7:1' },
    img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=500&q=60'
  },
  {
    id: 4, name: '아티잔', category: '문화/예술', isRecruiting: true, dDay: 1, badge: true,
    factors: ['예산 공개 100%'], tags: ['#전시기획', '#디자인'],
    stats: { project: 1, budget: 100, comp: '1.5:1' },
    img: 'https://images.unsplash.com/photo-1460518451285-83b620bc2472?auto=format&fit=crop&w=500&q=60'
  },
  {
    id: 5, name: '데이터포스', category: 'IT/개발', isRecruiting: true, dDay: 5, badge: true,
    factors: ['평균 경쟁률 3:1 이상', 'B2B 수주 3건 이상'], tags: ['#데이터분석', '#AI'],
    stats: { project: 4, budget: 90, comp: '5:1' },
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=60'
  },
  {
    id: 6, name: '크리에이티브랩', category: '마케팅/기획', isRecruiting: false, dDay: null, badge: true,
    factors: ['공간 지원/후원'], tags: ['#광고기획', '#카피라이팅'],
    stats: { project: 1, budget: 60, comp: '2:1' },
    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=60'
  }
];

export const PROJECTS_DATA = [
  {
    id: 1,
    company: '(주)뷰티이노베이션',
    title: 'Z세대 타겟 신제품 런칭 바이럴 캠페인 기획 및 실행',
    category: '마케팅/SNS',
    reward: '활동비 200만원 + 우수자 인턴 기회',
    requirements: '10명 이상 규모, SNS 채널 운영 필수',
    deadline: 'D-5',
    status: 'OPEN',
    tags: ['#바이럴마케팅', '#뷰티', '#오프라인팝업']
  },
  {
    id: 2,
    company: '로컬스테이',
    title: '지역 기반 숙박 앱 사용성 테스트(UT) 및 리서치',
    category: 'IT/기획',
    reward: '팀 지원금 80만원 + 수료증',
    requirements: 'UX/UI 리서치 경험, 5인 이상',
    deadline: 'D-12',
    status: 'OPEN',
    tags: ['#UX리서치', '#FGI', '#IT서비스']
  },
  {
    id: 3,
    company: '넥스트파이낸스',
    title: '대학생 모의투자 대회 오프라인 부스 공동 운영',
    category: '행사/부스',
    reward: '부스 운영비 전액 + 동아리 후원금 100만원',
    requirements: '행사 기획/운영 경험, 최소 15명 투입',
    deadline: 'D-2',
    status: 'OPEN',
    tags: ['#행사운영', '#금융', '#BTL']
  },
  {
    id: 4,
    company: '스타트업얼라이언스',
    title: '대학생 창업 네트워킹 데이 행사 기획 파트너',
    category: '행사/부스',
    reward: '주관사 명의 등재 및 네트워킹 참여권',
    requirements: '창업 관련 동아리',
    deadline: '마감',
    status: 'CLOSED',
    tags: ['#창업', '#행사기획']
  },
  {
    id: 5,
    company: '에이아이라보',
    title: '자사 AI 솔루션 활용 해커톤 공동 주최 (Co-hosting)',
    category: 'IT/개발',
    reward: '해커톤 상금 500만원 지원 + 서버 인프라',
    requirements: '개발 동아리, 참가자 50명 이상 모객 가능',
    deadline: 'D-20',
    status: 'OPEN',
    tags: ['#해커톤', '#AI', '#공동주최']
  }
];

export const SUCCESS_CASES = [
  {
    id: 1,
    title: '마제스티 x (주)뷰티이노베이션',
    desc: '3주 만에 신제품 팝업 스토어 기획 및 방문객 1,000명 달성',
    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=60'
  },
  {
    id: 2,
    title: '코드크래프트 x 테크스타트',
    desc: 'B2B SaaS 서비스 사용성 개선 리포트 제공 및 산학협력 체결',
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=500&q=60'
  },
  {
    id: 3,
    title: '플래너스 x 커리어네트웍스',
    desc: '전국 대학생 취업 박람회 부스 공동 기획 및 운영 완료',
    img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=500&q=60'
  }
];

export const POSTS_DATA = [
  {
    id: 1,
    author: "마제스티 (Majesty)",
    title: "2026 상반기 신제품 런칭 바이럴 캠페인 비하인드",
    excerpt: "뷰티이노베이션팀과 함께한 3주간의 대장정. 오프라인 팝업과 온라인 바이럴을 동시에 진행하며 겪은 인사이트를 공유합니다.",
    date: "2026.04.15",
    tags: ["#마케팅", "#팝업스토어", "#프로젝트회고"],
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    author: "코드크래프트",
    title: "B2B SaaS 기업과 진행한 사용성 테스트(UT) 꿀팁",
    excerpt: "실제 고객사의 서비스를 분석하고 개선점 15가지를 도출했던 과정을 담았습니다. IT 동아리라면 꼭 읽어보세요.",
    date: "2026.04.10",
    tags: ["#웹개발", "#UT", "#UX리서치"],
    img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    author: "스타터스",
    title: "창업 네트워킹 데이, 500명 모객 성공기",
    excerpt: "제로 예산에서 시작해 스타트업얼라이언스와 공동 주최까지. 좌충우돌 행사 기획 A to Z.",
    date: "2026.04.05",
    tags: ["#창업", "#행사기획", "#네트워킹"],
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=800&q=80",
  }
];

export const THREADS_DATA = [
  {
    id: 1,
    author: "부",
    authorName: "부산정보산업진흥원",
    role: "홍보글",
    title: "🚀 클라우드·컨테이너 실무 교육 (부산)",
    content: "클라우드 네이티브를 위한 컨테이너 기술 구축 및 운영 교육 참가자 모집.",
    img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    time: "2시간 전",
    views: 36,
    likes: 5,
    comments: 1
  },
  {
    id: 2,
    author: "B",
    authorName: "방지니",
    role: "서비스 기획자",
    title: "[UX 데이터 분석] 전체 데이터 속에 갇히지 마라",
    content: "기획자는 데이터로 증명해야 합니다. 전체 데이터를 하나의 덩어리로 묶어 평균 지표만 분석하는 것은 잘못된 기획으로 이어질 수 있습니다.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    time: "3시간 전",
    views: 54,
    likes: 12,
    comments: 4
  },
  {
    id: 3,
    author: "E",
    authorName: "EasyDev",
    role: "Keep It Simple",
    title: "",
    content: "AI 비용이 점점 낮아진다는 건 희망에 가깝지 않을까.\n최근 클라우드 사용량 제한이 타이트해졌다는 얘기가 종종 보입니다.",
    img: "",
    time: "3시간 전",
    views: 63,
    likes: 2,
    comments: 0
  },
  {
    id: 4,
    author: "마",
    authorName: "마제스티 연합동아리",
    role: "실무 마케팅 파우치",
    title: "성수동 팝업스토어 하루만에 1,000명 방문시킨 썰",
    content: "어떻게 Z세대 대학생들을 성수동 한복판으로 이끌었을까요? 뷰티이노베이션팀과 함께한 '마제스티'의 오프라인 팝업 대작전 기획 노트를 모두 공개합니다.",
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
    time: "5시간 전",
    views: 128,
    likes: 45,
    comments: 6
  }
];
