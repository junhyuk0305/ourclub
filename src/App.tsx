import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { CorpProvider, useCorp } from './contexts/CorpContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import {
  Home, Clubs, B2BLounge, TextPage, Stories,
  ClubDetail, ClubApply, ClubRecruit, Onboarding
} from './pages/public';
import { MyPage } from './pages/user';
import {
  Workspace, RecruitAdmin, FormBuilder, AttendanceAdmin, MembersAdmin,
  DashboardAdmin, B2BAdmin, B2BProposalAdmin, FeedbackAdmin, PostsAdmin, SettingsAdmin
} from './pages/admin';
import { CorpDashboard } from './pages/corp';

// 로그인 전용 보호 라우트
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// 운영진 전용 보호 라우트
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// 기업담당자 전용 보호 라우트
function CorpRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { isCorpUser, loading: corpLoading } = useCorp();

  if (authLoading || corpLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!isCorpUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const isDashboardLayout =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/corp') ||
    location.pathname === '/workspace';

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-orange-500 selection:text-white flex flex-col">
      {!isDashboardLayout && <Header />}
      <div className="flex-1 flex flex-col">
        <Routes>
          {/* 공개 */}
          <Route path="/"               element={<Home />} />
          <Route path="/clubs"          element={<Clubs />} />
          <Route path="/clubs/:id"      element={<ClubDetail />} />
          <Route path="/clubs/:id/recruit" element={<ClubRecruit />} />
          <Route path="/clubs/:id/apply" element={<ClubApply />} />
          <Route path="/b2b"            element={<B2BLounge />} />
          <Route path="/stories"        element={<Stories />} />
          <Route path="/login"          element={<Onboarding />} />

          {/* 로그인 전용 */}
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />

          {/* 운영진 전용 */}
          <Route path="/workspace"            element={<AdminRoute><Workspace /></AdminRoute>} />
          <Route path="/admin/dashboard"      element={<AdminRoute><DashboardAdmin /></AdminRoute>} />
          <Route path="/admin/recruit"        element={<AdminRoute><RecruitAdmin /></AdminRoute>} />
          <Route path="/admin/form-builder"   element={<AdminRoute><FormBuilder /></AdminRoute>} />
          <Route path="/admin/attendance"     element={<AdminRoute><AttendanceAdmin /></AdminRoute>} />
          <Route path="/admin/members"        element={<AdminRoute><MembersAdmin /></AdminRoute>} />
          <Route path="/admin/b2b"            element={<AdminRoute><B2BAdmin /></AdminRoute>} />
          <Route path="/admin/b2b/proposal"   element={<AdminRoute><B2BProposalAdmin /></AdminRoute>} />
          <Route path="/admin/feedback"       element={<AdminRoute><FeedbackAdmin /></AdminRoute>} />
          <Route path="/admin/posts"          element={<AdminRoute><PostsAdmin /></AdminRoute>} />
          <Route path="/admin/settings"       element={<AdminRoute><SettingsAdmin /></AdminRoute>} />

          {/* 기업 */}
          <Route path="/corp/dashboard" element={<CorpRoute><CorpDashboard /></CorpRoute>} />
          <Route path="/corp/*"         element={<Navigate to="/corp/dashboard" replace />} />

          {/* 약관 */}
          <Route path="/privacy"        element={<TextPage title="개인정보처리방침" />} />
          <Route path="/terms"          element={<TextPage title="서비스 이용약관" />} />
          <Route path="/auth-process"   element={<TextPage title="인증 동아리 절차" />} />
          <Route path="/corporate-join" element={<TextPage title="기업 가입 안내" />} />
          <Route path="/project-guide"  element={<TextPage title="프로젝트 등록 방법" />} />
        </Routes>
      </div>
      {!isDashboardLayout && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <CorpProvider>
          <AppRoutes />
        </CorpProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
