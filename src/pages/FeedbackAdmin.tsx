import React, { useEffect, useState } from 'react';
import { Plus, Star, Loader, X, Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';

interface PulseSurvey {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

interface PulseResponse {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  user_profiles: {
    display_name: string | null;
  } | null;
}

interface SurveyDetail {
  survey: PulseSurvey;
  responses: PulseResponse[];
  avg: number | null;
  totalMembers: number;
}

export default function FeedbackAdmin() {
  const { adminClubId } = useAdmin();
  const [surveys, setSurveys] = useState<PulseSurvey[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, SurveyDetail>>({});
  const [totalMembers, setTotalMembers] = useState(0);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!adminClubId) return;
    loadAll(adminClubId);
  }, [adminClubId]);

  const loadAll = async (clubId: string) => {
    setFetching(true);
    const [{ data: surveyData }, { count }] = await Promise.all([
      supabase
        .from('pulse_surveys')
        .select('id, title, is_active, created_at')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false }),
      supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('status', '활동중'),
    ]);
    setSurveys((surveyData as PulseSurvey[]) ?? []);
    setTotalMembers(count ?? 0);
    setFetching(false);
  };

  const loadDetail = async (survey: PulseSurvey) => {
    if (details[survey.id]) return;
    const { data } = await supabase
      .from('pulse_responses')
      .select('id, score, comment, created_at, user_profiles(display_name)')
      .eq('survey_id', survey.id)
      .order('created_at', { ascending: false });
    const responses = (data as PulseResponse[]) ?? [];
    const avg = responses.length > 0
      ? Math.round(responses.reduce((s, r) => s + r.score, 0) / responses.length * 10) / 10
      : null;
    setDetails(prev => ({ ...prev, [survey.id]: { survey, responses, avg, totalMembers } }));
  };

  const handleCreate = async () => {
    if (!adminClubId || !newTitle.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('pulse_surveys')
      .insert({ club_id: adminClubId, title: newTitle.trim(), is_active: true })
      .select()
      .single();
    setCreating(false);
    if (error || !data) { showToast('생성 실패: ' + error?.message); return; }
    setSurveys(prev => [data as PulseSurvey, ...prev]);
    setNewTitle('');
    setShowNewModal(false);
    showToast('설문이 생성되었습니다.');
  };

  const handleToggleActive = async (survey: PulseSurvey) => {
    const next = !survey.is_active;
    await supabase.from('pulse_surveys').update({ is_active: next }).eq('id', survey.id);
    setSurveys(prev => prev.map(s => s.id === survey.id ? { ...s, is_active: next } : s));
    showToast(next ? '설문을 활성화했습니다.' : '설문을 종료했습니다.');
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const stars = (score: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-3.5 h-3.5 ${i < score ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`} />
  ));

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        <button
          onClick={() => setShowNewModal(true)}
          className="ml-4 px-6 py-2 border border-black bg-black text-white font-black hover:bg-gray-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 새 설문 생성
        </button>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-3xl flex flex-col gap-8">
            <div>
              <h2 className="text-4xl font-black mb-2">만족도 조사 (Pulse)</h2>
              <p className="text-gray-500 font-bold">부원들의 피드백을 수집하여 동아리 건강도를 파악합니다.</p>
            </div>

            {fetching ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : surveys.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 p-16 flex flex-col items-center gap-4 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300" />
                <p className="font-black text-gray-400 text-lg">생성된 설문이 없습니다.</p>
                <button onClick={() => setShowNewModal(true)} className="px-6 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors">
                  첫 설문 만들기
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {surveys.map(survey => {
                  const isExpanded = expandedId === survey.id;
                  const detail = details[survey.id];
                  const responseCount = detail?.responses.length ?? 0;
                  const responseRate = totalMembers > 0 ? Math.round(responseCount / totalMembers * 100) : 0;

                  return (
                    <div key={survey.id} className="bg-white border border-black overflow-hidden">
                      <div
                        className={`p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-orange-50/40' : ''}`}
                        onClick={async () => {
                          if (!isExpanded) await loadDetail(survey);
                          setExpandedId(isExpanded ? null : survey.id);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`px-2 py-1 text-xs font-black border ${survey.is_active ? 'bg-orange-500 text-white border-orange-600' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                            {survey.is_active ? '진행 중' : '종료'}
                          </div>
                          <div>
                            <h3 className="font-black text-lg">{survey.title}</h3>
                            <p className="text-xs text-gray-400 font-bold mt-0.5">
                              {new Date(survey.created_at).toLocaleDateString('ko-KR')}
                              {detail && ` · 응답 ${responseCount}명 (${responseRate}%)`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {detail?.avg != null && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                              <span className="font-black text-orange-500">{detail.avg}</span>
                            </div>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handleToggleActive(survey); }}
                            className={`px-3 py-1.5 border font-black text-xs transition-colors ${survey.is_active ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                          >
                            {survey.is_active ? '설문 종료' : '다시 활성화'}
                          </button>
                          {isExpanded ? <ChevronUp className="text-gray-400 w-5 h-5" /> : <ChevronDown className="text-gray-400 w-5 h-5" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-black p-6 bg-gray-50">
                          {!detail ? (
                            <div className="flex justify-center py-4"><Loader className="w-5 h-5 animate-spin text-gray-400" /></div>
                          ) : detail.responses.length === 0 ? (
                            <p className="text-center text-gray-400 font-bold py-4">아직 응답이 없습니다.</p>
                          ) : (
                            <div className="flex flex-col gap-6">
                              <div className="flex flex-col gap-6">
                                {/* 집계 */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-white border border-black p-4 text-center">
                                    <p className="text-3xl font-black text-orange-500">{detail.avg ?? '—'}</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1">평균 점수 (5점 만점)</p>
                                  </div>
                                  <div className="bg-white border border-black p-4 text-center">
                                    <p className="text-3xl font-black text-black">{responseCount}명</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1">응답자 수</p>
                                  </div>
                                  <div className="bg-white border border-black p-4 text-center">
                                    <p className="text-3xl font-black text-gray-500">{responseRate}%</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1">응답률</p>
                                  </div>
                                </div>

                                {/* 피드백 목록 */}
                                <div className="flex flex-col gap-4">
                                  <h4 className="font-black text-lg">모든 피드백</h4>
                                  {detail.responses.map(response => (
                                    <div key={response.id} className="bg-white border border-gray-200 p-4">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-1">
                                          {stars(response.score)}
                                          <span className="text-sm font-bold text-gray-500 ml-1">
                                            {response.user_profiles?.display_name ?? '익명'}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                          {new Date(response.created_at).toLocaleDateString('ko-KR')}
                                        </p>
                                      </div>
                                      {response.comment && (
                                        <p className="text-sm font-medium text-gray-700 mt-2">{response.comment}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-black mb-3">점수 분포</h4>
                                <div className="flex flex-col gap-2">
                                  {[5, 4, 3, 2, 1].map(score => {
                                    const cnt = detail.responses.filter(r => r.score === score).length;
                                    const pct = detail.responses.length > 0 ? Math.round(cnt / detail.responses.length * 100) : 0;
                                    return (
                                      <div key={score} className="flex items-center gap-3">
                                        <div className="flex items-center gap-0.5 w-20">{stars(score)}</div>
                                        <div className="flex-1 h-3 bg-gray-200 border border-gray-300">
                                          <div className="h-full bg-orange-400" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 w-12 text-right">{cnt}명 ({pct}%)</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 코멘트 */}
                              {detail.responses.some(r => r.comment) && (
                                <div>
                                  <h4 className="font-black mb-3">자유 의견</h4>
                                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                                    {detail.responses.filter(r => r.comment).map(r => (
                                      <div key={r.id} className="bg-white border border-gray-200 p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="flex items-center gap-0.5">{stars(r.score)}</div>
                                          <span className="text-xs text-gray-400 font-bold">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">{r.comment}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 새 설문 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">새 만족도 조사 만들기</h2>
              <button onClick={() => setShowNewModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-gray-500 font-bold text-sm">설문을 생성하면 부원 마이페이지에 배너로 표시됩니다.</p>
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">설문 제목 *</label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="예: 3월 정규 세션 만족도 조사"
                className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500"
              />
            </div>
            <p className="text-xs text-gray-400 font-bold">* 부원들은 1~5점 별점과 자유 의견을 남길 수 있습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100">취소</button>
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader className="w-4 h-4 animate-spin" />} 생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}
    </div>
  );
}
