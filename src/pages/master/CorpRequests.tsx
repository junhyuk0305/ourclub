import React, { useCallback, useEffect, useState } from 'react';
import { Loader, ExternalLink, CheckCircle, FileText, ChevronRight, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { statusColor } from '../../lib/statusColor';
import { useAuth } from '../../contexts/AuthContext';

interface CorpRequest {
  id: string;
  user_id: string;
  corp_name: string;
  business_number: string;
  manager_name: string;
  manager_phone: string | null;
  website: string | null;
  description: string | null;
  business_doc_url: string | null;
  status: string;
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  b2b_terms_agreed_at: string | null;
  profiles: { name: string; email: string } | null;
}

const STATUS_TABS = ['검토대기', '검토중', '보완요청', '승인', '거절'];

function fmt(iso: string) {
  return formatDate(iso, 'medium');
}

export default function CorpRequests() {
  const { user } = useAuth();
  const [tab, setTab] = useState('검토대기');
  const [list, setList] = useState<CorpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CorpRequest | null>(null);

  const [newStatus, setNewStatus] = useState('');
  const [reviewerNote, setReviewerNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('corp_registration_requests')
      .select('*, profiles(name, email)')
      .eq('status', tab)
      .order('created_at', { ascending: false });
    setList((data as unknown as CorpRequest[]) ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchList(); setSelected(null); }, [fetchList]);

  useEffect(() => {
    if (!selected) return;
    setNewStatus(selected.status);
    setReviewerNote(selected.reviewer_note ?? '');
    setActionMsg('');
    setDocUrl(null);
    if (selected.business_doc_url) {
      supabase.storage.from('certification-docs').createSignedUrl(selected.business_doc_url, 3600)
        .then(({ data }) => setDocUrl(data?.signedUrl ?? null));
    }
  }, [selected]);

  const handleSaveStatus = async () => {
    if (!selected || !newStatus) return;
    setSaving(true);
    setActionMsg('');
    const { error } = await supabase
      .from('corp_registration_requests')
      .update({
        status: newStatus,
        reviewer_note: reviewerNote || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq('id', selected.id);
    setSaving(false);
    if (error) { setActionMsg('저장 실패: ' + error.message); return; }
    setActionMsg('저장됐어요.');
    fetchList();
    setSelected(prev => prev ? { ...prev, status: newStatus, reviewer_note: reviewerNote } : null);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setApproving(true);
    setActionMsg('');
    const { error } = await supabase.rpc('approve_corp_registration', {
      p_request_id: selected.id,
      p_note: reviewerNote || null,
    });
    setApproving(false);
    if (error) { setActionMsg('승인 실패: ' + error.message); return; }
    setActionMsg('✅ 승인 완료! 기업 계정이 생성됐어요.');
    fetchList();
    setSelected(null);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-ink mb-1">기업 가입 심사</h1>
          <p className="font-bold text-sand-500">기업 가입 신청을 검토하고 승인하세요.</p>
        </div>

        <div className="flex gap-1 border border-sand-200 rounded-ctl w-fit bg-sand-100 p-1">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 font-black text-sm rounded-ctl transition-colors ${
                tab === t ? 'bg-white text-ink shadow-soft' : 'text-sand-500 hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* 목록 */}
          <div className="w-80 shrink-0 flex flex-col gap-2">
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
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-black text-sm text-ink leading-snug">{req.corp_name}</span>
                    <ChevronRight className="w-4 h-4 text-sand-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs font-bold text-sand-400 mb-2">{req.business_number}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-ctl ${statusColor(req.status)}`}>{req.status}</span>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-ink flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand" strokeWidth={2.5} /> {selected.corp_name}
                  </h2>
                  <span className={`text-sm font-black px-3 py-1 rounded-ctl ${statusColor(selected.status)}`}>{selected.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    ['신청자', selected.profiles?.name ?? '—'],
                    ['이메일', selected.profiles?.email ?? '—'],
                    ['사업자등록번호', selected.business_number],
                    ['담당자', selected.manager_name],
                    ['담당자 연락처', selected.manager_phone ?? '—'],
                    ['신청일', fmt(selected.created_at)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5">
                      <span className="font-bold text-sand-400 text-xs">{k}</span>
                      <span className="font-bold text-sand-600">{v}</span>
                    </div>
                  ))}
                  {selected.website && (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sand-400 text-xs">웹사이트</span>
                      <a href={selected.website} target="_blank" rel="noopener noreferrer" className="font-bold text-brand hover:underline flex items-center gap-1">
                        바로가기 <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                      </a>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sand-400 text-xs">B2B 약관 동의</span>
                    {selected.b2b_terms_agreed_at ? (
                      <span className="font-black text-ok-fg">✓ 동의 ({fmt(selected.b2b_terms_agreed_at)})</span>
                    ) : (
                      <span className="font-bold text-sand-400">미동의 (약관 도입 전 신청)</span>
                    )}
                  </div>
                </div>
                {selected.description && (
                  <div className="mt-4 pt-4 border-t border-sand-200">
                    <p className="text-xs font-bold text-sand-400 mb-1">기업 소개</p>
                    <p className="font-bold text-sm text-sand-600 whitespace-pre-line">{selected.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6">
                <h3 className="font-black text-ink mb-4 flex items-center gap-2"><FileText className="w-4 h-4" strokeWidth={2.5} /> 제출 서류</h3>
                <div className="border border-sand-200 rounded-ctl p-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-sand-600 truncate">사업자등록증</span>
                  {selected.business_doc_url && docUrl ? (
                    <a href={docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-black text-brand hover:underline shrink-0">
                      열기 <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                    </a>
                  ) : (
                    <span className="text-xs font-bold text-sand-400">미첨부</span>
                  )}
                </div>
              </div>

              <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6 flex flex-col gap-4">
                <h3 className="font-black text-ink">심사 처리</h3>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-sand-500">상태 변경</label>
                  <div className="flex gap-2 flex-wrap">
                    {['검토중', '보완요청', '거절'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewStatus(s)}
                        className={`px-3 py-2 text-sm font-black rounded-ctl border transition-colors ${
                          newStatus === s ? 'bg-ink text-white border-ink' : 'bg-white text-sand-600 border-sand-300 hover:bg-sand-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-sand-500">담당자 메모 (신청자에게 표시)</label>
                  <textarea
                    value={reviewerNote}
                    onChange={e => setReviewerNote(e.target.value)}
                    rows={3}
                    placeholder="보완 요청 내용 또는 거절 사유를 작성해주세요."
                    className="field border border-sand-300 rounded-ctl px-3 py-2 text-sm font-bold resize-none"
                  />
                </div>

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
                    onClick={handleSaveStatus}
                    disabled={saving}
                    className="flex-1 py-3 bg-white border border-sand-300 rounded-ctl text-ink font-black text-sm hover:bg-sand-50 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} />}
                    상태 저장
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={approving || selected.status === '승인'}
                    className="flex-1 py-3 btn-grad text-white rounded-ctl shadow-btn font-black text-sm hover:-translate-y-0.5 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {approving ? <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <CheckCircle className="w-4 h-4" strokeWidth={2.5} />}
                    최종 승인 (기업 생성)
                  </button>
                </div>

                <p className="text-xs font-bold text-sand-400">
                  * 최종 승인 시 corporations 테이블에 기업이 생성되고, 신청자가 담당자(corp_members)로 등록됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sand-400">
              <div className="text-center">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" strokeWidth={2.5} />
                <p className="font-bold">목록에서 신청서를 선택하세요.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
