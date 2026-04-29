import React, { useEffect, useState } from 'react';
import { Users, Search, Award, Loader, UserPlus, X, Check } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';

type MemberStatus = '활동중' | '수료' | '탈퇴' | '활동정지';

interface Member {
  id: string;
  role: '운영진' | '부원';
  generation: string | null;
  position: string | null;
  status: MemberStatus;
  joined_at: string;
  profiles: { name: string; email: string; major: string | null; university: string | null } | null;
  attendanceRate?: number;
}

const STATUS_BADGE: Record<MemberStatus, string> = {
  '활동중':  'bg-green-100 text-green-700 border-green-300',
  '수료':    'bg-blue-100 text-blue-700 border-blue-300',
  '탈퇴':    'bg-gray-100 text-gray-500 border-gray-300',
  '활동정지': 'bg-red-100 text-red-700 border-red-300',
};

export default function MembersAdmin() {
  const { adminClubId } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!adminClubId) return;
    loadMembers(adminClubId);
  }, [adminClubId]);

  const loadMembers = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('club_members')
      .select('id, role, generation, position, status, joined_at, profiles(name, email, major, university)')
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true });

    // 출석률 계산
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
    setFetching(false);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const updateMember = async (id: string, patch: Partial<Pick<Member, 'role' | 'status' | 'generation' | 'position'>>) => {
    await supabase.from('club_members').update(patch).eq('id', id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    showToast('변경되었습니다.');
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

            <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {fetching ? (
                <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-bold">검색 결과가 없습니다.</td></tr>
                    ) : filtered.map(m => (
                      <tr key={m.id} className="hover:bg-orange-50 transition-colors">
                        <td className="p-4 font-black text-lg">
                          {m.profiles?.name ?? '—'}
                          {m.role === '운영진' && <Award className="w-4 h-4 inline-block ml-1 text-orange-500" />}
                          <p className="text-xs font-normal text-gray-400">{m.profiles?.major}</p>
                        </td>
                        <td className="p-4">
                          <input
                            defaultValue={m.generation ?? ''}
                            onBlur={e => updateMember(m.id, { generation: e.target.value || null })}
                            className="w-16 border border-gray-300 p-1 text-sm font-bold outline-none focus:border-orange-500"
                            placeholder="기수"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            defaultValue={m.position ?? ''}
                            onBlur={e => updateMember(m.id, { position: e.target.value || null })}
                            className="w-24 border border-gray-300 p-1 text-sm font-bold outline-none focus:border-orange-500"
                            placeholder="직책"
                          />
                        </td>
                        <td className="p-4">
                          <select
                            value={m.role}
                            onChange={e => updateMember(m.id, { role: e.target.value as '운영진' | '부원' })}
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
                            value={m.status}
                            onChange={e => updateMember(m.id, { status: e.target.value as MemberStatus })}
                            className={`border text-xs font-bold p-1.5 outline-none cursor-pointer ${STATUS_BADGE[m.status]}`}
                          >
                            {(['활동중', '수료', '탈퇴', '활동정지'] as MemberStatus[]).map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {showInviteModal && (
        <InviteModal clubId={adminClubId!} onClose={() => setShowInviteModal(false)} onSuccess={() => { showToast('부원이 추가되었습니다.'); if (adminClubId) loadMembers(adminClubId); }} />
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
    // 이메일로 profiles 조회
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
