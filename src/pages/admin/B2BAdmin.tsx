import React, { useEffect, useState } from 'react';
import { Building2, ChevronRight, FileOutput, Check, Calendar, Tag } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Link } from 'react-router-dom';
import { AdminHeaderPortal } from './AdminLayout';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import B2BHandoffModal, { type HandoffApp } from '../../components/b2b/B2BHandoffModal';

type AppStatus = '미열람' | '검토중' | '미팅요청' | '매칭완료' | '거절';

interface MyApplication {
  id: string;
  proposal_text: string | null;
  status: AppStatus;
  submitted_at: string;
  b2b_projects: {
    id: string;
    title: string;
    category: string;
    budget: number | null;
    status: string;
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
  '미열람':  'bg-off-bg text-off-fg',
  '검토중':  'bg-warn-bg text-warn-fg',
  '미팅요청': 'bg-info-bg text-info-fg',
  '매칭완료': 'bg-ok-bg text-ok-fg',
  '거절':    'bg-bad-bg text-bad-fg',
};

export default function B2BAdmin() {
  const { adminClubId, adminClub } = useAdmin();
  const [tab, setTab] = useState<'내지원' | '탐색'>('내지원');
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [handoffApp, setHandoffApp] = useState<HandoffApp | null>(null);

  useEffect(() => {
    if (!adminClubId) return;
    loadAll(adminClubId);
  }, [adminClubId]);

  const loadAll = async (clubId: string) => {
    setFetching(true);

    const [{ data: apps }, { data: allProjects }] = await Promise.all([
      supabase
        .from('b2b_applications')
        .select('id, proposal_text, status, submitted_at, b2b_projects(id, title, category, budget, status, corporations(name))')
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
    <>
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-5xl flex flex-col gap-8">
            <div>
              <h2 className="text-4xl font-black text-ink mb-2">기업 협업 프로젝트</h2>
              <p className="text-sand-500 font-bold">기업과 매칭된 프로젝트를 탐색하고 지원 현황을 관리합니다.</p>
            </div>

            <div className="flex gap-1 p-1 bg-sand-100 rounded-ctl w-fit">
              {(['내지원', '탐색'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-6 py-2 font-bold rounded-ctl transition-all ${tab === t ? 'bg-white text-ink shadow-soft' : 'text-sand-500 hover:text-ink'}`}
                >
                  {t === '내지원' ? `내 지원 현황 (${myApps.length})` : '프로젝트 탐색'}
                </button>
              ))}
            </div>

            {fetching ? (
              <LoadingScreen />
            ) : tab === '내지원' ? (
              myApps.length === 0 ? (
                <div className="border border-dashed border-sand-300 rounded-card p-16 flex flex-col items-center gap-4 text-center">
                  <Building2 className="w-12 h-12 text-sand-300" strokeWidth={2.5} />
                  <p className="font-black text-sand-400 text-lg">지원한 프로젝트가 없습니다.</p>
                  <button onClick={() => setTab('탐색')} className="px-6 py-3 rounded-ctl btn-grad text-white shadow-btn font-bold transition-all">
                    프로젝트 탐색하기
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sand-50 border-b border-sand-200 text-sm">
                        <th className="p-4 font-bold text-sand-500">기업명</th>
                        <th className="p-4 font-bold text-sand-500">프로젝트명</th>
                        <th className="p-4 font-bold text-sand-500">상태</th>
                        <th className="p-4 font-bold text-sand-500">예산 / 지원일</th>
                        <th className="p-4 font-bold text-sand-500">진행</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-200">
                      {myApps.map(app => (
                        <tr key={app.id} className="hover:bg-sand-50 transition-colors">
                          <td className="p-4 font-bold text-ink flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center border border-sand-200">
                              <Building2 className="w-4 h-4 text-sand-500" strokeWidth={2.5} />
                            </div>
                            {app.b2b_projects?.corporations?.name ?? '—'}
                          </td>
                          <td className="p-4">
                            <p className="font-black text-lg text-ink">{app.b2b_projects?.title ?? '—'}</p>
                            <p className="text-xs text-sand-400 font-bold mt-0.5">{app.b2b_projects?.category}</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 font-bold text-xs rounded-ctl ${STATUS_STYLE[app.status]}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-brand">{formatBudget(app.b2b_projects?.budget ?? null)}</p>
                            <p className="text-xs font-bold text-sand-400 mt-1">
                              {formatDate(app.submitted_at)}
                            </p>
                          </td>
                          <td className="p-4">
                            {app.status === '매칭완료' && app.b2b_projects && adminClubId ? (
                              <button
                                onClick={() => setHandoffApp({
                                  applicationId: app.id,
                                  projectId: app.b2b_projects!.id,
                                  clubId: adminClubId,
                                  projectTitle: app.b2b_projects!.title,
                                  clubName: adminClub?.name ?? '우리 동아리',
                                  projectStatus: app.b2b_projects!.status,
                                })}
                                className="px-4 py-2 rounded-ctl btn-grad text-white shadow-btn font-bold text-xs transition-all flex items-center gap-1 whitespace-nowrap"
                              >
                                프로젝트 진행 <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-sand-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              projects.length === 0 ? (
                <div className="border border-dashed border-sand-300 rounded-card p-16 flex flex-col items-center gap-4 text-center">
                  <Building2 className="w-12 h-12 text-sand-300" strokeWidth={2.5} />
                  <p className="font-black text-sand-400 text-lg">현재 모집 중인 기업 프로젝트가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {projects.map(proj => (
                    <div key={proj.id} className="bg-white border border-sand-200 rounded-card p-6 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all flex justify-between items-start gap-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-sand-100 flex items-center justify-center border border-sand-200 shrink-0">
                          <Building2 className="w-5 h-5 text-sand-500" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-sand-500 bg-sand-100 px-2 py-0.5 rounded-ctl">{proj.category}</span>
                            <span className="text-xs font-bold text-sand-400">{proj.corporations?.name}</span>
                            {proj.deadline && (
                              <span className="text-xs font-bold text-sand-400 flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" strokeWidth={2.5} />
                                {formatDate(proj.deadline)} 마감
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-xl mb-1 text-ink">{proj.title}</h3>
                          {proj.description && <p className="text-sm font-bold text-sand-500 line-clamp-2">{proj.description}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <p className="text-sm font-black text-brand">예산: {formatBudget(proj.budget)}</p>
                            {proj.required_skills?.length > 0 && proj.required_skills.slice(0, 3).map(s => (
                              <span key={s} className="flex items-center gap-0.5 px-2 py-0.5 rounded-ctl bg-brand-tint text-brand text-xs font-bold">
                                <Tag className="w-2.5 h-2.5" strokeWidth={2.5} />{s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {proj.already_applied ? (
                        <span className="px-4 py-2 rounded-ctl bg-ok-bg text-ok-fg font-bold text-sm shrink-0 flex items-center gap-1">
                          <Check className="w-4 h-4" strokeWidth={2.5} /> 지원완료
                        </span>
                      ) : (
                        <Link
                          to={`/admin/b2b/proposal?project_id=${proj.id}`}
                          className="px-4 py-2 rounded-ctl btn-grad text-white shadow-btn font-bold text-sm transition-all shrink-0 flex items-center gap-1"
                        >
                          제안서 작성 <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </main>

      <AdminHeaderPortal>
        <Link
          to="/admin/b2b/proposal"
          className="ml-4 px-6 py-2 rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2 font-bold"
        >
          <FileOutput className="w-4 h-4" strokeWidth={2.5} /> 새 제안서 작성
        </Link>
      </AdminHeaderPortal>

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-ink text-white px-6 py-4 rounded-card font-bold flex items-center gap-2 shadow-soft-lg">
          <Check className="w-4 h-4 text-ok-fg" strokeWidth={2.5} /> {toast}
        </div>
      )}

      {handoffApp && (
        <B2BHandoffModal
          side="club"
          app={handoffApp}
          onClose={() => { setHandoffApp(null); if (adminClubId) loadAll(adminClubId); }}
        />
      )}
    </>
  );
}
