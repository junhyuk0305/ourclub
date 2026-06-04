import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ClipboardList, Users, LogOut, LayoutDashboard, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { path: '/master',               label: '운영 대시보드',   icon: LayoutDashboard },
  { path: '/master/clubs',         label: '동아리 관리',     icon: Building2 },
  { path: '/master/registrations', label: '동아리 등록 심사', icon: ClipboardList },
  { path: '/master/join-requests', label: '합류 신청 심사',   icon: Users },
];

export function MasterLayout({ children }: { children: React.ReactNode }) {
  const { signOut, profile } = useAuth();
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* 헤더 */}
      <header className="h-14 border-b-4 border-black bg-black text-white flex items-center px-6 gap-4 shrink-0">
        <Shield className="w-5 h-5 text-orange-500" />
        <span className="font-black text-lg tracking-tight">OURCLUB 마스터</span>
        <span className="ml-auto text-sm font-bold text-gray-400">{profile?.name}</span>
        <button
          onClick={signOut}
          className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
        >
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        <aside className="w-56 border-r-4 border-black bg-white flex flex-col p-4 gap-1 shrink-0">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-3 font-bold text-sm transition-colors ${
                  active
                    ? 'bg-black text-white font-black'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </aside>

        {/* 메인 */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
