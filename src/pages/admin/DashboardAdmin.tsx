import React, { useEffect, useState } from 'react';
import { Users, Briefcase, TrendingUp, ChevronRight, Loader, Star, Edit2, Calendar, BarChart2, Globe, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAllIn } from '../../lib/fetchAll';
import { NumberTicker } from '../../components/ui/NumberTicker';

interface Stats {
  memberCount: number;
  applicantCount: number;
  b2bCount: number;
  pulseAvg: number | null;
}

interface RecentApplicant {
  id: string;
  status: string;
  submitted_at: string;
  profiles: { name: string; major: string | null } | null;
}

export default function DashboardAdmin() {
  const { adminClub, adminClubId } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentApplicants, setRecentApplicants] = useState<RecentApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminClubId) return;
    fetchAll(adminClubId);
  }, [adminClubId]);

  const fetchAll = async (clubId: string) => {
    setLoading(true);

    // 1. 활동중 부원 수
    const { count: memberCount } = await supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('status', '활동중');

    // 2. 모집중인 지원자 수 (해당 클럽의 모든 recruitment에 달린 지원서)
    const { data: recruitIds } = await supabase
      .from('recruitments')
      .select('id')
      .eq('club_id', clubId)
      .eq('status', '진행중');

    let applicantCount = 0;
    if (recruitIds && recruitIds.length > 0) {
      const { count } = await supabase
        .from('recruitment_applications')
        .select('*', { count: 'exact', head: true })
        .in('recruitment_id', recruitIds.map(r => r.id));
      applicantCount = count ?? 0;
    }

    // 3. 진행중 B2B 수주 수
    const { count: b2bCount } = await supabase
      .from('b2b_applications')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .neq('status', '거절');

    // 4. Pulse 평균 점수
    let pulseAvg: number | null = null;
    const { data: surveys } = await supabase
      .from('pulse_surveys')
      .select('id')
      .eq('club_id', clubId);
    if (surveys && surveys.length > 0) {
      const surveyIds = surveys.map(s => s.id);
      const { data: responses } = await fetchAllIn<{ score: number | null }>(
        surveyIds,
        (chunk, from, to) => supabase
          .from('pulse_responses')
          .select('score')
          .in('survey_id', chunk)
          .range(from, to),
      );
      if (responses && responses.length > 0) {
        const total = responses.reduce((sum, r) => sum + (r.score ?? 0), 0);
        pulseAvg = Math.round((total / responses.length) * 10) / 10;
      }
    }

    setStats({
      memberCount: memberCount ?? 0,
      applicantCount,
      b2bCount: b2bCount ?? 0,
      pulseAvg,
    });

    // 5. 최근 지원자 5명
    if (recruitIds && recruitIds.length > 0) {
      const { data: apps } = await supabase
        .from('recruitment_applications')
        .select('id, status, submitted_at, profiles(name, major)')
        .in('recruitment_id', recruitIds.map(r => r.id))
        .order('submitted_at', { ascending: false })
        .limit(5);
      setRecentApplicants((apps as unknown as RecentApplicant[]) ?? []);
    }

    setLoading(false);
  };

  const statusStyle: Record<string, string> = {
    '서류심사': 'bg-gray-100 border-gray-300 text-gray-700',
    '면접':     'bg-yellow-100 border-yellow-300 text-yellow-800',
    '최종합격': 'bg-green-100 border-green-300 text-green-800',
    '불합격':   'bg-red-100 border-red-300 text-red-700',
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return '방금 전';
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        <Link
          to={`/clubs/${adminClub?.slug ?? ''}`}
          target="_blank"
          className="ml-4 px-4 py-2 border border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-px text-xs flex items-center gap-1"
        >
          홈페이지 라이브 프리뷰
        </Link>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
              <div>
                <h2 className="text-4xl font-black mb-2">대시보드 홈</h2>
                <p className="text-gray-500 font-bold">
                  {adminClub?.name} · 동아리 운영 현황을 한눈에 파악하세요.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  icon={<Users className="w-6 h-6 text-orange-600" />}
                  iconBg="bg-orange-100"
                  label="활동중 부원"
                  numericValue={stats?.memberCount ?? 0}
                  suffix="명"
                  link={{ to: '/admin/members', label: '부원 관리', color: 'text-orange-600' }}
                />
                <StatCard
                  icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
                  iconBg="bg-blue-100"
                  label="모집중 지원자"
                  numericValue={stats?.applicantCount ?? 0}
                  suffix="명"
                  link={{ to: '/admin/recruit', label: '리크루팅 CRM', color: 'text-blue-600' }}
                />
                <StatCard
                  icon={<Briefcase className="w-6 h-6 text-purple-600" />}
                  iconBg="bg-purple-100"
                  label="진행중 B2B"
                  numericValue={stats?.b2bCount ?? 0}
                  suffix="건"
                  link={{ to: '/admin/b2b', label: 'B2B 관리', color: 'text-purple-600' }}
                />
                <StatCard
                  icon={<Star className="w-6 h-6 text-yellow-600" />}
                  iconBg="bg-yellow-100"
                  label="Pulse 평균 점수"
                  numericValue={stats?.pulseAvg != null ? Math.round(stats.pulseAvg * 10) / 10 : 0}
                  suffix={stats?.pulseAvg != null ? '점' : undefined}
                  link={{ to: '/admin/feedback', label: '설문 결과 보기', color: 'text-yellow-600' }}
                />
              </div>

              {/* 하단 2분할 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 최근 지원 현황 */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="p-6 border-b border-black flex justify-between items-center">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" /> 최근 지원 현황
                    </h3>
                    <Link to="/admin/recruit" className="text-sm font-bold text-gray-500 hover:text-black">
                      더보기
                    </Link>
                  </div>
                  <div>
                    {recentApplicants.length === 0 ? (
                      <div className="p-8 flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-bold text-sm">아직 지원자가 없습니다.</p>
                        <Link
                          to="/admin/form-builder"
                          className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white font-black text-xs border border-black hover:bg-orange-500 hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <FileText className="w-3.5 h-3.5" /> 공고 및 폼 만들기
                        </Link>
                      </div>
                    ) : (
                      recentApplicants.map(app => (
                        <div key={app.id} className="flex justify-between items-center p-4 border-b border-gray-100 last:border-none hover:bg-gray-50">
                          <div>
                            <p className="font-bold">
                              {app.profiles?.name ?? '—'}
                              <span className="text-sm text-gray-500 ml-2">{app.profiles?.major ?? ''}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(app.submitted_at)}</p>
                          </div>
                          <span className={`px-3 py-1 border text-xs font-bold ${statusStyle[app.status] ?? 'bg-gray-100'}`}>
                            {app.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 빠른 이동 */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="p-6 border-b border-black">
                    <h3 className="text-xl font-black">빠른 이동</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {[
                      { to: '/admin/form-builder', label: '지원서 폼 빌더 수정',  icon: <Edit2 className="w-4 h-4" /> },
                      { to: '/admin/attendance',   label: '출석 세션 생성하기',   icon: <Calendar className="w-4 h-4" /> },
                      { to: '/admin/feedback',     label: '만족도 조사 만들기',   icon: <BarChart2 className="w-4 h-4" /> },
                      { to: '/admin/posts',        label: '스토리 포스트 발행',   icon: <FileText className="w-4 h-4" /> },
                      { to: '/workspace',          label: '동아리 홈페이지 편집', icon: <Globe className="w-4 h-4" /> },
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center justify-between p-4 border border-gray-200 hover:border-black hover:bg-orange-50 transition-all font-bold group"
                      >
                        <span className="flex items-center gap-3 text-gray-600 group-hover:text-black transition-colors">
                          <span className="text-gray-400 group-hover:text-orange-500 transition-colors">{item.icon}</span>
                          {item.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, numericValue, suffix, link }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  numericValue: number;
  suffix?: string;
  link: { to: string; label: string; color: string };
}) {
  return (
    <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
      <div className={`inline-flex p-3 ${iconBg} border border-black rounded-lg mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-500 font-bold mb-1 text-sm">{label}</h3>
      <p className="text-4xl font-black flex items-baseline gap-1">
        <NumberTicker value={numericValue} duration={1400} stagger={80} />
        {suffix && <span className="text-2xl text-gray-400 font-bold">{suffix}</span>}
      </p>
      <Link to={link.to} className={`mt-4 flex items-center gap-1 text-sm font-bold ${link.color} hover:underline`}>
        {link.label} <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
