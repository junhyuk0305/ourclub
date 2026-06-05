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
      <div className="border-2 border-black p-6 bg-white">
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-black text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-500" /> 이 지원자에게 할 면접 질문
          </h4>
          <button onClick={onSave} className="text-xs font-black text-white bg-blue-500 px-4 py-1.5 hover:bg-blue-600 transition-colors">저장</button>
        </div>
        {questions.length === 0 && (
          <p className="text-gray-400 font-bold text-sm mb-4">아직 등록된 질문이 없습니다. 아래에서 추가하세요.</p>
        )}
        <div className="flex flex-col gap-3 mb-4">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 w-6 shrink-0 text-right">{i + 1}.</span>
              <input
                value={q}
                onChange={e => update(i, e.target.value)}
                className="flex-1 p-2.5 border border-black font-medium text-sm outline-none focus:border-orange-500"
                placeholder={`면접 질문 ${i + 1}`}
              />
              <button onClick={() => remove(i)} className="p-1.5 hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button onClick={add} className="text-sm font-bold text-blue-500 hover:underline flex items-center gap-1">
          <Plus className="w-4 h-4" /> 질문 추가
        </button>
      </div>
    </div>
  );
}
