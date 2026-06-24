import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { SortKey, SortDir } from './types';

export function SortTh({ label, sortKey, current, dir, onToggle }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onToggle: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="px-4 py-3 text-left cursor-pointer select-none group" onClick={() => onToggle(sortKey)}>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-black uppercase tracking-wider transition-colors ${active ? 'text-brand' : 'text-sand-500 group-hover:text-ink'}`}>{label}</span>
        {active ? (dir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand" strokeWidth={2.5} /> : <ChevronDown className="w-3 h-3 text-brand" strokeWidth={2.5} />)
          : <ArrowUpDown className="w-3 h-3 text-sand-300 group-hover:text-sand-500" strokeWidth={2.5} />}
      </div>
    </th>
  );
}
