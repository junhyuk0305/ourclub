import { useState, useEffect } from 'react';
import { X, Check, Star, Loader } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

// ──────────────────────────────────────────
// Phase 5: Pulse Check 배너
// ──────────────────────────────────────────
export default function PulseCheckBanner() {
  const { user } = useAuth();
  const [survey, setSurvey] = useState<{ id: string; title: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;
    // 1. 내가 속한 동아리 목록 조회
    supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('status', '활동중')
      .then(async ({ data: memberships }) => {
        if (!memberships || memberships.length === 0) return;
        const clubIds = memberships.map(m => m.club_id);
        // 2. 해당 동아리의 진행중 설문 조회
        const { data } = await supabase
          .from('pulse_surveys')
          .select('id, title')
          .in('club_id', clubIds)
          .eq('status', '진행중')
          .limit(1)
          .maybeSingle();
        if (data) setSurvey(data);
      });
  }, [user, dismissed]);

  if (!survey || dismissed) return null;

  return (
    <>
      <div className="border border-sand-200 rounded-card bg-brand-tint p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-soft">
        <div>
          <div className="flex items-center gap-2 text-brand-dark font-bold text-sm mb-1 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Pulse Check
          </div>
          <h3 className="text-xl font-black text-ink mb-1">{survey.title}</h3>
          <p className="font-bold text-sand-600 text-sm">익명으로 진행되며, 더 나은 동아리 활동을 위해 활용됩니다.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="px-4 py-2 bg-white text-ink border border-sand-300 rounded-ctl font-bold text-sm hover:bg-sand-50 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 btn-grad text-white rounded-ctl font-bold shadow-btn hover:-translate-y-0.5 transition-all whitespace-nowrap"
          >
            참여하기
          </button>
        </div>
      </div>

      {showModal && (
        <PulseCheckModal
          surveyId={survey.id}
          surveyTitle={survey.title}
          onClose={() => { setShowModal(false); setDismissed(true); }}
        />
      )}
    </>
  );
}

// ──────────────────────────────────────────
// Phase 5: Pulse Check 응답 모달
// ──────────────────────────────────────────
function PulseCheckModal({ surveyId, surveyTitle, onClose }: {
  surveyId: string; surveyTitle: string; onClose: () => void;
}) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) return;
    setSubmitting(true);
    await supabase.from('pulse_responses').insert({ survey_id: surveyId, score, feedback: feedback.trim() || null });
    setSubmitting(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-md mx-4 p-8">
        {done ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Check className="w-12 h-12 text-ok-fg" strokeWidth={2.5} />
            <p className="font-black text-xl text-ink">응답이 제출되었습니다!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-ink">{surveyTitle}</h2>
              <button onClick={onClose} className="text-sand-400 hover:text-brand transition-colors"><X className="w-6 h-6" strokeWidth={2.5} /></button>
            </div>

            <p className="font-bold text-sand-600 mb-6 text-sm">이번 활동은 어땠나요? (익명)</p>

            {/* 별점 */}
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${n <= score ? 'text-brand fill-brand' : 'text-sand-300'}`}
                  />
                </button>
              ))}
            </div>
            {score > 0 && (
              <p className="text-center font-black text-sm mb-4 text-sand-500">
                {['', '매우 불만족', '불만족', '보통', '만족', '매우 만족'][score]}
              </p>
            )}

            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="자유롭게 의견을 남겨주세요. (선택)"
              rows={3}
              className="field w-full border border-sand-300 rounded-ctl px-4 py-3 font-bold text-ink outline-none transition-colors resize-none mb-6 placeholder:text-sand-400"
            />

            <button
              onClick={handleSubmit}
              disabled={score === 0 || submitting}
              className="w-full py-3 btn-grad text-white rounded-ctl font-bold shadow-btn hover:-translate-y-0.5 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting && <Loader className="w-4 h-4 animate-spin" />}
              익명으로 제출
            </button>
          </>
        )}
      </div>
    </div>
  );
}
