import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings, Briefcase } from 'lucide-react';

export function CorpSidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const menu = [
    { name: '발주한 프로젝트', path: '/corp/dashboard', icon: Briefcase },
    { name: '초대한 행사', path: '/corp/events', icon: Calendar, soon: true },
    { name: '관심 동아리 풀 (Scouting)', path: '/corp/scouts', icon: Users },
    { name: '기업/결제 설정', path: '/corp/settings', icon: Settings, soon: true },
  ];

  return (
    <div className="flex flex-col gap-2">
      {menu.map(item => {
        const Icon = item.icon;
        // 미구현 메뉴: 라우트가 없어 클릭 시 catch-all로 대시보드에 조용히 튕기므로 비활성 '준비중'으로 표시
        if (item.soon) {
          return (
            <div
              key={item.path}
              aria-disabled="true"
              title="준비 중인 기능이에요"
              className="p-3 rounded-ctl text-left flex items-center gap-3 font-bold text-sand-400 cursor-not-allowed"
            >
              <Icon className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-sm flex-1">{item.name}</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 border border-sand-200 text-sand-400 rounded-md">준비중</span>
            </div>
          );
        }
        const isSelected = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`p-3 rounded-ctl text-left transition-all flex items-center gap-3 ${
              isSelected
                ? 'font-black text-white btn-grad shadow-btn'
                : 'font-bold text-sand-600 hover:bg-sand-100 hover:text-ink'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={2.5} /> <span className="text-sm">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
