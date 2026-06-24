import React, { useEffect, useState } from 'react';
import { Users, Briefcase, TrendingUp, ChevronRight, Star, Edit2, Calendar, BarChart2, Globe, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminHeaderPortal } from './AdminLayout';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAllIn } from '../../lib/fetchAll';
import { STORY_ENABLED } from '../../lib/features';
import { NumberTicker } from '../../components/ui/NumberTicker';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { BannerSlider } from '../../components/ui/BannerSlider';
import { getBanners } from '../../data/banners';
import { Card } from '../../components/ui/Card';

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
    '서류심사': 'bg-off-bg text-off-fg',
    '면접':     'bg-warn-bg text-warn-fg',
    '최종합격': 'bg-ok-bg text-ok-fg',
    '불합격':   'bg-bad-bg text-bad-fg',
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return '방금 전';
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  };

  return (
    <>
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          {loading ? (
            <LoadingScreen />
          ) : (
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
              <div>
                <h2 className="text-4xl font-black text-ink mb-2">대시보드 홈</h2>
                <p className="text-sand-500 font-bold">
                  {adminClub?.name} · 동아리 운영 현황을 한눈에 파악하세요.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  icon={<Users className="w-6 h-6 text-brand" strokeWidth={2.5} />}
                  iconBg="bg-brand-tint"
                  label="활동중 부원"
                  numericValue={stats?.memberCount ?? 0}
                  suffix="명"
                  link={{ to: '/admin/members', label: '부원 관리', color: 'text-brand' }}
                />
                <StatCard
                  icon={<TrendingUp className="w-6 h-6 text-brand" strokeWidth={2.5} />}
                  iconBg="bg-brand-tint"
                  label="모집중 지원자"
                  numericValue={stats?.applicantCount ?? 0}
                  suffix="명"
                  link={{ to: '/admin/recruit', label: '리크루팅 CRM', color: 'text-brand' }}
                />
                <StatCard
                  icon={<Briefcase className="w-6 h-6 text-brand" strokeWidth={2.5} />}
                  iconBg="bg-brand-tint"
                  label="진행중 B2B"
                  numericValue={stats?.b2bCount ?? 0}
                  suffix="건"
                  link={{ to: '/admin/b2b', label: 'B2B 관리', color: 'text-brand' }}
                />
                <StatCard
                  icon={<Star className="w-6 h-6 text-brand" strokeWidth={2.5} />}
                  iconBg="bg-brand-tint"
                  label="Pulse 평균 점수"
                  numericValue={stats?.pulseAvg != null ? Math.round(stats.pulseAvg * 10) / 10 : 0}
                  suffix={stats?.pulseAvg != null ? '점' : undefined}
                  link={{ to: '/admin/feedback', label: '설문 결과 보기', color: 'text-brand' }}
                />
              </div>

              {/* 하단 2분할 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 최근 지원 현황 */}
                <Card shadow={false}>
                  <div className="p-6 border-b border-sand-200 flex justify-between items-center">
                    <h3 className="text-xl font-black text-ink flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" strokeWidth={2.5} /> 최근 지원 현황
                    </h3>
                    <Link to="/admin/recruit" className="text-sm font-bold text-sand-500 hover:text-ink">
                      더보기
                    </Link>
                  </div>
                  <div>
                    {recentApplicants.length === 0 ? (
                      <div className="p-8 flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-ctl border border-dashed border-sand-300 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-sand-400" strokeWidth={2.5} />
                        </div>
                        <p className="text-sand-400 font-bold text-sm">아직 지원자가 없습니다.</p>
                        <Link
                          to="/admin/form-builder"
                          className="inline-flex items-center gap-2 px-5 py-2 btn-grad text-white font-black text-xs rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" strokeWidth={2.5} /> 공고 및 폼 만들기
                        </Link>
                      </div>
                    ) : (
                      recentApplicants.map(app => (
                        <div key={app.id} className="flex justify-between items-center p-4 border-b border-sand-200 last:border-none hover:bg-sand-50">
                          <div>
                            <p className="font-bold text-ink">
                              {app.profiles?.name ?? '—'}
                              <span className="text-sm text-sand-500 ml-2">{app.profiles?.major ?? ''}</span>
                            </p>
                            <p className="text-xs text-sand-400 mt-0.5">{timeAgo(app.submitted_at)}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-ctl text-xs font-bold ${statusStyle[app.status] ?? 'bg-off-bg text-off-fg'}`}>
                            {app.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* 빠른 이동 */}
                <Card shadow={false}>
                  <div className="p-6 border-b border-sand-200">
                    <h3 className="text-xl font-black text-ink">빠른 이동</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {[
                      { to: '/admin/form-builder', label: '지원서 폼 빌더 수정',  icon: <Edit2 className="w-4 h-4" /> },
                      { to: '/admin/attendance',   label: '출석 세션 생성하기',   icon: <Calendar className="w-4 h-4" /> },
                      { to: '/admin/feedback',     label: '만족도 조사 만들기',   icon: <BarChart2 className="w-4 h-4" /> },
                      ...(STORY_ENABLED ? [{ to: '/admin/posts', label: '스토리 포스트 발행', icon: <FileText className="w-4 h-4" /> }] : []),
                      { to: '/workspace',          label: '동아리 홈페이지 편집', icon: <Globe className="w-4 h-4" /> },
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center justify-between p-4 rounded-ctl border border-sand-200 hover:border-brand hover:bg-brand-tint transition-all font-bold group"
                      >
                        <span className="flex items-center gap-3 text-sand-600 group-hover:text-ink transition-colors">
                          <span className="text-sand-400 group-hover:text-brand transition-colors">{item.icon}</span>
                          {item.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-sand-300 group-hover:text-brand transition-colors" strokeWidth={2.5} />
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>

              <BannerSlider page="workspace" slides={getBanners('workspace')} />
            </div>
          )}
        </main>

      <AdminHeaderPortal>
        <Link
          to={`/clubs/${adminClub?.slug ?? ''}`}
          target="_blank"
          className="ml-4 px-4 py-2 rounded-ctl border border-sand-300 bg-white hover:bg-sand-50 transition-colors text-xs font-bold text-ink flex items-center gap-1"
        >
          홈페이지 라이브 프리뷰
        </Link>
      </AdminHeaderPortal>
    </>
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
    <div className="bg-white border border-sand-200 rounded-card p-6 shadow-soft hover:-translate-y-1 hover:shadow-soft-lg transition-all">
      <div className={`inline-flex p-3 ${iconBg} rounded-ctl mb-4`}>
        {icon}
      </div>
      <h3 className="text-sand-500 font-bold mb-1 text-sm">{label}</h3>
      <p className="text-4xl font-black text-ink flex items-baseline gap-1">
        <NumberTicker value={numericValue} duration={1400} stagger={80} />
        {suffix && <span className="text-2xl text-sand-400 font-bold">{suffix}</span>}
      </p>
      <Link to={link.to} className={`mt-4 flex items-center gap-1 text-sm font-bold ${link.color} hover:underline`}>
        {link.label} <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
