import React, { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3, Loader, Users, TrendingUp, Compass, Activity, AlertCircle, PieChart,
} from 'lucide-react';
import { Question, QuestionType } from '../../types/recruitment';

interface Recruitment {
  id: string;
  title: string;
  pipeline_stages: string[] | null;
  form_schema: Question[] | null;
  deployed_form_schema: Question[] | null;
}

interface ApplicationRow {
  id: string;
  recruitment_id: string;
  status: string;
  submitted_at: string;
  answers: Record<string, string>;
}

const REJECT_KEYWORDS = ['불합격', '탈락', '거절'];

function isReject(status: string) {
  return REJECT_KEYWORDS.some(k => status.toLowerCase().includes(k.toLowerCase()));
}

const ANALYZABLE_TYPES: QuestionType[] = ['select', 'multiselect', 'source', 'consent'];

export default function RecruitAnalytics() {
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
      .select('id, title, pipeline_stages, form_schema, deployed_form_schema')
      .eq('club_id', adminClubId)
      .order('created_at', { ascending: false });
    const recList = (recs as Recruitment[] | null) ?? [];
    setRecruitments(recList);

    if (recList.length > 0) {
      const { data: applications } = await supabase
        .from('recruitment_applications')
        .select('id, recruitment_id, status, submitted_at, answers')
        .in('recruitment_id', recList.map(r => r.id));
      setApps((applications as ApplicationRow[] | null) ?? []);
    }
    setLoading(false);
  };

  const filteredApps = useMemo(() => (
    selectedRid === 'all' ? apps : apps.filter(a => a.recruitment_id === selectedRid)
  ), [apps, selectedRid]);

  const focused = selectedRid === 'all' ? null : recruitments.find(r => r.id === selectedRid) ?? null;

  // 핵심 KPI
  const kpi = useMemo(() => {
    const total = filteredApps.length;
    let passed = 0, rejected = 0;
    filteredApps.forEach(a => {
      const rec = recruitments.find(r => r.id === a.recruitment_id);
      const stages = rec?.pipeline_stages ?? [];
      const last = stages[stages.length - 1];
      if (a.status === last) passed++;
      else if (isReject(a.status)) rejected++;
    });
    const completedCount = passed + rejected;
    const passRate = completedCount > 0 ? (passed / completedCount) * 100 : 0;
    return { total, passed, rejected, passRate };
  }, [filteredApps, recruitments]);

  // 주간 유입 (최근 8주)
  const weeklyInflow = useMemo(() => {
    const buckets: { weekStart: Date; label: string; count: number }[] = [];
    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    for (let i = 7; i >= 0; i--) {
      const start = new Date(monday);
      start.setDate(start.getDate() - i * 7);
      buckets.push({
        weekStart: start,
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        count: 0,
      });
    }
    filteredApps.forEach(a => {
      const t = new Date(a.submitted_at).getTime();
      for (let i = buckets.length - 1; i >= 0; i--) {
        if (t >= buckets[i].weekStart.getTime()) {
          buckets[i].count++;
          break;
        }
      }
    });
    return buckets;
  }, [filteredApps]);

  // 지원경로별 통계
  const sourceStats = useMemo(() => {
    const rec = focused ?? recruitments[0];
    const schema = (rec?.deployed_form_schema ?? rec?.form_schema ?? []) as Question[];
    const sourceQuestion = schema.find(q => q.type === 'source');
    if (!sourceQuestion) return null;
    const key = sourceQuestion.title;
    const distribution: Record<string, { total: number; passed: number }> = {};
    filteredApps.forEach(a => {
      const v = a.answers?.[key];
      if (!v) return;
      if (!distribution[v]) distribution[v] = { total: 0, passed: 0 };
      distribution[v].total++;
      const recForApp = recruitments.find(r => r.id === a.recruitment_id);
      const stages = recForApp?.pipeline_stages ?? [];
      if (a.status === stages[stages.length - 1]) distribution[v].passed++;
    });
    return { key, distribution };
  }, [filteredApps, recruitments, focused]);

  // 선택형 질문 응답 분포 (분석 가능한 타입만)
  const questionStats = useMemo(() => {
    const rec = focused ?? recruitments[0];
    const schema = (rec?.deployed_form_schema ?? rec?.form_schema ?? []) as Question[];
    return schema
      .filter(q => ANALYZABLE_TYPES.includes(q.type) && q.type !== 'source')
      .map(q => {
        const key = q.title;
        const dist: Record<string, number> = {};
        filteredApps.forEach(a => {
          const v = a.answers?.[key];
          if (!v) return;
          if (q.type === 'multiselect') {
            v.split(', ').filter(Boolean).forEach(opt => { dist[opt] = (dist[opt] ?? 0) + 1; });
          } else {
            dist[v] = (dist[v] ?? 0) + 1;
          }
        });
        return { question: q, distribution: dist };
      })
      .filter(s => Object.keys(s.distribution).length > 0);
  }, [filteredApps, recruitments, focused]);

  const maxWeekly = Math.max(1, ...weeklyInflow.map(w => w.count));

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-3xl font-black flex items-center gap-3">
                  <BarChart3 className="w-7 h-7 text-blue-500" />
                  분석 리포트
                </h1>
                <p className="text-gray-500 font-bold text-sm mt-1">
                  지원 유입·합격률·경로별 인사이트를 한 페이지에서 확인합니다.
                </p>
              </div>
              {recruitments.length > 0 && (
                <select
                  value={selectedRid}
                  onChange={e => setSelectedRid(e.target.value)}
                  className="px-4 py-2.5 border-2 border-black font-bold text-sm bg-white outline-none focus:border-blue-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="all">전체 공고 ({recruitments.length})</option>
                  {recruitments.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : recruitments.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-300 p-16 text-center">
                <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-400 mb-2">분석할 데이터가 없습니다</h3>
                <p className="font-bold text-gray-400 text-sm">먼저 공고를 만들고 지원자가 모이면 인사이트가 표시됩니다.</p>
              </div>
            ) : (
              <>
                {/* KPI 3개 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Kpi label="총 지원자 수" value={kpi.total} suffix="명" icon={<Users className="w-5 h-5" />} accent="bg-blue-50 border-blue-300" />
                  <Kpi label="최종 합격률" value={kpi.passRate} suffix="%" decimals={1} icon={<TrendingUp className="w-5 h-5" />} accent="bg-green-50 border-green-300" />
                  <Kpi label="합격 / 불합격" value={kpi.passed} suffix={` / ${kpi.rejected}`} icon={<Activity className="w-5 h-5" />} accent="bg-orange-50 border-orange-300" />
                </div>

                {/* 주간 유입 그래프 */}
                <div className="bg-white border-2 border-black p-6">
                  <h3 className="font-black text-base mb-1">주간 지원자 유입</h3>
                  <p className="text-xs text-gray-500 font-bold mb-5">최근 8주 동안 매주 새로 들어온 지원자 수입니다.</p>
                  <div className="flex items-end gap-2 h-48">
                    {weeklyInflow.map((w, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                        <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                          {w.count > 0 && (
                            <div className="text-center text-xs font-black text-blue-600 mb-1">{w.count}</div>
                          )}
                          <div
                            className="w-full bg-blue-500 border-t-2 border-black transition-all hover:bg-blue-600"
                            style={{ height: `${(w.count / maxWeekly) * 140}px`, minHeight: w.count > 0 ? '8px' : '0' }}
                            title={`${w.label} 주: ${w.count}명`}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${i === weeklyInflow.length - 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {w.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-gray-400">
                    <span>← 8주 전</span>
                    <span>이번 주 →</span>
                  </div>
                </div>

                {/* 지원경로별 통계 */}
                {sourceStats ? (
                  <SourceBreakdown
                    fieldName={sourceStats.key}
                    distribution={sourceStats.distribution}
                  />
                ) : (
                  <div className="bg-white border-2 border-dashed border-gray-300 p-8 text-center">
                    <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-400 text-sm mb-1">지원경로별 통계가 없습니다.</p>
                    <p className="text-xs text-gray-400 font-medium">
                      지원서에 <strong>지원경로</strong> 타입 질문을 추가하면 자동 집계됩니다.
                    </p>
                  </div>
                )}

                {/* 선택형 질문 응답 분포 */}
                {questionStats.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h3 className="font-black text-base flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-orange-500" />
                      지원서 응답 분포
                    </h3>
                    {questionStats.map(({ question, distribution }) => (
                      <QuestionDistribution key={question.id} question={question} distribution={distribution} />
                    ))}
                  </div>
                )}

                {questionStats.length === 0 && !sourceStats && (
                  <div className="bg-blue-50 border border-blue-200 p-4 text-sm font-bold text-blue-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                      더 풍부한 인사이트를 위해, 지원서에 <strong>단일 선택 · 다중 선택 · 지원경로 · 동의 항목</strong> 타입의 질문을 추가해보세요.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Kpi({ label, value, suffix, icon, accent, decimals }: { label: string; value: number; suffix?: string; icon: React.ReactNode; accent: string; decimals?: number }) {
  return (
    <div className={`border-2 p-5 ${accent}`}>
      <div className="flex items-center gap-2 text-gray-600 font-bold text-sm mb-2">{icon}{label}</div>
      <p className="text-3xl font-black">
        {value.toFixed(decimals ?? 0)}
        {suffix && <span className="text-base font-bold text-gray-500 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function SourceBreakdown({ fieldName, distribution }: { fieldName: string; distribution: Record<string, { total: number; passed: number }> }) {
  const entries = Object.entries(distribution).sort(([, a], [, b]) => b.total - a.total);
  const max = Math.max(1, ...entries.map(([, v]) => v.total));

  return (
    <div className="bg-white border-2 border-black p-6">
      <h3 className="font-black text-base flex items-center gap-2 mb-1">
        <Compass className="w-5 h-5 text-orange-500" />
        지원경로별 지원자 수·합격률
      </h3>
      <p className="text-xs text-gray-500 font-bold mb-5">질문: <strong>{fieldName}</strong></p>
      <div className="flex flex-col gap-3">
        {entries.map(([source, v]) => {
          const rate = v.total > 0 ? (v.passed / v.total) * 100 : 0;
          const width = (v.total / max) * 100;
          return (
            <div key={source}>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="font-black">{source}</span>
                <span className="text-xs font-bold text-gray-500">{v.total}명 · 합격 {v.passed}명 · {rate.toFixed(1)}%</span>
              </div>
              <div className="h-6 bg-gray-100 border border-gray-200 overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionDistribution({ question, distribution }: { question: Question; distribution: Record<string, number> }) {
  const entries = Object.entries(distribution).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  const max = Math.max(1, ...entries.map(([, n]) => n));

  return (
    <div className="bg-white border-2 border-black p-6">
      <h4 className="font-black text-sm mb-1">{question.title}</h4>
      <p className="text-xs text-gray-400 font-bold mb-4">{TYPE_LABEL[question.type]} · 응답 {total}건</p>
      <div className="flex flex-col gap-2">
        {entries.map(([opt, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const width = (count / max) * 100;
          return (
            <div key={opt} className="flex items-center gap-3">
              <span className="text-xs font-bold w-32 truncate">{opt}</span>
              <div className="flex-1 h-5 bg-gray-100 border border-gray-200 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${width}%` }} />
              </div>
              <span className="text-xs font-black w-20 text-right">{count}명 · {pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TYPE_LABEL: Record<QuestionType, string> = {
  text: '단답형', textarea: '장문형', number: '숫자', email: '이메일', phone: '전화번호',
  select: '단일 선택', multiselect: '다중 선택', file: '파일', source: '지원경로', consent: '동의 항목',
};
