import React, { useEffect, useState } from 'react';
import { Plus, Star, Loader, X, Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { AdminHeaderPortal } from './AdminLayout';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll } from '../../lib/fetchAll';
import { formatDate } from '../../lib/format';

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
  user_id: string;
  profiles: {
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
    const { data } = await fetchAll<any>((from, to) => supabase
      .from('pulse_responses')
      .select('id, score, comment, created_at, user_id, profiles(display_name)')
      .eq('survey_id', survey.id)
      .order('created_at', { ascending: false })
      .range(from, to));
    const responses = (data as unknown as PulseResponse[]) ?? [];
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
    <Star key={i} strokeWidth={2.5} className={`w-3.5 h-3.5 ${i < score ? 'text-brand fill-brand' : 'text-sand-300'}`} />
  ));

  return (
    <>
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-3xl flex flex-col gap-8">
            <div>
              <h2 className="text-4xl font-black text-ink mb-2">만족도 조사 (Pulse)</h2>
              <p className="text-sand-600 font-medium">부원들의 피드백을 수집하여 동아리 건강도를 파악합니다.</p>
            </div>

            {fetching ? (
              <LoadingScreen />
            ) : surveys.length === 0 ? (
              <div className="border border-dashed border-sand-300 rounded-card p-16 flex flex-col items-center gap-4 text-center">
                <MessageSquare strokeWidth={2.5} className="w-12 h-12 text-sand-300" />
                <p className="font-black text-sand-400 text-lg">생성된 설문이 없습니다.</p>
                <button onClick={() => setShowNewModal(true)} className="px-6 py-3 rounded-ctl bg-brand text-white font-bold shadow-btn hover:bg-brand-dark transition-colors">
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
                    <div key={survey.id} className="bg-white border border-sand-200 rounded-card shadow-soft overflow-hidden">
                      <div
                        className={`p-6 flex justify-between items-center cursor-pointer hover:bg-sand-50 transition-colors ${isExpanded ? 'bg-brand-tint' : ''}`}
                        onClick={async () => {
                          if (!isExpanded) await loadDetail(survey);
                          setExpandedId(isExpanded ? null : survey.id);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`px-2 py-1 text-xs font-bold rounded-md ${survey.is_active ? 'bg-ok-bg text-ok-fg' : 'bg-off-bg text-off-fg'}`}>
                            {survey.is_active ? '진행 중' : '종료'}
                          </div>
                          <div>
                            <h3 className="font-black text-ink text-lg">{survey.title}</h3>
                            <p className="text-xs text-sand-400 font-medium mt-0.5">
                              {formatDate(survey.created_at)}
                              {detail && ` · 응답 ${responseCount}명 (${responseRate}%)`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {detail?.avg != null && (
                            <div className="flex items-center gap-1">
                              <Star strokeWidth={2.5} className="w-4 h-4 text-brand fill-brand" />
                              <span className="font-black text-brand">{detail.avg}</span>
                            </div>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handleToggleActive(survey); }}
                            className={`px-3 py-1.5 border border-sand-300 rounded-ctl font-bold text-xs transition-colors ${survey.is_active ? 'text-bad-fg hover:bg-bad-bg' : 'text-ok-fg hover:bg-ok-bg'}`}
                          >
                            {survey.is_active ? '설문 종료' : '다시 활성화'}
                          </button>
                          {isExpanded ? <ChevronUp strokeWidth={2.5} className="text-sand-400 w-5 h-5" /> : <ChevronDown strokeWidth={2.5} className="text-sand-400 w-5 h-5" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-sand-200 p-6 bg-sand-50">
                          {!detail ? (
                            <div className="flex justify-center py-4"><Loader strokeWidth={2.5} className="w-5 h-5 animate-spin text-sand-400" /></div>
                          ) : detail.responses.length === 0 ? (
                            <p className="text-center text-sand-400 font-medium py-4">아직 응답이 없습니다.</p>
                          ) : (
                            <div className="flex flex-col gap-6">
                              <div className="flex flex-col gap-6">
                                {/* 집계 */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-white border border-sand-200 rounded-card shadow-soft p-4 text-center">
                                    <p className="text-3xl font-black text-brand">{detail.avg ?? '—'}</p>
                                    <p className="text-xs font-medium text-sand-500 mt-1">평균 점수 (5점 만점)</p>
                                  </div>
                                  <div className="bg-white border border-sand-200 rounded-card shadow-soft p-4 text-center">
                                    <p className="text-3xl font-black text-ink">{responseCount}명</p>
                                    <p className="text-xs font-medium text-sand-500 mt-1">응답자 수</p>
                                  </div>
                                  <div className="bg-white border border-sand-200 rounded-card shadow-soft p-4 text-center">
                                    <p className="text-3xl font-black text-sand-500">{responseRate}%</p>
                                    <p className="text-xs font-medium text-sand-500 mt-1">응답률</p>
                                  </div>
                                </div>

                                {/* 피드백 목록 */}
                                <div className="flex flex-col gap-4">
                                  <h4 className="font-black text-ink text-lg">모든 피드백</h4>
                                  {detail.responses.map(response => (
                                    <div key={response.id} className="bg-white border border-sand-200 rounded-card p-4" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 96px' }}>
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-1">
                                          {stars(response.score)}
                                          <span className="text-sm font-bold text-sand-500 ml-1">
                                            {response.profiles?.display_name ?? '익명'}
                                          </span>
                                        </div>
                                        <p className="text-xs text-sand-400">
                                          {formatDate(response.created_at)}
                                        </p>
                                      </div>
                                      {response.comment && (
                                        <p className="text-sm font-medium text-sand-600 mt-2">{response.comment}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-black text-ink mb-3">점수 분포</h4>
                                <div className="flex flex-col gap-2">
                                  {[5, 4, 3, 2, 1].map(score => {
                                    const cnt = detail.responses.filter(r => r.score === score).length;
                                    const pct = detail.responses.length > 0 ? Math.round(cnt / detail.responses.length * 100) : 0;
                                    return (
                                      <div key={score} className="flex items-center gap-3">
                                        <div className="flex items-center gap-0.5 w-20">{stars(score)}</div>
                                        <div className="flex-1 h-3 rounded-md bg-sand-100 border border-sand-200">
                                          <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-sand-500 w-12 text-right">{cnt}명 ({pct}%)</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 코멘트 */}
                              {detail.responses.some(r => r.comment) && (
                                <div>
                                  <h4 className="font-black text-ink mb-3">자유 의견</h4>
                                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                                    {detail.responses.filter(r => r.comment).map(r => (
                                      <div key={r.id} className="bg-white border border-sand-200 rounded-card p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="flex items-center gap-0.5">{stars(r.score)}</div>
                                          <span className="text-xs text-sand-400 font-bold">{formatDate(r.created_at)}</span>
                                        </div>
                                        <p className="text-sm font-bold text-sand-600">{r.comment}</p>
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

      <AdminHeaderPortal>
        <button
          onClick={() => setShowNewModal(true)}
          className="ml-4 px-6 py-2 rounded-ctl bg-brand text-white font-bold hover:bg-brand-dark transition-colors shadow-btn text-sm flex items-center gap-2"
        >
          <Plus strokeWidth={2.5} className="w-4 h-4" /> 새 설문 생성
        </button>
      </AdminHeaderPortal>

      {/* 새 설문 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-md mx-4 p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-ink">새 만족도 조사 만들기</h2>
              <button onClick={() => setShowNewModal(false)}><X strokeWidth={2.5} className="w-5 h-5" /></button>
            </div>
            <p className="text-sand-500 font-medium text-sm">설문을 생성하면 부원 마이페이지에 배너로 표시됩니다.</p>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-ink text-sm">설문 제목 *</label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="예: 3월 정규 세션 만족도 조사"
                className="field w-full p-3 border border-sand-300 rounded-ctl font-bold outline-none"
              />
            </div>
            <p className="text-xs text-sand-400 font-medium">* 부원들은 1~5점 별점과 자유 의견을 남길 수 있습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-3 border border-sand-300 rounded-ctl font-bold text-ink hover:bg-sand-100">취소</button>
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="flex-1 py-3 rounded-ctl bg-brand text-white font-bold shadow-btn hover:bg-brand-dark disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader strokeWidth={2.5} className="w-4 h-4 animate-spin" />} 생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-ink text-white px-6 py-4 rounded-card font-bold flex items-center gap-2 shadow-soft-lg">
          <Check strokeWidth={2.5} className="w-4 h-4 text-ok-bg" /> {toast}
        </div>
      )}
    </>
  );
}
