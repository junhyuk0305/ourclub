import { useState } from 'react';
import { Bell, X, UserCheck, FileEdit, Save } from 'lucide-react';
import { EmailModalState, EmailTemplate } from './types';

export function EmailMoveModal({
  state, templates, onChangeState, onConfirm, onSaveAsTemplate, onClose,
}: {
  state: EmailModalState;
  templates: EmailTemplate[];
  onChangeState: (s: EmailModalState) => void;
  onConfirm: (sendEmail: boolean) => void;
  onSaveAsTemplate: (name: string, asDefault: boolean) => void;
  onClose: () => void;
}) {
  const [showSave, setShowSave] = useState(false);
  const [tplName, setTplName] = useState('');
  const [asDefault, setAsDefault] = useState(true);

  // 불합격(탈락/거절) 단계는 '알림 없이 이동'을 골라도 결과가 항상 통보된다(고스팅 방지).
  // 분석/대시보드의 REJECT_KEYWORDS 와 동일 규칙.
  const isReject = ['불합격', '탈락', '거절', 'reject'].some(k =>
    state.toStage.toLowerCase().includes(k.toLowerCase()));

  const applyTemplate = (tpl: EmailTemplate) => {
    const fill = (s: string) => s
      .replace(/{{\s*name\s*}}/g, state.applicant.profiles?.name ?? '지원자')
      .replace(/{{\s*stage\s*}}/g, state.toStage);
    onChangeState({ ...state, subject: fill(tpl.subject), body: fill(tpl.body) });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-sand-200 rounded-card w-full max-w-2xl shadow-soft-lg flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-6 btn-grad text-white flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black flex items-center gap-2"><Bell className="w-5 h-5" strokeWidth={2.5} /> 단계 이동 알림</h3>
          <button onClick={onClose} className="opacity-80 hover:opacity-100 transition-opacity"><X className="w-5 h-5" strokeWidth={2.5} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-brand-tint rounded-card p-4 text-sm font-bold text-brand-dark flex gap-2 items-start">
            <UserCheck className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.5} />
            <p>
              <strong>{state.applicant.profiles?.name}</strong>님을{' '}
              <span className="bg-sand-200 px-1.5 py-0.5 rounded-md text-sand-600">{state.fromStage}</span>
              {' → '}<span className="bg-brand px-1.5 py-0.5 rounded-md text-white">{state.toStage}</span>{' '}으로 이동합니다.
            </p>
          </div>
          <div><label className="font-black text-sm mb-1 block text-ink">수신: <span className="font-bold text-sand-600">{state.applicant.profiles?.name ?? '지원자'}님 (마이페이지 인앱 알림)</span></label></div>

          {/* 템플릿 선택 */}
          {templates.length > 0 && (
            <div>
              <label className="font-bold text-xs block mb-1.5 text-sand-600">템플릿 불러오기</label>
              <select
                onChange={e => {
                  const tpl = templates.find(t => t.id === e.target.value);
                  if (tpl) applyTemplate(tpl);
                  e.target.value = '';
                }}
                defaultValue=""
                className="field w-full p-2 border border-sand-300 rounded-ctl font-bold outline-none text-sm bg-white"
              >
                <option value="" disabled>저장된 템플릿 선택...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.stage ? ` · ${t.stage}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="font-bold text-xs block mb-1.5 text-sand-600">제목</label>
            <input
              value={state.subject}
              onChange={e => onChangeState({ ...state, subject: e.target.value })}
              className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-xs block mb-1.5 text-sand-600">
              본문 <span className="font-medium text-sand-400">— 사용 가능 변수: {`{{name}}, {{recruitment_title}}, {{stage}}`}</span>
            </label>
            <textarea
              rows={6}
              value={state.body}
              onChange={e => onChangeState({ ...state, body: e.target.value })}
              className="field w-full p-4 border border-sand-300 rounded-ctl outline-none font-medium leading-relaxed resize-none text-sm"
            />
          </div>

          {showSave ? (
            <div className="border border-brand bg-brand-tint rounded-card p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-brand-dark">
                <FileEdit className="w-4 h-4" strokeWidth={2.5} /> 이 내용을 템플릿으로 저장
              </div>
              <input
                value={tplName}
                onChange={e => setTplName(e.target.value)}
                placeholder="템플릿 이름 (예: 면접 안내)"
                className="field w-full p-2 border border-sand-300 rounded-ctl font-bold outline-none text-sm bg-white"
              />
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-sand-600">
                <input type="checkbox" checked={asDefault} onChange={e => setAsDefault(e.target.checked)} className="accent-brand" />
                <span>'{state.toStage}' 단계 기본 템플릿으로 설정</span>
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowSave(false)} className="px-3 py-1.5 rounded-ctl border border-sand-300 font-bold text-xs text-ink hover:bg-white">취소</button>
                <button
                  onClick={() => { if (tplName.trim()) { onSaveAsTemplate(tplName.trim(), asDefault); setShowSave(false); setTplName(''); } }}
                  disabled={!tplName.trim()}
                  className="px-3 py-1.5 rounded-ctl btn-grad text-white shadow-btn font-bold text-xs disabled:opacity-40 flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" strokeWidth={2.5} /> 저장
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              className="self-start text-xs font-black text-brand hover:underline flex items-center gap-1"
            >
              <FileEdit className="w-3.5 h-3.5" strokeWidth={2.5} /> 이 내용을 템플릿으로 저장
            </button>
          )}

          <p className="text-xs text-sand-400 font-bold border-t border-sand-200 pt-3">
            ℹ 이 메시지는 지원자의 마이페이지에 인앱 알림으로 전송됩니다. (이메일 발송은 추후 지원 예정)
          </p>
          {isReject && (
            <p className="text-xs font-bold text-brand -mt-2">
              ℹ 불합격 결과는 지원자가 알 수 있도록 항상 통보됩니다. '기본 메시지로 통보'를 선택하면 기본 안내 문구로 전송돼요.
            </p>
          )}
        </div>
        <div className="p-6 border-t border-sand-200 bg-sand-50 flex justify-end gap-3 shrink-0">
          <button onClick={() => onConfirm(false)} className="px-6 py-2.5 rounded-ctl border border-sand-300 font-bold bg-white text-ink hover:bg-sand-50 text-sm">
            {isReject ? '기본 메시지로 통보' : '알림 없이 이동'}
          </button>
          <button onClick={() => onConfirm(true)} className="px-6 py-2.5 rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 font-bold transition-all flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4" strokeWidth={2.5} /> 알림 보내고 이동
          </button>
        </div>
      </div>
    </div>
  );
}
