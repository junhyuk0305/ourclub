import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PlayCircle, Loader, Copy, Check } from 'lucide-react';
import { SessionTabs } from '../../components/admin/SessionTabs';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll } from '../../lib/fetchAll';

interface SessionRow {
  id: string;
  title: string;
  attendance_code: string;
  expires_at: string | null;
  session_date: string | null;
  target_generations: string[] | null;
  created_at: string;
}

interface MemberRow {
  id: string;
  generation: string | null;
  display_name: string | null;
  profiles: { name: string } | null;
}

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const NO_GEN = '미지정';
const genKey = (m: MemberRow) => m.generation ?? NO_GEN;

const PRESET_DURATIONS = [
  { label: '10분', minutes: 10 },
  { label: '15분', minutes: 15 },
  { label: '30분', minutes: 30 },
];

export default function AttendanceCreate() {
  const { adminClubId } = useAdmin();
  const [liveSession, setLiveSession] = useState<SessionRow | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [liveTargetCount, setLiveTargetCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 폼 상태
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [allMembers, setAllMembers] = useState<MemberRow[]>([]);
  const [currentGen, setCurrentGen] = useState<string | null>(null);
  const [selectedGens, setSelectedGens] = useState<Set<string>>(new Set());
  const [excludedMembers, setExcludedMembers] = useState<Set<string>>(new Set());
  const [durationMin, setDurationMin] = useState(10);
  const [customDuration, setCustomDuration] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!adminClubId) return;
    loadActiveSession(adminClubId);
    loadMembers(adminClubId);
  }, [adminClubId]);

  // 라이브 세션 출석 인원 폴링
  useEffect(() => {
    if (!liveSession) return;
    const poll = async () => {
      const [aRes, tRes] = await Promise.all([
        supabase.from('attendances').select('*', { count: 'exact', head: true }).eq('session_id', liveSession.id).eq('status', '출석'),
        supabase.from('session_targets').select('*', { count: 'exact', head: true }).eq('session_id', liveSession.id),
      ]);
      setLiveCount(aRes.count ?? 0);
      setLiveTargetCount(tRes.count ?? 0);
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [liveSession]);

  // 카운트다운
  useEffect(() => {
    if (!liveSession) { if (timerRef.current) clearInterval(timerRef.current); return; }
    const expiresAt = liveSession.expires_at
      ? new Date(liveSession.expires_at).getTime()
      : Date.now() + 10 * 60 * 1000;
    const tick = () => setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [liveSession]);

  const loadActiveSession = async (clubId: string) => {
    const { data } = await supabase
      .from('sessions')
      .select('id, title, attendance_code, expires_at, session_date, target_generations, created_at')
      .eq('club_id', clubId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setLiveSession(data as SessionRow);
  };

  const loadMembers = async (clubId: string) => {
    const [{ data: club }, { data }] = await Promise.all([
      supabase.from('clubs').select('current_generation').eq('id', clubId).maybeSingle(),
      fetchAll((from, to) => supabase
        .from('club_members')
        .select('id, generation, display_name, profiles(name)')
        .eq('club_id', clubId)
        .eq('status', '활동중')
        .range(from, to)),
    ]);
    const members = (data ?? []) as unknown as MemberRow[];
    setAllMembers(members);
    const cur = (club?.current_generation ?? null) as string | null;
    setCurrentGen(cur);
    // 기본 대상: 현재 활동 기수(없거나 해당 기수 부원이 없으면 전 기수)
    const opts = Array.from(new Set(members.map(genKey)));
    setSelectedGens(cur && opts.includes(cur) ? new Set([cur]) : new Set(opts));
  };

  // 기수 옵션(내림차순: 숫자 우선)
  const genOptions = useMemo(() => {
    return Array.from(new Set(allMembers.map(genKey))).sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return nb - na;
      return b.localeCompare(a);
    });
  }, [allMembers]);

  const candidateMembers = allMembers.filter(m => selectedGens.has(genKey(m)));
  const targetMembers = candidateMembers.filter(m => !excludedMembers.has(m.id));
  const allVisibleChecked = candidateMembers.length > 0 && candidateMembers.every(m => !excludedMembers.has(m.id));

  const toggleGen = (g: string) => {
    setSelectedGens(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setExcludedMembers(prev => {
      const next = new Set(prev);
      if (allVisibleChecked) candidateMembers.forEach(m => next.add(m.id));
      else candidateMembers.forEach(m => next.delete(m.id));
      return next;
    });
  };

  const toggleExclude = (id: string) => {
    setExcludedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    setErrorMsg('');
    if (!adminClubId) { setErrorMsg('클럽 정보를 불러올 수 없습니다.'); return; }
    if (!sessionName.trim()) { setErrorMsg('세션 이름을 입력하세요.'); return; }
    if (targetMembers.length === 0) { setErrorMsg('출석 대상자가 한 명 이상 필요합니다.'); return; }

    setCreating(true);
    const code = generateCode();
    const expiresAt = new Date(Date.now() + durationMin * 60 * 1000).toISOString();

    const insertPayload = {
      club_id: adminClubId,
      title: sessionName.trim(),
      attendance_code: code,
      expires_at: expiresAt,
      session_date: sessionDate || null,
      target_generations: Array.from(selectedGens).filter(g => g !== NO_GEN),
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      console.error('[AttendanceCreate] sessions insert failed:', error);
      setErrorMsg(`세션 생성 실패: ${error?.message ?? '알 수 없는 오류'} (code: ${error?.code ?? 'n/a'})`);
      setCreating(false);
      return;
    }
    const newSession = data as SessionRow;

    const targetRows = targetMembers.map(m => ({ session_id: newSession.id, member_id: m.id }));
    const { error: tErr } = await supabase.from('session_targets').insert(targetRows);
    if (tErr) {
      console.error('[AttendanceCreate] session_targets insert failed:', tErr);
      setErrorMsg(`대상자 등록 실패: ${tErr.message}. 세션은 생성되었습니다.`);
      // 세션은 생성되었으므로 라이브 상태로 진입
    }

    setLiveSession(newSession);
    setLiveTargetCount(targetMembers.length);
    setSessionName('');
    setExcludedMembers(new Set());
    setCreating(false);
  };

  const handleEnd = async () => {
    if (!liveSession) return;
    await supabase.from('sessions').update({ expires_at: new Date().toISOString() }).eq('id', liveSession.id);
    setLiveSession(null);
  };

  const handleCopy = async () => {
    if (!liveSession) return;
    await navigator.clipboard.writeText(liveSession.attendance_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-5xl flex flex-col gap-6">
            <SessionTabs />

            <div className="max-w-3xl flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-ink mb-1">새 출석 세션 시작</h3>
              <p className="text-sand-500 font-bold text-sm">새로운 출석 코드를 발급하고 대상을 설정합니다.</p>
            </div>

            {liveSession ? (
              <div className="border border-brand rounded-card p-8 shadow-soft-lg bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 btn-grad text-white font-black px-4 py-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE · {fmt(timeLeft)}
                </div>
                <h3 className="text-3xl font-black text-ink mb-1">{liveSession.title}</h3>
                <p className="font-bold text-sand-500 mb-8">현재 세션 출석 진행 중. 화면에 코드를 띄워주세요.</p>
                <div className="relative flex items-center justify-center py-10 bg-sand-50 border border-sand-200 rounded-card mb-8">
                  <div className="text-9xl font-black text-ink tracking-[0.3em]">{liveSession.attendance_code}</div>
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-ctl bg-white border border-sand-300 font-bold text-xs text-ink hover:bg-sand-50 flex items-center gap-1"
                    title="코드 복사"
                  >
                    {copied ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <Copy className="w-3 h-3" strokeWidth={2.5} />}
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-brand flex items-center justify-center font-black text-xl text-ink">
                      {liveCount}
                    </div>
                    <div className="font-bold">
                      <p className="text-sand-500">출석 완료</p>
                      <p className="text-xl text-ink">{liveCount} / {liveTargetCount}명</p>
                    </div>
                  </div>
                  <button
                    onClick={handleEnd}
                    className="px-6 py-3 rounded-ctl bg-ink text-white font-bold hover:opacity-90 transition-all"
                  >
                    출석 마감하기
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-sand-200 rounded-card p-8 bg-brand-tint shadow-soft flex flex-col gap-5">
                <h3 className="text-2xl font-black text-ink flex items-center gap-2">
                  <PlayCircle className="w-6 h-6 text-brand" strokeWidth={2.5} /> 새 세션 시작하기
                </h3>

                {errorMsg && (
                  <div className="bg-bad-bg text-bad-fg rounded-ctl px-4 py-3 font-bold text-sm whitespace-pre-line">
                    {errorMsg}
                  </div>
                )}

                {/* 세션 이름 + 날짜 */}
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-black text-sm text-ink">세션 이름 *</label>
                    <input
                      value={sessionName}
                      onChange={e => setSessionName(e.target.value)}
                      placeholder="예: 2차 정규 세션 (마케팅 실습)"
                      className="field p-3 border border-sand-300 rounded-ctl font-bold outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-black text-sm text-ink">날짜</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={e => setSessionDate(e.target.value)}
                      className="field p-3 border border-sand-300 rounded-ctl font-bold outline-none bg-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* 마감 시간 */}
                <div className="flex flex-col gap-2">
                  <label className="font-black text-sm text-ink">출석 마감 시간</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_DURATIONS.map(p => {
                      const on = !customDuration && durationMin === p.minutes;
                      return (
                        <button
                          key={p.minutes}
                          type="button"
                          onClick={() => { setCustomDuration(false); setDurationMin(p.minutes); }}
                          className={`px-3 py-1.5 rounded-ctl font-bold text-xs transition-all ${
                            on ? 'bg-ink text-white' : 'bg-white border border-sand-300 text-ink hover:bg-sand-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setCustomDuration(true)}
                      className={`px-3 py-1.5 rounded-ctl font-bold text-xs transition-all ${
                        customDuration ? 'bg-ink text-white' : 'bg-white border border-sand-300 text-ink hover:bg-sand-50'
                      }`}
                    >
                      직접 입력
                    </button>
                    {customDuration && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={durationMin}
                          onChange={e => setDurationMin(Math.max(1, parseInt(e.target.value) || 1))}
                          className="field w-20 p-1.5 border border-sand-300 rounded-ctl font-bold text-sm outline-none"
                        />
                        <span className="font-bold text-sm text-ink">분</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 예외 처리 */}
                {allMembers.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {/* 기수 선택 칩 */}
                    {genOptions.length > 1 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-sand-500">기수 선택:</span>
                        {genOptions.map(g => {
                          const on = selectedGens.has(g);
                          const cnt = allMembers.filter(m => genKey(m) === g).length;
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => toggleGen(g)}
                              className={`px-2.5 py-1 rounded-ctl font-bold text-xs flex items-center gap-1 transition-all ${
                                on ? 'btn-grad text-white' : 'bg-white border border-sand-300 text-sand-400 hover:bg-sand-50'
                              }`}
                            >
                              {g === NO_GEN ? '미지정' : g}
                              {g === currentGen && <span className={`text-[9px] ${on ? 'text-white/80' : 'text-brand'}`}>현재</span>}
                              <span className={`px-1 rounded ${on ? 'bg-white/20' : 'bg-sand-100'}`}>{cnt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <label className="font-black text-sm text-ink">출석 대상자 ({targetMembers.length}명)</label>
                      <div className="flex items-center gap-3">
                        {candidateMembers.length > 0 && (
                          <button
                            type="button"
                            onClick={toggleAllVisible}
                            className="text-xs font-black text-brand underline hover:no-underline"
                          >
                            {allVisibleChecked ? '전체 해제' : '전체 선택'}
                          </button>
                        )}
                        <span className="text-xs font-bold text-sand-500">
                          체크 해제 시 모수에서 제외됩니다
                        </span>
                      </div>
                    </div>
                    <div className="border border-sand-200 rounded-card bg-white max-h-60 overflow-y-auto">
                      {candidateMembers.length === 0 ? (
                        <p className="px-3 py-6 text-center text-xs font-bold text-sand-400">
                          위에서 기수를 하나 이상 선택하세요.
                        </p>
                      ) : candidateMembers.map(m => {
                        const excluded = excludedMembers.has(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`flex items-center gap-2 px-3 py-2 border-b border-sand-200 last:border-b-0 cursor-pointer hover:bg-sand-50 text-sm font-bold ${
                              excluded ? 'text-sand-400 line-through' : 'text-ink'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!excluded}
                              onChange={() => toggleExclude(m.id)}
                              className="w-4 h-4 accent-brand"
                            />
                            <span>{m.profiles?.name ?? m.display_name ?? '—'}</span>
                            <span className="text-xs text-sand-400">{m.generation}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={creating || !sessionName.trim() || targetMembers.length === 0}
                  className="w-full py-4 btn-grad text-white rounded-ctl font-bold shadow-btn hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating && <Loader className="w-4 h-4 animate-spin" />}
                  코드 생성 · {durationMin}분 타이머 시작
                </button>
              </div>
            )}
            </div>
          </div>
        </main>
  );
}
