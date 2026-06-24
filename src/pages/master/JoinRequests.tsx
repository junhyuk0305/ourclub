import React, { useCallback, useEffect, useState } from 'react';
import { Loader, CheckCircle, XCircle, ChevronRight, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { statusColor } from '../../lib/statusColor';
import { useAuth } from '../../contexts/AuthContext';

interface JoinRequest {
  id: string;
  user_id: string;
  club_id: string;
  role_title: string | null;
  intro: string | null;
  status: string;
  reviewed_at: string | null;
  created_at: string;
  profiles: { name: string; email: string } | null;
  clubs: { name: string; type: string } | null;
}

const STATUS_TABS = ['대기중', '승인', '거절'];

function fmt(iso: string) {
  return formatDate(iso, 'medium');
}

export default function JoinRequests() {
  const { user } = useAuth();
  const [tab, setTab] = useState('대기중');
  const [list, setList] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JoinRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('club_join_requests')
      .select('*, profiles(name, email), clubs(name, type)')
      .eq('status', tab)
      .order('created_at', { ascending: false });
    setList((data as unknown as JoinRequest[]) ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchList(); setSelected(null); }, [fetchList]);

  useEffect(() => {
    if (selected) setActionMsg('');
  }, [selected]);

  const handleDecision = async (decision: '승인' | '거절') => {
    if (!selected || !user) return;
    setProcessing(true);
    setActionMsg('');

    try {
      if (decision === '승인') {
        // club_members 생성
        const { error: memberErr } = await supabase
          .from('club_members')
          .insert({
            user_id: selected.user_id,
            club_id: selected.club_id,
            role: '운영진',
            status: '활동중',
            position: selected.role_title ?? null,
          });
        if (memberErr) throw new Error('운영진 등록 실패: ' + memberErr.message);
      }

      // 신청서 상태 업데이트
      const { error: updateErr } = await supabase
        .from('club_join_requests')
        .update({
          status: decision,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selected.id);

      if (updateErr) throw new Error('상태 업데이트 실패: ' + updateErr.message);

      setActionMsg(decision === '승인' ? '✅ 승인 완료! 해당 사용자가 운영진으로 등록됐어요.' : '거절 처리됐어요.');
      fetchList();
      setSelected(null);
    } catch (err: unknown) {
      setActionMsg((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-ink mb-1">합류 신청 심사</h1>
          <p className="font-bold text-sand-500">기존 동아리에 운영진으로 합류하려는 신청을 처리하세요.</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 border border-sand-200 rounded-ctl w-fit bg-sand-100 p-1">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 font-black text-sm rounded-ctl transition-colors ${
                tab === t ? 'bg-white text-ink shadow-soft' : 'text-sand-500 hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* 목록 */}
          <div className="w-72 shrink-0 flex flex-col gap-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-brand" strokeWidth={2.5} />
              </div>
            ) : list.length === 0 ? (
              <div className="bg-white border border-sand-200 rounded-card shadow-soft p-8 text-center">
                <p className="font-bold text-sand-400 text-sm">해당 상태의 신청이 없어요.</p>
              </div>
            ) : (
              list.map(req => (
                <button
                  key={req.id}
                  onClick={() => setSelected(req)}
                  className={`w-full text-left bg-white border rounded-card p-4 transition-all hover:shadow-soft-lg ${
                    selected?.id === req.id ? 'border-brand shadow-soft-lg' : 'border-sand-200 shadow-soft'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-black text-sm text-ink">{req.profiles?.name ?? '—'}</span>
                    <ChevronRight className="w-4 h-4 text-sand-400 shrink-0" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs font-bold text-brand mb-2">→ {req.clubs?.name ?? '—'}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-ctl ${statusColor(req.status)}`}>
                      {req.status}
                    </span>
                    <span className="text-xs font-bold text-sand-400">{fmt(req.created_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 상세 */}
          {selected ? (
            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black text-ink">신청 상세</h2>
                  <span className={`text-sm font-black px-3 py-1 rounded-ctl ${statusColor(selected.status)}`}>
                    {selected.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-5">
                  {[
                    ['신청자', selected.profiles?.name ?? '—'],
                    ['이메일', selected.profiles?.email ?? '—'],
                    ['신청 동아리', selected.clubs?.name ?? '—'],
                    ['동아리 유형', selected.clubs?.type ?? '—'],
                    ['희망 직책', selected.role_title ?? '—'],
                    ['신청일', fmt(selected.created_at)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5">
                      <span className="font-bold text-sand-400 text-xs">{k}</span>
                      <span className="font-bold text-sand-600">{v}</span>
                    </div>
                  ))}
                </div>

                {selected.intro && (
                  <div className="border-t border-sand-200 pt-4">
                    <p className="text-xs font-bold text-sand-400 mb-1">한 줄 소개</p>
                    <p className="font-bold text-sm text-sand-600 bg-sand-50 border border-sand-200 rounded-ctl p-3 whitespace-pre-line">
                      {selected.intro}
                    </p>
                  </div>
                )}
              </div>

              {/* 액션 */}
              {selected.status === '대기중' && (
                <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6 flex flex-col gap-4">
                  <h3 className="font-black text-ink">심사 처리</h3>

                  {actionMsg && (
                    <p className={`text-sm font-bold px-3 py-2 rounded-ctl ${
                      actionMsg.startsWith('✅') ? 'bg-ok-bg text-ok-fg' : 'bg-bad-bg text-bad-fg'
                    }`}>
                      {actionMsg}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleDecision('거절')}
                      disabled={processing}
                      className="flex-1 py-3 bg-white border border-sand-300 rounded-ctl text-ink font-black text-sm hover:bg-sand-50 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                    >
                      {processing ? <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <XCircle className="w-4 h-4" strokeWidth={2.5} />}
                      거절
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision('승인')}
                      disabled={processing}
                      className="flex-1 py-3 btn-grad text-white rounded-ctl shadow-btn font-black text-sm hover:-translate-y-0.5 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {processing ? <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <CheckCircle className="w-4 h-4" strokeWidth={2.5} />}
                      승인 (운영진 등록)
                    </button>
                  </div>

                  <p className="text-xs font-bold text-sand-400">
                    * 승인 시 해당 사용자가 club_members에 운영진(활동중)으로 즉시 등록됩니다.
                  </p>
                </div>
              )}

              {selected.status !== '대기중' && (
                <div className="bg-sand-50 border border-sand-200 rounded-card p-4 text-center">
                  <p className="font-bold text-sand-500 text-sm">
                    이미 처리된 신청이에요. ({selected.status} · {selected.reviewed_at ? fmt(selected.reviewed_at) : '—'})
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sand-400">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" strokeWidth={2.5} />
                <p className="font-bold">목록에서 신청을 선택하세요.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
