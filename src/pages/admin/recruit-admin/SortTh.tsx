import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import type { SortKey, SortDir } from './types';

// ── 테이블 정렬 헤더 ─────────────────────────────────────────────────────────
export function SortTh({ label, sortKey, current, dir, onToggle }: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onToggle: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="px-4 py-3 text-left cursor-pointer select-none group"
      onClick={() => onToggle(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span className={`text-xs font-black uppercase tracking-wider transition-colors ${active ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-800'}`}>
          {label}
        </span>
        {active ? (
          dir === 'asc' ? <ChevronUp className="w-3 h-3 text-orange-500" /> : <ChevronDown className="w-3 h-3 text-orange-500" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
        )}
      </div>
    </th>
  );
}
