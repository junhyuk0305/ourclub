import { Filter } from 'lucide-react';
import type { Member } from './types';

interface ColumnHeaderFilterProps {
  label: string;
  col: keyof Member;
  colFilters: Record<string, Set<string>>;
  openFilterCol: string | null;
  setOpenFilterCol: (v: string | null) => void;
  uniqueValues: (col: keyof Member) => string[];
  toggleColFilter: (col: string, value: string) => void;
  clearColFilter: (col: string) => void;
}

export function ColumnHeaderFilter({
  label, col, colFilters, openFilterCol, setOpenFilterCol,
  uniqueValues, toggleColFilter, clearColFilter,
}: ColumnHeaderFilterProps) {
  const active = colFilters[col as string];
  const isActive = active && active.size > 0;
  const isOpen = openFilterCol === col;
  return (
    <div className="p-4 font-black text-ink relative">
      <div className="flex items-center gap-1">
        {label}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilterCol(isOpen ? null : (col as string));
          }}
          className={`p-0.5 rounded-md hover:bg-sand-100 ${isActive ? 'text-brand' : 'text-sand-400'}`}
          aria-label={`${label} 필터`}
        >
          <Filter className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 bg-white border border-sand-200 rounded-ctl z-20 p-2 min-w-[140px] max-h-60 overflow-y-auto shadow-soft font-sans text-left normal-case"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-1 pb-1 border-b border-sand-200">
            <span className="text-xs font-black text-ink">필터</span>
            {isActive && (
              <button
                onClick={() => clearColFilter(col as string)}
                className="text-xs text-brand font-black hover:underline"
              >
                초기화
              </button>
            )}
          </div>
          {(() => {
            const values = uniqueValues(col);
            if (values.length === 0) return <p className="text-xs font-bold text-sand-400 py-1">값 없음</p>;
            return values.map(v => (
              <label key={v} className="flex items-center gap-1.5 py-0.5 cursor-pointer text-xs font-bold text-sand-600 rounded-md hover:bg-sand-50 px-1">
                <input
                  type="checkbox"
                  checked={active?.has(v) ?? false}
                  onChange={() => toggleColFilter(col as string, v)}
                  className="w-3 h-3 accent-brand"
                />
                {v}
              </label>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
