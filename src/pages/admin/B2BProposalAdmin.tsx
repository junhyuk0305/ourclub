import React, { useEffect, useState } from 'react';
import { Send, Building, Target, FileText, Loader, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AdminHeaderPortal } from './AdminLayout';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { ContractNatureBanner, StudentIncomeNotice } from '../../components/b2b/B2BNotices';

interface Project {
  id: string;
  title: string;
  category: string;
  budget: number | null;
  description: string | null;
  corporations: { name: string } | null;
}

export default function B2BProposalAdmin() {
  const { adminClubId } = useAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('project_id');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId ?? '');
  const [proposalText, setProposalText] = useState('');
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  // 미납 자동제재(R4): 미납 수수료가 있는 동아리는 신규 제안 발송 차단
  useEffect(() => {
    if (!adminClubId) return;
    supabase
      .rpc('b2b_club_has_overdue', { p_club_id: adminClubId })
      .then(({ data }) => setOverdue(data === true));
  }, [adminClubId]);

  const loadProjects = async () => {
    setFetching(true);
    const { data } = await supabase
      .from('b2b_projects')
      .select('id, title, category, budget, description, corporations(name)')
      .eq('status', '모집중')
      .order('created_at', { ascending: false });
    setProjects((data as unknown as Project[]) ?? []);
    setFetching(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleSubmit = async () => {
    if (!adminClubId || !selectedProjectId || !proposalText.trim() || !agreed || overdue) return;
    setSubmitting(true);
    setError('');

    const { error: insertErr } = await supabase
      .from('b2b_applications')
      .insert({
        club_id: adminClubId,
        project_id: selectedProjectId,
        proposal_text: proposalText.trim(),
        status: '미열람',
        terms_agreed_at: new Date().toISOString(),
      });

    setSubmitting(false);
    if (insertErr?.code === '23505') { setError('이미 해당 프로젝트에 지원하셨습니다.'); return; }
    if (insertErr) { setError(insertErr.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center flex flex-col items-center gap-6">
            <CheckCircle2 className="w-20 h-20 text-ok-fg" strokeWidth={2.5} />
            <div>
              <h2 className="text-3xl font-black text-ink mb-2">제안서 발송 완료!</h2>
              <p className="text-sand-500 font-bold">기업 담당자에게 제안서가 전달되었습니다.</p>
            </div>
            <Link to="/admin/b2b" className="px-8 py-3 rounded-ctl btn-grad text-white shadow-btn font-bold transition-all">
              지원 현황 확인하기
            </Link>
          </div>
        </main>
        <AdminHeaderPortal>
          <Link to="/admin/b2b" className="ml-4 px-4 py-2 rounded-ctl border border-sand-300 bg-white text-ink hover:bg-sand-50 font-bold text-sm">목록으로</Link>
        </AdminHeaderPortal>
      </>
    );
  }

  return (
    <>
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto flex justify-center">
          <div className="w-full max-w-4xl flex flex-col gap-6">
            <div>
              <h2 className="text-4xl font-black text-ink mb-2">새 제안서 작성</h2>
              <p className="text-sand-500 font-bold">기업 파트너에게 협업 모델과 프로젝트 제안서를 작성합니다.</p>
            </div>

            {fetching ? (
              <LoadingScreen />
            ) : (
              <div className="bg-white border border-sand-200 rounded-card shadow-soft p-8 flex flex-col gap-6">

                {/* 도급 성격 고지 (R1) */}
                <ContractNatureBanner />

                {/* 미납 자동제재 안내 (R4) */}
                {overdue && (
                  <div className="flex items-start gap-2 bg-bad-bg rounded-card px-4 py-3 text-sm font-bold text-bad-fg leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.5} />
                    미납된 중개수수료가 있어 신규 제안을 발송할 수 없습니다. 기업 협업 프로젝트 페이지의 진행 중 프로젝트에서 정산(수수료 납부)을 완료한 뒤 다시 시도해 주세요.
                  </div>
                )}

                {/* 프로젝트 선택 */}
                <div>
                  <label className="flex items-center gap-2 font-black text-ink mb-2">
                    <Target className="w-4 h-4 text-brand" strokeWidth={2.5} /> 지원할 프로젝트 *
                  </label>
                  {projects.length === 0 ? (
                    <p className="text-sand-400 font-bold text-sm p-4 border border-dashed border-sand-300 rounded-ctl">현재 모집 중인 프로젝트가 없습니다.</p>
                  ) : (
                    <select
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                      className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none bg-white cursor-pointer"
                    >
                      <option value="">프로젝트를 선택하세요</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.corporations?.name ?? '기업'}] {p.title} — {p.budget ? `${p.budget.toLocaleString()}원` : '예산 협의'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 선택된 프로젝트 정보 */}
                {selectedProject && (
                  <div className="bg-brand-tint rounded-card p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-brand" strokeWidth={2.5} />
                      <span className="font-black text-ink">{selectedProject.corporations?.name}</span>
                      <span className="text-xs text-sand-500 font-bold bg-white border border-sand-200 rounded-ctl px-2 py-0.5">{selectedProject.category}</span>
                    </div>
                    <p className="font-black text-lg text-ink">{selectedProject.title}</p>
                    {selectedProject.description && (
                      <p className="text-sm font-bold text-sand-600 mt-1">{selectedProject.description}</p>
                    )}
                    <p className="text-sm font-black text-brand mt-1">
                      예산: {selectedProject.budget ? `${selectedProject.budget.toLocaleString()}원` : '협의'}
                    </p>
                  </div>
                )}

                {/* 제안서 본문 */}
                <div>
                  <label className="flex items-center gap-2 font-black text-ink mb-2">
                    <FileText className="w-4 h-4 text-brand" strokeWidth={2.5} /> 제안서 본문 *
                  </label>
                  <textarea
                    placeholder="기업에 제안할 내용을 작성하세요.&#10;&#10;예) 프로젝트 배경 및 목적, 우리 동아리의 역량, 진행 방식, 기대 효과, 일정 등"
                    value={proposalText}
                    onChange={e => setProposalText(e.target.value)}
                    className="field w-full h-80 p-4 border border-sand-300 rounded-ctl font-medium leading-relaxed resize-none outline-none bg-white"
                  />
                  <p className="text-xs text-sand-400 font-bold mt-1 text-right">{proposalText.length}자</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-bad-fg font-bold text-sm bg-bad-bg rounded-card p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2.5} /> {error}
                  </div>
                )}

                {/* 학생 소득 고지 (R3) */}
                <StudentIncomeNotice />

                {/* 수수료 메시징 (R6) — 선납 없음 */}
                <div className="border border-sand-200 bg-sand-50 rounded-card px-4 py-3 text-xs font-bold text-sand-600 leading-relaxed">
                  OURCLUB 중개수수료는 프로젝트팀이 부담하는 성공보수형이며, <strong>기업으로부터 대금을 수령한 후</strong> 납부합니다.
                  대금 수령 전 선납 부담은 없고, 거래가 성사되지 않으면 수수료도 발생하지 않습니다.
                </div>

                {/* 거래약관·수수료 약정·정보제공 동의 (R5 + L6) */}
                <label className="flex items-start gap-3 border border-sand-300 bg-white rounded-card px-4 py-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-brand cursor-pointer"
                  />
                  <span className="text-xs font-bold text-sand-600 leading-relaxed">
                    <Link to="/b2b-terms" target="_blank" rel="noopener noreferrer" className="text-brand underline hover:text-brand-dark">B2B 프로젝트 거래약관</Link>
                    {' 및 중개·정산 약정(중개수수료 '}<strong>동아리 부담</strong>, 성공보수형)에 동의하며,
                    제안서 발송 시 우리 동아리의 정보(동아리명·제안 내용·연락처)가 해당 기업 담당자에게 제공되는 것에 동의합니다.
                    제공된 정보는 본 프로젝트 검토 목적으로만 이용됩니다.
                  </span>
                </label>

                <div className="bg-brand-tint rounded-card p-4 font-bold text-sm text-brand-dark">
                  제안서 발송 시 기업 담당자에게 검토 요청이 전달되며, 상태는 기업 협업 프로젝트 페이지에서 확인할 수 있습니다.
                </div>
              </div>
            )}
          </div>
        </main>

      <AdminHeaderPortal>
        <Link to="/admin/b2b" className="ml-4 px-4 py-2 rounded-ctl border border-sand-300 bg-white text-ink hover:bg-sand-50 transition-colors text-sm font-bold flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> 목록으로 돌아가기
        </Link>
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedProjectId || !proposalText.trim() || !agreed || overdue}
          className="ml-4 px-6 py-2 rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2 font-bold disabled:opacity-50"
        >
          {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2.5} />}
          제안서 발송하기
        </button>
      </AdminHeaderPortal>
    </>
  );
}
