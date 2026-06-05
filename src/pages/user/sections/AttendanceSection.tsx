import { useState, useEffect } from 'react';
import { Loader, Check, CalendarCheck, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

const EXCUSE_REASONS = ['개인 일정', '병가', '교내 일정', '자격증 시험', '가족 행사', '기타'];

interface Membership {
  id: string;        // club_members.id
  clubId: string;
  clubName: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// ──────────────────────────────────────────
// Phase 4: 출석 코드 입력 (INSERT 포함)
// M1: 출석 인정 신청 패널 추가
// ──────────────────────────────────────────
export default function AttendanceSection() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  // ── 출석 인정 신청 ──
  const [excuseOpen, setExcuseOpen] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [exMemberId, setExMemberId] = useState('');
  const [exDate, setExDate] = useState(todayStr());
  const [exReason, setExReason] = useState('');
  const [exDetail, setExDetail] = useState('');
  const [exFile, setExFile] = useState<File | null>(null);
  const [exSubmitting, setExSubmitting] = useState(false);
  const [exMsg, setExMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const handleAttend = async () => {
    if (!code.trim() || !user) return;
    setStatus('loading');
    setMsg('');

    // 1. 유효한 세션 조회
    const { data: session } = await supabase
      .from('sessions')
      .select('id, club_id, expires_at')
      .eq('attendance_code', code.trim())
      .maybeSingle();

    if (!session) {
      setStatus('error'); setMsg('유효하지 않은 코드입니다.'); return;
    }
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      setStatus('error'); setMsg('출석 시간이 초과되었습니다.'); return;
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

  // 출석 인정 패널 열 때 내 활동 멤버십 로드
  useEffect(() => {
    if (!excuseOpen || !user || memberships.length > 0) return;
    supabase
      .from('club_members')
      .select('id, club_id, status, clubs ( name )')
      .eq('user_id', user.id)
      .eq('status', '활동중')
      .then(({ data }) => {
        const list: Membership[] = (data ?? []).map((m: any) => ({
          id: m.id,
          clubId: m.club_id,
          clubName: m.clubs?.name ?? '—',
        }));
        setMemberships(list);
        if (list.length === 1) setExMemberId(list[0].id);
      });
  }, [excuseOpen, user, memberships.length]);

  const submitExcuse = async () => {
    setExMsg(null);
    const membership = memberships.find(m => m.id === exMemberId);
    if (!membership) { setExMsg({ kind: 'error', text: '동아리를 선택해주세요.' }); return; }
    if (!exReason) { setExMsg({ kind: 'error', text: '사유를 선택해주세요.' }); return; }
    if (!exDate) { setExMsg({ kind: 'error', text: '일자를 선택해주세요.' }); return; }

    setExSubmitting(true);

    // (선택) 증빙 파일 업로드
    let fileUrl: string | null = null;
    if (exFile) {
      const ext = exFile.name.split('.').pop() || 'bin';
      const path = `excuses/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('club-pages').upload(path, exFile, { upsert: false });
      if (upErr) {
        setExSubmitting(false);
        setExMsg({ kind: 'error', text: '파일 업로드에 실패했습니다.' });
        return;
      }
      fileUrl = supabase.storage.from('club-pages').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('attendance_excuse_requests').insert({
      club_id: membership.clubId,
      member_id: membership.id,
      excuse_date: exDate,
      reason_category: exReason,
      detail: exDetail.trim() || null,
      file_url: fileUrl,
      status: '대기',
    });

    setExSubmitting(false);

    if (error) {
      setExMsg({ kind: 'error', text: '신청 중 오류가 발생했습니다.' });
      return;
    }

    setExMsg({ kind: 'success', text: '출석 인정 신청이 접수되었습니다.' });
    setExReason(''); setExDetail(''); setExFile(null); setExDate(todayStr());
  };

  return (
    <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-2xl font-black flex items-center gap-2">
          <span className="text-orange-500">✓</span> 출석 체크
        </h3>
        <button
          onClick={() => { setExcuseOpen(o => !o); setExMsg(null); }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 border-2 border-black font-black text-xs transition-colors ${
            excuseOpen ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" /> 출석 인정 신청
        </button>
      </div>

      <p className="font-bold text-gray-500 mb-4">
        운영진이 안내한 4자리 숫자 코드를 입력하세요.
      </p>
      <div className="flex max-w-sm border-2 border-black focus-within:shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] transition-all">
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setStatus('idle'); setMsg(''); }}
          onKeyDown={e => { if (e.key === 'Enter') handleAttend(); }}
          placeholder="0000"
          className="flex-1 px-4 py-3 outline-none font-black text-lg tracking-widest placeholder:font-bold placeholder:text-gray-300"
          maxLength={4}
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

      {/* ── 출석 인정 신청 패널 ── */}
      {excuseOpen && (
        <div className="mt-6 border-t-2 border-dashed border-gray-300 pt-6 flex flex-col gap-4">
          <p className="font-bold text-gray-500 text-sm">
            부득이하게 참석하지 못한 활동의 출석 인정을 신청합니다. 운영진 승인 시 <strong className="text-blue-600">공결</strong> 처리됩니다.
          </p>

          {memberships.length > 1 && (
            <div>
              <label className="block font-black text-xs mb-1.5">동아리</label>
              <select
                value={exMemberId}
                onChange={e => setExMemberId(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-black font-bold text-sm outline-none focus:shadow-[2px_2px_0px_0px_rgba(249,115,22,1)]"
              >
                <option value="" disabled>동아리 선택</option>
                {memberships.map(m => <option key={m.id} value={m.id}>{m.clubName}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block font-black text-xs mb-1.5">일자</label>
            <input
              type="date"
              value={exDate}
              onChange={e => setExDate(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-black font-bold text-sm outline-none focus:shadow-[2px_2px_0px_0px_rgba(249,115,22,1)]"
            />
          </div>

          <div>
            <label className="block font-black text-xs mb-1.5">사유</label>
            <div className="flex flex-wrap gap-2">
              {EXCUSE_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setExReason(r)}
                  className={`px-3 py-1.5 border-2 border-black font-bold text-xs transition-colors ${
                    exReason === r ? 'bg-orange-500 text-black' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-black text-xs mb-1.5">상세 내용</label>
            <textarea
              value={exDetail}
              onChange={e => setExDetail(e.target.value)}
              rows={3}
              placeholder="출석 인정 사유를 자세히 적어주세요."
              className="w-full px-3 py-2.5 border-2 border-black font-bold text-sm outline-none focus:shadow-[2px_2px_0px_0px_rgba(249,115,22,1)] resize-none placeholder:text-gray-300"
            />
          </div>

          <div>
            <label className="block font-black text-xs mb-1.5">파일 첨부 <span className="text-gray-400 font-bold">(선택)</span></label>
            {exFile ? (
              <div className="flex items-center gap-2 px-3 py-2 border-2 border-black bg-gray-50">
                <Paperclip className="w-4 h-4 shrink-0" />
                <span className="font-bold text-xs truncate flex-1">{exFile.name}</span>
                <button onClick={() => setExFile(null)} className="hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-black font-bold text-xs cursor-pointer hover:bg-gray-100">
                <Paperclip className="w-4 h-4" /> 파일 선택
                <input
                  type="file"
                  className="hidden"
                  onChange={e => setExFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          {exMsg && (
            <p className={`font-bold text-sm flex items-center gap-1 ${exMsg.kind === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {exMsg.kind === 'success' && <Check className="w-4 h-4" />}
              {exMsg.text}
            </p>
          )}

          <button
            onClick={submitExcuse}
            disabled={exSubmitting}
            className="self-start px-6 py-2.5 bg-black text-white font-black text-sm border-2 border-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {exSubmitting && <Loader className="w-4 h-4 animate-spin" />} 신청하기
          </button>
        </div>
      )}
    </div>
  );
}
