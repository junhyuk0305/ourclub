import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, PlusCircle, Clock, CheckCircle, AlertTriangle, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';

type SetupState =
  | { kind: 'loading' }
  | { kind: 'select' }
  | { kind: 'pending_registration'; clubName: string; status: string; note: string | null; createdAt: string }
  | { kind: 'pending_join'; clubName: string; createdAt: string };

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  '검토대기': { text: '검토 대기 중', color: 'bg-warn-bg text-warn-fg' },
  '검토중':   { text: '검토 진행 중', color: 'bg-info-bg text-info-fg' },
  '보완요청': { text: '보완 요청됨', color: 'bg-bad-bg text-bad-fg' },
};

function fmt(iso: string) {
  return formatDate(iso, 'medium');
}

export default function ClubSetup() {
  const { user } = useAuth();
  const { refreshClub } = useAdmin();
  const navigate = useNavigate();
  const [state, setState] = useState<SetupState>({ kind: 'loading' });
  // 거절된 최근 등록 신청(분기 선택 화면에서 사유 안내 + 재신청 유도)
  const [rejected, setRejected] = useState<{ clubName: string; note: string | null; createdAt: string } | null>(null);

  const check = useCallback(async () => {
    if (!user) return;
    {
      // 1. 이미 운영진이면 대시보드로
      const { data: member } = await supabase
        .from('club_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', '운영진')
        .eq('status', '활동중')
        .maybeSingle();

      // 승인 직후 운영진이 된 경우: AdminContext를 먼저 갱신해야 AdminRoute가
      // isAdmin=true를 보고 통과시킨다. (갱신 없이 navigate하면 /club-setup로 되튕김)
      if (member) { await refreshClub(); navigate('/admin/dashboard', { replace: true }); return; }

      // 2. 등록 신청 대기 중?
      const { data: reg } = await supabase
        .from('club_registration_requests')
        .select('club_name, status, reviewer_note, created_at')
        .eq('user_id', user.id)
        .in('status', ['검토대기', '검토중', '보완요청'])
        .maybeSingle();

      if (reg) {
        setState({
          kind: 'pending_registration',
          clubName: reg.club_name,
          status: reg.status,
          note: reg.reviewer_note,
          createdAt: reg.created_at,
        });
        return;
      }

      // 3. 합류 신청 대기 중?
      const { data: join } = await supabase
        .from('club_join_requests')
        .select('status, created_at, clubs(name)')
        .eq('user_id', user.id)
        .eq('status', '대기중')
        .maybeSingle();

      if (join) {
        const clubName = (join.clubs as unknown as { name: string } | null)?.name ?? '알 수 없음';
        setState({ kind: 'pending_join', clubName, createdAt: join.created_at });
        return;
      }

      // 4. 거절된 최근 신청이 있으면 분기 선택 화면에서 사유를 안내(차단하지 않고 재신청 유도)
      const { data: rej } = await supabase
        .from('club_registration_requests')
        .select('club_name, reviewer_note, created_at')
        .eq('user_id', user.id)
        .eq('status', '거절')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setRejected(rej ? { clubName: rej.club_name, note: rej.reviewer_note, createdAt: rej.created_at } : null);

      setState({ kind: 'select' });
    }
  }, [user, navigate, refreshClub]);

  // 최초 진입 시 1회 확인
  useEffect(() => { check(); }, [check]);

  // 승인 대기 중에는 주기적으로 재확인 → 승인되면 check()가 자동으로 대시보드 전환
  useEffect(() => {
    if (state.kind !== 'pending_join' && state.kind !== 'pending_registration') return;
    const id = setInterval(check, 12000);
    return () => clearInterval(id);
  }, [state.kind, check]);

  // ── 로딩 ────────────────────────────────────────────────────
  if (state.kind === 'loading') {
    return <LoadingScreen />;
  }

  // ── 등록 신청 대기 중 ────────────────────────────────────────
  if (state.kind === 'pending_registration') {
    const badge = STATUS_LABEL[state.status] ?? { text: state.status, color: 'bg-off-bg text-off-fg' };
    const isSupplementNeeded = state.status === '보완요청';

    return (
      <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg">
          <div className="bg-white border border-sand-200 rounded-card p-8 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              {isSupplementNeeded
                ? <AlertTriangle className="w-8 h-8 text-bad-fg" strokeWidth={2.5} />
                : <Clock className="w-8 h-8 text-brand" strokeWidth={2.5} />}
              <h1 className="text-2xl font-black text-ink">
                {isSupplementNeeded ? '보완 요청이 도착했어요' : '심사가 진행 중이에요'}
              </h1>
            </div>

            <div className={`rounded-ctl px-4 py-2 inline-flex items-center gap-2 font-bold text-sm mb-6 ${badge.color}`}>
              {badge.text}
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between border-b border-sand-200 pb-3">
                <span className="font-medium text-sand-500 text-sm">신청 동아리</span>
                <span className="font-bold text-ink">{state.clubName}</span>
              </div>
              <div className="flex justify-between border-b border-sand-200 pb-3">
                <span className="font-medium text-sand-500 text-sm">신청 일시</span>
                <span className="font-bold text-ink">{fmt(state.createdAt)}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="font-medium text-sand-500 text-sm">심사 소요 기간</span>
                <span className="font-bold text-ink">약 2~3주</span>
              </div>
            </div>

            {isSupplementNeeded && state.note && (
              <div className="bg-bad-bg rounded-card p-4 mb-6">
                <p className="font-bold text-sm text-bad-fg mb-1">담당자 메시지</p>
                <p className="font-medium text-sm text-bad-fg">{state.note}</p>
              </div>
            )}

            {!isSupplementNeeded && (
              <p className="text-sm font-medium text-sand-500 mb-6">
                검토 완료 후 결과를 알림으로 안내해 드립니다.<br />
                승인되면 자동으로 동아리 운영 페이지에 접근할 수 있어요.
              </p>
            )}

            {isSupplementNeeded ? (
              <button
                onClick={() => navigate('/club-register')}
                className="block w-full py-4 btn-grad text-white text-center font-bold rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all"
              >
                수정하고 다시 제출하기
              </button>
            ) : (
              <Link
                to="/"
                className="block w-full py-4 btn-grad text-white text-center font-bold rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all"
              >
                메인으로 돌아가기
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 합류 신청 대기 중 ────────────────────────────────────────
  if (state.kind === 'pending_join') {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg">
          <div className="bg-white border border-sand-200 rounded-card p-8 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-brand" strokeWidth={2.5} />
              <h1 className="text-2xl font-black text-ink">합류 승인 대기 중이에요</h1>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between border-b border-sand-200 pb-3">
                <span className="font-medium text-sand-500 text-sm">신청 동아리</span>
                <span className="font-bold text-ink">{state.clubName}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="font-medium text-sand-500 text-sm">신청 일시</span>
                <span className="font-bold text-ink">{fmt(state.createdAt)}</span>
              </div>
            </div>

            <p className="text-sm font-medium text-sand-500 mb-6">
              해당 동아리 운영진이 승인하면 동아리 관리 페이지에 접근할 수 있어요.
            </p>

            <Link
              to="/"
              className="block w-full py-4 btn-grad text-white text-center font-bold rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 분기 선택 (의도 기반: 부원 / 운영진) ──────────────────────
  return (
    <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center p-6 py-16 font-sans">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-brand-tint px-4 py-2 rounded-ctl font-bold text-brand-dark text-sm mb-6">
          <CheckCircle className="w-4 h-4" strokeWidth={2.5} /> 회원가입 완료
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-ink mb-4 tracking-tight">
          어떻게 시작하시겠어요?
        </h1>
        <p className="text-lg font-medium text-sand-600">
          동아리에 부원으로 가입하거나, 동아리를 직접 운영할 수 있어요.
        </p>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-8">
        {/* 거절된 최근 신청 안내 — 사유 표시 + 새 동아리 등록으로 재신청 유도 */}
        {rejected && (
          <div className="bg-bad-bg rounded-card p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-bad-fg shrink-0" strokeWidth={2.5} />
              <p className="font-bold text-bad-fg">
                <span className="font-black">{rejected.clubName}</span> 등록 신청이 반려되었어요
              </p>
            </div>
            {rejected.note && (
              <p className="font-medium text-sm text-bad-fg">반려 사유: {rejected.note}</p>
            )}
            <p className="font-medium text-xs text-bad-fg">
              내용을 보완해 아래 ‘새 동아리 등록’에서 다시 신청할 수 있어요. (신청일 {fmt(rejected.createdAt)})
            </p>
          </div>
        )}

        {/* 부원으로 가입 (가장 일반적인 경로 — 강조) */}
        <div
          onClick={() => navigate('/clubs')}
          className="group bg-white border border-sand-200 rounded-card p-8 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-6"
        >
          <div className="w-16 h-16 bg-brand-tint rounded-full flex items-center justify-center shrink-0">
            <Search className="w-8 h-8 text-brand" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-ink mb-2">동아리에 가입하고 싶어요</h2>
            <p className="font-medium text-sand-600 leading-relaxed">
              모집 중인 동아리를 둘러보고 지원하세요. 합격하면 운영진이 부원으로 등록해 드려요.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 py-4 px-6 btn-grad text-white font-bold rounded-ctl shadow-btn group-hover:-translate-y-0.5 transition-all whitespace-nowrap">
            동아리 둘러보기 <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </div>
        </div>

        {/* 운영진 영역 구분 */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-px bg-sand-200" />
          <span className="text-sm font-bold text-sand-400">동아리를 운영하시나요?</span>
          <div className="flex-1 h-px bg-sand-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 기존 동아리 합류 */}
          <div
            onClick={() => navigate('/club-join')}
            className="group bg-white border border-sand-200 rounded-card p-8 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col"
          >
            <div className="w-16 h-16 bg-brand-tint rounded-full flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-brand" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-ink mb-3">기존 동아리 합류</h2>
            <p className="font-medium text-sand-600 flex-1 mb-6 leading-relaxed">
              이미 OURCLUB에 등록된 동아리의<br />운영진으로 참여 신청해요.<br />
              <span className="text-sm text-sand-400 mt-1 block">기존 운영진의 승인이 필요해요.</span>
            </p>
            <div className="flex items-center justify-between w-full py-4 bg-white text-ink px-5 font-bold rounded-ctl border border-sand-300 group-hover:bg-sand-50 transition-colors">
              합류 신청하기 <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </div>
          </div>

          {/* 새 동아리 등록 */}
          <div
            onClick={() => navigate('/club-register')}
            className="group bg-white border border-sand-200 rounded-card p-8 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col"
          >
            <div className="w-16 h-16 bg-brand-tint rounded-full flex items-center justify-center mb-6">
              <PlusCircle className="w-8 h-8 text-brand" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-ink mb-3">새 동아리 등록</h2>
            <p className="font-medium text-sand-600 flex-1 mb-6 leading-relaxed">
              새로운 동아리를 직접 등록해요.<br />안전 인증 심사를 통과하면<br />
              <span className="text-brand font-bold">오렌지 배찌</span>와 모든 운영 기능이 열려요.
              <span className="text-sm text-sand-400 mt-1 block">서류 제출 + 안전 설문 필요, 심사 2~3주.</span>
            </p>
            <div className="flex items-center justify-between w-full py-4 btn-grad text-white px-5 font-bold rounded-ctl shadow-btn group-hover:-translate-y-0.5 transition-all">
              등록 시작하기 <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
