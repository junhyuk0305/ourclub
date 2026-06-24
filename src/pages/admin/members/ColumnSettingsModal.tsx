import { useState } from 'react';
import { X, AlertTriangle, Settings, Trash2, Eye, EyeOff, Plus, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import type { CustomField, CustomFieldType, NewCustomField } from './types';
import { CUSTOM_FIELD_TYPE_LABELS } from './types';

interface ColumnSettingsModalProps {
  fields: CustomField[];
  hiddenCols: Set<string>;
  onAdd: (field: NewCustomField) => Promise<void>;
  onDelete: (fieldId: string) => Promise<void>;
  onToggleVisibility: (fieldId: string) => void;
  onReorder: (fieldId: string, dir: -1 | 1) => void;
  onClose: () => void;
}

const TYPES = Object.keys(CUSTOM_FIELD_TYPE_LABELS) as CustomFieldType[];

export function ColumnSettingsModal({ fields, hiddenCols, onAdd, onDelete, onToggleVisibility, onReorder, onClose }: ColumnSettingsModalProps) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CustomFieldType>('text');
  const [newOptions, setNewOptions] = useState('');
  const [newRequired, setNewRequired] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomField | null>(null);

  const parseOptions = (raw: string): string[] =>
    raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

  const optionsInvalid = newType === 'select' && parseOptions(newOptions).length === 0;

  const submit = async () => {
    if (!newName.trim() || adding || optionsInvalid) return;
    setAdding(true);
    await onAdd({
      name: newName,
      field_type: newType,
      options: newType === 'select' ? parseOptions(newOptions) : [],
      required: newRequired,
    });
    setNewName(''); setNewType('text'); setNewOptions(''); setNewRequired(false);
    setAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-md mx-4 p-7 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-ink flex items-center gap-2">
              <Settings className="w-5 h-5" strokeWidth={2.5} /> 항목 설정
            </h2>
            <p className="text-xs font-bold text-sand-500 mt-1">동아리 고유 항목을 추가·정렬하거나 숨길 수 있습니다.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" strokeWidth={2.5} /></button>
        </div>

        {/* 기본 항목 안내 */}
        <div className="bg-sand-50 border border-sand-200 rounded-ctl p-3 text-xs font-bold text-sand-500">
          기본 항목(이름, 학교, 기수, 출석률, 상태)은 항상 표시됩니다.
        </div>

        {/* 추가 항목 */}
        <div className="flex flex-col gap-2">
          <label className="font-black text-sm text-ink">운영진 추가 항목</label>
          {fields.length === 0 ? (
            <p className="text-xs font-bold text-sand-400 py-2">아직 추가된 항목이 없습니다.</p>
          ) : (
            <div className="flex flex-col border border-sand-200 rounded-ctl overflow-hidden">
              {fields.map((f, i) => {
                const hidden = hiddenCols.has(f.id);
                return (
                  <div key={f.id} className="flex items-center justify-between px-3 py-2 border-b border-sand-200 last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex flex-col">
                        <button
                          onClick={() => onReorder(f.id, -1)}
                          disabled={i === 0}
                          title="위로"
                          className="text-sand-400 hover:text-ink disabled:opacity-20 leading-none"
                        >
                          <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => onReorder(f.id, 1)}
                          disabled={i === fields.length - 1}
                          title="아래로"
                          className="text-sand-400 hover:text-ink disabled:opacity-20 leading-none"
                        >
                          <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                      <span className={`font-bold text-sm truncate ${hidden ? 'text-sand-400 line-through' : 'text-ink'}`}>
                        {f.name}
                        {f.required && <span className="text-bad-fg ml-0.5">*</span>}
                      </span>
                      <span className="shrink-0 px-1.5 py-0.5 bg-sand-100 rounded-md text-[10px] font-black text-sand-500">
                        {CUSTOM_FIELD_TYPE_LABELS[f.field_type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleVisibility(f.id)}
                        title={hidden ? '표시' : '숨기기'}
                        className="p-1.5 rounded-ctl hover:bg-sand-100 text-sand-500 hover:text-ink"
                      >
                        {hidden ? <EyeOff className="w-4 h-4" strokeWidth={2.5} /> : <Eye className="w-4 h-4" strokeWidth={2.5} />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(f)}
                        title="삭제"
                        className="p-1.5 rounded-ctl hover:bg-bad-bg text-sand-400 hover:text-bad-fg"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 새 항목 추가 */}
        <div className="flex flex-col gap-2 border border-sand-200 rounded-ctl p-3 bg-sand-50">
          <label className="font-black text-sm text-ink">새 항목 추가</label>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newType !== 'select') { e.preventDefault(); submit(); } }}
            placeholder="항목 이름 (예: MBTI, 회비 납부)"
            className="field p-2 border border-sand-300 rounded-ctl font-bold text-sm"
          />

          {/* 타입 선택 */}
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`px-2.5 py-1 rounded-ctl font-black text-xs ${
                  newType === t ? 'btn-grad text-white' : 'bg-white border border-sand-300 text-sand-500 hover:bg-sand-100'
                }`}
              >
                {CUSTOM_FIELD_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* 선택형 옵션 */}
          {newType === 'select' && (
            <div className="flex flex-col gap-1">
              <textarea
                value={newOptions}
                onChange={e => setNewOptions(e.target.value)}
                placeholder="옵션을 쉼표 또는 줄바꿈으로 구분 (예: 납부, 미납, 면제)"
                rows={2}
                className="field p-2 border border-sand-300 rounded-ctl font-bold text-xs resize-y"
              />
              {optionsInvalid && <span className="text-[11px] font-bold text-bad-fg">옵션을 1개 이상 입력하세요.</span>}
            </div>
          )}

          <label className="flex items-center gap-2 font-bold text-xs text-sand-600 cursor-pointer">
            <input
              type="checkbox"
              checked={newRequired}
              onChange={e => setNewRequired(e.target.checked)}
              className="w-4 h-4 accent-brand"
            />
            필수 항목 (헤더에 * 표시)
          </label>

          <button
            onClick={submit}
            disabled={!newName.trim() || adding || optionsInvalid}
            className="px-3 py-2 btn-grad text-white rounded-ctl shadow-btn font-black text-xs disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {adding ? <Loader className="w-3 h-3 animate-spin" strokeWidth={2.5} /> : <Plus className="w-3 h-3" strokeWidth={2.5} />}
            추가
          </button>
        </div>

        <button
          onClick={onClose}
          className="py-2.5 border border-sand-300 rounded-ctl font-black text-ink hover:bg-sand-100 text-sm"
        >
          닫기
        </button>

        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
            <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-bad-fg shrink-0 mt-0.5" strokeWidth={2.5} />
                <div>
                  <h3 className="text-lg font-black text-ink">항목 삭제</h3>
                  <p className="text-sm font-bold text-sand-600 mt-1">
                    <strong className="text-ink">"{deleteTarget.name}"</strong> 항목과 모든 부원의 해당 값이 삭제됩니다.<br />
                    되돌릴 수 없습니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2 border border-sand-300 rounded-ctl font-black text-ink text-sm hover:bg-sand-100"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    await onDelete(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 py-2 bg-bad-fg text-white rounded-ctl shadow-btn font-black text-sm hover:opacity-90"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
