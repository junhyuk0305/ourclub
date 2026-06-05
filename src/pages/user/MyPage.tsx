import React, { useState } from 'react';
import { User, Heart, FileText, Bell, Loader, LogOut, ClipboardList, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PulseCheckBanner from './sections/PulseCheckBanner';
import AttendanceSection from './sections/AttendanceSection';
import RoleNudgeBanner from './sections/RoleNudgeBanner';
import ApplicationsSection from './sections/ApplicationsSection';
import AttendanceHistorySection from './sections/AttendanceHistorySection';
import ScrapsSection from './sections/ScrapsSection';
import NotificationsSection from './sections/NotificationsSection';
import EditProfileModal from './sections/EditProfileModal';
import DeleteAccountModal from './sections/DeleteAccountModal';

type Tab = 'applications' | 'attendance' | 'scraps' | 'notifications';

// ──────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────
export default function MyPage() {
  const { profile, signOut, refreshProfile, loading, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 출석 체크/인정 신청 후 출결 탭을 갱신하기 위한 신호
  const [activityVersion, setActivityVersion] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'applications', label: '지원 내역',     icon: <FileText className="w-5 h-5" /> },
    { key: 'attendance',   label: '활동 및 출결',  icon: <ClipboardList className="w-5 h-5" /> },
    { key: 'scraps',       label: '스크랩한 동아리', icon: <Heart className="w-5 h-5" /> },
    { key: 'notifications',label: '알림',          icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-12 md:py-16 border-b border-black">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-black mb-8">마이페이지</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── 프로필 사이드바 ── */}
          <div className="col-span-1 border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 self-start">
            <div className="flex flex-col items-center border-b border-black pb-8 mb-6">
              <div className="w-24 h-24 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-gray-500" />
              </div>
              <h2 className="text-2xl font-black mb-1">{profile?.name || '—'}</h2>
              <p className="text-gray-500 font-bold mb-1 text-sm text-center break-all">{profile?.email || '—'}</p>
              {profile?.university && (
                <p className="text-gray-400 font-bold text-xs mb-1">
                  {profile.university} {profile.major}
                </p>
              )}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-2 mb-3">
                  {profile.skills.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-orange-100 border border-orange-300 text-orange-700 text-xs font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full py-2.5 border border-black font-bold text-sm hover:bg-gray-100 transition-colors mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px"
              >
                프로필 수정
              </button>
            </div>

            {/* Mobile: 수평 스크롤 탭 */}
            <div className="flex overflow-x-auto md:hidden gap-1 -mx-2 px-2 pb-2 mb-2">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap text-sm font-bold border border-black transition-colors shrink-0 ${
                    activeTab === item.key
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(249,115,22,1)]'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>

            {/* Desktop: 수직 네비게이션 */}
            <nav className="hidden md:flex flex-col gap-2 font-bold">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-3 p-3 text-left transition-colors ${
                    activeTab === item.key
                      ? 'bg-black text-white'
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>

            <button
              onClick={handleSignOut}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-500 font-bold text-sm hover:border-black hover:text-black transition-colors"
            >
              <LogOut className="w-4 h-4" /> 로그아웃
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-400 font-bold text-xs hover:border-red-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> 회원 탈퇴
            </button>
          </div>

          {/* ── 메인 콘텐츠 ── */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-8">
            {/* 역할별 전환 유도 배너 (운영진/기업 사용자) */}
            <RoleNudgeBanner />

            {/* Phase 5: Pulse Check 배너 (진행중 설문 있을 때만 표시) */}
            <PulseCheckBanner />

            {/* Phase 4: 출석 코드 입력 */}
            <AttendanceSection onActivityChange={() => setActivityVersion(v => v + 1)} />

            {/* 탭 콘텐츠 */}
            {activeTab === 'applications'  && <ApplicationsSection />}
            {activeTab === 'attendance'    && <AttendanceHistorySection refreshKey={activityVersion} />}
            {activeTab === 'scraps'        && <ScrapsSection />}
            {activeTab === 'notifications' && <NotificationsSection />}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal onClose={() => { setShowEditModal(false); refreshProfile(); }} />
      )}
      {showDeleteConfirm && (
        <DeleteAccountModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            const { error } = await deleteAccount();
            if (!error) navigate('/');
          }}
        />
      )}
    </div>
  );
}
