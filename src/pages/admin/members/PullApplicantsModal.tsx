import { useEffect, useState } from 'react';
import { X, Loader, UserCheck, Download } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { fetchAll, fetchAllIn } from '../../../lib/fetchAll';

interface PassedApplicant {
  userId: string;
  name: string;
  email: string | null;
  recruitmentTitle: string;
  alreadyMember: boolean;
}

export function PullApplicantsModal({
  clubId, generations, defaultGeneration, onClose, onSuccess,
}: {
  clubId: string;
  generations: string[];
  defaultGeneration: string;
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState<PassedApplicant[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generation, setGeneration] = useState(defaultGeneration);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true);
    const [{ data: recs }, { data: existing }] = await Promise.all([
      supabase.from('recruitments').select('id, title, pipeline_stages').eq('club_id', clubId),
      fetchAll<{ user_id: string | null }>((from, to) =>
        supabase.from('club_members').select('user_id').eq('club_id', clubId).range(from, to)),
    ]);
    const recList = (recs ?? []) as { id: string; title: string; pipeline_stages: string[] | null }[];
    const memberUserIds = new Set(
      ((existing ?? []) as { user_id: string | null }[]).map(m => m.user_id).filter(Boolean) as string[]
    );
    if (recList.length === 0) { setApplicants([]); setLoading(false); return; }

    const finalStageOf: Record<string, string | null> = {};
    const titleOf: Record<string, string> = {};
    recList.forEach(r => {
      const st = Array.isArray(r.pipeline_stages) ? r.pipeline_stages : [];
      finalStageOf[r.id] = st.length ? st[st.length - 1] : null;
      titleOf[r.id] = r.title;
    });

    const { data: apps } = await fetchAllIn(
      recList.map(r => r.id),
      (chunk, from, to) => supabase
        .from('recruitment_applications')
        .select('id, user_id, recruitment_id, status, submitted_at, profiles(name, email)')
        .in('recruitment_id', chunk)
        .range(from, to),
    );

    const passed = ((apps ?? []) as unknown as {
      user_id: string | null; recruitment_id: string; status: string | null;
      submitted_at: string | null; profiles: { name: string; email: string } | null;
    }[])
      .filter(a => a.user_id && a.status && a.status === finalStageOf[a.recruitment_id])
      .sort((a, b) => (b.submitted_at ?? '').localeCompare(a.submitted_at ?? ''));

    // 한 사람이 여러 공고 합격 시 1회만 (가장 최근 지원 기준)
    const seen = new Set<string>();
    const list: PassedApplicant[] = [];
    passed.forEach(a => {
      const uid = a.user_id as string;
      if (seen.has(uid)) return;
      seen.add(uid);
      list.push({
        userId: uid,
        name: a.profiles?.name ?? '—',
        email: a.profiles?.email ?? null,
        recruitmentTitle: titleOf[a.recruitment_id] ?? '',
        alreadyMember: memberUserIds.has(uid),
      });
    });

    setApplicants(list);
    // 기본 선택: 아직 멤버가 아닌 합격자 전체
    setSelected(new Set(list.filter(x => !x.alreadyMember).map(x => x.userId)));
    setLoading(false);
  };

  const toggle = (userId: string) => setSelected(prev => {
    const n = new Set(prev);
    if (n.has(userId)) n.delete(userId); else n.add(userId);
    return n;
  });

  const allChecked = applicants.length > 0 && applicants.every(a => selected.has(a.userId));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(applicants.map(a => a.userId)));
  };

  const submit = async () => {
    if (selected.size === 0) return;
    setSaving(true); setError('');
    const gen = generation.trim() || null;
    const chosen = applicants.filter(a => selected.has(a.userId));
    // 개별 insert/update N개 → 단일 RPC(트랜잭션). 기존 멤버는 활동중/기수 갱신,
    // 신규는 부원 추가를 원자적으로 처리하고, 동시 끌어오기에도 중복 멤버가 없다.
    const { error } = await supabase.rpc('pull_applicants_to_members', {
      p_club_id: clubId,
      p_user_ids: chosen.map(a => a.userId),
      p_generation: gen,
    });
    setSaving(false);
    if (error) { setError('명단 추가에 실패했습니다. 다시 시도해주세요.'); return; }
    onSuccess(chosen.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-lg mx-4 p-7 flex flex-col gap-5 max-h-[88vh]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-ink flex items-center gap-2">
              <Download className="w-5 h-5 text-brand" strokeWidth={2.5} /> 합격자 끌어오기
            </h2>
            <p className="text-xs font-medium text-sand-500 mt-1">최종 합격한 지원자를 명단에 추가합니다. 기수를 지정하세요.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-sand-500" strokeWidth={2.5} /></button>
        </div>

        {error && (
          <div className="bg-bad-bg rounded-ctl px-3 py-2 text-bad-fg font-bold text-sm">{error}</div>
        )}

        {/* 기수 지정 */}
        <div className="flex items-center gap-2">
          <label className="font-bold text-sm text-ink">추가할 기수</label>
          <select
            value={generation}
            onChange={e => setGeneration(e.target.value)}
            className="field px-3 py-1.5 border border-sand-300 rounded-ctl font-medium text-sm bg-white cursor-pointer"
          >
            <option value="">미지정</option>
            {generations.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader className="w-7 h-7 animate-spin text-brand" strokeWidth={2.5} /></div>
        ) : applicants.length === 0 ? (
          <div className="py-12 text-center font-medium text-sand-400 border border-dashed border-sand-300 rounded-card">
            최종 합격 단계의 지원자가 없습니다.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button onClick={toggleAll} className="text-xs font-bold text-brand underline hover:no-underline">
                {allChecked ? '전체 해제' : '전체 선택'}
              </button>
              <span className="text-xs font-medium text-sand-500">선택 {selected.size} / {applicants.length}명</span>
            </div>

            <div className="border border-sand-200 rounded-card overflow-y-auto flex-1 min-h-0">
              {applicants.map(a => {
                const checked = selected.has(a.userId);
                return (
                  <label
                    key={a.userId}
                    className={`flex items-center gap-3 px-3 py-2.5 border-b border-sand-200 last:border-b-0 cursor-pointer hover:bg-sand-50 ${checked ? 'bg-brand-tint' : ''}`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(a.userId)} className="w-4 h-4 accent-brand" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">{a.name}</span>
                        {a.alreadyMember && (
                          <span className="px-1.5 py-0.5 bg-info-bg text-info-fg rounded-md font-bold text-[10px]">이미 멤버</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-sand-400 truncate">{a.email} · {a.recruitmentTitle}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] font-medium text-sand-400">
              ※ '이미 멤버'는 선택 시 활동중으로 전환되고 지정 기수로 갱신됩니다(휴식→복귀·기수 재배정).
            </p>
          </>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-sand-300 text-ink font-bold text-sm rounded-ctl hover:bg-sand-50">취소</button>
          <button
            onClick={submit}
            disabled={saving || selected.size === 0}
            className="flex-1 py-2.5 btn-grad text-white font-bold text-sm rounded-ctl shadow-btn hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <UserCheck className="w-4 h-4" strokeWidth={2.5} />}
            {selected.size}명 명단에 추가
          </button>
        </div>
      </div>
    </div>
  );
}
