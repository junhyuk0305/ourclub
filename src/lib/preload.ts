// 라우트 청크 프리페치.
// lazy 페이지는 클릭하는 순간 청크를 다운로드하므로, 그동안 Suspense 전체화면 스피너가 잠깐 떴다 사라진다(=깜박임).
// 미리 청크를 받아두면 네비게이션 시 즉시 렌더되어 깜박임이 사라진다.

// 경로 → 해당 페이지 동적 import (hover 프리페치용)
const importers: Record<string, () => Promise<unknown>> = {
  '/clubs': () => import('../pages/public/Clubs'),
  '/b2b': () => import('../pages/public/B2BLounge'),
  '/for-clubs': () => import('../pages/public/ForClubs'),
  '/stories': () => import('../pages/public/Stories'),
  '/mypage': () => import('../pages/user/MyPage'),
};

/** 링크 hover/focus 시 해당 경로 청크를 미리 로드. */
export function preloadPath(path: string) {
  importers[path]?.();
}

/** 첫 진입 후 유휴 시간에 자주 이동하는 공개 페이지를 미리 로드. */
export function prefetchCommonRoutes() {
  import('../pages/public/Clubs');
  import('../pages/public/ClubDetail');
  import('../pages/public/ClubRecruit');
  import('../pages/public/B2BLounge');
}
