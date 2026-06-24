import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, BarChart3 } from 'lucide-react';
import RecruitDashboard from './RecruitDashboard';
import RecruitAnalytics from './RecruitAnalytics';

// 모집 대시보드 + 분석 리포트를 한 페이지의 2개 탭으로 통합.
const TABS = [
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'analytics', label: '분석 리포트', icon: BarChart3 },
] as const;

export default function RecruitInsights() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'analytics' ? 'analytics' : 'dashboard';

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 pt-8">
        <div className="flex gap-1 p-1 bg-sand-100 rounded-ctl w-fit">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setParams(t.key === 'dashboard' ? {} : { tab: t.key })}
                className={`px-5 py-2.5 font-bold text-sm flex items-center gap-2 rounded-ctl transition-all ${
                  active ? 'bg-white text-ink shadow-soft' : 'text-sand-500 hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {tab === 'dashboard' ? <RecruitDashboard /> : <RecruitAnalytics />}
    </main>
  );
}
