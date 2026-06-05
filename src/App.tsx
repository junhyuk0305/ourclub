import React, { Suspense, lazy } from 'react';
import * as Sentry from '@sentry/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { CorpProvider, useCorp } from './contexts/CorpContext';

const PROFILE_SETUP_PATH = '/profile-setup';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { INFO_PAGES } from './data/infoPages';

// 라우트 단위 코드 스플리팅: 페이지별 개별 모듈을 지연 로딩(배럴이 아닌 파일 직접 import 해야 청크가 쪼개짐).
// 레이아웃(Header/Footer)·컨텍스트는 항상 필요하므로 eager 유지.
// public
const Home = lazy(() => import('./pages/public/Home'));
const Clubs = lazy(() => import('./pages/public/Clubs'));
const ClubDetail = lazy(() => import('./pages/public/ClubDetail'));
const ClubRecruit = lazy(() => import('./pages/public/ClubRecruit'));
const ClubApply = lazy(() => import('./pages/public/ClubApply'));
const B2BLounge = lazy(() => import('./pages/public/B2BLounge'));
const Stories = lazy(() => import('./pages/public/Stories'));
const StoryDetail = lazy(() => import('./pages/public/StoryDetail'));
const InfoPage = lazy(() => import('./pages/public/InfoPage'));
const ClubStories = lazy(() => import('./pages/public/ClubStories'));
const Onboarding = lazy(() => import('./pages/public/Onboarding'));
const ProfileSetup = lazy(() => import('./pages/public/ProfileSetup'));
const ClubSetup = lazy(() => import('./pages/public/ClubSetup'));
const ClubJoin = lazy(() => import('./pages/public/ClubJoin'));
const ClubRegister = lazy(() => import('./pages/public/ClubRegister'));
const ClubDemoPage = lazy(() => import('./pages/public/ClubDemoPage'));
// user
const MyPage = lazy(() => import('./pages/user/MyPage'));
// admin
const Workspace = lazy(() => import('./pages/admin/Workspace'));
const RecruitAdmin = lazy(() => import('./pages/admin/RecruitAdmin'));
const FormBuilder = lazy(() => import('./pages/admin/FormBuilder'));
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
const RecruitPageBuilder = lazy(() => import('./pages/admin/RecruitPageBuilder'));
const RecruitDashboard = lazy(() => import('./pages/admin/RecruitDashboard'));
const RecruitAnalytics = lazy(() => import('./pages/admin/RecruitAnalytics'));
// corp
const CorpDashboard = lazy(() => import('./pages/corp/CorpDashboard'));
const CorpScouts = lazy(() => import('./pages/corp/CorpScouts'));
// master
const Overview = lazy(() => import('./pages/master/Overview'));
const ClubsAdmin = lazy(() => import('./pages/master/ClubsAdmin'));
const Registrations = lazy(() => import('./pages/master/Registrations'));
const JoinRequests = lazy(() => import('./pages/master/JoinRequests'));

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
  if (loading) return null;
  if (!session) return <RedirectToLogin />;
  return <>{children}</>;
}

// 로그인 + 프로필 완성 필요 (학생/부원 영역). 기업·마스터는 면제.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, isProfileComplete, isMaster } = useAuth();
  const { isCorpUser, loading: corpLoading } = useCorp();
  if (loading || corpLoading) return null;
  if (!session) return <RedirectToLogin />;
  if (!isMaster && !isCorpUser && !isProfileComplete) return <RedirectToProfileSetup />;
  return <>{children}</>;
}

// 운영진 전용 보호 라우트
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading, isProfileComplete, isMaster } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) return null;
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
  if (loading) return null;
  if (!session) return <RedirectToLogin />;
  if (!isMaster) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// 기업담당자 전용 보호 라우트
function CorpRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { isCorpUser, loading: corpLoading } = useCorp();

  if (authLoading || corpLoading) return null;
  if (!session) return <RedirectToLogin />;
  if (!isCorpUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const isDashboardLayout =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/corp') ||
    location.pathname.startsWith('/master') ||
    location.pathname === '/workspace' ||
    location.pathname === '/demo';
  // 동아리 상세 페이지(/clubs/:id, 단 /clubs/:id/... 하위는 제외)에서는 헤더를 hover 시에만 노출
  const isClubIntroPage = /^\/clubs\/[^/]+\/?$/.test(location.pathname);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-orange-500 selection:text-white flex flex-col">
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
        <Suspense fallback={<div className="flex-1" />}>
        <Routes>
          {/* 공개 */}
          <Route path="/"               element={<Home />} />
          <Route path="/clubs"          element={<Clubs />} />
          <Route path="/clubs/:id"      element={<ClubDetail />} />
          <Route path="/clubs/:id/recruit" element={<ClubRecruit />} />
          <Route path="/clubs/:id/apply" element={<ClubApply />} />
          <Route path="/clubs/:id/stories" element={<ClubStories />} />
          <Route path="/b2b"            element={<B2BLounge />} />
          <Route path="/stories"         element={<Stories />} />
          <Route path="/stories/:id"    element={<StoryDetail />} />
          <Route path="/login"          element={<Onboarding />} />
          <Route path="/profile-setup"  element={<RequireAuth><ProfileSetup /></RequireAuth>} />
          <Route path="/demo"           element={<ClubDemoPage />} />

          {/* 로그인 전용 */}
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/club-setup" element={<ProtectedRoute><ClubSetup /></ProtectedRoute>} />
          <Route path="/club-join" element={<ProtectedRoute><ClubJoin /></ProtectedRoute>} />
          <Route path="/club-register" element={<ProtectedRoute><ClubRegister /></ProtectedRoute>} />

          {/* 운영진 전용 */}
          <Route path="/workspace"            element={<AdminRoute><Workspace /></AdminRoute>} />
          <Route path="/admin/dashboard"      element={<AdminRoute><DashboardAdmin /></AdminRoute>} />
          {/* 신규 모집·지원 관리 (4탭 통합 구조) */}
          <Route path="/admin/recruitments"        element={<AdminRoute><RecruitmentsList /></AdminRoute>} />
          <Route path="/admin/recruitments/:id"    element={<AdminRoute><RecruitmentDetail /></AdminRoute>} />
          <Route path="/admin/recruit-page"        element={<AdminRoute><RecruitPageBuilder /></AdminRoute>} />
          <Route path="/admin/recruit-dashboard"   element={<AdminRoute><RecruitDashboard /></AdminRoute>} />
          <Route path="/admin/recruit-analytics"   element={<AdminRoute><RecruitAnalytics /></AdminRoute>} />
          {/* 구버전 라우트는 신규로 리다이렉트 (외부 링크/북마크 호환) */}
          <Route path="/admin/recruit"        element={<Navigate to="/admin/recruitments" replace />} />
          <Route path="/admin/form-builder"   element={<Navigate to="/admin/recruitments" replace />} />
          {/* 구버전 직접 접근용 (deprecated) */}
          <Route path="/admin/recruit-legacy"      element={<AdminRoute><RecruitAdmin /></AdminRoute>} />
          <Route path="/admin/form-builder-legacy" element={<AdminRoute><FormBuilder /></AdminRoute>} />
          <Route path="/admin/sessions/new"   element={<AdminRoute><AttendanceCreate /></AdminRoute>} />
          <Route path="/admin/sessions"       element={<AdminRoute><AttendanceList /></AdminRoute>} />
          <Route path="/admin/sessions/:id"   element={<AdminRoute><AttendanceDetail /></AdminRoute>} />
          <Route path="/admin/attendance-excuses" element={<AdminRoute><AttendanceExcuses /></AdminRoute>} />
          {/* 구버전 라우트 호환 */}
          <Route path="/admin/attendance"     element={<Navigate to="/admin/sessions/new" replace />} />
          <Route path="/admin/members"        element={<AdminRoute><MembersAdmin /></AdminRoute>} />
          <Route path="/admin/members-analytics" element={<AdminRoute><MembersAnalytics /></AdminRoute>} />
          <Route path="/admin/b2b"            element={<AdminRoute><B2BAdmin /></AdminRoute>} />
          <Route path="/admin/b2b/proposal"   element={<AdminRoute><B2BProposalAdmin /></AdminRoute>} />
          <Route path="/admin/feedback"       element={<AdminRoute><FeedbackAdmin /></AdminRoute>} />
          <Route path="/admin/posts"          element={<AdminRoute><PostsAdmin /></AdminRoute>} />
          <Route path="/admin/settings"       element={<AdminRoute><SettingsAdmin /></AdminRoute>} />

          {/* 마스터 */}
          <Route path="/master"               element={<MasterRoute><Overview /></MasterRoute>} />
          <Route path="/master/clubs"         element={<MasterRoute><ClubsAdmin /></MasterRoute>} />
          <Route path="/master/registrations" element={<MasterRoute><Registrations /></MasterRoute>} />
          <Route path="/master/join-requests"  element={<MasterRoute><JoinRequests /></MasterRoute>} />

          {/* 기업 */}
          <Route path="/corp/dashboard" element={<CorpRoute><CorpDashboard /></CorpRoute>} />
          <Route path="/corp/scouts"    element={<CorpRoute><CorpScouts /></CorpRoute>} />
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-6 text-center">
      <p className="font-black text-2xl mb-2">문제가 발생했습니다</p>
      <p className="text-sm text-gray-500 mb-6">일시적인 오류일 수 있어요. 페이지를 새로고침해 주세요.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 bg-orange-500 text-white font-black hover:bg-orange-600 transition-colors"
      >
        새로고침
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
      <AuthProvider>
        <AdminProvider>
          <CorpProvider>
            <AppRoutes />
          </CorpProvider>
        </AdminProvider>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}
