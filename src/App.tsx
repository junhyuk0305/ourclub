import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { CorpProvider, useCorp } from './contexts/CorpContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import {
  Home, Clubs, B2BLounge, TextPage, InfoPage, Stories, StoryDetail,
  ClubDetail, ClubApply, ClubRecruit, ClubStories, Onboarding, ClubSetup, ClubJoin, ClubRegister
} from './pages/public';
import { MyPage } from './pages/user';
import {
  Workspace, RecruitAdmin, FormBuilder, AttendanceAdmin, MembersAdmin,
  DashboardAdmin, B2BAdmin, B2BProposalAdmin, FeedbackAdmin, PostsAdmin, SettingsAdmin
} from './pages/admin';
import { CorpDashboard } from './pages/corp';
import { Registrations, JoinRequests } from './pages/master';

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
  // 미승인 신청자 포함 비운영진 → club-setup(대기 화면 or 분기 선택)으로
  if (!isAdmin) return <Navigate to="/club-setup" replace />;
  return <>{children}</>;
}

// 마스터 전용 보호 라우트
function MasterRoute({ children }: { children: React.ReactNode }) {
  const { session, isMaster, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!isMaster) return <Navigate to="/" replace />;
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
    location.pathname.startsWith('/master') ||
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
          <Route path="/clubs/:id/stories" element={<ClubStories />} />
          <Route path="/b2b"            element={<B2BLounge />} />
          <Route path="/stories"         element={<Stories />} />
          <Route path="/stories/:id"    element={<StoryDetail />} />
          <Route path="/login"          element={<Onboarding />} />

          {/* 로그인 전용 */}
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/club-setup" element={<ProtectedRoute><ClubSetup /></ProtectedRoute>} />
          <Route path="/club-join" element={<ProtectedRoute><ClubJoin /></ProtectedRoute>} />
          <Route path="/club-register" element={<ProtectedRoute><ClubRegister /></ProtectedRoute>} />

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

          {/* 마스터 */}
          <Route path="/master/registrations" element={<MasterRoute><Registrations /></MasterRoute>} />
          <Route path="/master/join-requests"  element={<MasterRoute><JoinRequests /></MasterRoute>} />
          <Route path="/master" element={<Navigate to="/master/registrations" replace />} />

          {/* 기업 */}
          <Route path="/corp/dashboard" element={<CorpRoute><CorpDashboard /></CorpRoute>} />
          <Route path="/corp/*"         element={<Navigate to="/corp/dashboard" replace />} />

          {/* 안내 */}
          <Route path="/privacy" element={
            <InfoPage
              title="개인정보처리방침"
              category="정책 및 약관"
              updatedAt="2026.05.01"
              sections={[
                { heading: "수집하는 개인정보 항목", body: "OURCLUB은 서비스 제공을 위해 다음 정보를 수집합니다.\n\n• 필수: 이름, 이메일 주소, 비밀번호(암호화 저장)\n• 선택: 학교명, 학과, 학번, 전화번호, 포트폴리오 URL, 기술 스택\n• 자동 수집: 서비스 이용 기록, 접속 IP, 쿠키(Supabase 인증 토큰)" },
                { heading: "개인정보 수집 및 이용 목적", body: "수집한 개인정보는 아래 목적에만 이용합니다.\n\n① 회원 식별 및 로그인 인증\n② 동아리 지원서 제출 및 관리\n③ 기업-동아리 B2B 매칭 서비스 제공\n④ 서비스 공지 및 중요 안내 전달\n⑤ 부정 이용 방지 및 분쟁 해결" },
                { heading: "개인정보 보유 및 이용 기간", body: "• 회원 탈퇴 시: 즉시 파기 (단, 관련 법령에 따라 일부 기록은 보존)\n• 전자상거래법: 계약·청약 철회 기록 5년, 소비자 불만 기록 3년\n• 통신비밀보호법: 로그인 기록 3개월\n\n보존 기간 종료 후에는 복구 불가능한 방법으로 즉시 파기합니다." },
                { heading: "개인정보의 제3자 제공", body: "OURCLUB은 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.\n\n단, 다음 경우는 예외입니다.\n• 이용자가 사전에 동의한 경우 (예: B2B 매칭 시 기업 담당자에게 지원서 공개)\n• 법령의 규정에 의거하거나 수사기관의 적법한 요청이 있는 경우" },
                { heading: "이용자의 권리와 행사 방법", body: "이용자는 언제든지 아래 권리를 행사할 수 있습니다.\n\n• 개인정보 열람 요청\n• 오류 정정 요청\n• 삭제(회원 탈퇴) 요청\n• 처리 정지 요청\n\n권리 행사는 마이페이지 설정 또는 이메일(privacy@ourclub.kr)로 가능하며, 10영업일 이내 처리합니다." },
              ]}
            />
          } />
          <Route path="/terms" element={
            <InfoPage
              title="서비스 이용약관"
              category="정책 및 약관"
              updatedAt="2026.05.01"
              sections={[
                { heading: "목적 및 적용 범위", body: "본 약관은 OURCLUB(이하 '서비스')이 제공하는 동아리-기업 매칭 플랫폼의 이용 조건 및 절차에 관한 사항을 규정합니다.\n\n서비스에 가입하거나 이용하는 모든 회원(학생, 동아리 운영진, 기업 담당자)에게 적용됩니다." },
                { heading: "서비스 이용", body: "• 이메일 인증을 완료한 회원만 서비스를 이용할 수 있습니다.\n• 동아리 운영진 기능은 OURCLUB이 인증한 클럽의 운영진에 한해 제공됩니다.\n• 기업 대시보드 기능은 사업자 인증을 완료한 기업 파트너에 한해 제공됩니다.\n• 서비스는 PC 및 모바일 웹 브라우저를 통해 이용할 수 있습니다." },
                { heading: "이용자 의무", body: "회원은 다음 행위를 해서는 안 됩니다.\n\n① 타인의 개인정보 도용 또는 허위 정보 등록\n② 서비스를 통해 스팸, 광고성 메시지 무단 전송\n③ 플랫폼 코드 역공학, 크롤링, 자동화 스크래핑\n④ 다른 회원에게 불이익을 주는 행위\n\n위반 시 사전 통보 없이 계정이 정지 또는 삭제될 수 있습니다." },
                { heading: "서비스 변경 및 중단", body: "OURCLUB은 운영상 필요한 경우 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.\n\n• 정기 점검: 사전 공지 후 진행\n• 긴급 중단: 보안 사고, 시스템 장애 등 불가피한 경우 사후 공지\n• 서비스 종료 시 최소 30일 전 이메일로 사전 고지합니다." },
              ]}
            />
          } />
          <Route path="/auth-process" element={
            <InfoPage
              title="인증 동아리 절차 안내"
              category="동아리용 서비스"
              updatedAt="2026.05.01"
              sections={[
                { heading: "인증 동아리(오렌지 뱃지)란?", body: "OURCLUB이 활동 실적, 구성원 신원, 재정 투명성, 운영 방식을 직접 심사해 공식 인증한 동아리입니다.\n\n인증을 완료한 동아리에는 '오렌지 뱃지'가 부여되며, 플랫폼 내 B2B 프로젝트 열람 및 지원 권한이 주어집니다." },
                { heading: "신청 자격", body: "아래 조건을 모두 충족하는 동아리가 신청할 수 있습니다.\n\n✓ 대학생 중심으로 구성된 팀 (졸업생 혼합 가능)\n✓ 3개월 이상 정기적으로 활동한 기록 보유\n✓ 구성원 5인 이상\n✓ 활동 기록(SNS, 노션, 활동 보고서 등) 제출 가능" },
                { heading: "제출 서류", body: "아래 서류를 OURCLUB 인증 신청 이메일(auth@ourclub.kr)로 제출하세요.\n\n① 동아리 소개서 (자유 형식, 1~3페이지)\n② 최근 3개월 활동 내역 (날짜·내용·참가 인원 포함)\n③ 현재 구성원 명단 (이름·소속 학교·역할)\n④ 재정 내역 요약 (회비 수입·지출 내역)\n⑤ 운영진 신분증 사본 (개인정보 마스킹 후)" },
                { heading: "심사 절차 및 기간", body: "서류 접수 완료 후 아래 순서로 진행됩니다.\n\n1단계. 서류 접수 확인 (1영업일 이내 회신)\n2단계. 1차 서면 심사 (5~7영업일)\n3단계. 2차 화상 인터뷰 (30분, 일정 조율 후 진행)\n4단계. 최종 승인 및 뱃지 부여\n\n전체 소요 기간은 약 2~3주이며, 미승인 시 사유를 안내합니다." },
                { heading: "인증 동아리 혜택", body: "오렌지 뱃지 동아리에게는 다음 혜택이 제공됩니다.\n\n🔶 플랫폼 검색 결과 상단 노출\n🔶 B2B 프로젝트 공고 열람 및 지원 권한\n🔶 기업의 직접 제안(스카우트) 수신\n🔶 동아리 전용 1-Page 홈페이지 빌더 사용\n🔶 모집 지원자 관리 대시보드 제공\n🔶 연간 활동 성과 리포트 발급" },
              ]}
            />
          } />
          <Route path="/corporate-join" element={
            <InfoPage
              title="기업 파트너 가입 안내"
              category="기업용 서비스"
              updatedAt="2026.05.01"
              sections={[
                { heading: "기업 파트너란?", body: "OURCLUB 기업 파트너는 검증된 대학생 동아리와 B2B 협업 프로젝트를 진행하거나, 우수 인재를 발굴하고자 하는 기업·기관·스타트업을 위한 계정입니다.\n\n기업 파트너로 가입하면 전용 대시보드에서 프로젝트 공고 등록, 지원서 검토, 동아리 직접 제안 등 모든 매칭 과정을 관리할 수 있습니다." },
                { heading: "가입 자격", body: "아래 중 하나에 해당하면 신청 가능합니다.\n\n• 사업자등록증을 보유한 법인 사업자\n• 사업자등록증을 보유한 개인 사업자\n• 비영리 기관·협회 (별도 서류 안내)\n\n* 개인 자격(사업자 미등록)으로는 기업 파트너 가입이 불가합니다." },
                { heading: "가입 절차", body: "① 기업 정보 입력: 상호명, 사업자등록번호, 담당자 정보\n② 사업자등록증 업로드 (PDF 또는 이미지)\n③ OURCLUB 운영팀 검토 (1~2영업일)\n④ 담당자 연락처로 확인 연락\n⑤ 기업 대시보드 계정 활성화\n\n가입 문의: corp@ourclub.kr" },
                { heading: "제공 서비스", body: "기업 파트너에게는 아래 서비스가 제공됩니다.\n\n📋 B2B 프로젝트 공고 등록 (무제한)\n🔍 인증 동아리 검색 및 필터링\n📩 관심 동아리 직접 제안 기능\n📊 지원 현황 칸반 보드 (미열람 → 검토 → 미팅 → 매칭 완료)\n📄 동아리별 제안서 열람 및 상태 관리\n📈 매칭 결과 리포트 (분기별)" },
              ]}
            />
          } />
          <Route path="/project-guide" element={
            <InfoPage
              title="프로젝트 등록 방법"
              category="기업용 서비스"
              updatedAt="2026.05.01"
              sections={[
                { heading: "프로젝트 등록이란?", body: "기업이 원하는 협업 과제(마케팅, 개발, 리서치, 행사 등)를 공고로 등록하면, OURCLUB의 인증 동아리들이 제안서를 작성해 지원하는 B2B 매칭 시스템입니다.\n\n선발된 동아리와 기업이 협업을 진행하며, 프로젝트 결과물에 대한 보상(활동비, 후원금, 인턴 기회 등)은 기업이 직접 설정합니다." },
                { heading: "등록 전 준비사항", body: "원활한 등록을 위해 아래 내용을 미리 준비하세요.\n\n✓ 기업 파트너 계정 인증 완료 상태\n✓ 프로젝트 목표 및 기대 결과물 정의\n✓ 협업 기간 (시작일 ~ 종료일)\n✓ 필요한 역량 또는 동아리 유형\n✓ 보상 내용 (활동비, 현물 지원, 수료증 등)\n✓ 지원 마감일" },
                { heading: "등록 절차", body: "① 기업 대시보드 로그인\n② 상단 '새 프로젝트 등록' 버튼 클릭\n③ 프로젝트 제목, 카테고리, 예산, 마감일, 상세 설명 입력\n④ 필요 역량 태그 추가 (예: #마케팅 #SNS운영)\n⑤ '게시 요청' 제출\n⑥ OURCLUB 검토 후 인증 동아리에 공개 (보통 1영업일 이내)" },
                { heading: "매칭 과정", body: "공고 게시 후 아래 과정으로 매칭이 진행됩니다.\n\n1. 인증 동아리가 공고를 보고 제안서 작성 후 지원\n2. 기업 대시보드에서 지원 동아리 목록 및 제안서 확인\n3. 관심 동아리에 '미팅 요청' 상태로 변경\n4. 직접 연락 또는 플랫폼 내 채팅으로 미팅 진행\n5. 최종 협업 동아리 '매칭 완료' 처리" },
                { heading: "유의사항", body: "• 허위·과장된 공고 내용은 계정 정지 사유가 됩니다.\n• 보상 내용은 공고에 명시한 조건을 반드시 이행해야 합니다.\n• 동아리와의 분쟁 발생 시 OURCLUB은 중재 역할을 할 수 있으나, 계약 당사자는 기업과 동아리입니다.\n• 공고 내용 수정은 지원자가 없을 때만 가능합니다. 지원자 발생 후 중요 내용 변경 시 기존 지원자에게 개별 고지해야 합니다." },
              ]}
            />
          } />
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
