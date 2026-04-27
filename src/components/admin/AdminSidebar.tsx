import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Palette, Briefcase, Calendar, CheckSquare, Users, Edit3, Settings, MessageSquare, FileText, ChevronDown, ChevronRight, Globe, ClipboardList, PenTool } from 'lucide-react';

type MenuItem = {
  name: string;
  path: string;
};

type MenuGroup = {
  name: string;
  icon: React.ElementType;
  path?: string; // If the group itself is clickable
  items?: MenuItem[]; // Sub-items
};

export function AdminSidebar() {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    '웹사이트 관리': true,
    '모집 및 지원 관리': true,
    '멤버 및 활동 관리': true,
    '운영 및 성과 평가': true
  });

  const isActive = (path: string) => location.pathname === path || (path !== '/workspace' && path !== '/admin/dashboard' && location.pathname.startsWith(path));

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const menuGroups: MenuGroup[] = [
    { name: '대시보드', path: '/admin/dashboard', icon: LayoutDashboard },
    { 
      name: '웹사이트 관리', 
      icon: Globe,
      items: [
        { name: '1-Page 프로필 꾸미기', path: '/workspace' }
      ]
    },
    {
      name: '모집 및 지원 관리',
      icon: ClipboardList,
      items: [
        { name: '지원서 폼 빌더', path: '/admin/form-builder' },
        { name: '리크루팅 진행 상황', path: '/admin/recruit' }
      ]
    },
    {
      name: '멤버 및 활동 관리',
      icon: Users,
      items: [
        { name: '부원 명단 관리', path: '/admin/members' },
        { name: '출석 및 세션 관리', path: '/admin/attendance' }
      ]
    },
    {
      name: '운영 및 성과 평가',
      icon: Briefcase,
      items: [
        { name: 'B2B 프로젝트 수주', path: '/admin/b2b' },
        { name: '스토리 포스트 발행', path: '/admin/posts' },
        { name: '만족도 조사 (Pulse)', path: '/admin/feedback' }
      ]
    },
    { name: '동아리 환경 설정', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-1 select-none">
      {menuGroups.map((group, idx) => {
        const Icon = group.icon;
        
        if (group.path && !group.items) {
          // It's a top-level link
          const isSelected = isActive(group.path);
          return (
             <Link key={group.name} to={group.path} className={`p-3 rounded text-left transition-all flex items-center gap-3 ${isSelected ? 'font-black text-white border border-black bg-orange-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'font-bold text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-5 h-5" /> <span className="text-sm">{group.name}</span>
            </Link>
          );
        }

        // It's a group with sub-items
        const isOpen = openGroups[group.name];
        const isChildActive = group.items?.some(item => isActive(item.path));

        return (
          <div key={group.name} className="flex flex-col">
            <button 
              onClick={() => toggleGroup(group.name)}
              className={`p-3 rounded text-left transition-all flex items-center justify-between font-bold ${isChildActive ? 'text-black' : 'text-gray-600'} hover:bg-gray-100 mt-1`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" /> <span className="text-sm">{group.name}</span>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isOpen && group.items && (
              <div className="flex flex-col ml-11 mt-1 gap-1 border-l-2 border-gray-100">
                {group.items.map(item => {
                  const isSelected = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} className={`py-2 px-3 rounded text-left transition-all text-sm relative ${isSelected ? 'font-black text-orange-600 bg-orange-50' : 'font-bold text-gray-500 hover:bg-gray-100 hover:text-black'}`}>
                      {/* Tree branch effect */}
                      {isSelected && <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-[2px] h-3 bg-orange-500"></div>}
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
