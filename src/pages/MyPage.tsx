import React, { useState, useEffect } from 'react';
import { User, Heart, FileText, Bell, Loader, LogOut, X, Check, ClipboardList, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

type Tab = 'applications' | 'attendance' | 'scraps' | 'notifications';

// ──────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────
export default function MyPage() {
  const { profile, signOut, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [showEditModal, setShowEditModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'applications', label: '지원 내역',     icon: <FileText className="w-5 h-5" /> },
    { key: 'attendance',   label: '활동 및 출결',  icon: <ClipboardList className="w-5 h-5" /> },
    { key: 'scraps',       label: '스크랩한 동아리', icon: <Heart className="w-5 h-5" /> },
    { key: 'notifications',label: '알림 설정',     icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-12 md:py-16 border-b border-black">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-black mb-8">마이페이지</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── 프로필 사이드바 ── */}
          <div className="col-span-1 border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 self-start">
            <div className="flex flex-col items-center border-b border-black pb-8 mb-8">
              <div className="w-24 h-24 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-gray-500" />
              </div>
              <h2 className="text-2xl font-black mb-1">{profile?.name || '—'}</h2>
              <p className="text-gray-500 font-bold mb-1 text-sm text-center break-all">{profile?.email || '—'}</p>
              {profile?.university && (
                <p className="text-gray-400 font-bold text-xs mb-1">
                  {profile.university} {profile.major}
                </p>
              )}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-2 mb-3">
                  {profile.skills.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-orange-100 border border-orange-300 text-orange-700 text-xs font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full py-2 border border-black font-bold text-sm hover:bg-gray-100 transition-colors mt-2"
              >
                프로필 수정
              </button>
            </div>

            <nav className="flex flex-col gap-2 font-bold">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-3 p-3 text-left transition-colors ${
                    activeTab === item.key
                      ? 'bg-black text-white'
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>

            <button
              onClick={handleSignOut}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-500 font-bold text-sm hover:border-black hover:text-black transition-colors"
            >
              <LogOut className="w-4 h-4" /> 로그아웃
            </button>
          </div>

          {/* ── 메인 콘텐츠 ── */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-8">
            {/* Phase 5: Pulse Check 배너 (진행중 설문 있을 때만 표시) */}
            <PulseCheckBanner />

            {/* Phase 4: 출석 코드 입력 */}
            <AttendanceSection />

            {/* 탭 콘텐츠 */}
            {activeTab === 'applications'  && <ApplicationsSection />}
            {activeTab === 'attendance'    && <AttendanceHistorySection />}
            {activeTab === 'scraps'        && <ScrapsSection />}
            {activeTab === 'notifications' && <NotificationsSection />}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal onClose={() => { setShowEditModal(false); refreshProfile(); }} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Phase 5: Pulse Check 배너
// ──────────────────────────────────────────
function PulseCheckBanner() {
  const { user } = useAuth();
  const [survey, setSurvey] = useState<{ id: string; title: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;
    // 1. 내가 속한 동아리 목록 조회
    supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('status', '활동중')
      .then(async ({ data: memberships }) => {
        if (!memberships || memberships.length === 0) return;
        const clubIds = memberships.map(m => m.club_id);
        // 2. 해당 동아리의 진행중 설문 조회
        const { data } = await supabase
          .from('pulse_surveys')
          .select('id, title')
          .in('club_id', clubIds)
          .eq('status', '진행중')
          .limit(1)
          .maybeSingle();
        if (data) setSurvey(data);
      });
  }, [user, dismissed]);

  if (!survey || dismissed) return null;

  return (
    <>
      <div className="border border-black bg-orange-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-sm mb-1 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Pulse Check
          </div>
          <h3 className="text-xl font-black mb-1">{survey.title}</h3>
          <p className="font-bold text-gray-600 text-sm">익명으로 진행되며, 더 나은 동아리 활동을 위해 활용됩니다.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="px-4 py-2 border border-black font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 border border-black bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none whitespace-nowrap"
          >
            참여하기
          </button>
        </div>
      </div>

      {showModal && (
        <PulseCheckModal
          surveyId={survey.id}
          surveyTitle={survey.title}
          onClose={() => { setShowModal(false); setDismissed(true); }}
        />
      )}
    </>
  );
}

// ──────────────────────────────────────────
// Phase 5: Pulse Check 응답 모달
// ──────────────────────────────────────────
function PulseCheckModal({ surveyId, surveyTitle, onClose }: {
  surveyId: string; surveyTitle: string; onClose: () => void;
}) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) return;
    setSubmitting(true);
    await supabase.from('pulse_responses').insert({ survey_id: surveyId, score, feedback: feedback.trim() || null });
    setSubmitting(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8">
        {done ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Check className="w-12 h-12 text-green-500" />
            <p className="font-black text-xl">응답이 제출되었습니다!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">{surveyTitle}</h2>
              <button onClick={onClose}><X className="w-6 h-6 hover:text-orange-500 transition-colors" /></button>
            </div>

            <p className="font-bold text-gray-600 mb-6 text-sm">이번 활동은 어땠나요? (익명)</p>

            {/* 별점 */}
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${n <= score ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
            {score > 0 && (
              <p className="text-center font-black text-sm mb-4 text-gray-500">
                {['', '매우 불만족', '불만족', '보통', '만족', '매우 만족'][score]}
              </p>
            )}

            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="자유롭게 의견을 남겨주세요. (선택)"
              rows={3}
              className="w-full border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors resize-none mb-6"
            />

            <button
              onClick={handleSubmit}
              disabled={score === 0 || submitting}
              className="w-full py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting && <Loader className="w-4 h-4 animate-spin" />}
              익명으로 제출
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Phase 4: 출석 코드 입력 (INSERT 포함)
// ──────────────────────────────────────────
function AttendanceSection() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleAttend = async () => {
    if (!code.trim() || !user) return;
    setStatus('loading');
    setMsg('');

    // 1. 유효한 세션 조회
    const { data: session } = await supabase
      .from('sessions')
      .select('id, club_id, expires_at')
      .eq('attendance_code', code.toUpperCase())
      .maybeSingle();

    if (!session) {
      setStatus('error'); setMsg('유효하지 않은 출석 코드입니다.'); return;
    }
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      setStatus('error'); setMsg('출석 코드가 만료되었습니다.'); return;
    }

    // 2. 해당 동아리의 내 club_member 조회
    const { data: member } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', session.club_id)
      .eq('user_id', user.id)
      .eq('status', '활동중')
      .maybeSingle();

    if (!member) {
      setStatus('error'); setMsg('해당 동아리의 활동 부원만 출석할 수 있습니다.'); return;
    }

    // 3. 출석 INSERT
    const { error: insertErr } = await supabase
      .from('attendances')
      .insert({ session_id: session.id, member_id: member.id, status: '출석' });

    if (insertErr) {
      if (insertErr.code === '23505') {
        setStatus('error'); setMsg('이미 출석 처리되었습니다.'); return;
      }
      setStatus('error'); setMsg('출석 처리 중 오류가 발생했습니다.'); return;
    }

    setStatus('success'); setMsg('출석이 완료되었습니다!');
    setCode('');
  };

  return (
    <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h3 className="text-2xl font-black flex items-center gap-2 mb-4">
        <span className="text-orange-500">✓</span> 출석 체크
      </h3>
      <p className="font-bold text-gray-500 mb-4">
        운영진이 안내한 4~6자리 코드(영문/숫자)를 입력하세요.
      </p>
      <div className="flex max-w-sm border-2 border-black focus-within:shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] transition-all">
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value); setStatus('idle'); setMsg(''); }}
          onKeyDown={e => { if (e.key === 'Enter') handleAttend(); }}
          placeholder="출석코드 입력"
          className="flex-1 px-4 py-3 outline-none font-black text-lg uppercase placeholder:font-bold placeholder:text-gray-300"
          maxLength={6}
        />
        <button
          onClick={handleAttend}
          disabled={status === 'loading' || !code.trim()}
          className="bg-black text-white px-6 font-black border-l-2 border-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center"
        >
          {status === 'loading' ? <Loader className="w-5 h-5 animate-spin" /> : '인증'}
        </button>
      </div>
      {msg && (
        <p className={`mt-3 font-bold text-sm flex items-center gap-1 ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {status === 'success' && <Check className="w-4 h-4" />}
          {msg}
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Phase 3: 지원 내역 탭
// ──────────────────────────────────────────
function ApplicationsSection() {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('recruitment_applications')
      .select(`
        id, status, submitted_at,
        recruitments ( title, clubs ( name ) )
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => { setApps(data ?? []); setFetching(false); });
  }, [user]);

  const statusStyle: Record<string, string> = {
    '서류제출': 'bg-orange-200',
    '서류합격': 'bg-blue-200',
    '면접예정': 'bg-yellow-200',
    '최종합격': 'bg-green-200',
    '불합격':   'bg-gray-200',
  };

  return (
    <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-orange-500" /> 지원 내역
      </h3>
      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-bold border-2 border-dashed border-gray-300">
          아직 지원한 동아리가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {apps.map(app => {
            const recruit = app.recruitments as any;
            return (
              <div key={app.id} className="p-6 border border-black bg-gray-50 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">
                    {new Date(app.submitted_at).toLocaleDateString('ko-KR')} 지원
                  </div>
                  <div className="font-black text-lg">
                    {recruit?.clubs?.name ?? '—'} — {recruit?.title ?? '—'}
                  </div>
                </div>
                <span className={`shrink-0 px-4 py-2 border border-black font-bold text-sm ${statusStyle[app.status] ?? 'bg-gray-100'}`}>
                  {app.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Phase 4: 출결 이력 탭
// ──────────────────────────────────────────
function AttendanceHistorySection() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<{ clubName: string; rate: number; records: any[] }[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    // club_members → attendances → sessions 순서로 조회
    supabase
      .from('club_members')
      .select('id, generation, clubs ( name )')
      .eq('user_id', user.id)
      .then(async ({ data: memberships }) => {
        if (!memberships || memberships.length === 0) {
          setFetching(false); return;
        }

        const result = await Promise.all(
          memberships.map(async (m: any) => {
            const { data: records } = await supabase
              .from('attendances')
              .select('status, recorded_at, sessions ( title )')
              .eq('member_id', m.id)
              .order('recorded_at', { ascending: false });

            const list = records ?? [];
            const attended = list.filter(r => r.status === '출석').length;
            const rate = list.length > 0 ? Math.round((attended / list.length) * 100) : 0;

            return {
              clubName: `${m.clubs?.name ?? '—'} ${m.generation ?? ''}`.trim(),
              rate,
              records: list,
            };
          })
        );
        setGroups(result);
        setFetching(false);
      });
  }, [user]);

  const statusColor: Record<string, string> = {
    '출석': 'text-green-600',
    '지각': 'text-yellow-600',
    '결석': 'text-red-500',
  };

  return (
    <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-orange-500" /> 활동 및 출결
      </h3>
      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-bold border-2 border-dashed border-gray-300">
          소속된 동아리가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map(g => (
            <div key={g.clubName}>
              <div className="flex justify-between items-end border-b-2 border-black pb-2 px-2 mb-4">
                <div className="font-bold text-gray-500">{g.clubName}</div>
                <div className="font-black text-xl text-orange-500">출석률 {g.rate}%</div>
              </div>

              {g.records.length === 0 ? (
                <p className="text-gray-400 font-bold text-sm text-center py-4">
                  출결 내역이 없습니다.
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-100 border-b-2 border-black font-black">
                    <tr>
                      <th className="p-3">일자</th>
                      <th className="p-3">세션명</th>
                      <th className="p-3 text-right">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-bold">
                    {g.records.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-500">
                          {new Date(r.recorded_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="p-3">{(r.sessions as any)?.title ?? '—'}</td>
                        <td className={`p-3 text-right font-black ${statusColor[r.status] ?? ''}`}>
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Phase 6: 스크랩 탭
// ──────────────────────────────────────────
function ScrapsSection() {
  const { user } = useAuth();
  const [scraps, setScraps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('bookmarks')
      .select('id, target_id, created_at')
      .eq('user_id', user.id)
      .eq('target_type', 'CLUB')
      .order('created_at', { ascending: false })
      .then(async ({ data: bookmarks }) => {
        if (!bookmarks || bookmarks.length === 0) {
          setScraps([]); setFetching(false); return;
        }
        const ids = bookmarks.map(b => b.target_id);
        const { data: clubs } = await supabase
          .from('clubs')
          .select('id, name, one_line_desc, type')
          .in('id', ids);
        const clubMap = Object.fromEntries((clubs ?? []).map(c => [c.id, c]));
        setScraps(bookmarks.map(b => ({ ...b, club: clubMap[b.target_id] })));
        setFetching(false);
      });
  }, [user]);

  const handleRemove = async (bookmarkId: string) => {
    await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    setScraps(prev => prev.filter(s => s.id !== bookmarkId));
  };

  return (
    <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-orange-500" /> 스크랩 (관심 동아리)
      </h3>
      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : scraps.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-bold border-2 border-dashed border-gray-300">
          아직 스크랩한 동아리가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {scraps.map(s => (
            <div key={s.id} className="p-4 border border-black bg-gray-50 flex items-center justify-between">
              <div>
                <div className="font-black text-lg">{s.club?.name ?? s.target_id}</div>
                <div className="text-sm font-bold text-gray-500">
                  {s.club?.type} {s.club?.one_line_desc ? `· ${s.club.one_line_desc}` : ''}
                </div>
              </div>
              <button
                onClick={() => handleRemove(s.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="스크랩 삭제"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// 알림 설정 (placeholder)
// ──────────────────────────────────────────
function NotificationsSection() {
  return (
    <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
        <Bell className="w-6 h-6 text-orange-500" /> 알림 설정
      </h3>
      <p className="text-gray-500 font-bold text-center py-8 border-2 border-dashed border-gray-300">
        알림 설정 기능은 준비 중입니다.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────
// 프로필 수정 모달
// ──────────────────────────────────────────
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, user } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [major, setMajor] = useState(profile?.major ?? '');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills(prev => [...prev, trimmed]);
    setSkillInput('');
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { setErrorMsg('이름을 입력해주세요.'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        university: university.trim() || null,
        major: major.trim() || null,
        skills,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) { setErrorMsg(error.message); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg mx-4 p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">프로필 수정</h2>
          <button onClick={onClose} className="hover:text-orange-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {([
          { label: '이름 *', value: name, set: setName, placeholder: '홍길동' },
          { label: '전화번호', value: phone, set: setPhone, placeholder: '010-0000-0000' },
          { label: '대학교', value: university, set: setUniversity, placeholder: '○○대학교' },
          { label: '전공', value: major, set: setMajor, placeholder: '경영학과' },
        ] as { label: string; value: string; set: (v: string) => void; placeholder: string }[]).map(({ label, value, set, placeholder }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-black text-sm">{label}</label>
            <input
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              className="border-2 border-black px-4 py-2 font-bold outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <label className="font-black text-sm">스킬 태그</label>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="React, 기획, Figma…"
              className="flex-1 border-2 border-black px-4 py-2 font-bold outline-none focus:border-orange-500 transition-colors"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 bg-black text-white font-black hover:bg-orange-500 transition-colors"
            >
              추가
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 bg-orange-100 border border-orange-300 text-orange-700 font-bold text-sm">
                  {s}
                  <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {errorMsg && <p className="text-red-600 font-bold text-sm">{errorMsg}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100 transition-colors">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />} 저장
          </button>
        </div>
      </div>
    </div>
  );
}
