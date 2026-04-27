import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings, Briefcase } from 'lucide-react';

export function CorpSidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const menu = [
    { name: '발주한 프로젝트', path: '/corp/dashboard', icon: Briefcase },
    { name: '초대한 행사', path: '/corp/events', icon: Calendar },
    { name: '관심 동아리 풀 (Scouting)', path: '/corp/scouts', icon: Users },
    { name: '기업/결제 설정', path: '/corp/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-2">
      {menu.map(item => {
        const Icon = item.icon;
        const isSelected = isActive(item.path);
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`p-3 rounded text-left transition-all flex items-center gap-3 ${
              isSelected 
                ? 'font-black text-white border border-black bg-purple-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                : 'font-bold text-gray-600 hover:bg-gray-100 hover:text-black'
            }`}
          >
            <Icon className="w-5 h-5" /> <span className="text-sm">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
