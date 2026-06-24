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
        <Tag className="w-3.5 h-3.5 text-sand-400" strokeWidth={2.5} />
        <span className="text-xs font-black uppercase tracking-widest text-sand-500">태그</span>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.length === 0 && !editing && (
          <span className="text-xs text-sand-400 font-bold">아직 태그가 없습니다.</span>
        )}
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-tint text-brand-dark rounded-ctl text-xs font-black">
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
              className="field px-2 py-1 border border-sand-300 rounded-ctl font-bold text-xs w-32"
            />
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-ctl border border-dashed border-sand-300 hover:border-brand hover:text-brand text-xs font-bold text-sand-400 transition-colors"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} /> 태그 추가
          </button>
        )}
      </div>
    </div>
  );
}
