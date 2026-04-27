import React, { useEffect, useState, useRef } from 'react';
import { Edit3, PlayCircle, ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader, RefreshCw } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';

interface SessionRow {
  id: string;
  title: string;
  attendance_code: string;
  expires_at: string | null;
  created_at: string;
}

interface AttendanceRow {
  id: string;
  status: '출석' | '지각' | '결석';
  member_id: string;
  club_members: { profiles: { name: string } | null } | null;
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AttendanceAdmin() {
  const { adminClubId } = useAdmin();

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [newSessionName, setNewSessionName] = useState('');
  const [creating, setCreating] = useState(false);
  const [liveSession, setLiveSession] = useState<SessionRow | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<Record<string, AttendanceRow[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    if (!adminClubId) return;
    loadSessions(adminClubId);
    loadMemberCount(adminClubId);
  }, [adminClubId]);

  // 라이브 세션 출석 폴링 (10초)
  useEffect(() => {
    if (!liveSession) return;
    const poll = async () => {
      const { count } = await supabase
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', liveSession.id);
      setLiveCount(count ?? 0);
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [liveSession]);

  // 타이머
  useEffect(() => {
    if (!liveSession) { if (timerRef.current) clearInterval(timerRef.current); return; }
    const expiresAt = liveSession.expires_at ? new Date(liveSession.expires_at).getTime() : Date.now() + 30 * 60 * 1000;
    const tick = () => setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [liveSession]);

  const loadSessions = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('sessions')
      .select('id, title, attendance_code, expires_at, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    setSessions(data ?? []);
    setFetching(false);
  };

  const loadMemberCount = async (clubId: string) => {
    const { count } = await supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('status', '활동중');
    setTotalMembers(count ?? 0);
  };

  const loadAttendances = async (sessionId: string) => {
    if (attendances[sessionId]) return;
    const { data } = await supabase
      .from('attendances')
      .select('id, status, member_id, club_members(profiles(name))')
      .eq('session_id', sessionId);
    setAttendances(prev => ({ ...prev, [sessionId]: (data as unknown as AttendanceRow[]) ?? [] }));
  };

  const handleCreate = async () => {
    if (!adminClubId || !newSessionName.trim()) return;
    setCreating(true);
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('sessions')
      .insert({ club_id: adminClubId, title: newSessionName.trim(), attendance_code: code, expires_at: expiresAt })
      .select()
      .single();
    setCreating(false);
    if (error || !data) return;
    setLiveSession(data as SessionRow);
    setSessions(prev => [data as SessionRow, ...prev]);
    setNewSessionName('');
  };

  const handleEnd = async () => {
    if (!liveSession) return;
    await supabase
      .from('sessions')
      .update({ expires_at: new Date().toISOString() })
      .eq('id', liveSession.id);
    setLiveSession(null);
    if (adminClubId) loadSessions(adminClubId);
  };

  const updateAttendance = async (sessionId: string, memberId: string, status: '출석' | '지각' | '결석') => {
    await supabase
      .from('attendances')
      .update({ status })
      .eq('session_id', sessionId)
      .eq('member_id', memberId);
    setAttendances(prev => ({
      ...prev,
      [sessionId]: (prev[sessionId] ?? []).map(a => a.member_id === memberId ? { ...a, status } : a),
    }));
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const statusColor = { '출석': 'text-green-600', '지각': 'text-yellow-600', '결석': 'text-red-500' };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-white p-8 overflow-y-auto">
          <div className="max-w-2xl flex flex-col gap-8">
            <div>
              <h2 className="text-4xl font-black mb-2">출석 및 세션 관리</h2>
              <p className="text-gray-500 font-bold">스마트 출석 코드를 발급하고 출결 현황을 열람합니다.</p>
            </div>

            {/* 라이브 세션 */}
            {liveSession ? (
              <div className="border-4 border-orange-500 p-8 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-orange-500 text-white font-black px-4 py-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE · {fmt(timeLeft)}
                </div>
                <h3 className="text-3xl font-black mb-2">{liveSession.title}</h3>
                <p className="font-bold text-gray-500 mb-8">현재 세션 출석 진행 중. 화면에 코드를 띄워주세요.</p>
                <div className="flex items-center justify-center py-10 bg-gray-50 border-2 border-black mb-8">
                  <div className="text-8xl font-black tracking-[0.2em]">{liveSession.attendance_code}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-orange-500 flex items-center justify-center font-black text-xl">{liveCount}</div>
                    <div className="font-bold">
                      <p className="text-gray-500">출석 완료</p>
                      <p className="text-xl">{liveCount} / {totalMembers}명</p>
                    </div>
                  </div>
                  <button onClick={handleEnd} className="px-6 py-3 bg-black text-white font-black hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all">
                    출석 마감하기
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-black p-8 bg-orange-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <PlayCircle className="w-6 h-6 text-orange-500" /> 새 세션 시작하기
                </h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block font-black mb-2">세션 이름</label>
                    <input
                      value={newSessionName}
                      onChange={e => setNewSessionName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="예: 2차 정규 세션 (마케팅 실습)"
                      className="w-full p-4 border border-black font-bold outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newSessionName.trim()}
                    className="px-8 py-4 bg-orange-500 text-black border border-black font-black hover:bg-orange-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    {creating && <Loader className="w-4 h-4 animate-spin" />}
                    코드 생성
                  </button>
                </div>
              </div>
            )}

            {/* 과거 세션 목록 */}
            <div>
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-gray-400" /> 과거 세션 기록
              </h3>
              {fetching ? (
                <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-orange-500" /></div>
              ) : sessions.length === 0 ? (
                <p className="text-gray-400 font-bold text-center py-8 border-2 border-dashed border-gray-300">세션 기록이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {sessions
                    .filter(s => !liveSession || s.id !== liveSession.id)
                    .map(s => {
                      const atts = attendances[s.id];
                      const attended = atts?.filter(a => a.status === '출석').length ?? 0;
                      const total = atts?.length ?? 0;
                      const isExpanded = expandedId === s.id;
                      return (
                        <div key={s.id} className="border border-black bg-white overflow-hidden">
                          <div
                            className={`p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-orange-50/50' : ''}`}
                            onClick={async () => {
                              if (!isExpanded) await loadAttendances(s.id);
                              setExpandedId(isExpanded ? null : s.id);
                            }}
                          >
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-gray-500 text-sm bg-gray-100 px-2 py-1">
                                  {new Date(s.created_at).toLocaleDateString('ko-KR')}
                                </span>
                                <h4 className="font-black text-xl">{s.title}</h4>
                              </div>
                              <p className="font-bold text-gray-600 text-sm">
                                출석 코드: <span className="bg-gray-100 px-2 py-1 tracking-widest">{s.attendance_code}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              {atts && (
                                <div className="text-right">
                                  <p className="font-black text-2xl text-orange-500">{attended} <span className="text-lg text-gray-400">/ {total}</span></p>
                                  <p className="font-bold text-gray-500 text-sm">{total > 0 ? `참여율 ${Math.round(attended / total * 100)}%` : '—'}</p>
                                </div>
                              )}
                              {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-black p-6 bg-gray-50">
                              <div className="flex justify-between items-center mb-4">
                                <h5 className="font-black">개별 출결 현황</h5>
                                <button onClick={() => loadAttendances(s.id)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black">
                                  <RefreshCw className="w-3 h-3" /> 새로고침
                                </button>
                              </div>
                              {!atts ? (
                                <div className="flex justify-center py-4"><Loader className="w-5 h-5 animate-spin text-gray-400" /></div>
                              ) : atts.length === 0 ? (
                                <p className="text-gray-400 font-bold text-center py-4">출석 기록이 없습니다.</p>
                              ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {atts.map(a => (
                                    <div key={a.id} className="flex items-center justify-between bg-white border border-gray-300 p-2 text-sm font-bold">
                                      <span>{a.club_members?.profiles?.name ?? '—'}</span>
                                      <select
                                        value={a.status}
                                        onChange={e => updateAttendance(s.id, a.member_id, e.target.value as '출석' | '지각' | '결석')}
                                        className={`text-xs font-bold border border-gray-300 outline-none cursor-pointer bg-white ${statusColor[a.status]}`}
                                      >
                                        <option>출석</option>
                                        <option>지각</option>
                                        <option>결석</option>
                                      </select>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
