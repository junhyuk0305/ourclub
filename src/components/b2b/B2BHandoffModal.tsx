import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  X, Loader, Users, Crown, FileText, Upload, CheckCircle2,
  Phone, ShieldCheck, Rocket, Flag, AlertCircle, ExternalLink,
  Wallet, Coins, AlertTriangle, Star, MessageSquare,
  ListChecks, Plus, Trash2, Calendar,
} from 'lucide-react';

// 매칭완료 이후 핸드오프(M1) — 기업/동아리 양측이 같은 데이터를 공유하는 단일 모달.
//  · 동아리(club): PL·팀원 지정(게이트) + 계약서 업로드/체결
//  · 기업(corp): 팀·PL 연락처 확인 + 담당자 연락처 등록 + 킥오프/완료 상태 전이
// 금지어 회피: '프로젝트/도급/협업/매칭' 만 사용.

export interface HandoffApp {
  applicationId: string;
  projectId: string;
  clubId: string;
  projectTitle: string;
  clubName: string;
  projectStatus: string;       // b2b_projects.status
}

interface TeamMember {
  id: string;
  user_id: string | null;
  role: 'PL' | '팀원';
  share_pct: number | null;
  member_name: string | null;
  member_email: string | null;
  accepted_at: string | null;
}

interface Contract {
  id: string;
  doc_path: string | null;
  status: '미체결' | '체결완료';
  corp_contact_name: string | null;
  corp_contact_email: string | null;
}

interface Settlement {
  id: string;
  amount: number | null;
  fee_pct: number;
  fee_amount: number | null;
  due_days: number;
  paid_to_club_at: string | null;
  fee_paid_at: string | null;
  status: '대기' | '대금수령' | '수수료납부완료' | '미납';
}

interface Review {
  id: string;
  author_side: '기업' | '동아리';
  rating: number;
  comment: string | null;
}

interface Milestone {
  id: string;
  title: string;
  due_date: string | null;
  status: '예정' | '진행중' | '제출' | '완료';
  deliverable_path: string | null;
  sort: number;
}

interface ClubMemberOption {
  user_id: string;
  name: string;
  email: string | null;
}

interface Props {
  side: 'corp' | 'club';
  app: HandoffApp;
  onClose: () => void;
  onProjectStatusChange?: (status: string) => void;
}

const accentBtn = (_side: 'corp' | 'club') =>
  'btn-grad text-white hover:opacity-90';

const PROJECT_BADGE: Record<string, string> = {
  '모집중':  'bg-off-bg text-off-fg',
  '모집마감': 'bg-off-bg text-off-fg',
  '진행중':  'bg-info-bg text-info-fg',
  '완료':    'bg-ok-bg text-ok-fg',
  '중단':    'bg-bad-bg text-bad-fg',
};

const SETTLEMENT_BADGE: Record<string, string> = {
  '대기':        'bg-off-bg text-off-fg',
  '대금수령':     'bg-info-bg text-info-fg',
  '수수료납부완료': 'bg-ok-bg text-ok-fg',
  '미납':        'bg-bad-bg text-bad-fg',
};

const MILESTONE_BADGE: Record<string, string> = {
  '예정':  'bg-off-bg text-off-fg',
  '진행중': 'bg-info-bg text-info-fg',
  '제출':  'bg-warn-bg text-warn-fg',
  '완료':  'bg-ok-bg text-ok-fg',
};

export default function B2BHandoffModal({ side, app, onClose, onProjectStatusChange }: Props) {
  const [loading, setLoading]   = useState(true);
  const [team, setTeam]         = useState<TeamMember[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [projectBudget, setProjectBudget] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingInput, setRatingInput] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMsTitle, setNewMsTitle] = useState('');
  const [newMsDue, setNewMsDue] = useState('');
  const [projectStatus, setProjectStatus] = useState(app.projectStatus);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

  // 동아리 측 — PL·팀원 지정 폼 상태
  const [members, setMembers]   = useState<ClubMemberOption[]>([]);
  const [plId, setPlId]         = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [shares, setShares]     = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState(false);

  // 기업 측 — 담당자 연락처 폼 상태
  const [corpName, setCorpName]   = useState('');
  const [corpEmail, setCorpEmail] = useState('');

  // 동아리 제안서 동의 시각(b2b_applications.terms_agreed_at) — 증거 표시용
  const [appConsentAt, setAppConsentAt] = useState<string | null>(null);

  const hasTeam = team.length > 0;
  const pl = useMemo(() => team.find(t => t.role === 'PL') ?? null, [team]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.applicationId]);

  const load = async () => {
    setLoading(true);
    const [{ data: teamData }, { data: contractData }, { data: settlementData }, { data: projectData }, { data: reviewData }, { data: milestoneData }] = await Promise.all([
      supabase
        .from('b2b_project_team')
        .select('id, user_id, role, share_pct, member_name, member_email, accepted_at')
        .eq('application_id', app.applicationId)
        .order('role', { ascending: true }),
      supabase
        .from('b2b_contracts')
        .select('id, doc_path, status, corp_contact_name, corp_contact_email')
        .eq('application_id', app.applicationId)
        .maybeSingle(),
      supabase
        .from('b2b_settlements')
        .select('id, amount, fee_pct, fee_amount, due_days, paid_to_club_at, fee_paid_at, status')
        .eq('application_id', app.applicationId)
        .maybeSingle(),
      supabase
        .from('b2b_projects')
        .select('budget')
        .eq('id', app.projectId)
        .maybeSingle(),
      supabase
        .from('b2b_reviews')
        .select('id, author_side, rating, comment')
        .eq('application_id', app.applicationId),
      supabase
        .from('b2b_milestones')
        .select('id, title, due_date, status, deliverable_path, sort')
        .eq('application_id', app.applicationId)
        .order('sort', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    const t = (teamData as TeamMember[]) ?? [];
    setTeam(t);
    setContract((contractData as Contract) ?? null);
    setCorpName((contractData as Contract)?.corp_contact_name ?? '');
    setCorpEmail((contractData as Contract)?.corp_contact_email ?? '');
    setSettlement((settlementData as Settlement) ?? null);
    const budget = (projectData as { budget: number | null } | null)?.budget ?? null;
    setProjectBudget(budget);
    setAmountInput((settlementData as Settlement)?.amount?.toString() ?? budget?.toString() ?? '');

    const rv = (reviewData as Review[]) ?? [];
    setReviews(rv);
    const mine = rv.find(r => r.author_side === (side === 'corp' ? '기업' : '동아리'));
    setRatingInput(mine?.rating ?? 0);
    setCommentInput(mine?.comment ?? '');

    setMilestones((milestoneData as Milestone[]) ?? []);

    // 동아리 제안서 동의 시각 — 양측 증거 표시용
    const { data: appRow } = await supabase
      .from('b2b_applications')
      .select('terms_agreed_at')
      .eq('id', app.applicationId)
      .maybeSingle();
    setAppConsentAt((appRow as { terms_agreed_at: string | null } | null)?.terms_agreed_at ?? null);

    // 동아리 측이고 아직 팀 미지정이면 멤버 후보 로드
    if (side === 'club' && t.length === 0) {
      const { data: cm } = await supabase
        .from('club_members')
        .select('user_id, display_name, status, profiles(name, email)')
        .eq('club_id', app.clubId)
        .eq('status', '활동중')
        .not('user_id', 'is', null);
      const opts: ClubMemberOption[] = ((cm as any[]) ?? []).map(m => ({
        user_id: m.user_id as string,
        name: (m.profiles?.name as string) ?? (m.display_name as string) ?? '—',
        email: (m.profiles?.email as string) ?? null,
      }));
      setMembers(opts);
    }
    setLoading(false);
  };

  // ── 동아리: PL·팀원 저장(게이트) ──────────────────────────────
  const saveTeam = async () => {
    if (!plId) { setError('PL(프로젝트 리드)을 1명 지정해야 합니다.'); return; }
    if (!accepted) { setError('PL 책임 수락에 동의해야 합니다.'); return; }
    setBusy(true); setError('');

    const find = (uid: string) => members.find(m => m.user_id === uid);
    const num = (uid: string) => {
      const v = shares[uid]?.trim();
      return v ? Number(v) : null;
    };
    const rows = [
      {
        application_id: app.applicationId, user_id: plId, role: 'PL',
        share_pct: num(plId), member_name: find(plId)?.name ?? null,
        member_email: find(plId)?.email ?? null, accepted_at: new Date().toISOString(),
      },
      ...memberIds.filter(id => id !== plId).map(id => ({
        application_id: app.applicationId, user_id: id, role: '팀원',
        share_pct: num(id), member_name: find(id)?.name ?? null,
        member_email: find(id)?.email ?? null, accepted_at: null,
      })),
    ];

    const { error: insErr } = await supabase.from('b2b_project_team').insert(rows);
    if (insErr) { setBusy(false); setError(insErr.message); return; }
    // 계약 행이 없으면 생성(공유 핸드오프 레코드)
    if (!contract) {
      await supabase.from('b2b_contracts').insert({ application_id: app.applicationId });
    }
    setBusy(false);
    await load();
  };

  // ── 동아리: 계약서 업로드 ─────────────────────────────────────
  const uploadContract = async (file: File) => {
    setBusy(true); setError('');
    const ext = file.name.split('.').pop() ?? 'pdf';
    const path = `${app.applicationId}/contract_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('b2b-contracts').upload(path, file, { upsert: false });
    if (upErr) { setBusy(false); setError(upErr.message); return; }

    if (contract) {
      await supabase.from('b2b_contracts').update({ doc_path: path, updated_at: new Date().toISOString() }).eq('id', contract.id);
    } else {
      await supabase.from('b2b_contracts').insert({ application_id: app.applicationId, doc_path: path });
    }
    setBusy(false);
    await load();
  };

  // ── 동아리: 계약 체결완료 처리 ────────────────────────────────
  const markSigned = async () => {
    if (!contract) return;
    setBusy(true); setError('');
    const { error: e } = await supabase
      .from('b2b_contracts')
      .update({ status: '체결완료', signed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', contract.id);
    setBusy(false);
    if (e) { setError(e.message); return; }
    await load();
  };

  // ── 기업: 담당자 연락처 저장 ──────────────────────────────────
  const saveCorpContact = async () => {
    setBusy(true); setError('');
    const payload = { corp_contact_name: corpName.trim() || null, corp_contact_email: corpEmail.trim() || null, updated_at: new Date().toISOString() };
    let e;
    if (contract) {
      ({ error: e } = await supabase.from('b2b_contracts').update(payload).eq('id', contract.id));
    } else {
      ({ error: e } = await supabase.from('b2b_contracts').insert({ application_id: app.applicationId, ...payload }));
    }
    setBusy(false);
    if (e) { setError(e.message); return; }
    await load();
  };

  // ── 기업: 프로젝트 상태 전이(킥오프/완료) ─────────────────────
  const setStatus = async (status: string) => {
    setBusy(true); setError('');
    const { error: e } = await supabase.from('b2b_projects').update({ status }).eq('id', app.projectId);
    setBusy(false);
    if (e) { setError(e.message); return; }
    setProjectStatus(status);
    onProjectStatusChange?.(status);
  };

  // ── 기업: 동아리에 대금 지급 완료 표시(정산 시작) ────────────
  const markPaidToClub = async () => {
    const amount = amountInput.trim() ? Number(amountInput) : null;
    if (!amount || amount <= 0) { setError('거래금액을 입력해야 정산을 시작할 수 있습니다.'); return; }
    setBusy(true); setError('');
    const feePct = settlement?.fee_pct ?? 10;
    const payload = {
      amount,
      fee_pct: feePct,
      fee_amount: Math.round(amount * feePct / 100),
      paid_to_club_at: new Date().toISOString(),
      status: '대금수령' as const,
      updated_at: new Date().toISOString(),
    };
    let e;
    if (settlement) {
      ({ error: e } = await supabase.from('b2b_settlements').update(payload).eq('id', settlement.id));
    } else {
      ({ error: e } = await supabase.from('b2b_settlements').insert({ application_id: app.applicationId, ...payload }));
    }
    setBusy(false);
    if (e) { setError(e.message); return; }
    await load();
  };

  // ── 동아리: OURCLUB 수수료 납부 완료 표시 ─────────────────────
  const markFeePaid = async () => {
    if (!settlement) return;
    setBusy(true); setError('');
    const { error: e } = await supabase
      .from('b2b_settlements')
      .update({ fee_paid_at: new Date().toISOString(), status: '수수료납부완료', updated_at: new Date().toISOString() })
      .eq('id', settlement.id);
    setBusy(false);
    if (e) { setError(e.message); return; }
    await load();
  };

  // 미납 여부(대금 수령 후 납부기한 경과 + 미납 상태) — UI 경고용
  const feeOverdue = useMemo(() => {
    if (!settlement || settlement.fee_paid_at) return false;
    if (settlement.status === '미납') return true;
    if (settlement.status === '대금수령' && settlement.paid_to_club_at) {
      const due = new Date(settlement.paid_to_club_at).getTime() + settlement.due_days * 86400000;
      return Date.now() > due;
    }
    return false;
  }, [settlement]);

  // ── 양방향 리뷰(완료 후) ──────────────────────────────────────
  const mySide: '기업' | '동아리' = side === 'corp' ? '기업' : '동아리';
  const myReview = useMemo(() => reviews.find(r => r.author_side === mySide) ?? null, [reviews, mySide]);
  const otherReview = useMemo(() => reviews.find(r => r.author_side !== mySide) ?? null, [reviews, mySide]);

  const submitReview = async () => {
    if (ratingInput < 1) { setError('평점을 선택해 주세요.'); return; }
    setBusy(true); setError('');
    const payload = { rating: ratingInput, comment: commentInput.trim() || null, updated_at: new Date().toISOString() };
    let e;
    if (myReview) {
      ({ error: e } = await supabase.from('b2b_reviews').update(payload).eq('id', myReview.id));
    } else {
      ({ error: e } = await supabase.from('b2b_reviews').insert({ application_id: app.applicationId, author_side: mySide, ...payload }));
    }
    setBusy(false);
    if (e) { setError(e.message); return; }
    await load();
  };

  // ── 마일스톤(M2): 진행 추적 + 산출물 제출·검수 ───────────────
  const addMilestone = async () => {
    if (!newMsTitle.trim()) { setError('마일스톤 제목을 입력하세요.'); return; }
    setBusy(true); setError('');
    const { error: e } = await supabase.from('b2b_milestones').insert({
      application_id: app.applicationId,
      title: newMsTitle.trim(),
      due_date: newMsDue || null,
      sort: milestones.length,
    });
    setBusy(false);
    if (e) { setError(e.message); return; }
    setNewMsTitle(''); setNewMsDue('');
    await load();
  };

  const setMilestoneStatus = async (id: string, status: Milestone['status']) => {
    setBusy(true); setError('');
    const { error: e } = await supabase
      .from('b2b_milestones')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    setBusy(false);
    if (e) { setError(e.message); return; }
    await load();
  };

  const deleteMilestone = async (id: string) => {
    setBusy(true); setError('');
    const { error: e } = await supabase.from('b2b_milestones').delete().eq('id', id);
    setBusy(false);
    if (e) { setError(e.message); return; }
    await load();
  };

  const uploadDeliverable = async (ms: Milestone, file: File) => {
    setBusy(true); setError('');
    const ext = file.name.split('.').pop() ?? 'zip';
    const path = `${app.applicationId}/${ms.id}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('b2b-deliverables').upload(path, file, { upsert: false });
    if (upErr) { setBusy(false); setError(upErr.message); return; }
    const { error: e } = await supabase
      .from('b2b_milestones')
      .update({ deliverable_path: path, status: '제출', updated_at: new Date().toISOString() })
      .eq('id', ms.id);
    setBusy(false);
    if (e) { setError(e.message); return; }
    await load();
  };

  const openDeliverable = async (path: string) => {
    const { data } = await supabase.storage.from('b2b-deliverables').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
  };

  const openContract = async () => {
    if (!contract?.doc_path) return;
    const { data } = await supabase.storage.from('b2b-contracts').createSignedUrl(contract.doc_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
  };

  const toggleMember = (uid: string) =>
    setMemberIds(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-soft-lg w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 btn-grad text-white">
          <div>
            <p className="text-xs font-black text-white/70 uppercase mb-1">프로젝트 진행</p>
            <h3 className="font-black text-xl leading-tight">{app.projectTitle}</h3>
            <p className="text-sm font-bold text-white/80 mt-0.5">매칭 동아리 · {app.clubName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-ctl hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader className="w-7 h-7 animate-spin text-sand-400" /></div>
          ) : (
            <>
              {/* 진행 상태 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-sand-400 uppercase">진행 상태</span>
                <span className={`px-3 py-1 rounded-ctl font-black text-sm ${PROJECT_BADGE[projectStatus] ?? PROJECT_BADGE['모집중']}`}>
                  {projectStatus}
                </span>
              </div>

              {/* ── 담당 팀 (PL + 팀원) ── */}
              <section>
                <h4 className="flex items-center gap-2 font-black text-sm uppercase text-sand-500 mb-3">
                  <Users className="w-4 h-4" /> 담당 팀 (조합)
                </h4>

                {appConsentAt && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-ok-fg mb-3 -mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    동아리가 거래약관·중개수수료·정보제공에 동의함 ({new Date(appConsentAt).toLocaleDateString('ko-KR')})
                  </p>
                )}

                {hasTeam ? (
                  <div className="flex flex-col gap-2">
                    {team.map(t => (
                      <div key={t.id} className="flex items-center justify-between border border-sand-200 bg-sand-50 rounded-ctl px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {t.role === 'PL'
                            ? <Crown className="w-4 h-4 text-brand shrink-0" />
                            : <Users className="w-4 h-4 text-sand-400 shrink-0" />}
                          <div className="min-w-0">
                            <p className="font-black text-sm truncate">
                              {t.member_name ?? '—'}
                              <span className="ml-2 text-xs font-bold text-sand-400">{t.role}</span>
                            </p>
                            {/* PL 연락처는 기업 측에만 노출(단일창구) */}
                            {side === 'corp' && t.role === 'PL' && t.member_email && (
                              <p className="text-xs font-bold text-brand truncate">{t.member_email}</p>
                            )}
                          </div>
                        </div>
                        {t.share_pct != null && (
                          <span className="text-xs font-black text-sand-500 shrink-0">{t.share_pct}%</span>
                        )}
                      </div>
                    ))}
                    {side === 'corp' && pl && (
                      <p className="flex items-center gap-1.5 text-xs font-bold text-sand-500 mt-1">
                        <Phone className="w-3.5 h-3.5" /> 모든 소통은 PL <b className="text-ink">{pl.member_name}</b> 단일 창구로 진행됩니다.
                      </p>
                    )}
                  </div>
                ) : side === 'club' ? (
                  /* 동아리: PL·팀원 지정 게이트 */
                  <div className="border border-dashed border-sand-300 rounded-card p-4 flex flex-col gap-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-brand">
                      <AlertCircle className="w-4 h-4 shrink-0" /> PL·팀원을 지정해야 계약·진행 단계로 넘어갑니다.
                    </p>
                    {members.length === 0 ? (
                      <p className="text-sm font-bold text-sand-400">지정 가능한 활동중 구성원(계정 보유)이 없습니다.</p>
                    ) : (
                      <>
                        <div>
                          <label className="block font-black text-xs mb-1">PL (프로젝트 리드) <span className="text-bad-fg">*</span></label>
                          <select
                            value={plId}
                            onChange={e => setPlId(e.target.value)}
                            className="field w-full p-2.5 rounded-ctl font-bold cursor-pointer text-sm"
                          >
                            <option value="">PL을 선택하세요</option>
                            {members.map(m => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block font-black text-xs mb-1">팀원 (선택)</label>
                          <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                            {members.filter(m => m.user_id !== plId).map(m => (
                              <label key={m.user_id} className="flex items-center gap-2.5 px-2 py-1.5 border border-sand-200 rounded-ctl cursor-pointer hover:bg-sand-50">
                                <input type="checkbox" checked={memberIds.includes(m.user_id)} onChange={() => toggleMember(m.user_id)} />
                                <span className="font-bold text-sm flex-1">{m.name}</span>
                                {memberIds.includes(m.user_id) && (
                                  <input
                                    type="number" placeholder="배분%"
                                    value={shares[m.user_id] ?? ''}
                                    onChange={e => setShares(s => ({ ...s, [m.user_id]: e.target.value }))}
                                    className="field w-20 p-1 rounded-ctl text-xs font-bold"
                                    onClick={e => e.stopPropagation()}
                                  />
                                )}
                              </label>
                            ))}
                          </div>
                          {plId && (
                            <div className="flex items-center gap-2 mt-2 px-2">
                              <span className="text-xs font-bold text-sand-500">PL 배분%</span>
                              <input
                                type="number" placeholder="배분%"
                                value={shares[plId] ?? ''}
                                onChange={e => setShares(s => ({ ...s, [plId]: e.target.value }))}
                                className="field w-20 p-1 rounded-ctl text-xs font-bold"
                              />
                            </div>
                          )}
                        </div>
                        <label className="flex items-start gap-2 text-sm font-bold bg-sand-50 border border-sand-200 rounded-ctl p-3 cursor-pointer">
                          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5" />
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-sand-500 shrink-0" />
                            PL이 프로젝트팀(민법상 조합)의 대표 창구로서 책임을 수락합니다. 팀의 손해배상책임은 계약대금 한도·고의/중과실로 제한됩니다.
                          </span>
                        </label>
                        <button
                          onClick={saveTeam}
                          disabled={busy}
                          className={`py-2.5 rounded-ctl shadow-btn font-black text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 ${accentBtn(side)}`}
                        >
                          {busy ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          팀 확정하기
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-sand-400 border border-dashed border-sand-300 rounded-card p-4 text-center">
                    동아리가 아직 PL·팀원을 지정하지 않았습니다.
                  </p>
                )}
              </section>

              {/* ── 계약 ── */}
              <section>
                <h4 className="flex items-center gap-2 font-black text-sm uppercase text-sand-500 mb-3">
                  <FileText className="w-4 h-4" /> 도급 계약
                </h4>
                <div className="border border-sand-200 bg-sand-50 rounded-ctl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-ctl font-black text-xs ${contract?.status === '체결완료' ? 'bg-ok-bg text-ok-fg' : 'bg-off-bg text-off-fg'}`}>
                      {contract?.status ?? '미체결'}
                    </span>
                    {contract?.doc_path && (
                      <button onClick={openContract} className="flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" /> 계약서 보기
                      </button>
                    )}
                  </div>
                  {side === 'club' && (
                    <div className="flex items-center gap-2">
                      <label className={`px-3 py-1.5 border border-sand-300 rounded-ctl font-black text-xs cursor-pointer flex items-center gap-1 ${hasTeam ? 'bg-white hover:bg-sand-100' : 'opacity-40 pointer-events-none'}`}>
                        <Upload className="w-3.5 h-3.5" /> {contract?.doc_path ? '재업로드' : '업로드'}
                        <input
                          type="file" className="hidden"
                          accept=".pdf,.doc,.docx,.hwp,.png,.jpg,.jpeg"
                          disabled={!hasTeam || busy}
                          onChange={e => { const f = e.target.files?.[0]; if (f) uploadContract(f); e.target.value = ''; }}
                        />
                      </label>
                      {contract?.doc_path && contract.status !== '체결완료' && (
                        <button onClick={markSigned} disabled={busy} className="px-3 py-1.5 btn-grad text-white rounded-ctl font-black text-xs hover:opacity-90 disabled:opacity-50">
                          체결완료
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {side === 'club' && !hasTeam && (
                  <p className="text-xs font-bold text-sand-400 mt-1.5">PL·팀 확정 후 계약서를 업로드할 수 있습니다.</p>
                )}

                {side === 'club' && (
                  <div className="mt-3 border border-sand-200 bg-sand-50 rounded-ctl p-3 flex flex-col gap-2">
                    <p className="text-xs font-black text-sand-500">표준 양식 받기 (작성 시 참고)</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="/legal/standard-project-contract.md"
                        download="표준_프로젝트_용역계약서.md"
                        className="flex items-center gap-1 px-3 py-1.5 border border-sand-300 rounded-ctl bg-white font-bold text-xs hover:bg-sand-100"
                      >
                        <FileText className="w-3.5 h-3.5" /> 표준 용역계약서(도급)
                      </a>
                      <a
                        href="/legal/team-responsibility-agreement.md"
                        download="프로젝트_수행_및_책임_동의서.md"
                        className="flex items-center gap-1 px-3 py-1.5 border border-sand-300 rounded-ctl bg-white font-bold text-xs hover:bg-sand-100"
                      >
                        <FileText className="w-3.5 h-3.5" /> 팀 책임 동의서(내부)
                      </a>
                    </div>
                    <p className="text-[11px] font-bold text-sand-400 leading-relaxed">
                      ⚠️ 변호사 검토 전 <b>참고용 초안</b>입니다. 그대로 사용하지 말고 실제 거래에 맞게 보완·검토 후 사용하세요.
                      OURCLUB은 양식을 제공할 뿐 계약의 당사자가 아닙니다.
                    </p>
                  </div>
                )}
              </section>

              {/* ── 기업 담당자 연락처(단일창구) ── */}
              <section>
                <h4 className="flex items-center gap-2 font-black text-sm uppercase text-sand-500 mb-3">
                  <Phone className="w-4 h-4" /> 기업 담당자
                </h4>
                {side === 'corp' ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={corpName} onChange={e => setCorpName(e.target.value)} placeholder="담당자 이름"
                        className="field p-2.5 rounded-ctl font-bold text-sm" />
                      <input value={corpEmail} onChange={e => setCorpEmail(e.target.value)} placeholder="연락 이메일"
                        className="field p-2.5 rounded-ctl font-bold text-sm" />
                    </div>
                    <button onClick={saveCorpContact} disabled={busy}
                      className={`py-2 rounded-ctl shadow-btn font-black text-xs transition-opacity disabled:opacity-50 ${accentBtn(side)}`}>
                      연락처 저장
                    </button>
                  </div>
                ) : contract?.corp_contact_name || contract?.corp_contact_email ? (
                  <div className="border border-sand-200 bg-sand-50 rounded-ctl px-4 py-3">
                    <p className="font-black text-sm">{contract?.corp_contact_name ?? '—'}</p>
                    {contract?.corp_contact_email && <p className="text-xs font-bold text-brand">{contract.corp_contact_email}</p>}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-sand-400 border border-dashed border-sand-300 rounded-card p-4 text-center">
                    기업이 아직 담당자 연락처를 등록하지 않았습니다.
                  </p>
                )}
              </section>

              {/* ── 진행 (마일스톤 · 산출물, M2) ── */}
              {(projectStatus === '진행중' || projectStatus === '완료') && (
                <section>
                  <h4 className="flex items-center gap-2 font-black text-sm uppercase text-sand-500 mb-3">
                    <ListChecks className="w-4 h-4" /> 진행 · 산출물
                  </h4>

                  <div className="flex flex-col gap-2">
                    {milestones.length === 0 ? (
                      <p className="text-sm font-bold text-sand-400 border border-dashed border-sand-300 rounded-card p-4 text-center">
                        {side === 'club' ? '마일스톤을 추가해 진행 상황을 공유하세요.' : '동아리가 아직 마일스톤을 등록하지 않았습니다.'}
                      </p>
                    ) : (
                      milestones.map(ms => (
                        <div key={ms.id} className="border border-sand-200 bg-sand-50 rounded-ctl px-3 py-2.5 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-black text-sm">{ms.title}</p>
                              {ms.due_date && (
                                <p className="text-xs font-bold text-sand-400 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3" /> {new Date(ms.due_date).toLocaleDateString('ko-KR')} 까지
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-ctl font-black text-xs shrink-0 ${MILESTONE_BADGE[ms.status]}`}>
                              {ms.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {ms.deliverable_path && (
                              <button onClick={() => openDeliverable(ms.deliverable_path!)} className="flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                                <ExternalLink className="w-3.5 h-3.5" /> 산출물 보기
                              </button>
                            )}
                            {side === 'club' && ms.status === '예정' && (
                              <button onClick={() => setMilestoneStatus(ms.id, '진행중')} disabled={busy}
                                className="px-2.5 py-1 border border-sand-300 rounded-ctl bg-white font-black text-xs hover:bg-sand-100 disabled:opacity-50">
                                진행 시작
                              </button>
                            )}
                            {side === 'club' && (ms.status === '진행중' || ms.status === '제출') && (
                              <label className="px-2.5 py-1 border border-sand-300 rounded-ctl bg-white font-black text-xs cursor-pointer hover:bg-sand-100 flex items-center gap-1">
                                <Upload className="w-3.5 h-3.5" /> {ms.deliverable_path ? '산출물 재제출' : '산출물 제출'}
                                <input type="file" className="hidden" disabled={busy}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadDeliverable(ms, f); e.target.value = ''; }} />
                              </label>
                            )}
                            {side === 'corp' && ms.status === '제출' && (
                              <button onClick={() => setMilestoneStatus(ms.id, '완료')} disabled={busy}
                                className="px-2.5 py-1 btn-grad text-white rounded-ctl font-black text-xs hover:opacity-90 disabled:opacity-50">
                                검수 완료
                              </button>
                            )}
                            {side === 'club' && ms.status !== '완료' && (
                              <button onClick={() => deleteMilestone(ms.id)} disabled={busy}
                                className="ml-auto p-1 text-sand-400 hover:text-bad-fg disabled:opacity-50" title="삭제">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {side === 'club' && projectStatus === '진행중' && (
                    <div className="mt-2 flex gap-2">
                      <input value={newMsTitle} onChange={e => setNewMsTitle(e.target.value)} placeholder="새 마일스톤 제목"
                        className="field flex-1 min-w-0 p-2 rounded-ctl font-bold text-sm" />
                      <input type="date" value={newMsDue} onChange={e => setNewMsDue(e.target.value)}
                        className="field p-2 rounded-ctl font-bold text-sm" />
                      <button onClick={addMilestone} disabled={busy || !newMsTitle.trim()}
                        className={`px-3 py-2 rounded-ctl shadow-btn font-black text-xs transition-opacity disabled:opacity-50 flex items-center gap-1 ${accentBtn(side)}`}>
                        <Plus className="w-3.5 h-3.5" /> 추가
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* ── 정산 (R4) ── */}
              {(projectStatus === '진행중' || projectStatus === '완료') && (
                <section>
                  <h4 className="flex items-center gap-2 font-black text-sm uppercase text-sand-500 mb-3">
                    <Wallet className="w-4 h-4" /> 정산
                  </h4>

                  {settlement ? (
                    <div className="flex flex-col gap-2">
                      <div className="border border-sand-200 bg-sand-50 rounded-ctl px-4 py-3 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-bold text-sand-400">거래금액</p>
                          <p className="font-black text-sm">{settlement.amount?.toLocaleString() ?? '—'}원</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-sand-400">중개수수료 ({settlement.fee_pct}%)</p>
                          <p className="font-black text-sm">{settlement.fee_amount?.toLocaleString() ?? '—'}원</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-ctl font-black text-xs ${SETTLEMENT_BADGE[settlement.status]}`}>
                          {settlement.status}
                        </span>
                        {settlement.status === '대금수령' && settlement.paid_to_club_at && (
                          <span className="text-xs font-bold text-sand-500">
                            수수료 납부기한 {new Date(new Date(settlement.paid_to_club_at).getTime() + settlement.due_days * 86400000).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>

                      {feeOverdue && (
                        <div className="flex items-start gap-2 text-bad-fg font-bold text-xs bg-bad-bg rounded-ctl p-3">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          수수료 납부기한이 지났습니다. 납부 완료 전까지 신규 프로젝트 제안 발송이 제한됩니다.
                        </div>
                      )}

                      {side === 'club' && settlement.status === '대금수령' && (
                        <button
                          onClick={markFeePaid}
                          disabled={busy}
                          className={`py-2.5 rounded-ctl shadow-btn font-black text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 ${accentBtn(side)}`}
                        >
                          {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                          OURCLUB 수수료 납부 완료
                        </button>
                      )}
                      {settlement.status === '수수료납부완료' && (
                        <div className="flex items-center justify-center gap-2 py-2 bg-ok-bg text-ok-fg rounded-ctl font-black text-sm">
                          <CheckCircle2 className="w-4 h-4" /> 정산이 완료되었습니다.
                        </div>
                      )}
                    </div>
                  ) : side === 'corp' ? (
                    <div className="border border-dashed border-sand-300 rounded-card p-4 flex flex-col gap-2">
                      <p className="text-sm font-bold text-sand-600">
                        동아리(프로젝트팀)에 대금을 직접 지급하셨다면 금액을 입력하고 정산을 시작하세요.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={amountInput}
                          onChange={e => setAmountInput(e.target.value)}
                          placeholder={projectBudget ? `예산 ${projectBudget.toLocaleString()}원` : '거래금액(원)'}
                          className="field flex-1 p-2.5 rounded-ctl font-bold text-sm"
                        />
                        <button
                          onClick={markPaidToClub}
                          disabled={busy}
                          className={`px-4 py-2.5 rounded-ctl shadow-btn font-black text-sm transition-opacity disabled:opacity-50 flex items-center gap-2 whitespace-nowrap ${accentBtn(side)}`}
                        >
                          {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                          대금 지급 완료
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-sand-400 border border-dashed border-sand-300 rounded-card p-4 text-center">
                      기업의 대금 지급 후 수수료 정산이 시작됩니다.
                    </p>
                  )}
                </section>
              )}

              {/* ── 상호 평가 (완료 후) ── */}
              {projectStatus === '완료' && (
                <section>
                  <h4 className="flex items-center gap-2 font-black text-sm uppercase text-sand-500 mb-3">
                    <Star className="w-4 h-4" /> 상호 평가
                  </h4>

                  {/* 내 평가 작성/수정 */}
                  <div className="border border-sand-200 bg-sand-50 rounded-ctl px-4 py-3 flex flex-col gap-2">
                    <p className="text-xs font-bold text-sand-500">
                      {mySide === '기업' ? '협업한 동아리' : '함께한 기업'}에 대한 평가
                      {myReview && <span className="ml-1 text-sand-400">(작성됨 · 수정 가능)</span>}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => setRatingInput(n)} className="p-0.5">
                          <Star className={`w-6 h-6 ${n <= ratingInput ? 'fill-brand text-brand' : 'text-sand-300'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      placeholder="협업 후기를 남겨주세요 (선택)"
                      className="field w-full h-20 p-2.5 rounded-ctl font-medium text-sm resize-none"
                    />
                    <button
                      onClick={submitReview}
                      disabled={busy}
                      className={`py-2 rounded-ctl shadow-btn font-black text-xs transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 ${accentBtn(side)}`}
                    >
                      {busy ? <Loader className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      {myReview ? '평가 수정' : '평가 등록'}
                    </button>
                  </div>

                  {/* 상대 평가 */}
                  {otherReview ? (
                    <div className="mt-2 border border-sand-200 rounded-ctl px-4 py-3">
                      <p className="text-xs font-bold text-sand-500 mb-1">{otherReview.author_side} 측 평가</p>
                      <div className="flex items-center gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-4 h-4 ${n <= otherReview.rating ? 'fill-brand text-brand' : 'text-sand-300'}`} />
                        ))}
                      </div>
                      {otherReview.comment && <p className="text-sm font-medium text-sand-600 whitespace-pre-wrap">{otherReview.comment}</p>}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-bold text-sand-400">상대방이 아직 평가를 남기지 않았습니다.</p>
                  )}
                </section>
              )}

              {error && (
                <div className="flex items-center gap-2 text-bad-fg font-bold text-sm bg-bad-bg rounded-ctl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — 기업: 킥오프/완료 전이 */}
        {!loading && side === 'corp' && (
          <div className="p-6 border-t border-sand-200 flex gap-3">
            {(projectStatus === '모집중' || projectStatus === '모집마감') && (
              <button
                onClick={() => setStatus('진행중')}
                disabled={busy || !hasTeam}
                title={hasTeam ? '' : '동아리의 PL·팀 지정 후 시작할 수 있습니다.'}
                className="flex-1 py-3 btn-grad text-white rounded-ctl shadow-btn font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" /> 프로젝트 시작(킥오프)
              </button>
            )}
            {projectStatus === '진행중' && (
              <button
                onClick={() => setStatus('완료')}
                disabled={busy}
                className="flex-1 py-3 btn-grad text-white rounded-ctl shadow-btn font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Flag className="w-4 h-4" /> 프로젝트 완료 처리
              </button>
            )}
            {projectStatus === '완료' && (
              <div className="flex-1 py-3 bg-ok-bg text-ok-fg rounded-ctl font-black text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> 완료된 프로젝트입니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
