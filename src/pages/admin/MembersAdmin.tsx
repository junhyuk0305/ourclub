import React, { useEffect, useState } from 'react';
import { Users, Search, Award, Loader, UserPlus, X, Check, Save, Info, Bell, CheckCircle, XCircle } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

type MemberStatus = '활동중' | '수료' | '탈퇴' | '활동정지';

interface Member {
  id: string;
  role: '운영진' | '부원';
  generation: string | null;
  position: string | null;
  status: MemberStatus;
  joined_at: string;
  profiles: { name: string; email: string; major: string | null; university: string | null } | null;
  attendanceRate?: number | null;
}

type MemberDraft = Partial<Pick<Member, 'role' | 'status' | 'generation' | 'position'>>;

interface JoinRequest {
  id: string;
  user_id: string;
  role_title: string | null;
  intro: string | null;
  status: string;
  created_at: string;
  profiles: { name: string; email: string; university: string | null; major: string | null } | null;
}

const STATUS_BADGE: Record<MemberStatus, string> = {
  '활동중':  'bg-green-100 text-green-700 border-green-300',
  '수료':    'bg-blue-100 text-blue-700 border-blue-300',
  '탈퇴':    'bg-gray-100 text-gray-500 border-gray-300',
  '활동정지': 'bg-red-100 text-red-700 border-red-300',
};

export default function MembersAdmin() {
  const { adminClubId } = useAdmin();
  const [activeTab, setActiveTab] = useState<'members' | 'join-requests'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, MemberDraft>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // 합류 신청 탭
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [joinFetching, setJoinFetching] = useState(false);
  const [joinProcessing, setJoinProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!adminClubId) return;
    loadMembers(adminClubId);
    loadJoinRequests(adminClubId);
  }, [adminClubId]);

  const loadMembers = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('club_members')
      .select('id, role, generation, position, status, joined_at, profiles(name, email, major, university)')
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true });

    const members = (data as unknown as Member[]) ?? [];
    const withRates = await Promise.all(
      members.map(async m => {
        const { data: atts } = await supabase
          .from('attendances')
          .select('status')
          .eq('member_id', m.id);
        const total = atts?.length ?? 0;
        const attended = atts?.filter(a => a.status === '출석').length ?? 0;
        return { ...m, attendanceRate: total > 0 ? Math.round(attended / total * 100) : null };
      })
    );
    setMembers(withRates);
    setDrafts({});
    setFetching(false);
  };

  const loadJoinRequests = async (clubId: string) => {
    setJoinFetching(true);
    const { data } = await supabase
      .from('club_join_requests')
      .select('id, user_id, role_title, intro, status, created_at, profiles(name, email, university, major)')
      .eq('club_id', clubId)
      .eq('status', '대기중')
      .order('created_at', { ascending: true });
    setJoinRequests((data as unknown as JoinRequest[]) ?? []);
    setJoinFetching(false);
  };

  const handleJoinDecision = async (req: JoinRequest, decision: '승인' | '거절') => {
    if (!adminClubId) return;
    setJoinProcessing(prev => ({ ...prev, [req.id]: true }));

    if (decision === '승인') {
      await supabase.from('club_members').insert({
        user_id: req.user_id,
        club_id: adminClubId,
        role: '운영진',
        status: '활동중',
        position: req.role_title ?? null,
      });
    }

    await supabase
      .from('club_join_requests')
      .update({ status: decision, reviewed_at: new Date().toISOString() })
      .eq('id', req.id);

    setJoinProcessing(prev => ({ ...prev, [req.id]: false }));
    showToast(decision === '승인' ? `${req.profiles?.name}님이 운영진으로 추가됐습니다.` : '거절 처리됐습니다.');
    loadJoinRequests(adminClubId);
    if (decision === '승인') loadMembers(adminClubId);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const setDraft = (id: string, patch: MemberDraft) => {
    setDrafts(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  };

  const hasDraft = (id: string) => {
    const d = drafts[id];
    if (!d) return false;
    return Object.keys(d).length > 0;
  };

  const saveMember = async (id: string) => {
    const patch = drafts[id];
    if (!patch || Object.keys(patch).length === 0) return;
    setSaving(prev => ({ ...prev, [id]: true }));
    const { error } = await supabase.from('club_members').update(patch).eq('id', id);
    setSaving(prev => ({ ...prev, [id]: false }));
    if (error) { showToast('저장 중 오류가 발생했습니다.'); return; }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    setDrafts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showToast('저장되었습니다.');
  };

  const getVal = <K extends keyof MemberDraft>(m: Member, key: K): string => {
    const draft = drafts[m.id];
    if (draft && key in draft) return (draft[key] as string) ?? '';
    return (m[key] as string) ?? '';
  };

  const filtered = members.filter(m =>
    !search ||
    (m.profiles?.name ?? '').includes(search) ||
    (m.profiles?.major ?? '').includes(search)
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-5xl flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-black pb-6">
              <div>
                <h2 className="text-4xl font-black mb-2">부원 명단 관리</h2>
                <p className="text-gray-500 font-bold">동아리 멤버 현황 및 역할/상태를 관리합니다.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-2 border border-black font-black bg-orange-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px active:translate-y-1 active:shadow-none flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> 부원 초대
              </button>
            </div>

            {/* 탭 */}
            <div className="flex gap-0 border-2 border-black w-fit">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-5 py-2.5 font-black text-sm border-r-2 border-black transition-colors flex items-center gap-2 ${
                  activeTab === 'members' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" /> 부원 명단
              </button>
              <button
                onClick={() => setActiveTab('join-requests')}
                className={`px-5 py-2.5 font-black text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'join-requests' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                합류 신청
                {joinRequests.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 font-black rounded-full">
                    {joinRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── 합류 신청 탭 ───────────────────────────────────── */}
            {activeTab === 'join-requests' && (
              <div className="flex flex-col gap-3">
                {joinFetching ? (
                  <div className="flex justify-center py-16">
                    <Loader className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : joinRequests.length === 0 ? (
                  <div className="bg-white border border-black p-12 text-center">
                    <Bell className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                    <p className="font-bold text-gray-400">대기 중인 합류 신청이 없습니다.</p>
                  </div>
                ) : (
                  joinRequests.map(req => (
                    <div key={req.id} className="bg-white border border-black p-5 flex flex-col gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-lg">{req.profiles?.name ?? '—'}</p>
                          <p className="text-sm font-bold text-gray-400">{req.profiles?.email}</p>
                          {(req.profiles?.university || req.profiles?.major) && (
                            <p className="text-sm font-bold text-gray-400">
                              {[req.profiles.university, req.profiles.major].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {req.role_title && (
                            <span className="inline-block border-2 border-black px-2 py-0.5 text-xs font-black mb-1">
                              희망 직책: {req.role_title}
                            </span>
                          )}
                          <p className="text-xs font-bold text-gray-400">
                            {new Date(req.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>

                      {req.intro && (
                        <div className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 whitespace-pre-line">
                          {req.intro}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleJoinDecision(req, '거절')}
                          disabled={joinProcessing[req.id]}
                          className="flex-1 py-2.5 border-2 border-black font-black text-sm hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                        >
                          {joinProcessing[req.id] ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          거절
                        </button>
                        <button
                          onClick={() => handleJoinDecision(req, '승인')}
                          disabled={joinProcessing[req.id]}
                          className="flex-1 py-2.5 bg-orange-500 border-2 border-black font-black text-sm hover:bg-black hover:text-orange-500 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                        >
                          {joinProcessing[req.id] ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          승인 (운영진 등록)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── 부원 명단 탭 ───────────────────────────────────── */}
            {activeTab === 'members' && <>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 px-4 py-2 border border-black bg-black text-white font-black">
                <Users className="w-4 h-4" />
                전체 부원 <span className="bg-white text-black px-2 py-0.5 rounded-full text-xs">{members.filter(m => m.status === '활동중').length}명</span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="이름 또는 학과 검색"
                  className="pl-9 pr-4 py-2 border border-black outline-none focus:border-orange-500 font-bold"
                />
              </div>
            </div>

            {Object.keys(drafts).length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-sm">
                <Info className="w-4 h-4 shrink-0" />
                변경된 행은 주황색으로 표시됩니다. 각 행의 <strong>저장</strong> 버튼을 눌러 확정하세요.
              </div>
            )}

            <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {fetching ? (
                <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="w-16 h-16 border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold">아직 등록된 부원이 없습니다.</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-black text-sm border border-black hover:bg-orange-500 hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <UserPlus className="w-4 h-4" /> 첫 번째 부원 초대하기
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-sm">
                      <th className="p-4 font-black">이름</th>
                      <th className="p-4 font-black">기수</th>
                      <th className="p-4 font-black">직책</th>
                      <th className="p-4 font-black">역할</th>
                      <th className="p-4 font-black">출석률</th>
                      <th className="p-4 font-black">상태</th>
                      <th className="p-4 font-black w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-bold">검색 결과가 없습니다.</td></tr>
                    ) : filtered.map(m => {
                      const isDirty = hasDraft(m.id);
                      const isSaving = saving[m.id];
                      return (
                        <tr key={m.id} className={`transition-colors ${isDirty ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <td className="p-4 font-black text-lg">
                            {m.profiles?.name ?? '—'}
                            {m.role === '운영진' && <Award className="w-4 h-4 inline-block ml-1 text-orange-500" />}
                            <p className="text-xs font-normal text-gray-400">{m.profiles?.email}</p>
                            <p className="text-xs font-normal text-gray-400">{m.profiles?.major}</p>
                          </td>
                          <td className="p-4">
                            <input
                              value={getVal(m, 'generation')}
                              onChange={e => setDraft(m.id, { generation: e.target.value || null })}
                              className="w-16 border border-gray-300 p-1 text-sm font-bold outline-none focus:border-orange-500"
                              placeholder="기수"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              value={getVal(m, 'position')}
                              onChange={e => setDraft(m.id, { position: e.target.value || null })}
                              className="w-24 border border-gray-300 p-1 text-sm font-bold outline-none focus:border-orange-500"
                              placeholder="직책"
                            />
                          </td>
                          <td className="p-4">
                            <select
                              value={(drafts[m.id]?.role ?? m.role) as string}
                              onChange={e => setDraft(m.id, { role: e.target.value as '운영진' | '부원' })}
                              className="border border-black text-sm font-bold p-1 outline-none cursor-pointer bg-white"
                            >
                              <option>운영진</option>
                              <option>부원</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {m.attendanceRate != null ? (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2.5 bg-gray-200 border border-gray-300">
                                  <div className="h-full bg-orange-500" style={{ width: `${m.attendanceRate}%` }} />
                                </div>
                                <span className="font-black text-sm">{m.attendanceRate}%</span>
                              </div>
                            ) : <span className="text-gray-400 text-sm font-bold">—</span>}
                          </td>
                          <td className="p-4">
                            <select
                              value={(drafts[m.id]?.status ?? m.status) as string}
                              onChange={e => setDraft(m.id, { status: e.target.value as MemberStatus })}
                              className={`border text-xs font-bold p-1.5 outline-none cursor-pointer ${STATUS_BADGE[(drafts[m.id]?.status ?? m.status) as MemberStatus]}`}
                            >
                              {(['활동중', '수료', '탈퇴', '활동정지'] as MemberStatus[]).map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="p-4">
                            {isDirty && (
                              <button
                                onClick={() => saveMember(m.id)}
                                disabled={isSaving}
                                title="변경사항 저장"
                                className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                              >
                                {isSaving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                저장
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            </>}

          </div>
        </main>
      </div>

      {showInviteModal && (
        <InviteModal
          clubId={adminClubId!}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => { showToast('부원이 추가되었습니다.'); if (adminClubId) loadMembers(adminClubId); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}
    </div>
  );
}

function InviteModal({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [generation, setGeneration] = useState('');
  const [role, setRole] = useState<'부원' | '운영진'>('부원');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true); setError('');
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();
    if (!profile) { setError('해당 이메일로 가입된 계정을 찾을 수 없습니다.'); setLoading(false); return; }

    const { error: insertErr } = await supabase
      .from('club_members')
      .insert({ club_id: clubId, user_id: profile.id, role, generation: generation.trim() || null, status: '활동중' });
    setLoading(false);
    if (insertErr?.code === '23505') { setError('이미 등록된 부원입니다.'); return; }
    if (insertErr) { setError(insertErr.message); return; }
    onSuccess(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">부원 초대</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <p className="text-gray-500 font-bold text-sm">OURCLUB에 가입된 계정을 이메일로 검색하여 추가합니다.</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-black text-sm">이메일 *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="gildong@university.ac.kr"
              className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">기수</label>
              <input value={generation} onChange={e => setGeneration(e.target.value)} placeholder="14기"
                className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">역할</label>
              <select value={role} onChange={e => setRole(e.target.value as '부원' | '운영진')}
                className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 bg-white cursor-pointer">
                <option>부원</option>
                <option>운영진</option>
              </select>
            </div>
          </div>
        </div>
        {error && <p className="text-red-600 font-bold text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100">취소</button>
          <button onClick={handleInvite} disabled={loading || !email.trim()}
            className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />} 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
