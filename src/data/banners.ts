import type { BannerPage, Slide } from '../components/ui/BannerSlider';

// ─────────────────────────────────────────────────────────────────────────
// 페이지별 슬림 슬라이드 배너 데이터 (1차 = 자사 홍보/공지, 정적)
//
// 추후 banners 테이블 + useBanners(page) 훅으로 교체. BannerSlider는 변경 없음.
// 카피 한도: title ≤ 24자 · subtitle ≤ 40자 · cta.label ≤ 10자 · 페이지당 3~5장.
// ⚠️ lounge 면은 채용/구인/인력/소개/알선 금지 → 프로젝트/도급/협업 (직업안정법 방어).
// ─────────────────────────────────────────────────────────────────────────

const BANNERS: Record<BannerPage, Slide[]> = {
  // ── 홈페이지 — 신규/비로그인 방문자 ──────────────────────────────────────
  home: [
    {
      id: 'home-start',
      theme: 'dark',
      eyebrow: 'OURCLUB 시작하기',
      title: '우리 동아리 홈페이지부터',
      highlight: '홈페이지',
      subtitle: '홈페이지·출석·회비·모집을 한 곳에서 관리하세요.',
      iconKey: 'rocket',
      cta: { label: '시작하기', href: '/club-setup' },
    },
    {
      id: 'home-find',
      theme: 'light',
      eyebrow: '동아리 찾는 학생',
      title: '관심 분야 동아리 둘러보기',
      highlight: '관심 분야',
      subtitle: '카테고리로 우리 동아리·학회를 찾아보세요.',
      iconKey: 'users',
      cta: { label: '동아리 찾기', href: '/clubs' },
    },
    {
      id: 'home-corp',
      theme: 'orange',
      eyebrow: 'For Company',
      title: '기업이신가요?',
      subtitle: '동아리·학회와 실무 프로젝트로 협업하세요.',
      iconKey: 'briefcase',
      cta: { label: '기업 라운지', href: '/b2b' },
    },
  ],

  // ── 동아리 찾기 (개별 동아리 모집 페이지) — 지원하려는 학생 ───────────────
  recruit: [
    {
      id: 'recruit-badge',
      theme: 'dark',
      eyebrow: '동아리 둘러보기',
      title: '관심 동아리·학회 찾기',
      highlight: '관심',
      subtitle: '다양한 동아리·학회를 둘러보고 지원하세요.',
      iconKey: 'award',
      cta: { label: '동아리 더 보기', href: '/clubs' },
    },
    {
      id: 'recruit-result',
      theme: 'light',
      eyebrow: '지원 안내',
      title: '결과는 빠짐없이 알려드려요',
      highlight: '빠짐없이',
      subtitle: '합격·불합격 모두 알림으로 통보됩니다.',
      iconKey: 'bell',
    },
    {
      id: 'recruit-profile',
      theme: 'orange',
      eyebrow: 'TIP',
      title: '프로필 완성하면 합격률 UP',
      highlight: '합격률 UP',
      subtitle: '학력·역량을 채우면 더 잘 보여요.',
      iconKey: 'sparkles',
      cta: { label: '프로필 완성', href: '/profile-setup' },
    },
  ],

  // ── 기업 라운지 — 기업 담당자 ───────────────────────────────────────────
  lounge: [
    {
      id: 'lounge-post',
      theme: 'dark',
      eyebrow: '프로젝트 의뢰',
      title: '과업을 등록하고 제안받기',
      highlight: '제안받기',
      subtitle: '동아리·학회의 협업 제안을 비교해보세요.',
      iconKey: 'file',
      cta: { label: '프로젝트 등록', href: '/corp/register' },
    },
    {
      id: 'lounge-safe',
      theme: 'light',
      eyebrow: '계약·정산',
      title: '계약·정산까지 한 번에',
      highlight: '한 번에',
      subtitle: '표준 도급 계약·책임 한도로 진행돼요.',
      iconKey: 'shield',
      cta: { label: '자세히 보기', href: '/b2b' },
    },
    {
      id: 'lounge-trust',
      theme: 'orange',
      eyebrow: '협업 실적',
      title: '385건 협업이 성사됐어요',
      highlight: '385건',
      subtitle: '동아리·학회와 함께한 누적 프로젝트입니다.',
      iconKey: 'trending',
      cta: { label: '프로젝트 등록', href: '/corp/register' },
    },
  ],

  // ── 학생 마이페이지 — 로그인 부원 ───────────────────────────────────────
  mypage: [
    {
      id: 'mypage-attend',
      theme: 'light',
      eyebrow: '출결 가이드',
      title: '출석·인정 신청은 여기서',
      highlight: '여기서',
      subtitle: '세션에서 체크하고 불참 사유도 제출하세요.',
      iconKey: 'calendar',
    },
    {
      id: 'mypage-discover',
      theme: 'dark',
      eyebrow: '더 둘러보기',
      title: '새로운 동아리도 찾아보세요',
      highlight: '새로운 동아리',
      subtitle: '관심사에 맞는 동아리·학회를 추천해드려요.',
      iconKey: 'users',
      cta: { label: '동아리 찾기', href: '/clubs' },
    },
    {
      id: 'mypage-profile',
      theme: 'orange',
      eyebrow: '프로필',
      title: '프로필을 최신으로 유지',
      highlight: '최신으로',
      subtitle: '역량을 채우면 지원·스카우트에 유리해요.',
      iconKey: 'sparkles',
      cta: { label: '프로필 수정', href: '/profile-setup' },
    },
  ],

  // ── 운영진 워크스페이스 (어드민 대시보드) — 운영진 ──────────────────────
  workspace: [
    {
      id: 'ws-builder',
      theme: 'dark',
      eyebrow: '웹빌더',
      title: '모집 페이지 직접 만들기',
      highlight: '직접',
      subtitle: '드래그만으로 우리 동아리 모집 페이지 완성.',
      iconKey: 'rocket',
      cta: { label: '빌더 열기', href: '/workspace' },
    },
    {
      id: 'ws-applicants',
      theme: 'light',
      eyebrow: '운영 가이드',
      title: '지원자 파이프라인 관리',
      highlight: '파이프라인',
      subtitle: '공고·지원자·출석·명단을 한 곳에서.',
      iconKey: 'users',
      cta: { label: '지원자 보기', href: '/admin/recruitments' },
    },
    {
      id: 'ws-b2b',
      theme: 'orange',
      eyebrow: '기업 프로젝트',
      title: '기업 프로젝트로 실무 경험',
      highlight: '실무 경험',
      subtitle: '동아리·학회는 기업 프로젝트에 제안할 수 있어요.',
      iconKey: 'briefcase',
      cta: { label: '기업 라운지', href: '/admin/b2b' },
    },
  ],
};

export function getBanners(page: BannerPage): Slide[] {
  return BANNERS[page];
}
