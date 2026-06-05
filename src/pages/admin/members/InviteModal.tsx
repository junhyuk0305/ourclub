import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export function InviteModal({
  clubId, generations, defaultGeneration, onClose, onSuccess,
}: {
  clubId: string;
  generations: string[];
  defaultGeneration: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<'email' | 'manual'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [generation, setGeneration] = useState(defaultGeneration);
  const [role, setRole] = useState<'부원' | '운영진'>('부원');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async () => {
    setError('');
    if (mode === 'email') {
      if (!email.trim()) return;
      setLoading(true);
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
      if (insertErr?.code === '23505') { setError('이미 등록된 구성원입니다.'); return; }
      if (insertErr) { setError(insertErr.message); return; }
      onSuccess(); onClose();
      return;
    }

    // manual mode — 계정 없이 추가
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    setLoading(true);
    const { error: insertErr } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: null,
        role,
        generation: generation.trim() || null,
        status: '활동중',
        display_name: name.trim(),
        display_university: university.trim() || null,
      });
    setLoading(false);
    if (insertErr) { setError(insertErr.message); return; }
    onSuccess(); onClose();
  };

  const canSubmit = mode === 'email' ? !!email.trim() : !!name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">구성원 추가</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-2 border-black">
          <button
            type="button"
            onClick={() => { setMode('email'); setError(''); }}
            className={`flex-1 py-2 font-black text-sm border-r-2 border-black ${mode === 'email' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            이메일 초대
          </button>
          <button
            type="button"
            onClick={() => { setMode('manual'); setError(''); }}
            className={`flex-1 py-2 font-black text-sm ${mode === 'manual' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            계정 없이 추가
          </button>
        </div>

        <p className="text-gray-500 font-bold text-sm">
          {mode === 'email'
            ? 'OURCLUB에 가입된 계정을 이메일로 검색해 부원 또는 운영진으로 추가합니다.'
            : '아직 OURCLUB 계정이 없는 사람도 명단에 등록할 수 있습니다.'}
        </p>

        <div className="flex flex-col gap-4">
          {mode === 'email' ? (
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">이메일 *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="gildong@university.ac.kr"
                className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-black text-sm">이름 *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동"
                  className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-black text-sm">학교</label>
                <input value={university} onChange={e => setUniversity(e.target.value)} placeholder="OO대학교"
                  className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">기수</label>
              <select value={generation} onChange={e => setGeneration(e.target.value)}
                className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 bg-white cursor-pointer">
                <option value="">선택 안 함</option>
                {generations.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
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
          {role === '운영진' && (
            <p className="text-xs font-bold text-orange-600">
              운영진은 워크스페이스(모집·부원·홈페이지) 관리 권한을 갖습니다.
            </p>
          )}
        </div>
        {error && <p className="text-red-600 font-bold text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100">취소</button>
          <button onClick={handleInvite} disabled={loading || !canSubmit}
            className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />} 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
