import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAllIn } from '../../lib/fetchAll';
import { deriveRecruitStatus } from '../../types/recruitment';
import {
  LayoutDashboard, Users, CheckCircle2, XCircle, Clock, ChevronRight,
  TrendingDown, Briefcase, AlertCircle,
} from 'lucide-react';

interface Recruitment {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  pipeline_stages: string[] | null;
  generation: string | null;
}

interface ApplicationRow {
  id: string;
  recruitment_id: string;
  status: string;
  submitted_at: string;
}

interface RecruitmentStats {
  recruitment: Recruitment;
  total: number;
  byStage: Record<string, number>;
  passed: number;
  inProgress: number;
  rejected: number;
}

const REJECT_KEYWORDS = ['불합격', '탈락', '거절', 'reject'];

function isReject(status: string) {
  return REJECT_KEYWORDS.some(k => status.toLowerCase().includes(k.toLowerCase()));
}

export default function RecruitDashboard() {
  const { adminClubId } = useAdmin();
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRid, setSelectedRid] = useState<string>('all');

  useEffect(() => {
    if (!adminClubId) return;
    load();
  }, [adminClubId]);

  const load = async () => {
    if (!adminClubId) return;
    setLoading(true);
    const { data: recs } = await supabase
      .from('recruitments')
      .select('id, title, status, deadline, pipeline_stages, generation')
      .eq('club_id', adminClubId)
      .order('created_at', { ascending: false });
    const recList = (recs as Recruitment[] | null) ?? [];
    setRecruitments(recList);

    if (recList.length > 0) {
      const { data: applications } = await fetchAllIn<ApplicationRow>(
        recList.map(r => r.id),
        (chunk, from, to) => supabase
          .from('recruitment_applications')
          .select('id, recruitment_id, status, submitted_at')
          .in('recruitment_id', chunk)
          .range(from, to),
      );
      setApps(applications);
    }
    setLoading(false);
  };

  // 집계
  const stats = useMemo<RecruitmentStats[]>(() => {
    return recruitments.map(r => {
      const rApps = apps.filter(a => a.recruitment_id === r.id);
      const stages = r.pipeline_stages ?? [];
      const lastStage = stages[stages.length - 1];
      const byStage: Record<string, number> = {};
      stages.forEach(s => { byStage[s] = 0; });
      let passed = 0, rejected = 0, inProgress = 0;
      rApps.forEach(a => {
        if (byStage[a.status] !== undefined) byStage[a.status]++;
        if (a.status === lastStage) passed++;
        else if (isReject(a.status)) rejected++;
        else inProgress++;
      });
      return { recruitment: r, total: rApps.length, byStage, passed, inProgress, rejected };
    });
  }, [recruitments, apps]);

  const totals = useMemo(() => {
    const t = stats.reduce((acc, s) => ({
      total: acc.total + s.total,
      passed: acc.passed + s.passed,
      inProgress: acc.inProgress + s.inProgress,
      rejected: acc.rejected + s.rejected,
    }), { total: 0, passed: 0, inProgress: 0, rejected: 0 });
    return t;
  }, [stats]);

  const focused = selectedRid === 'all'
    ? null
    : stats.find(s => s.recruitment.id === selectedRid) ?? null;

  return (
    <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-3xl font-black text-ink flex items-center gap-3">
                  <LayoutDashboard className="w-7 h-7 text-brand" strokeWidth={2.5} />
                  모집 대시보드
                </h1>
                <p className="text-sand-500 font-bold text-sm mt-1">
                  공고별 단계 분포·통과율을 한눈에 확인합니다.
                </p>
              </div>
              {recruitments.length > 0 && (
                <select
                  value={selectedRid}
                  onChange={e => setSelectedRid(e.target.value)}
                  className="field px-4 py-2.5 border border-sand-300 rounded-ctl font-bold text-sm bg-white outline-none"
                >
                  <option value="all">전체 공고 ({recruitments.length})</option>
                  {recruitments.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.title}{r.generation ? ` · ${r.generation}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {loading ? (
              <LoadingScreen />
            ) : recruitments.length === 0 ? (
              <div className="bg-white border border-dashed border-sand-300 rounded-card p-16 text-center">
                <Briefcase className="w-12 h-12 text-sand-300 mx-auto mb-4" strokeWidth={2.5} />
                <h3 className="text-xl font-black text-sand-400 mb-2">아직 공고가 없습니다</h3>
                <Link to="/admin/recruitments" className="text-brand font-bold hover:underline text-sm">
                  전체 모집에서 새 공고를 만들어보세요 →
                </Link>
              </div>
            ) : (
              <>
                {/* 요약 4개 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat label="총 지원자" value={focused?.total ?? totals.total} icon={<Users className="w-5 h-5" strokeWidth={2.5} />} color="bg-brand-tint text-brand" />
                  <Stat label="진행 중" value={focused?.inProgress ?? totals.inProgress} icon={<Clock className="w-5 h-5" strokeWidth={2.5} />} color="bg-info-bg text-info-fg" />
                  <Stat label="합격" value={focused?.passed ?? totals.passed} icon={<CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />} color="bg-ok-bg text-ok-fg" />
                  <Stat label="불합격" value={focused?.rejected ?? totals.rejected} icon={<XCircle className="w-5 h-5" strokeWidth={2.5} />} color="bg-off-bg text-off-fg" />
                </div>

                {/* 단계별 분포 */}
                {focused ? (
                  <StageBreakdown stats={focused} />
                ) : (
                  <RecruitmentDistribution stats={stats} />
                )}

                {/* 공고별 표 */}
                <div className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden">
                  <div className="px-6 py-4 border-b border-sand-200 bg-sand-50">
                    <h3 className="font-black text-base text-ink">공고별 현황</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-sand-50 border-b border-sand-200">
                      <tr>
                        <Th>공고</Th>
                        <Th>상태</Th>
                        <Th align="right">총 지원</Th>
                        <Th align="right">진행 중</Th>
                        <Th align="right">합격</Th>
                        <Th align="right">불합격</Th>
                        <Th align="right">합격률</Th>
                        <Th />
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map(s => {
                        const rate = s.total > 0 ? (s.passed / s.total) * 100 : 0;
                        const derivedStatus = deriveRecruitStatus(s.recruitment);
                        return (
                          <tr key={s.recruitment.id} className="border-b border-sand-200 hover:bg-sand-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-black text-sm text-ink">{s.recruitment.title}</p>
                              {s.recruitment.generation && <p className="text-xs text-sand-400 font-bold">{s.recruitment.generation}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-ctl ${
                                derivedStatus === '진행중' ? 'bg-ok-bg text-ok-fg' :
                                derivedStatus === '마감' ? 'bg-off-bg text-off-fg' :
                                'bg-warn-bg text-warn-fg'
                              }`}>
                                {derivedStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-sm text-ink">{s.total}</td>
                            <td className="px-4 py-3 text-right font-bold text-sm text-info-fg">{s.inProgress}</td>
                            <td className="px-4 py-3 text-right font-bold text-sm text-ok-fg">{s.passed}</td>
                            <td className="px-4 py-3 text-right font-bold text-sm text-sand-500">{s.rejected}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-black text-sm ${rate >= 30 ? 'text-ok-fg' : rate >= 10 ? 'text-brand' : 'text-sand-400'}`}>
                                {rate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/admin/recruitments/${s.recruitment.id}?tab=applicants`}
                                className="text-xs font-bold text-sand-400 hover:text-brand flex items-center gap-0.5 justify-end"
                              >
                                상세 <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-3 text-${align} text-xs font-bold text-sand-500 uppercase tracking-wider`}>
      {children}
    </th>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5">
      <div className={`inline-flex items-center gap-2 font-bold text-sm mb-2 px-2.5 py-1 rounded-ctl ${color}`}>{icon}{label}</div>
      <p className="text-3xl font-black text-ink">{value}</p>
    </div>
  );
}

// ── 단일 공고 선택 시 단계별 인원·통과율 ────────────────────────────────
function StageBreakdown({ stats }: { stats: RecruitmentStats }) {
  const stages = stats.recruitment.pipeline_stages ?? [];
  const max = Math.max(1, ...Object.values(stats.byStage));

  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6">
      <h3 className="font-black text-base text-ink mb-1">단계별 인원·통과율</h3>
      <p className="text-xs text-sand-500 font-bold mb-5">
        각 단계에 현재 머무는 지원자 수와 다음 단계 통과율입니다.
      </p>

      {stages.length === 0 ? (
        <p className="text-sm text-sand-400 font-bold">설정된 단계가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {stages.map((stage, i) => {
            const count = stats.byStage[stage] ?? 0;
            const width = (count / max) * 100;
            const isLast = i === stages.length - 1;
            // 통과율: 다음 단계 이후로 진입한 비율 (현재 단계 도달 인원 대비)
            const reached = stages.slice(i).reduce((s, st) => s + (stats.byStage[st] ?? 0), 0);
            const passedFromHere = stages.slice(i + 1).reduce((s, st) => s + (stats.byStage[st] ?? 0), 0);
            const passRate = !isLast && reached > 0 ? (passedFromHere / reached) * 100 : null;
            const dropRate = passRate !== null ? 100 - passRate : null;
            return (
              <div key={stage}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className={`font-black ${isLast ? 'text-ok-fg' : 'text-ink'}`}>{stage}</span>
                  <span className="text-xs font-bold text-sand-500">{count}명</span>
                </div>
                <div className="h-7 bg-sand-100 border border-sand-200 rounded-ctl overflow-hidden">
                  <div
                    className={`h-full transition-all flex items-center justify-end pr-2 text-xs font-black text-white ${isLast ? 'bg-ok-fg' : 'bg-brand'}`}
                    style={{ width: `${width}%` }}
                  >
                    {width > 15 && `${count}`}
                  </div>
                </div>
                {!isLast && passRate !== null && (
                  <div className="flex items-center gap-3 mt-1 text-xs font-bold">
                    <span className="text-ok-fg">통과율 {passRate.toFixed(1)}%</span>
                    <span className="text-sand-300">|</span>
                    <span className="text-bad-fg flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" strokeWidth={2.5} /> 탈락률 {dropRate?.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 전체 보기 시: 공고별 도넛(누적 바) ────────────────────────────────
function RecruitmentDistribution({ stats }: { stats: RecruitmentStats[] }) {
  const totalApplicants = stats.reduce((s, x) => s + x.total, 0);
  if (totalApplicants === 0) {
    return (
      <div className="bg-white border border-dashed border-sand-300 rounded-card p-10 text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-sand-300" strokeWidth={2.5} />
        <p className="font-bold text-sand-400 text-sm">아직 지원자가 없습니다.</p>
      </div>
    );
  }

  const colors = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444'];

  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6">
      <h3 className="font-black text-base text-ink mb-1">공고별 지원자 분포</h3>
      <p className="text-xs text-sand-500 font-bold mb-5">전체 지원자가 공고별로 어떻게 나뉘는지 확인합니다.</p>

      {/* 누적 막대 */}
      <div className="h-8 border border-sand-200 rounded-ctl flex overflow-hidden mb-4">
        {stats.map((s, i) => {
          if (s.total === 0) return null;
          const pct = (s.total / totalApplicants) * 100;
          return (
            <div
              key={s.recruitment.id}
              className="h-full flex items-center justify-center text-xs font-black text-white border-r border-white last:border-r-0"
              style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
              title={`${s.recruitment.title}: ${s.total}명 (${pct.toFixed(1)}%)`}
            >
              {pct > 8 && `${pct.toFixed(0)}%`}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {stats.filter(s => s.total > 0).map((s, i) => (
          <div key={s.recruitment.id} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 shrink-0 rounded-md" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="font-bold truncate flex-1 text-sand-600">{s.recruitment.title}</span>
            <span className="font-black text-sand-500 shrink-0">{s.total}명</span>
          </div>
        ))}
      </div>
    </div>
  );
}
