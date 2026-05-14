import React, { useEffect, useState } from 'react';
import { Building2, ChevronRight, Loader, FileOutput, Check, Calendar, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

type AppStatus = '미열람' | '검토중' | '미팅요청' | '매칭완료' | '거절';

interface MyApplication {
  id: string;
  proposal_text: string | null;
  status: AppStatus;
  submitted_at: string;
  b2b_projects: {
    title: string;
    category: string;
    budget: number | null;
    corporations: { name: string } | null;
  } | null;
}

interface PublicProject {
  id: string;
  title: string;
  category: string;
  budget: number | null;
  deadline: string | null;
  required_skills: string[];
  description: string | null;
  status: string;
  created_at: string;
  corporations: { name: string } | null;
  already_applied: boolean;
}

const STATUS_STYLE: Record<AppStatus, string> = {
  '미열람':  'bg-white border-black text-black',
  '검토중':  'bg-yellow-100 border-yellow-400 text-yellow-800',
  '미팅요청': 'bg-blue-100 border-blue-400 text-blue-800',
  '매칭완료': 'bg-green-100 border-green-400 text-green-800',
  '거절':    'bg-red-100 border-red-300 text-red-600',
};

export default function B2BAdmin() {
  const { adminClubId } = useAdmin();
  const [tab, setTab] = useState<'내지원' | '탐색'>('내지원');
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClubId) return;
    loadAll(adminClubId);
  }, [adminClubId]);

  const loadAll = async (clubId: string) => {
    setFetching(true);

    const [{ data: apps }, { data: allProjects }] = await Promise.all([
      supabase
        .from('b2b_applications')
        .select('id, proposal_text, status, submitted_at, b2b_projects(title, category, budget, corporations(name))')
        .eq('club_id', clubId)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('b2b_projects')
        .select('id, title, category, budget, deadline, required_skills, description, status, created_at, corporations(name)')
        .eq('status', '모집중')
        .order('created_at', { ascending: false }),
    ]);

    const appliedIds = new Set((apps ?? []).map((a: any) => a.b2b_projects?.id ?? ''));
    const publicProjects = ((allProjects ?? []) as any[]).map(p => ({
      ...p,
      already_applied: appliedIds.has(p.id),
    }));

    setMyApps((apps as unknown as MyApplication[]) ?? []);
    setProjects(publicProjects);
    setFetching(false);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const formatBudget = (budget: number | null) =>
    budget ? `${budget.toLocaleString()}원` : '협의';

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        <Link
          to="/admin/b2b/proposal"
          className="ml-4 px-6 py-2 border border-black bg-black text-white font-black hover:bg-gray-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px text-sm flex items-center gap-2"
        >
          <FileOutput className="w-4 h-4" /> 새 제안서 작성
        </Link>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-5xl flex flex-col gap-8">
            <div>
              <h2 className="text-4xl font-black mb-2">B2B 프로젝트 수주</h2>
              <p className="text-gray-500 font-bold">기업과 매칭된 프로젝트를 탐색하고 지원 현황을 관리합니다.</p>
            </div>

            <div className="flex gap-2">
              {(['내지원', '탐색'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-6 py-2 border border-black font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px ${tab === t ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  {t === '내지원' ? `내 지원 현황 (${myApps.length})` : '프로젝트 탐색'}
                </button>
              ))}
            </div>

            {fetching ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : tab === '내지원' ? (
              myApps.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 p-16 flex flex-col items-center gap-4 text-center">
                  <Building2 className="w-12 h-12 text-gray-300" />
                  <p className="font-black text-gray-400 text-lg">지원한 프로젝트가 없습니다.</p>
                  <button onClick={() => setTab('탐색')} className="px-6 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors">
                    프로젝트 탐색하기
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-black text-sm">
                        <th className="p-4 font-black">기업명</th>
                        <th className="p-4 font-black">프로젝트명</th>
                        <th className="p-4 font-black">상태</th>
                        <th className="p-4 font-black">예산 / 지원일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {myApps.map(app => (
                        <tr key={app.id} className="hover:bg-orange-50 transition-colors">
                          <td className="p-4 font-bold flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                              <Building2 className="w-4 h-4 text-gray-500" />
                            </div>
                            {app.b2b_projects?.corporations?.name ?? '—'}
                          </td>
                          <td className="p-4">
                            <p className="font-black text-lg">{app.b2b_projects?.title ?? '—'}</p>
                            <p className="text-xs text-gray-400 font-bold mt-0.5">{app.b2b_projects?.category}</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 font-bold text-xs border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${STATUS_STYLE[app.status]}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-orange-600">{formatBudget(app.b2b_projects?.budget ?? null)}</p>
                            <p className="text-xs font-bold text-gray-400 mt-1">
                              {new Date(app.submitted_at).toLocaleDateString('ko-KR')}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              projects.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 p-16 flex flex-col items-center gap-4 text-center">
                  <Building2 className="w-12 h-12 text-gray-300" />
                  <p className="font-black text-gray-400 text-lg">현재 모집 중인 B2B 프로젝트가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {projects.map(proj => (
                    <div key={proj.id} className="bg-white border border-black p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex justify-between items-start gap-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-300 shrink-0">
                          <Building2 className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5">{proj.category}</span>
                            <span className="text-xs font-bold text-gray-400">{proj.corporations?.name}</span>
                            {proj.deadline && (
                              <span className="text-xs font-bold text-gray-400 flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(proj.deadline).toLocaleDateString('ko-KR')} 마감
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-xl mb-1">{proj.title}</h3>
                          {proj.description && <p className="text-sm font-bold text-gray-500 line-clamp-2">{proj.description}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <p className="text-sm font-black text-orange-600">예산: {formatBudget(proj.budget)}</p>
                            {proj.required_skills?.length > 0 && proj.required_skills.slice(0, 3).map(s => (
                              <span key={s} className="flex items-center gap-0.5 px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
                                <Tag className="w-2.5 h-2.5" />{s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {proj.already_applied ? (
                        <span className="px-4 py-2 border border-green-400 bg-green-50 text-green-700 font-black text-sm shrink-0 flex items-center gap-1">
                          <Check className="w-4 h-4" /> 지원완료
                        </span>
                      ) : (
                        <Link
                          to={`/admin/b2b/proposal?project_id=${proj.id}`}
                          className="px-4 py-2 bg-black text-white border border-black font-black text-sm hover:bg-orange-500 hover:text-black transition-colors shrink-0 flex items-center gap-1"
                        >
                          제안서 작성 <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}
    </div>
  );
}
