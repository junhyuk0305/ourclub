import { HelpCircle, X, Plus } from 'lucide-react';

// ── 면접 질문 탭 ─────────────────────────────────────────────────────────
export function InterviewTabContent({
  questions, setQuestions, onSave,
}: { questions: string[]; setQuestions: (q: string[]) => void; onSave: () => void }) {
  const update = (i: number, v: string) => setQuestions(questions.map((q, idx) => idx === i ? v : q));
  const remove = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));
  const add = () => setQuestions([...questions, '']);

  return (
    <div className="p-8">
      <div className="border border-sand-200 rounded-card shadow-soft p-6 bg-white">
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-black text-sm text-ink flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand" strokeWidth={2.5} /> 이 지원자에게 할 면접 질문
          </h4>
          <button onClick={onSave} className="text-xs font-bold text-white btn-grad shadow-btn px-4 py-1.5 rounded-ctl transition-all">저장</button>
        </div>
        {questions.length === 0 && (
          <p className="text-sand-400 font-bold text-sm mb-4">아직 등록된 질문이 없습니다. 아래에서 추가하세요.</p>
        )}
        <div className="flex flex-col gap-3 mb-4">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-black text-sand-400 w-6 shrink-0 text-right">{i + 1}.</span>
              <input
                value={q}
                onChange={e => update(i, e.target.value)}
                className="field flex-1 p-2.5 border border-sand-300 rounded-ctl font-medium text-sm outline-none"
                placeholder={`면접 질문 ${i + 1}`}
              />
              <button onClick={() => remove(i)} className="p-1.5 text-sand-500 hover:text-red-500 shrink-0"><X className="w-4 h-4" strokeWidth={2.5} /></button>
            </div>
          ))}
        </div>
        <button onClick={add} className="text-sm font-bold text-brand hover:underline flex items-center gap-1">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> 질문 추가
        </button>
      </div>
    </div>
  );
}
