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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-2 border-black w-full max-w-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[92vh]">
        <div className="p-6 border-b border-black bg-gray-50 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500" /> 단계 이동 알림</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-orange-50 border border-orange-200 p-4 text-sm font-bold text-orange-800 flex gap-2 items-start">
            <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              <strong>{state.applicant.profiles?.name}</strong>님을{' '}
              <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">{state.fromStage}</span>
              {' → '}<span className="bg-orange-500 px-1.5 py-0.5 rounded text-white">{state.toStage}</span>{' '}으로 이동합니다.
            </p>
          </div>
          <div><label className="font-black text-sm mb-1 block">수신: <span className="font-bold text-gray-600">{state.applicant.profiles?.name ?? '지원자'}님 (마이페이지 인앱 알림)</span></label></div>

          {/* 템플릿 선택 */}
          {templates.length > 0 && (
            <div>
              <label className="font-black text-xs block mb-1.5 text-gray-700">템플릿 불러오기</label>
              <select
                onChange={e => {
                  const tpl = templates.find(t => t.id === e.target.value);
                  if (tpl) applyTemplate(tpl);
                  e.target.value = '';
                }}
                defaultValue=""
                className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500 text-sm bg-white"
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
            <label className="font-black text-xs block mb-1.5 text-gray-700">제목</label>
            <input
              value={state.subject}
              onChange={e => onChangeState({ ...state, subject: e.target.value })}
              className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm"
            />
          </div>

          <div>
            <label className="font-black text-xs block mb-1.5 text-gray-700">
              본문 <span className="font-medium text-gray-400">— 사용 가능 변수: {`{{name}}, {{recruitment_title}}, {{stage}}`}</span>
            </label>
            <textarea
              rows={6}
              value={state.body}
              onChange={e => onChangeState({ ...state, body: e.target.value })}
              className="w-full p-4 border border-black outline-none focus:border-orange-500 font-medium leading-relaxed resize-none text-sm"
            />
          </div>

          {showSave ? (
            <div className="border-2 border-orange-300 bg-orange-50 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-orange-800">
                <FileEdit className="w-4 h-4" /> 이 내용을 템플릿으로 저장
              </div>
              <input
                value={tplName}
                onChange={e => setTplName(e.target.value)}
                placeholder="템플릿 이름 (예: 면접 안내)"
                className="w-full p-2 border border-black font-bold outline-none focus:border-orange-500 text-sm bg-white"
              />
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={asDefault} onChange={e => setAsDefault(e.target.checked)} className="accent-orange-500" />
                <span>'{state.toStage}' 단계 기본 템플릿으로 설정</span>
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowSave(false)} className="px-3 py-1.5 border border-black font-bold text-xs hover:bg-white">취소</button>
                <button
                  onClick={() => { if (tplName.trim()) { onSaveAsTemplate(tplName.trim(), asDefault); setShowSave(false); setTplName(''); } }}
                  disabled={!tplName.trim()}
                  className="px-3 py-1.5 bg-black text-white font-black text-xs hover:bg-orange-500 hover:text-black disabled:opacity-40 flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> 저장
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              className="self-start text-xs font-black text-orange-500 hover:underline flex items-center gap-1"
            >
              <FileEdit className="w-3.5 h-3.5" /> 이 내용을 템플릿으로 저장
            </button>
          )}

          <p className="text-xs text-gray-400 font-bold border-t border-gray-200 pt-3">
            ℹ 이 메시지는 지원자의 마이페이지에 인앱 알림으로 전송됩니다. (이메일 발송은 추후 지원 예정)
          </p>
          {isReject && (
            <p className="text-xs font-bold text-orange-600 -mt-2">
              ℹ 불합격 결과는 지원자가 알 수 있도록 항상 통보됩니다. '기본 메시지로 통보'를 선택하면 기본 안내 문구로 전송돼요.
            </p>
          )}
        </div>
        <div className="p-6 border-t border-black bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={() => onConfirm(false)} className="px-6 py-2.5 border border-black font-bold bg-white hover:bg-gray-100 text-sm">
            {isReject ? '기본 메시지로 통보' : '알림 없이 이동'}
          </button>
          <button onClick={() => onConfirm(true)} className="px-6 py-2.5 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors flex items-center gap-2 text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none">
            <Bell className="w-4 h-4" /> 알림 보내고 이동
          </button>
        </div>
      </div>
    </div>
  );
}
