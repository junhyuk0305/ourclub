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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-md mx-4 p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-ink">구성원 추가</h2>
          <button onClick={onClose}><X className="w-5 h-5" strokeWidth={2.5} /></button>
        </div>

        <div className="flex border border-sand-300 rounded-ctl overflow-hidden">
          <button
            type="button"
            onClick={() => { setMode('email'); setError(''); }}
            className={`flex-1 py-2 font-bold text-sm border-r border-sand-300 ${mode === 'email' ? 'bg-brand text-white' : 'bg-white text-ink hover:bg-sand-50'}`}
          >
            이메일 초대
          </button>
          <button
            type="button"
            onClick={() => { setMode('manual'); setError(''); }}
            className={`flex-1 py-2 font-bold text-sm ${mode === 'manual' ? 'bg-brand text-white' : 'bg-white text-ink hover:bg-sand-50'}`}
          >
            계정 없이 추가
          </button>
        </div>

        <p className="text-sand-500 font-medium text-sm">
          {mode === 'email'
            ? 'OURCLUB에 가입된 계정을 이메일로 검색해 부원 또는 운영진으로 추가합니다.'
            : '아직 OURCLUB 계정이 없는 사람도 명단에 등록할 수 있습니다.'}
        </p>

        <div className="flex flex-col gap-4">
          {mode === 'email' ? (
            <div className="flex flex-col gap-1">
              <label className="font-bold text-sm text-ink">이메일 *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="gildong@university.ac.kr"
                className="field w-full p-3 border border-sand-300 rounded-ctl font-bold" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ink">이름 *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동"
                  className="field w-full p-3 border border-sand-300 rounded-ctl font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ink">학교</label>
                <input value={university} onChange={e => setUniversity(e.target.value)} placeholder="OO대학교"
                  className="field w-full p-3 border border-sand-300 rounded-ctl font-bold" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-sm text-ink">기수</label>
              <select value={generation} onChange={e => setGeneration(e.target.value)}
                className="field w-full p-3 border border-sand-300 rounded-ctl font-bold bg-white cursor-pointer">
                <option value="">선택 안 함</option>
                {generations.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-sm text-ink">역할</label>
              <select value={role} onChange={e => setRole(e.target.value as '부원' | '운영진')}
                className="field w-full p-3 border border-sand-300 rounded-ctl font-bold bg-white cursor-pointer">
                <option>부원</option>
                <option>운영진</option>
              </select>
            </div>
          </div>
          {role === '운영진' && (
            <p className="text-xs font-bold text-brand-dark">
              운영진은 워크스페이스(모집·부원·홈페이지) 관리 권한을 갖습니다.
            </p>
          )}
        </div>
        {error && <p className="text-bad-fg font-bold text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-sand-300 text-ink rounded-ctl font-bold hover:bg-sand-50">취소</button>
          <button onClick={handleInvite} disabled={loading || !canSubmit}
            className="flex-1 py-3 btn-grad text-white rounded-ctl font-bold shadow-btn hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} />} 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
