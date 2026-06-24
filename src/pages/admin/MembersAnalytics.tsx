import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { Users, GraduationCap, TrendingDown, Activity, Flame, BarChart3 } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll, fetchAllIn } from '../../lib/fetchAll';

interface MemberRow {
  id: string;
  generation: string | null;
  status: string;
  display_name: string | null;
  profiles: { name: string } | null;
}
interface SessionRow {
  id: string;
  title: string;
  session_date: string | null;
  created_at: string;
}
interface Pair { member_id: string; session_id: string; }

const STATUSES = ['활동중', '수료', '탈퇴', '활동정지'] as const;
const STATUS_COLOR: Record<string, string> = {
  '활동중': '#2F7D4F', '수료': '#2D5FA6', '탈퇴': '#7A7066', '활동정지': '#B23B2E',
};
const memberName = (m: MemberRow) => m.profiles?.name ?? m.display_name ?? '—';
const genDesc = (a: string, b: string) => {
  const na = parseInt(a, 10), nb = parseInt(b, 10);
  if (!isNaN(na) && !isNaN(nb) && na !== nb) return nb - na;
  return b.localeCompare(a);
};

export default function MembersAnalytics() {
  const { adminClubId } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [targets, setTargets] = useState<Pair[]>([]);
  const [atts, setAtts] = useState<Pair[]>([]);

  useEffect(() => {
    if (!adminClubId) return;
    load(adminClubId);
  }, [adminClubId]);

  const load = async (clubId: string) => {
    setLoading(true);
    const [{ data: mem }, { data: sess }] = await Promise.all([
      fetchAll((from, to) => supabase.from('club_members').select('id, generation, status, display_name, profiles(name)').eq('club_id', clubId).range(from, to)),
      fetchAll((from, to) => supabase.from('sessions').select('id, title, session_date, created_at').eq('club_id', clubId).range(from, to)),
    ]);
    const memberList = (mem ?? []) as unknown as MemberRow[];
    const sessionList = (sess ?? []) as SessionRow[];
    setMembers(memberList);
    setSessions(sessionList);

    const sessionIds = sessionList.map(s => s.id);
    if (sessionIds.length > 0) {
      const [{ data: t }, { data: a }] = await Promise.all([
        fetchAllIn<Pair>(sessionIds, (chunk, from, to) =>
          supabase.from('session_targets').select('member_id, session_id').in('session_id', chunk).range(from, to)),
        fetchAllIn<Pair>(sessionIds, (chunk, from, to) =>
          supabase.from('attendances').select('member_id, session_id').in('session_id', chunk).eq('status', '출석').range(from, to)),
      ]);
      setTargets((t ?? []) as Pair[]);
      setAtts((a ?? []) as Pair[]);
    } else {
      setTargets([]); setAtts([]);
    }
    setLoading(false);
  };

  // 멤버별 출석률(D2: 분모=session_targets, 분자=출석)
  const { rateOf, attSet } = useMemo(() => {
    const denom: Record<string, Set<string>> = {};
    targets.forEach(t => (denom[t.member_id] ??= new Set()).add(t.session_id));
    const aset: Record<string, Set<string>> = {};
    atts.forEach(a => (aset[a.member_id] ??= new Set()).add(a.session_id));
    const rateOf = (id: string): number | null => {
      const d = denom[id];
      if (!d || d.size === 0) return null;
      let n = 0;
      d.forEach(s => { if (aset[id]?.has(s)) n++; });
      return Math.round((n / d.size) * 100);
    };
    return { rateOf, attSet: aset };
  }, [targets, atts]);

  // KPI
  const kpi = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === '활동중').length;
    const completed = members.filter(m => m.status === '수료').length;
    const withdrawn = members.filter(m => m.status === '탈퇴').length;
    const rates = members.map(m => rateOf(m.id)).filter((r): r is number => r != null);
    const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;
    const completionRate = (completed + withdrawn) > 0 ? Math.round((completed / (completed + withdrawn)) * 100) : null;
    const dropoutRate = total > 0 ? Math.round((withdrawn / total) * 100) : 0;
    return { total, active, completed, withdrawn, avgRate, completionRate, dropoutRate };
  }, [members, rateOf]);

  // 상태 분포
  const statusData = useMemo(() =>
    STATUSES.map(s => ({ name: s, value: members.filter(m => m.status === s).length })).filter(d => d.value > 0),
  [members]);

  // 출석률 구간 분포
  const histData = useMemo(() => {
    const bins = [
      { name: '0–20', min: 0, max: 20, count: 0 },
      { name: '21–40', min: 21, max: 40, count: 0 },
      { name: '41–60', min: 41, max: 60, count: 0 },
      { name: '61–80', min: 61, max: 80, count: 0 },
      { name: '81–100', min: 81, max: 100, count: 0 },
    ];
    members.forEach(m => {
      const r = rateOf(m.id);
      if (r == null) return;
      const bin = bins.find(b => r >= b.min && r <= b.max);
      if (bin) bin.count++;
    });
    return bins;
  }, [members, rateOf]);

  // 기수별 요약
  const genSummary = useMemo(() => {
    const byGen: Record<string, MemberRow[]> = {};
    members.forEach(m => {
      const g = m.generation ?? '미지정';
      (byGen[g] ??= []).push(m);
    });
    return Object.entries(byGen)
      .map(([gen, list]) => {
        const rates = list.map(m => rateOf(m.id)).filter((r): r is number => r != null);
        return {
          gen,
          total: list.length,
          active: list.filter(m => m.status === '활동중').length,
          completed: list.filter(m => m.status === '수료').length,
          withdrawn: list.filter(m => m.status === '탈퇴').length,
          avgRate: rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null,
        };
      })
      .sort((a, b) => genDesc(a.gen, b.gen));
  }, [members, rateOf]);

  // 회차별 출석률 추이 (날짜 오름차순)
  const sessionOrder = useMemo(() =>
    [...sessions].sort((a, b) =>
      (a.session_date ?? a.created_at).localeCompare(b.session_date ?? b.created_at)),
  [sessions]);

  const trendData = useMemo(() => {
    const tgtCount: Record<string, number> = {};
    targets.forEach(t => { tgtCount[t.session_id] = (tgtCount[t.session_id] ?? 0) + 1; });
    const attCount: Record<string, number> = {};
    atts.forEach(a => { attCount[a.session_id] = (attCount[a.session_id] ?? 0) + 1; });
    return sessionOrder
      .filter(s => (tgtCount[s.id] ?? 0) > 0)
      .map(s => ({
        label: (s.session_date ?? s.created_at).slice(5, 10), // MM-DD
        title: s.title,
        rate: Math.round(((attCount[s.id] ?? 0) / tgtCount[s.id]) * 100),
      }));
  }, [sessionOrder, targets, atts]);

  // 연속 출석(streak) Top — 가장 최근 세션부터 거꾸로 연속 '출석'
  const streakTop = useMemo(() => {
    const memberTargets: Record<string, string[]> = {};
    const order = sessionOrder.map(s => s.id);
    const orderIdx: Record<string, number> = {};
    order.forEach((id, i) => { orderIdx[id] = i; });
    targets.forEach(t => (memberTargets[t.member_id] ??= []).push(t.session_id));

    return members
      .map(m => {
        const ids = (memberTargets[m.id] ?? []).slice().sort((a, b) => orderIdx[a] - orderIdx[b]);
        let streak = 0;
        for (let i = ids.length - 1; i >= 0; i--) {
          if (attSet[m.id]?.has(ids[i])) streak++;
          else break;
        }
        return { name: memberName(m), gen: m.generation, streak };
      })
      .filter(x => x.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 8);
  }, [members, targets, attSet, sessionOrder]);

  const KPIS = [
    { icon: Users, label: '총 부원', value: `${kpi.total}명`, sub: `활동중 ${kpi.active}` },
    { icon: Activity, label: '평균 출석률', value: kpi.avgRate != null ? `${kpi.avgRate}%` : '—', sub: '대상 세션 보유자 기준' },
    { icon: GraduationCap, label: '수료율', value: kpi.completionRate != null ? `${kpi.completionRate}%` : '—', sub: '수료/(수료+탈퇴)' },
    { icon: TrendingDown, label: '중도이탈률', value: `${kpi.dropoutRate}%`, sub: `탈퇴 ${kpi.withdrawn}/${kpi.total}` },
  ];

  return (
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-5xl flex flex-col gap-6">
            <div>
              <h2 className="text-4xl font-black text-ink mb-2 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-brand" strokeWidth={2.5} /> 명단 분석
              </h2>
              <p className="text-sand-500 font-medium">부원 구성·출석·이탈 지표를 한눈에 봅니다.</p>
            </div>

            {loading ? (
              <LoadingScreen />
            ) : members.length === 0 ? (
              <div className="py-24 text-center font-bold text-sand-400 border border-dashed border-sand-300 rounded-card bg-white">
                등록된 부원이 없습니다.
              </div>
            ) : (
              <>
                {/* KPI 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {KPIS.map(k => {
                    const Icon = k.icon;
                    return (
                      <div key={k.label} className="bg-white border border-sand-200 rounded-card p-4 shadow-soft">
                        <div className="flex items-center gap-1.5 text-sand-400 font-black text-xs mb-2">
                          <Icon className="w-4 h-4" strokeWidth={2.5} /> {k.label}
                        </div>
                        <div className="text-3xl font-black text-ink">{k.value}</div>
                        <div className="text-[11px] font-bold text-sand-400 mt-1">{k.sub}</div>
                      </div>
                    );
                  })}
                </div>

                {/* 상태 분포 + 출석률 구간 분포 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5">
                    <h3 className="font-black text-ink text-sm mb-3">상태 분포</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: { name?: string; value?: number }) => `${e.name} ${e.value}`}>
                          {statusData.map(d => <Cell key={d.name} fill={STATUS_COLOR[d.name] ?? '#A8A095'} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5">
                    <h3 className="font-black text-ink text-sm mb-3">출석률 구간 분포 (명)</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={histData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fontWeight: 700, fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v}명`, '인원']} />
                        <Bar dataKey="count" fill="#EC6A2C">
                          <LabelList dataKey="count" position="top" style={{ fontWeight: 700, fontSize: 11 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 회차별 출석률 추이 */}
                <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5">
                  <h3 className="font-black text-ink text-sm mb-3">회차별 출석률 추이</h3>
                  {trendData.length === 0 ? (
                    <p className="text-xs font-bold text-sand-400 py-8 text-center">대상자가 지정된 세션이 없습니다.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EBE6DF" />
                        <XAxis dataKey="label" tick={{ fontWeight: 700, fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(v: number) => [`${v}%`, '출석률']}
                          labelFormatter={(label: string, p) => (p?.[0]?.payload?.title ?? label)}
                        />
                        <Line type="monotone" dataKey="rate" stroke="#EC6A2C" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* 기수별 요약 + 연속 출석 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5">
                    <h3 className="font-black text-ink text-sm mb-3">기수별 요약</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-sand-200 text-xs text-sand-500">
                            <th className="py-2 pr-2 font-bold">기수</th>
                            <th className="py-2 px-2 font-bold text-right">인원</th>
                            <th className="py-2 px-2 font-bold text-right">활동중</th>
                            <th className="py-2 px-2 font-bold text-right">수료</th>
                            <th className="py-2 px-2 font-bold text-right">탈퇴</th>
                            <th className="py-2 pl-2 font-bold text-right">평균출석</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sand-200">
                          {genSummary.map(g => (
                            <tr key={g.gen}>
                              <td className="py-2 pr-2 font-bold text-ink">{g.gen}</td>
                              <td className="py-2 px-2 text-right font-bold text-ink">{g.total}</td>
                              <td className="py-2 px-2 text-right font-bold text-ok-fg">{g.active}</td>
                              <td className="py-2 px-2 text-right font-bold text-info-fg">{g.completed}</td>
                              <td className="py-2 px-2 text-right font-bold text-sand-400">{g.withdrawn}</td>
                              <td className="py-2 pl-2 text-right font-black text-ink">{g.avgRate != null ? `${g.avgRate}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5">
                    <h3 className="font-black text-ink text-sm mb-3 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-brand" strokeWidth={2.5} /> 연속 출석 Top
                    </h3>
                    {streakTop.length === 0 ? (
                      <p className="text-xs font-bold text-sand-400 py-8 text-center">연속 출석 기록이 없습니다.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {streakTop.map((s, i) => (
                          <div key={`${s.name}-${i}`} className="flex items-center justify-between px-3 py-2 border border-sand-200 rounded-ctl bg-sand-50">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 flex items-center justify-center rounded-md font-black text-xs ${i < 3 ? 'bg-brand text-white' : 'bg-sand-200 text-sand-500'}`}>{i + 1}</span>
                              <span className="font-bold text-sm text-ink">{s.name}</span>
                              {s.gen && <span className="text-xs font-bold text-sand-400">{s.gen}</span>}
                            </div>
                            <span className="font-black text-sm text-brand-dark">{s.streak}회 연속</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] font-bold text-sand-400">
                  ※ 휴식→복귀 전환율·기수간 리텐션은 상태 변경 이력을 별도 기록해야 산출 가능하여 추후 제공됩니다.
                </p>
              </>
            )}
          </div>
        </main>
  );
}
