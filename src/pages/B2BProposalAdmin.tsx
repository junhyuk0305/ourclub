import React, { useEffect, useState } from 'react';
import { Send, Building, Target, FileText, Loader, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';

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

  useEffect(() => {
    loadProjects();
  }, []);

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
    if (!adminClubId || !selectedProjectId || !proposalText.trim()) return;
    setSubmitting(true);
    setError('');

    const { error: insertErr } = await supabase
      .from('b2b_applications')
      .insert({
        club_id: adminClubId,
        project_id: selectedProjectId,
        proposal_text: proposalText.trim(),
        status: '미열람',
      });

    setSubmitting(false);
    if (insertErr?.code === '23505') { setError('이미 해당 프로젝트에 지원하셨습니다.'); return; }
    if (insertErr) { setError(insertErr.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
        <AdminHeader>
          <Link to="/admin/b2b" className="ml-4 px-4 py-2 border border-black bg-white hover:bg-gray-100 font-bold text-sm">목록으로</Link>
        </AdminHeader>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0"><AdminSidebar /></aside>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center flex flex-col items-center gap-6">
              <CheckCircle2 className="w-20 h-20 text-green-500" />
              <div>
                <h2 className="text-3xl font-black mb-2">제안서 발송 완료!</h2>
                <p className="text-gray-500 font-bold">기업 담당자에게 제안서가 전달되었습니다.</p>
              </div>
              <Link to="/admin/b2b" className="px-8 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors">
                지원 현황 확인하기
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        <Link to="/admin/b2b" className="ml-4 px-4 py-2 border border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none text-sm font-bold flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
        </Link>
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedProjectId || !proposalText.trim()}
          className="ml-4 px-6 py-2 border border-black bg-black text-white font-black hover:bg-gray-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          제안서 발송하기
        </button>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center">
          <div className="w-full max-w-4xl flex flex-col gap-6">
            <div>
              <h2 className="text-4xl font-black mb-2">새 제안서 작성</h2>
              <p className="text-gray-500 font-bold">기업 파트너에게 협업 모델과 프로젝트 제안서를 작성합니다.</p>
            </div>

            {fetching ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : (
              <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col gap-6">

                {/* 프로젝트 선택 */}
                <div>
                  <label className="flex items-center gap-2 font-black mb-2">
                    <Target className="w-4 h-4 text-orange-500" /> 지원할 프로젝트 *
                  </label>
                  {projects.length === 0 ? (
                    <p className="text-gray-400 font-bold text-sm p-4 border border-dashed border-gray-300">현재 모집 중인 프로젝트가 없습니다.</p>
                  ) : (
                    <select
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                      className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 bg-gray-50 cursor-pointer"
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
                  <div className="bg-orange-50 border border-orange-200 p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-500" />
                      <span className="font-black">{selectedProject.corporations?.name}</span>
                      <span className="text-xs text-gray-500 font-bold bg-white border border-gray-200 px-2 py-0.5">{selectedProject.category}</span>
                    </div>
                    <p className="font-black text-lg">{selectedProject.title}</p>
                    {selectedProject.description && (
                      <p className="text-sm font-bold text-gray-600 mt-1">{selectedProject.description}</p>
                    )}
                    <p className="text-sm font-black text-orange-600 mt-1">
                      예산: {selectedProject.budget ? `${selectedProject.budget.toLocaleString()}원` : '협의'}
                    </p>
                  </div>
                )}

                {/* 제안서 본문 */}
                <div>
                  <label className="flex items-center gap-2 font-black mb-2">
                    <FileText className="w-4 h-4 text-orange-500" /> 제안서 본문 *
                  </label>
                  <textarea
                    placeholder="기업에 제안할 내용을 작성하세요.&#10;&#10;예) 프로젝트 배경 및 목적, 우리 동아리의 역량, 진행 방식, 기대 효과, 일정 등"
                    value={proposalText}
                    onChange={e => setProposalText(e.target.value)}
                    className="w-full h-80 p-4 border border-black font-medium leading-relaxed resize-none outline-none focus:border-orange-500 bg-gray-50"
                  />
                  <p className="text-xs text-gray-400 font-bold mt-1 text-right">{proposalText.length}자</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 border border-red-200 p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <div className="bg-orange-50 border border-orange-200 p-4 font-bold text-sm text-orange-800">
                  제안서 발송 시 기업 담당자에게 검토 요청이 전달되며, 상태는 B2B 수주 페이지에서 확인할 수 있습니다.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
