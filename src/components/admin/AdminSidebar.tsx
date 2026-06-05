import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Settings, ChevronDown, ChevronRight, Palette, ClipboardList } from 'lucide-react';

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
    '커스터마이징': true,
    '모집 및 지원 관리': true,
    '멤버 및 활동 관리': true,
    '운영 및 성과 평가': true
  });

  const EXACT_ONLY = ['/workspace', '/admin/dashboard', '/admin/sessions'];
  const isActive = (path: string) =>
    location.pathname === path ||
    (!EXACT_ONLY.includes(path) && location.pathname.startsWith(path));

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const menuGroups: MenuGroup[] = [
    { name: '대시보드', path: '/admin/dashboard', icon: LayoutDashboard },
    {
      name: '커스터마이징',
      icon: Palette,
      items: [
        { name: '1-Page 프로필', path: '/workspace' },
        { name: '채용 메인 페이지 제작', path: '/admin/recruit-page' },
      ]
    },
    {
      name: '모집 및 지원 관리',
      icon: ClipboardList,
      items: [
        { name: '전체 채용', path: '/admin/recruitments' },
        { name: '모집 대시보드', path: '/admin/recruit-dashboard' },
        { name: '분석 리포트', path: '/admin/recruit-analytics' },
      ]
    },
    {
      name: '멤버 및 활동 관리',
      icon: Users,
      items: [
        { name: '부원 명단 관리', path: '/admin/members' },
        { name: '명단 분석', path: '/admin/members-analytics' },
        { name: '세션 출석기록 생성', path: '/admin/sessions/new' },
        { name: '전체 세션 관리', path: '/admin/sessions' },
        { name: '출석 인정 관리', path: '/admin/attendance-excuses' },
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
          // Top-level 단독 링크
          const isSelected = isActive(group.path);
          return (
            <Link
              key={group.name}
              to={group.path}
              className={`p-3 text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? 'font-black text-white border border-black bg-orange-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'font-bold text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{group.name}</span>
            </Link>
          );
        }

        // 그룹 + 서브메뉴
        const isOpen = openGroups[group.name];
        const isChildActive = group.items?.some(item => isActive(item.path));

        return (
          <div key={group.name} className="flex flex-col mt-1 pt-1 border-t border-gray-100 first:border-t-0 first:mt-0 first:pt-0">
            <button
              onClick={() => toggleGroup(group.name)}
              className={`py-2.5 px-3 text-left transition-all flex items-center justify-between font-bold text-xs uppercase tracking-widest ${
                isChildActive ? 'text-orange-600' : 'text-gray-400'
              } hover:text-black`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{group.name}</span>
              </div>
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {isOpen && group.items && (
              <div className="flex flex-col ml-6 gap-0.5 border-l-2 border-gray-100 pl-1 mb-1">
                {group.items.map(item => {
                  const isSelected = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`py-2.5 px-3 text-left transition-all text-sm relative ${
                        isSelected
                          ? 'font-black text-black bg-orange-50 border-l-4 border-orange-500 -ml-[2px] pl-[14px]'
                          : 'font-bold text-gray-500 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
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
