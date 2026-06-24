import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Settings, ChevronDown, ChevronRight, Palette, ClipboardList } from 'lucide-react';
import { STORY_ENABLED } from '../../lib/features';

type MenuItem = {
  name: string;
  path: string;
  match?: (pathname: string) => boolean; // 하위 경로까지 활성 처리할 때
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
    (!EXACT_ONLY.includes(path) && location.pathname.startsWith(path + '/'));

  const itemActive = (item: MenuItem) =>
    item.match ? item.match(location.pathname) : isActive(item.path);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const menuGroups: MenuGroup[] = [
    { name: '대시보드', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: '1PAGE 웹 디자인', path: '/workspace', icon: Palette },
    {
      name: '모집 및 지원 관리',
      icon: ClipboardList,
      items: [
        { name: '전체 모집', path: '/admin/recruitments' },
        { name: '모집 분석', path: '/admin/recruit-insights' },
      ]
    },
    {
      name: '멤버 및 활동 관리',
      icon: Users,
      items: [
        { name: '부원 명단 관리', path: '/admin/members' },
        { name: '명단 분석', path: '/admin/members-analytics' },
        {
          name: '전체 세션 관리',
          path: '/admin/sessions',
          match: (p) => p.startsWith('/admin/sessions') || p.startsWith('/admin/attendance-excuses'),
        },
      ]
    },
    {
      name: '운영 및 성과 평가',
      icon: Briefcase,
      items: [
        { name: '기업 협업 프로젝트', path: '/admin/b2b' },
        ...(STORY_ENABLED ? [{ name: '스토리 포스트 발행', path: '/admin/posts' }] : []),
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
              className={`p-3 rounded-ctl text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? 'font-black text-white btn-grad shadow-btn'
                  : 'font-bold text-sand-600 hover:bg-sand-50'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-sm">{group.name}</span>
            </Link>
          );
        }

        // 그룹 + 서브메뉴
        const isOpen = openGroups[group.name];
        const isChildActive = group.items?.some(itemActive);

        return (
          <div key={group.name} className="flex flex-col mt-1 pt-1 border-t border-sand-200 first:border-t-0 first:mt-0 first:pt-0">
            <button
              onClick={() => toggleGroup(group.name)}
              className={`py-2.5 px-3 text-left transition-all flex items-center justify-between font-bold text-xs uppercase tracking-widest ${
                isChildActive ? 'text-brand-dark' : 'text-sand-400'
              } hover:text-ink`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                <span>{group.name}</span>
              </div>
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {isOpen && group.items && (
              <div className="flex flex-col ml-6 gap-0.5 border-l border-sand-200 pl-1 mb-1">
                {group.items.map(item => {
                  const isSelected = itemActive(item);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`py-2.5 px-3 rounded-ctl text-left transition-all text-sm relative ${
                        isSelected
                          ? 'font-black text-ink bg-brand-tint border-l-4 border-brand -ml-[1px] pl-[15px]'
                          : 'font-bold text-sand-500 hover:bg-sand-50 hover:text-ink'
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
