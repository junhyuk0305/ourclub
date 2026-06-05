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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-7 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <GraduationCap className="w-5 h-5" /> 기수 목록 관리
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-1">동아리에서 사용할 기수 라벨을 자유롭게 추가/수정/삭제하세요.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-black text-sm">기수 목록</label>
          {list.length === 0 ? (
            <p className="text-xs font-bold text-gray-400 py-2">아직 등록된 기수가 없습니다.</p>
          ) : (
            <div className="flex flex-col border-2 border-black">
              {list.map((g, idx) => (
                <div key={`${g}-${idx}`} className="flex items-center justify-between px-3 py-2 border-b border-gray-200 last:border-b-0">
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
                      className="flex-1 p-1 border border-orange-500 font-bold text-sm outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingIdx(idx); setEditingValue(g); setError(''); }}
                      className="flex-1 text-left font-bold text-sm hover:text-orange-500"
                    >
                      {g}
                      {g === currentGeneration && (
                        <span className="ml-2 px-1.5 py-0.5 bg-orange-100 border border-orange-300 text-orange-700 font-black text-[10px]">
                          현재
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => removeAt(idx)}
                    title="삭제"
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-black text-sm">새 기수 추가</label>
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
              placeholder="예: 14기, 2026-봄"
              className="flex-1 p-2 border-2 border-black font-bold text-sm outline-none focus:border-orange-500"
            />
            <button
              onClick={addLabel}
              disabled={!newLabel.trim()}
              className="px-3 py-2 bg-black text-white border-2 border-black font-black text-xs hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>
          {error && <p className="text-red-600 font-bold text-xs">{error}</p>}
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 border-2 border-black font-black text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 bg-black text-white border-2 border-black font-black text-sm hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="w-3 h-3 animate-spin" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
