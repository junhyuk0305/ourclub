import { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';

// ── 태그 편집기 ──────────────────────────────────────────────────────────
export function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(false);

  const add = () => {
    const v = input.trim().replace(/^#/, '');
    if (!v || tags.includes(v)) { setInput(''); return; }
    onChange([...tags, v]);
    setInput('');
  };
  const remove = (t: string) => onChange(tags.filter(x => x !== t));

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-black uppercase tracking-widest text-gray-500">태그</span>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.length === 0 && !editing && (
          <span className="text-xs text-gray-400 font-bold">아직 태그가 없습니다.</span>
        )}
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 border border-orange-300 text-xs font-black">
            #{t}
            <button onClick={() => remove(t)} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {editing ? (
          <div className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') add();
                else if (e.key === 'Escape') { setEditing(false); setInput(''); }
              }}
              onBlur={() => { add(); setEditing(false); }}
              placeholder="태그 입력 후 Enter"
              className="px-2 py-1 border border-black font-bold text-xs outline-none focus:border-orange-500 w-32"
            />
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-gray-300 hover:border-orange-400 hover:text-orange-500 text-xs font-bold text-gray-400 transition-colors"
          >
            <Plus className="w-3 h-3" /> 태그 추가
          </button>
        )}
      </div>
    </div>
  );
}
