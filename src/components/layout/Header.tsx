import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

export const Header = () => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <header className="h-16 border-b border-black flex items-center justify-between px-6 bg-white sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-4 h-4 bg-orange-500 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
        <span className="font-black text-2xl tracking-tighter ml-1">OURCLUB</span>
      </Link>
      <nav className="hidden md:flex gap-8 text-sm font-bold">
        <NavLink
          to="/clubs"
          className={({ isActive }) =>
            `transition-colors ${isActive ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'hover:text-orange-500'}`
          }
        >
          동아리 찾기
        </NavLink>
        <NavLink
          to="/b2b"
          className={({ isActive }) =>
            `transition-colors ${isActive ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'hover:text-orange-500'}`
          }
        >
          기업 라운지
        </NavLink>
        <NavLink
          to="/stories"
          className={({ isActive }) =>
            `transition-colors ${isActive ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'hover:text-orange-500'}`
          }
        >
          동아리 스토리
        </NavLink>
      </nav>
      <div className="flex gap-2 items-center">
        {user ? (
          <>
            {isAdmin ? (
              <Link to="/admin/dashboard" className="hidden lg:block px-3 py-2 text-sm font-bold text-gray-600 hover:text-orange-500 transition-colors">
                운영진 워크스페이스
              </Link>
            ) : (
              <Link to="/mypage" className="hidden lg:block px-3 py-2 text-sm font-bold text-gray-600 hover:text-orange-500 transition-colors">
                학생 마이페이지
              </Link>
            )}
            {/* Assuming corp/dashboard has its own auth logic, keeping it for now */}
            <Link to="/corp/dashboard" className="hidden lg:block px-3 py-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors">
              기업 비즈니스 센터
            </Link>
            <div className="hidden lg:block w-px h-4 bg-gray-300 mx-2"></div>
            <button onClick={() => setIsAlertOpen(true)} className="p-2 hover:bg-orange-500 border border-transparent hover:border-black transition-colors" title="알림">
              <Bell className="w-5 h-5" />
            </button>
          </>
        ) : (
          <Link to="/login" className="px-5 py-2 border-2 border-black text-sm font-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none ml-2">
            로그인 / 가입
          </Link>
        )}
      </div>

      <Modal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} title="새로운 알림">
        <div className="flex flex-col items-center justify-center py-8">
          <Bell className="w-12 h-12 text-gray-300 mb-4" />
          <p className="font-bold text-gray-600">현재 도착한 새로운 알림이 없습니다.</p>
        </div>
      </Modal>
    </header>
  );
};
