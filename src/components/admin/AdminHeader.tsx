import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  clubName?: string;
  children?: React.ReactNode;
}

export function AdminHeader({ clubName = '마제스티', children }: AdminHeaderProps) {
  return (
    <header className="h-14 border-b border-black bg-white flex items-center justify-between px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-gray-100 transition-colors rounded-full border border-transparent hover:border-black">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-black text-lg tracking-tight">운영진 워크스페이스</h1>
      </div>
      <div className="flex items-center gap-4 text-sm font-bold">
        현재 관리 중인 동아리: <span className="text-orange-500">{clubName}</span>
        {children}
      </div>
    </header>
  );
}
