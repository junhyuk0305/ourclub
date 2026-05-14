import React, { useCallback, useEffect, useState } from 'react';
import {
  Loader, ExternalLink, CheckCircle, XCircle, Clock,
  AlertTriangle, FileText, ChevronRight, Shield,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { MasterLayout } from './MasterLayout';

interface RegRequest {
  id: string;
  user_id: string;
  club_name: string;
  club_type: string;
  one_line_desc: string;
  description: string | null;
  location: string | null;
  registration_doc_url: string | null;
  activity_doc_url: string | null;
  member_list_doc_url: string | null;
  representative_id_url: string | null;
  member_count: number | null;
  has_regular_meeting: boolean | null;
  meeting_location: string | null;
  has_membership_fee: boolean | null;
  membership_fee_amount: number | null;
  has_accident_history: boolean | null;
  accident_description: string | null;
  status: string;
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles: { name: string; email: string } | null;
}

const STATUS_TABS = ['검토대기', '검토중', '보완요청', '승인', '거절'];

const STATUS_STYLE: Record<string, string> = {
  '검토대기': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '검토중':   'bg-blue-100 text-blue-800 border-blue-300',
  '보완요청': 'bg-red-100 text-red-800 border-red-300',
  '승인':     'bg-green-100 text-green-800 border-green-300',
  '거절':     'bg-gray-100 text-gray-600 border-gray-300',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function Bool({ v }: { v: boolean | null }) {
  if (v === null) return <span className="text-gray-400">미응답</span>;
  return v
    ? <span className="text-green-700 font-black">예</span>
    : <span className="text-gray-500 font-bold">아니오</span>;
}

export default function Registrations() {
  const { user } = useAuth();
  const [tab, setTab] = useState('검토대기');
  const [list, setList] = useState<RegRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RegRequest | null>(null);

  // 상태 변경용
  const [newStatus, setNewStatus] = useState('');
  const [reviewerNote, setReviewerNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // 서류 Signed URL 캐시
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('club_registration_requests')
      .select('*, profiles(name, email)')
      .eq('status', tab)
      .order('created_at', { ascending: false });
    setList((data as unknown as RegRequest[]) ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchList(); setSelected(null); }, [fetchList]);

  // 서류 signed URL 생성
  useEffect(() => {
    if (!selected) return;

    const paths = [
      selected.registration_doc_url,
      selected.activity_doc_url,
      selected.member_list_doc_url,
      selected.representative_id_url,
    ].filter(Boolean) as string[];

    const fetchUrls = async () => {
      const entries: Record<string, string> = {};
      await Promise.all(
        paths.map(async (path) => {
          const { data } = await supabase.storage
            .from('certification-docs')
            .createSignedUrl(path, 3600);
          if (data?.signedUrl) entries[path] = data.signedUrl;
        })
      );
      setSignedUrls(entries);
    };

    fetchUrls();
    setNewStatus(selected.status);
    setReviewerNote(selected.reviewer_note ?? '');
    setActionMsg('');
  }, [selected]);

  // 상태만 변경
  const handleSaveStatus = async () => {
    if (!selected || !newStatus) return;
    setSaving(true);
    setActionMsg('');
    const { error } = await supabase
      .from('club_registration_requests')
      .update({
        status: newStatus,
        reviewer_note: reviewerNote || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selected.id);
    setSaving(false);
    if (error) { setActionMsg('저장 실패: ' + error.message); return; }
    setActionMsg('저장됐어요.');
    fetchList();
    setSelected(prev => prev ? { ...prev, status: newStatus, reviewer_note: reviewerNote } : null);
  };

  // 최종 승인 (clubs + club_members 생성 + status='승인')
  const handleApprove = async () => {
    if (!selected) return;
    setApproving(true);
    setActionMsg('');

    try {
      // 1. clubs 생성
      const slug = `club-${Date.now()}`;
      const { data: club, error: clubErr } = await supabase
        .from('clubs')
        .insert({
          slug,
          name: selected.club_name,
          type: selected.club_type,
          one_line_desc: selected.one_line_desc,
          description: selected.description,
          location: selected.location,
          is_certified: true,
          theme_color: '#f97316',
        })
        .select('id')
        .single();

      if (clubErr) throw new Error('동아리 생성 실패: ' + clubErr.message);

      // 2. club_members 생성 (신청자를 운영진으로)
      const { error: memberErr } = await supabase
        .from('club_members')
        .insert({
          user_id: selected.user_id,
          club_id: club.id,
          role: '운영진',
          status: '활동중',
        });

      if (memberErr) throw new Error('운영진 등록 실패: ' + memberErr.message);

      // 3. 신청서 상태 → 승인
      const { error: updateErr } = await supabase
        .from('club_registration_requests')
        .update({ status: '승인', reviewer_note: reviewerNote || null, reviewed_at: new Date().toISOString() })
        .eq('id', selected.id);

      if (updateErr) throw new Error('상태 업데이트 실패: ' + updateErr.message);

      setActionMsg(`✅ 승인 완료! 슬러그: ${slug}`);
      fetchList();
      setSelected(null);
    } catch (err: unknown) {
      setActionMsg((err as Error).message);
    } finally {
      setApproving(false);
    }
  };

  const docFields = selected ? [
    { label: '동아리 등록증',       path: selected.registration_doc_url },
    { label: '활동 내역',           path: selected.activity_doc_url },
    { label: '회원 명단',           path: selected.member_list_doc_url },
    { label: '대표자 신분증 사본',  path: selected.representative_id_url },
  ] : [];

  return (
    <MasterLayout>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black mb-1">동아리 등록 심사</h1>
          <p className="font-bold text-gray-500">안전 인증 신청을 검토하고 승인하세요.</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-0 border-2 border-black w-fit bg-white">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-black text-sm border-r-2 border-black last:border-r-0 transition-colors ${
                tab === t ? 'bg-black text-white' : 'hover:bg-gray-100'
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
                <Loader className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : list.length === 0 ? (
              <div className="bg-white border-2 border-black p-8 text-center">
                <p className="font-bold text-gray-400 text-sm">해당 상태의 신청이 없어요.</p>
              </div>
            ) : (
              list.map(req => (
                <button
                  key={req.id}
                  onClick={() => setSelected(req)}
                  className={`w-full text-left bg-white border-2 border-black p-4 transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    selected?.id === req.id ? 'shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-black text-sm leading-snug">{req.club_name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 mb-2">{req.club_type}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black px-2 py-0.5 border ${STATUS_STYLE[req.status]}`}>
                      {req.status}
                    </span>
                    <span className="text-xs font-bold text-gray-400">{fmt(req.created_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 상세 */}
          {selected ? (
            <div className="flex-1 flex flex-col gap-4">
              {/* 기본 정보 */}
              <div className="bg-white border-2 border-black p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black">{selected.club_name}</h2>
                  <span className={`text-sm font-black px-3 py-1 border-2 ${STATUS_STYLE[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    ['신청자', selected.profiles?.name ?? '—'],
                    ['이메일', selected.profiles?.email ?? '—'],
                    ['유형', selected.club_type],
                    ['활동 지역', selected.location ?? '—'],
                    ['신청일', fmt(selected.created_at)],
                    ['한 줄 소개', selected.one_line_desc],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5">
                      <span className="font-bold text-gray-400 text-xs">{k}</span>
                      <span className="font-bold">{v}</span>
                    </div>
                  ))}
                </div>
                {selected.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-1">동아리 소개</p>
                    <p className="font-bold text-sm whitespace-pre-line">{selected.description}</p>
                  </div>
                )}
              </div>

              {/* 서류 */}
              <div className="bg-white border-2 border-black p-6">
                <h3 className="font-black mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 제출 서류
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {docFields.map(({ label, path }) => (
                    <div key={label} className="border-2 border-black p-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold truncate">{label}</span>
                      {path && signedUrls[path] ? (
                        <a
                          href={signedUrls[path]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-black text-orange-600 hover:underline shrink-0"
                        >
                          열기 <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-gray-300">미첨부</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 안전 설문 */}
              <div className="bg-white border-2 border-black p-6">
                <h3 className="font-black mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" /> 안전 설문 답변
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-0.5">회원 수</p>
                    <p className="font-bold">{selected.member_count ?? '—'}명</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-0.5">정기 모임</p>
                    <Bool v={selected.has_regular_meeting} />
                    {selected.has_regular_meeting && selected.meeting_location && (
                      <p className="text-xs text-gray-500 mt-0.5">{selected.meeting_location}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-0.5">회비</p>
                    <Bool v={selected.has_membership_fee} />
                    {selected.has_membership_fee && selected.membership_fee_amount != null && (
                      <p className="text-xs text-gray-500 mt-0.5">월 {selected.membership_fee_amount.toLocaleString()}원</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-0.5">안전 사고 이력</p>
                    <Bool v={selected.has_accident_history} />
                    {selected.has_accident_history && selected.accident_description && (
                      <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{selected.accident_description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 심사 액션 */}
              <div className="bg-white border-2 border-black p-6 flex flex-col gap-4">
                <h3 className="font-black">심사 처리</h3>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-gray-500">상태 변경</label>
                  <div className="flex gap-2 flex-wrap">
                    {['검토중', '보완요청', '거절'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewStatus(s)}
                        className={`px-3 py-2 text-sm font-black border-2 transition-colors ${
                          newStatus === s ? 'bg-black text-white border-black' : 'border-black hover:bg-gray-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-gray-500">담당자 메모 (신청자에게 표시)</label>
                  <textarea
                    value={reviewerNote}
                    onChange={e => setReviewerNote(e.target.value)}
                    rows={3}
                    placeholder="보완 요청 내용 또는 거절 사유를 작성해주세요."
                    className="border-2 border-black px-3 py-2 text-sm font-bold outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                {actionMsg && (
                  <p className={`text-sm font-bold px-3 py-2 border-2 ${
                    actionMsg.startsWith('✅') ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'
                  }`}>
                    {actionMsg}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveStatus}
                    disabled={saving}
                    className="flex-1 py-3 border-2 border-black font-black text-sm hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader className="w-4 h-4 animate-spin" />}
                    상태 저장
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={approving || selected.status === '승인'}
                    className="flex-1 py-3 bg-orange-500 border-2 border-black font-black text-sm hover:bg-black hover:text-orange-500 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                  >
                    {approving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    최종 승인 (배찌 부여)
                  </button>
                </div>

                <p className="text-xs font-bold text-gray-400">
                  * 최종 승인 시 clubs 테이블에 동아리가 생성되고, 신청자가 운영진으로 등록되며 is_certified=true가 적용됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">목록에서 신청서를 선택하세요.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MasterLayout>
  );
}

function ClipboardList(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
