import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { CorpProvider, useCorp } from './contexts/CorpContext';

const PROFILE_SETUP_PATH = '/profile-setup';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { INFO_PAGES } from './data/infoPages';
import { STORY_ENABLED } from './lib/features';
import { prefetchCommonRoutes } from './lib/preload';

// 라우트 단위 코드 스플리팅: 페이지별 개별 모듈을 지연 로딩(배럴이 아닌 파일 직접 import 해야 청크가 쪼개짐).
// 레이아웃(Header/Footer)·컨텍스트는 항상 필요하므로 eager 유지.
// public
const Home = lazy(() => import('./pages/public/Home'));
const Clubs = lazy(() => import('./pages/public/Clubs'));
const ClubDetail = lazy(() => import('./pages/public/ClubDetail'));
const ClubRecruit = lazy(() => import('./pages/public/ClubRecruit'));
const ClubApply = lazy(() => import('./pages/public/ClubApply'));
const B2BLounge = lazy(() => import('./pages/public/B2BLounge'));
const ForClubs = lazy(() => import('./pages/public/ForClubs'));
const Stories = lazy(() => import('./pages/public/Stories'));
const StoryDetail = lazy(() => import('./pages/public/StoryDetail'));
const InfoPage = lazy(() => import('./pages/public/InfoPage'));
const ClubStories = lazy(() => import('./pages/public/ClubStories'));
const Onboarding = lazy(() => import('./pages/public/Onboarding'));
const ProfileSetup = lazy(() => import('./pages/public/ProfileSetup'));
const ClubSetup = lazy(() => import('./pages/public/ClubSetup'));
const ClubJoin = lazy(() => import('./pages/public/ClubJoin'));
const ClubRegister = lazy(() => import('./pages/public/ClubRegister'));
const CorpRegister = lazy(() => import('./pages/public/CorpRegister'));
const ClubDemoPage = lazy(() => import('./pages/public/ClubDemoPage'));
// user
const MyPage = lazy(() => import('./pages/user/MyPage'));
const CertificateView = lazy(() => import('./pages/user/CertificateView'));
// admin — 공통 셸은 eager(즉시 표시), 개별 페이지는 lazy
import AdminLayout from './pages/admin/AdminLayout';
const Workspace = lazy(() => import('./pages/admin/Workspace'));
const AttendanceCreate = lazy(() => import('./pages/admin/AttendanceCreate'));
const AttendanceList = lazy(() => import('./pages/admin/AttendanceList'));
const AttendanceDetail = lazy(() => import('./pages/admin/AttendanceDetail'));
const AttendanceExcuses = lazy(() => import('./pages/admin/AttendanceExcuses'));
const MembersAdmin = lazy(() => import('./pages/admin/MembersAdmin'));
const MembersAnalytics = lazy(() => import('./pages/admin/MembersAnalytics'));
const DashboardAdmin = lazy(() => import('./pages/admin/DashboardAdmin'));
const B2BAdmin = lazy(() => import('./pages/admin/B2BAdmin'));
const B2BProposalAdmin = lazy(() => import('./pages/admin/B2BProposalAdmin'));
const FeedbackAdmin = lazy(() => import('./pages/admin/FeedbackAdmin'));
const PostsAdmin = lazy(() => import('./pages/admin/PostsAdmin'));
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'));
const RecruitmentsList = lazy(() => import('./pages/admin/RecruitmentsList'));
const RecruitmentDetail = lazy(() => import('./pages/admin/RecruitmentDetail'));
const RecruitInsights = lazy(() => import('./pages/admin/RecruitInsights'));
// corp — 공통 셸은 eager, 개별 페이지는 lazy
import CorpLayout from './pages/corp/CorpLayout';
const CorpDashboard = lazy(() => import('./pages/corp/CorpDashboard'));
const CorpScouts = lazy(() => import('./pages/corp/CorpScouts'));
// master — 공통 셸은 eager, 개별 페이지는 lazy
import { MasterLayout } from './pages/master/MasterLayout';
const Overview = lazy(() => import('./pages/master/Overview'));
const ClubsAdmin = lazy(() => import('./pages/master/ClubsAdmin'));
const Registrations = lazy(() => import('./pages/master/Registrations'));
const JoinRequests = lazy(() => import('./pages/master/JoinRequests'));
const CorpRequests = lazy(() => import('./pages/master/CorpRequests'));

// 미로그인 시 로그인 페이지로 보내되, 원래 가려던 위치를 기억
function RedirectToLogin() {
  const location = useLocation();
  return <Navigate to="/login" replace state={{ from: location }} />;
}

// 프로필 미완성 시 프로필 작성으로 보내되, 원래 가려던 위치를 기억
function RedirectToProfileSetup() {
  const location = useLocation();
  return <Navigate to={PROFILE_SETUP_PATH} replace state={{ from: location }} />;
}

// 로그인만 필요한 라우트 (프로필 완성 게이트 제외 — /profile-setup 자체용)
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <RedirectToLogin />;
  return <>{children}</>;
}

// 로그인 + 프로필 완성 필요 (학생/부원 영역). 기업·마스터는 면제.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, isProfileComplete, isMaster } = useAuth();
  const { isCorpUser, loading: corpLoading } = useCorp();
  if (loading || corpLoading) return <LoadingScreen />;
  if (!session) return <RedirectToLogin />;
  if (!isMaster && !isCorpUser && !isProfileComplete) return <RedirectToProfileSetup />;
  return <>{children}</>;
}

// 운영진 전용 보호 라우트
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading, isProfileComplete, isMaster } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) return <LoadingScreen />;
  if (!session) return <RedirectToLogin />;
  // 운영진(학생)도 프로필 완성 필요. 마스터는 면제.
  if (!isMaster && !isProfileComplete) return <RedirectToProfileSetup />;
  // 미승인 신청자 포함 비운영진 → club-setup(대기 화면 or 분기 선택)으로
  if (!isAdmin) return <Navigate to="/club-setup" replace />;
  return <>{children}</>;
}

// 마스터 전용 보호 라우트
function MasterRoute({ children }: { children: React.ReactNode }) {
  const { session, isMaster, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <RedirectToLogin />;
  if (!isMaster) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// 기업담당자 전용 보호 라우트
function CorpRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { isCorpUser, loading: corpLoading } = useCorp();

  if (authLoading || corpLoading) return <LoadingScreen />;
  if (!session) return <RedirectToLogin />;
  if (!isCorpUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();

  // 첫 페인트 이후 유휴 시간에 자주 이동하는 공개 페이지 청크를 미리 받아 네비게이션 깜박임 방지
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(prefetchCommonRoutes);
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(prefetchCommonRoutes, 1500);
    return () => clearTimeout(t);
  }, []);
  const isDashboardLayout =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/corp') ||
    location.pathname.startsWith('/master') ||
    location.pathname === '/workspace' ||
    location.pathname === '/demo';
  // 동아리 상세 페이지(/clubs/:id, 단 /clubs/:id/... 하위는 제외)에서는 헤더를 hover 시에만 노출
  const isClubIntroPage = /^\/clubs\/[^/]+\/?$/.test(location.pathname);

  return (
    <div className="min-h-screen bg-white text-ink font-sans selection:bg-brand selection:text-white flex flex-col">
      {!isDashboardLayout && !isClubIntroPage && <Header />}
      {!isDashboardLayout && isClubIntroPage && (
        // hover trigger 영역(헤더 높이 h-16=64px 만큼) + Header(absolute, translateY로 숨김/표시)
        <div className="fixed top-0 inset-x-0 z-[60] group/hovernav" style={{ height: '64px' }} aria-label="navigation hover area">
          <div className="absolute inset-x-0 top-0 -translate-y-full group-hover/hovernav:translate-y-0 transition-transform duration-300 ease-out">
            <Header />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* 공개 */}
          <Route path="/"               element={<Home />} />
          <Route path="/clubs"          element={<Clubs />} />
          <Route path="/clubs/:id"      element={<ClubDetail />} />
          <Route path="/clubs/:id/recruit" element={<ClubRecruit />} />
          <Route path="/clubs/:id/apply" element={<ClubApply />} />
          {STORY_ENABLED && <Route path="/clubs/:id/stories" element={<ClubStories />} />}
          <Route path="/b2b"            element={<B2BLounge />} />
          <Route path="/for-clubs"      element={<ForClubs />} />
          {STORY_ENABLED && <Route path="/stories"         element={<Stories />} />}
          {STORY_ENABLED && <Route path="/stories/:id"    element={<StoryDetail />} />}
          <Route path="/login"          element={<Onboarding />} />
          <Route path="/profile-setup"  element={<RequireAuth><ProfileSetup /></RequireAuth>} />
          <Route path="/demo"           element={<ClubDemoPage />} />

          {/* 로그인 전용 */}
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/certificate/:id" element={<ProtectedRoute><CertificateView /></ProtectedRoute>} />
          <Route path="/club-setup" element={<ProtectedRoute><ClubSetup /></ProtectedRoute>} />
          <Route path="/club-join" element={<ProtectedRoute><ClubJoin /></ProtectedRoute>} />
          <Route path="/club-register" element={<ProtectedRoute><ClubRegister /></ProtectedRoute>} />

          {/* 운영진 전용 — 공통 레이아웃(헤더+사이드바)을 한 번만 마운트, 콘텐츠만 Outlet 교체 */}
          <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="/admin/dashboard"      element={<DashboardAdmin />} />
            {/* 신규 모집·지원 관리 (탭 통합 구조) */}
            <Route path="/admin/recruitments"        element={<RecruitmentsList />} />
            <Route path="/admin/recruitments/:id"    element={<RecruitmentDetail />} />
            <Route path="/admin/recruit-insights"    element={<RecruitInsights />} />
            <Route path="/admin/sessions/new"   element={<AttendanceCreate />} />
            <Route path="/admin/sessions"       element={<AttendanceList />} />
            <Route path="/admin/sessions/:id"   element={<AttendanceDetail />} />
            <Route path="/admin/attendance-excuses" element={<AttendanceExcuses />} />
            <Route path="/admin/members"        element={<MembersAdmin />} />
            <Route path="/admin/members-analytics" element={<MembersAnalytics />} />
            <Route path="/admin/b2b"            element={<B2BAdmin />} />
            <Route path="/admin/b2b/proposal"   element={<B2BProposalAdmin />} />
            <Route path="/admin/feedback"       element={<FeedbackAdmin />} />
            <Route path="/admin/settings"       element={<SettingsAdmin />} />
          </Route>

          {/* 운영진 전용 — 독립 풀스크린 셸 (공통 레이아웃 미적용) */}
          <Route path="/workspace"            element={<AdminRoute><Workspace /></AdminRoute>} />
          {STORY_ENABLED && <Route path="/admin/posts" element={<AdminRoute><PostsAdmin /></AdminRoute>} />}

          {/* 구버전 라우트 호환 — 신규/통합 라우트로 리다이렉트 (외부 링크·북마크) */}
          <Route path="/admin/recruit-page"        element={<Navigate to="/admin/recruitments" replace />} />
          <Route path="/admin/recruit-dashboard"   element={<Navigate to="/admin/recruit-insights" replace />} />
          <Route path="/admin/recruit-analytics"   element={<Navigate to="/admin/recruit-insights?tab=analytics" replace />} />
          <Route path="/admin/recruit"        element={<Navigate to="/admin/recruitments" replace />} />
          <Route path="/admin/form-builder"   element={<Navigate to="/admin/recruitments" replace />} />
          <Route path="/admin/attendance"     element={<Navigate to="/admin/sessions/new" replace />} />

          {/* 마스터 — 공통 레이아웃(헤더+사이드바)을 한 번만 마운트 */}
          <Route element={<MasterRoute><MasterLayout /></MasterRoute>}>
            <Route path="/master"               element={<Overview />} />
            <Route path="/master/clubs"         element={<ClubsAdmin />} />
            <Route path="/master/registrations" element={<Registrations />} />
            <Route path="/master/join-requests"  element={<JoinRequests />} />
            <Route path="/master/corp-requests"  element={<CorpRequests />} />
          </Route>

          {/* 기업 */}
          <Route path="/corp/register"  element={<RequireAuth><CorpRegister /></RequireAuth>} />
          <Route element={<CorpRoute><CorpLayout /></CorpRoute>}>
            <Route path="/corp/dashboard" element={<CorpDashboard />} />
            <Route path="/corp/scouts"    element={<CorpScouts />} />
          </Route>
          <Route path="/corp/*"         element={<Navigate to="/corp/dashboard" replace />} />

          {/* 안내 — 콘텐츠는 src/data/infoPages.ts 에서 관리 */}
          {INFO_PAGES.map((p) => (
            <Route
              key={p.slug}
              path={`/${p.slug}`}
              element={
                <InfoPage
                  title={p.title}
                  category={p.category}
                  updatedAt={p.updatedAt}
                  sections={p.sections}
                />
              }
            />
          ))}
        </Routes>
        </Suspense>
      </div>
      {!isDashboardLayout && <Footer />}
    </div>
  );
}

// 렌더 크래시가 앱 전체 화이트스크린이 되지 않도록 격리 + Sentry 리포트.
function AppErrorFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-ink p-6 text-center">
      <p className="font-black text-2xl mb-2">문제가 발생했습니다</p>
      <p className="text-sm text-sand-500 mb-6">일시적인 오류일 수 있어요. 페이지를 새로고침해 주세요.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 btn-grad text-white font-black rounded-ctl shadow-btn hover:-translate-y-0.5 transition-transform"
      >
        새로고침
      </button>
    </div>
  );
}

// @sentry/react를 엔트리에 정적 포함하지 않기 위한 경량 ErrorBoundary.
// 렌더 크래시를 격리하고, 로드된 경우 Sentry로 리포트(미로드 시 무시).
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // Sentry를 엔트리에 끌어들이지 않도록 리포트 시점에만 동적 로드.
    import('./lib/sentry').then((m) => m.captureException(error)).catch(() => {});
  }
  render() {
    if (this.state.hasError) return <AppErrorFallback />;
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminProvider>
          <CorpProvider>
            <AppRoutes />
          </CorpProvider>
        </AdminProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
