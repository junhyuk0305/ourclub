import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Loader, ArrowRight, Award, LogOut, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDate } from '../../../lib/format';

// ──────────────────────────────────────────
// 참여 이력 탭 — 거쳐온 모든 동아리(활동중·수료·탈퇴 포함)
// ──────────────────────────────────────────
interface MembershipRow {
  id: string;
  club_id: string;
  role: string;
  status: string;
  generation: string | null;
  position: string | null;
  role_function: string | null;
  joined_at: string;
  clubs: { name: string; slug: string | null } | null;
}

const statusBadge: Record<string, string> = {
  '활동중':   'bg-ok-bg text-ok-fg',
  '수료':     'bg-info-bg text-info-fg',
  '탈퇴':     'bg-off-bg text-off-fg',
  '활동정지': 'bg-warn-bg text-warn-fg',
};

export default function MembershipHistorySection() {
  const { user } = useAuth();
  const [rows, setRows] = useState<MembershipRow[]>([]);
  const [fetching, setFetching] = useState(true);
  // 동아리별 보기 필터 (거쳐온 동아리 2개 이상일 때만 노출)
  const [selectedClub, setSelectedClub] = useState<string>('all');

  // 동아리 단위 탈퇴 확인 모달
  const [leaving, setLeaving] = useState<MembershipRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('club_members')
      .select('id, club_id, role, status, generation, position, role_function, joined_at, clubs ( name, slug )')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .then(({ data }) => { setRows((data ?? []) as any); setFetching(false); });
  }, [user]);

  const openLeave = (m: MembershipRow) => { setLeaveError(''); setLeaving(m); };

  const confirmLeave = async () => {
    if (!leaving) return;
    setBusy(true);
    setLeaveError('');
    // club_id 가 행에 없으므로 leave_club 은 club 단위로 본인 활동중 멤버십을 탈퇴 처리.
    // 마지막 운영진이면 prevent_last_admin_removal 트리거가 차단 → 메시지를 그대로 노출.
    const { error } = await supabase.rpc('leave_club', { p_club_id: leaving.club_id });
    setBusy(false);
    if (error) { setLeaveError(error.message || '동아리 탈퇴에 실패했습니다.'); return; }
    setRows(prev => prev.map(r => r.id === leaving.id ? { ...r, status: '탈퇴' } : r));
    setLeaving(null);
  };

  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-8">
      <h3 className="text-2xl font-black text-ink mb-6 flex items-center gap-2">
        <History className="w-6 h-6 text-brand" strokeWidth={2.5} /> 참여 이력
      </h3>
      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-sand-400" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-sand-500 font-bold border border-dashed border-sand-300 rounded-card flex flex-col items-center gap-4">
          <p>아직 가입한 동아리가 없습니다.</p>
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 px-6 py-2.5 btn-grad text-white rounded-ctl font-bold text-sm shadow-btn hover:-translate-y-0.5 transition-all"
          >
            동아리 탐색하러 가기 <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(() => {
            const clubs = Array.from(new Map(rows.map(r => [r.club_id, r.clubs?.name ?? '—'])).entries());
            if (clubs.length <= 1) return null;
            return (
              <div className="flex flex-wrap gap-2 mb-2">
                {[['all', '전체'] as [string, string], ...clubs].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedClub(id)}
                    className={`px-4 py-2 text-sm font-bold rounded-ctl transition-colors ${
                      selectedClub === id
                        ? 'btn-grad text-white shadow-btn'
                        : 'bg-white text-sand-600 border border-sand-200 hover:bg-sand-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}
          {(selectedClub === 'all' ? rows : rows.filter(r => r.club_id === selectedClub)).map(m => {
            const club = m.clubs;
            const meta = [m.generation, m.position, m.role_function].filter(Boolean).join(' · ');
            const body = (
              <>
                <div className="text-xs font-bold text-sand-400 mb-1">
                  {formatDate(m.joined_at)} 가입
                </div>
                <div className="font-black text-base text-ink truncate flex items-center gap-1.5">
                  {club?.name ?? '—'}
                  {m.role === '운영진' && <Award className="w-4 h-4 shrink-0 text-brand" strokeWidth={2.5} />}
                </div>
                {meta && (
                  <div className="font-bold text-sm text-sand-500 truncate mt-0.5">{meta}</div>
                )}
              </>
            );
            return (
              <div key={m.id} className="p-5 bg-white border border-sand-200 rounded-card flex items-center justify-between gap-4 hover:bg-sand-50 transition-colors">
                {club?.slug ? (
                  <Link to={`/clubs/${club.slug}`} className="min-w-0 group">{body}</Link>
                ) : (
                  <div className="min-w-0">{body}</div>
                )}
                <div className="shrink-0 flex items-center gap-3">
                  {m.status === '활동중' && (
                    <button
                      onClick={() => openLeave(m)}
                      className="flex items-center gap-1 text-xs font-bold text-sand-400 hover:text-red-600 transition-colors"
                      title="이 동아리에서 나가기"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} /> 나가기
                    </button>
                  )}
                  <span className={`px-3 py-1.5 rounded-ctl font-bold text-xs ${statusBadge[m.status] ?? 'bg-off-bg text-off-fg'}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leaving && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-sand-200 rounded-card w-full max-w-md shadow-soft-lg overflow-hidden">
            <div className="p-5 btn-grad text-white flex justify-between items-center">
              <h4 className="text-lg font-black flex items-center gap-2">
                <LogOut className="w-5 h-5" strokeWidth={2.5} /> 동아리 나가기
              </h4>
              <button onClick={() => setLeaving(null)} disabled={busy} className="opacity-80 hover:opacity-100 transition-opacity"><X className="w-5 h-5" strokeWidth={2.5} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="font-bold text-sm text-sand-600 leading-relaxed">
                <strong className="text-ink">{leaving.clubs?.name ?? '이 동아리'}</strong>에서 나갑니다.
                활동 상태가 <span className="font-black text-ink">'탈퇴'</span>로 바뀌며, 워크스페이스·명단에서 제외돼요.
                계정과 다른 동아리 활동은 그대로 유지됩니다.
              </p>
              {leaving.role === '운영진' && (
                <div className="flex gap-2 items-start bg-warn-bg rounded-ctl p-3 text-xs font-bold text-warn-fg">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>운영진이시네요. 남은 운영진이 없으면 나갈 수 없어요. 먼저 다른 구성원에게 운영 권한을 양도하세요.</span>
                </div>
              )}
              {leaveError && (
                <div className="bg-bad-bg rounded-ctl p-3 text-xs font-bold text-bad-fg">{leaveError}</div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setLeaving(null)} disabled={busy} className="px-5 py-2.5 bg-white text-ink border border-sand-300 rounded-ctl font-bold text-sm hover:bg-sand-50 disabled:opacity-40">
                  취소
                </button>
                <button onClick={confirmLeave} disabled={busy} className="px-5 py-2.5 bg-red-500 text-white rounded-ctl font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center gap-2">
                  {busy ? <Loader className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" strokeWidth={2.5} />} 나가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
