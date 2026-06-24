import { useState } from 'react';
import { GraduationCap, X, Trash2, Plus, Loader } from 'lucide-react';

interface GenManagerModalProps {
  generations: string[];
  currentGeneration: string | null;
  onUpdate: (next: string[]) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export function GenManagerModal({ generations, currentGeneration, onUpdate, onClose }: GenManagerModalProps) {
  const [list, setList] = useState<string[]>(generations);
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState('');

  const addLabel = () => {
    const v = newLabel.trim();
    if (!v) return;
    if (list.includes(v)) { setError('이미 존재하는 기수입니다.'); return; }
    setList([...list, v]);
    setNewLabel('');
    setError('');
  };

  const removeAt = (idx: number) => {
    const target = list[idx];
    if (target === currentGeneration) {
      if (!window.confirm(`${target}는 현재 활동 기수로 지정되어 있습니다. 그래도 삭제하시겠습니까?`)) return;
    }
    setList(list.filter((_, i) => i !== idx));
  };

  const commitEdit = (idx: number) => {
    const v = editingValue.trim();
    if (!v) { setEditingIdx(null); return; }
    if (list.some((g, i) => i !== idx && g === v)) {
      setError('이미 존재하는 기수입니다.');
      return;
    }
    setList(list.map((g, i) => i === idx ? v : g));
    setEditingIdx(null);
    setError('');
  };

  const save = async () => {
    setSaving(true);
    const r = await onUpdate(list);
    setSaving(false);
    if (!r.error) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-md mx-4 p-7 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-ink flex items-center gap-2">
              <GraduationCap className="w-5 h-5" strokeWidth={2.5} /> 기수 목록 관리
            </h2>
            <p className="text-xs font-medium text-sand-500 mt-1">동아리에서 사용할 기수 라벨을 자유롭게 추가/수정/삭제하세요.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" strokeWidth={2.5} /></button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm text-ink">기수 목록</label>
          {list.length === 0 ? (
            <p className="text-xs font-medium text-sand-400 py-2">아직 등록된 기수가 없습니다.</p>
          ) : (
            <div className="flex flex-col border border-sand-200 rounded-card overflow-hidden">
              {list.map((g, idx) => (
                <div key={`${g}-${idx}`} className="flex items-center justify-between px-3 py-2 border-b border-sand-200 last:border-b-0">
                  {editingIdx === idx ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(idx); }
                        if (e.key === 'Escape') { setEditingIdx(null); setError(''); }
                      }}
                      onBlur={() => commitEdit(idx)}
                      className="field flex-1 p-1 border border-brand rounded-ctl font-bold text-sm"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingIdx(idx); setEditingValue(g); setError(''); }}
                      className="flex-1 text-left font-bold text-sm text-ink hover:text-brand"
                    >
                      {g}
                      {g === currentGeneration && (
                        <span className="ml-2 px-1.5 py-0.5 bg-brand-tint text-brand-dark rounded-md font-bold text-[10px]">
                          현재
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => removeAt(idx)}
                    title="삭제"
                    className="p-1.5 rounded-ctl hover:bg-bad-bg text-sand-400 hover:text-bad-fg"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-bold text-sm text-ink">새 기수 추가</label>
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
              placeholder="예: 14기, 2026-봄"
              className="field flex-1 p-2 border border-sand-300 rounded-ctl font-bold text-sm"
            />
            <button
              onClick={addLabel}
              disabled={!newLabel.trim()}
              className="px-3 py-2 btn-grad text-white rounded-ctl font-bold text-xs shadow-btn hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} /> 추가
            </button>
          </div>
          {error && <p className="text-bad-fg font-bold text-xs">{error}</p>}
        </div>

        <div className="flex gap-2 pt-2 border-t border-sand-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 bg-white border border-sand-300 text-ink rounded-ctl font-bold text-sm hover:bg-sand-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 btn-grad text-white rounded-ctl font-bold text-sm shadow-btn hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="w-3 h-3 animate-spin" strokeWidth={2.5} />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
