import { useEffect, useMemo, useState } from 'react';
import { Award, Loader, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll, fetchAllIn } from '../../lib/fetchAll';
import { attendanceRate } from '../../lib/attendanceRate';

// ──────────────────────────────────────────
// 활동 증명서 발급 모달 (운영진)
//  · 제목 + 본문을 입력하고
//  · 출석률 기준치 이상 부원을 자동 선택(수동 가감 가능)
//  · 발급 시점 정보를 스냅샷으로 동결하여 certificates 에 insert
// ──────────────────────────────────────────

interface Candidate {
  id: string;            // club_members.id
  user_id: string;
  name: string;
  generation: string | null;
  position: string | null;
  rate: number | null;   // 출석률(%)
}

export default function CertificateIssueModal({
  clubId, clubName, onClose, onIssued,
}: { clubId: string; clubName: string; onClose: () => void; onIssued: (count: number) => void }) {
  const { user } = useAuth();

  const [loading, setLoading]   = useState(true);
  const [cands, setCands]       = useState<Candidate[]>([]);
  const [title, setTitle]       = useState('활동 수료증');
  const [body, setBody]         = useState('');
  const [threshold, setThreshold] = useState(80);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [issuing, setIssuing]   = useState(false);
  const [error, setError]       = useState('');

  // 활동중·수료 부원(계정 보유) + 출석률 계산
  useEffect(() => {
    (async () => {
      const { data: memberRows } = await fetchAll<any>((from, to) => supabase
        .from('club_members')
        .select('id, user_id, generation, position, display_name, profiles(name)')
        .eq('club_id', clubId)
        .in('status', ['활동중', '수료'])
        .not('user_id', 'is', null)
        .range(from, to));
      const members = (memberRows ?? []) as any[];

      // 동아리 세션 → 대상/출석 조회 후 멤버별 출석률(운영진 명단과 동일 SSOT)
      const { data: sessionRows } = await fetchAll<{ id: string }>((from, to) => supabase
        .from('sessions').select('id').eq('club_id', clubId).range(from, to));
      const sessionIds = (sessionRows ?? []).map(s => s.id);

      const rateMap: Record<string, number | null> = {};
      if (sessionIds.length > 0) {
        const [{ data: tgtRows }, { data: attRows }] = await Promise.all([
          fetchAllIn<{ member_id: string; session_id: string }>(sessionIds, (chunk, from, to) =>
            supabase.from('session_targets').select('member_id, session_id').in('session_id', chunk).range(from, to)),
          fetchAllIn<{ member_id: string; session_id: string }>(sessionIds, (chunk, from, to) =>
            supabase.from('attendances').select('member_id, session_id').in('session_id', chunk).eq('status', '출석').range(from, to)),
        ]);
        const denom: Record<string, Set<string>> = {};
        (tgtRows ?? []).forEach(t => { (denom[t.member_id] ??= new Set()).add(t.session_id); });
        const attended: Record<string, string[]> = {};
        (attRows ?? []).forEach(a => { (attended[a.member_id] ??= []).push(a.session_id); });
        members.forEach(m => { rateMap[m.id] = attendanceRate(denom[m.id] ?? new Set(), attended[m.id] ?? []); });
      }

      const list: Candidate[] = members.map(m => ({
        id: m.id,
        user_id: m.user_id,
        name: m.profiles?.name ?? m.display_name ?? '이름 미상',
        generation: m.generation ?? null,
        position: m.position ?? null,
        rate: rateMap[m.id] ?? null,
      })).sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

      setCands(list);
      setSelected(new Set(list.filter(c => c.rate != null && c.rate >= 80).map(c => c.id)));
      setLoading(false);
    })();
  }, [clubId]);

  // 기준치 슬라이더 이동 → 기준 이상 부원으로 선택 재설정
  const applyThreshold = (t: number) => {
    setThreshold(t);
    setSelected(new Set(cands.filter(c => c.rate != null && c.rate >= t).map(c => c.id)));
  };

  const toggle = (id: string) =>
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const eligibleCount = useMemo(
    () => cands.filter(c => c.rate != null && c.rate >= threshold).length, [cands, threshold]);

  const issue = async () => {
    if (!title.trim()) { setError('증명서 제목을 입력하세요.'); return; }
    if (!body.trim())  { setError('증명서 본문을 입력하세요.'); return; }
    if (selected.size === 0) { setError('발급 대상을 한 명 이상 선택하세요.'); return; }
    setIssuing(true); setError('');

    const stamp = Date.now().toString(36).toUpperCase();
    const rows = cands.filter(c => selected.has(c.id)).map((c, i) => ({
      club_id: clubId,
      recipient_user_id: c.user_id,
      member_id: c.id,
      cert_no: `OC-${stamp}-${String(i + 1).padStart(3, '0')}`,
      title: title.trim(),
      body: body.trim(),
      recipient_name: c.name,
      club_name: clubName,
      generation: c.generation,
      position: c.position,
      attendance_rate: c.rate,
      issued_by: user?.id ?? null,
    }));

    const { error: insErr } = await supabase.from('certificates').insert(rows);
    setIssuing(false);
    if (insErr) { setError(insErr.message); return; }
    onIssued(rows.length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border border-sand-200 rounded-card w-full max-w-2xl shadow-soft-lg flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-sand-200 bg-brand-tint rounded-t-card flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black flex items-center gap-2 text-brand-dark">
            <Award className="w-5 h-5" strokeWidth={2.5} /> 활동 증명서 발급
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" strokeWidth={2.5} /></button>
        </div>

        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <label className="font-black text-sm text-ink">증명서 제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold"
              placeholder="활동 수료증" maxLength={40} />
          </div>

          {/* 본문 */}
          <div className="flex flex-col gap-1.5">
            <label className="font-black text-sm text-ink">본문</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
              className="field w-full p-3 border border-sand-300 rounded-ctl font-bold resize-none"
              placeholder="위 사람은 본 동아리에서 성실히 활동하였기에 이 증서를 수여합니다." />
            <p className="text-xs font-medium text-sand-400">
              이름·동아리·기수·출석률은 자동으로 들어갑니다. 위 본문 문구만 작성하세요.
            </p>
          </div>

          {/* 출석률 기준 */}
          <div className="flex flex-col gap-2 bg-sand-50 border border-sand-200 rounded-card p-4">
            <div className="flex items-center justify-between">
              <label className="font-black text-sm text-ink">출석률 기준</label>
              <span className="font-black text-brand">{threshold}% 이상 · {eligibleCount}명</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={threshold}
              onChange={e => applyThreshold(Number(e.target.value))}
              className="w-full accent-brand cursor-pointer" />
            <p className="text-xs font-medium text-sand-400">
              기준을 옮기면 해당 출석률 이상 부원이 자동 선택됩니다. 아래에서 개별 가감할 수 있어요.
            </p>
          </div>

          {/* 대상 명단 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-sm text-ink">발급 대상</label>
              <span className="text-xs font-bold text-sand-500">{selected.size}명 선택됨</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-sand-400" /></div>
            ) : cands.length === 0 ? (
              <div className="border border-sand-200 rounded-card bg-sand-50 p-4 text-sm font-medium text-sand-500">
                계정을 보유한 활동중·수료 부원이 없습니다.
              </div>
            ) : (
              <div className="border border-sand-200 rounded-card divide-y divide-sand-200 max-h-64 overflow-y-auto">
                {cands.map(c => (
                  <button key={c.id} type="button" onClick={() => toggle(c.id)}
                    className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-sand-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center ${
                        selected.has(c.id) ? 'bg-brand border-brand text-white' : 'bg-white border-sand-300'}`}>
                        {selected.has(c.id) && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="font-black text-sm text-ink">{c.name}</span>
                        <span className="font-bold text-xs text-sand-400 ml-2">
                          {[c.generation, c.position].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </span>
                    </div>
                    <span className={`shrink-0 font-black text-sm ${c.rate != null && c.rate >= threshold ? 'text-brand' : 'text-sand-400'}`}>
                      {c.rate != null ? `${c.rate}%` : '출결 없음'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        </div>

        <div className="p-6 border-t border-sand-200 bg-sand-50 rounded-b-card flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 border border-sand-300 rounded-ctl font-bold bg-white hover:bg-sand-50 text-sm">취소</button>
          <button onClick={issue} disabled={issuing || selected.size === 0}
            className="px-6 py-2.5 rounded-ctl bg-brand text-white font-black hover:-translate-y-px transition-all flex items-center gap-2 text-sm disabled:opacity-40 shadow-btn">
            {issuing ? <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <Award className="w-4 h-4" strokeWidth={2.5} />}
            {selected.size}명에게 발급
          </button>
        </div>
      </div>
    </div>
  );
}
