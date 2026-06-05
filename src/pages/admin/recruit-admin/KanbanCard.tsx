import React from 'react';
import { MessageSquare, GripVertical } from 'lucide-react';
import type { Applicant } from './types';

// ── 칸반 카드 ────────────────────────────────────────────────────────────────
export function KanbanCard({
  applicant, isDragging, onDragStart, onDragEnd, onClick,
}: {
  applicant: Applicant;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const daysAgo = Math.floor((Date.now() - new Date(applicant.submitted_at).getTime()) / 86400000);

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, applicant.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-white border-2 border-black p-3.5 cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging
          ? 'opacity-40 rotate-1 shadow-none'
          : 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-black text-sm">{applicant.profiles?.name ?? '—'}</span>
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
      </div>

      {(applicant.profiles?.university || applicant.profiles?.major) && (
        <p className="text-xs text-gray-500 font-bold mb-2.5 truncate">
          {[applicant.profiles?.university, applicant.profiles?.major].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400 font-bold">
          {daysAgo === 0 ? '오늘 접수' : `${daysAgo}일 전`}
        </span>
        <div className="flex items-center gap-1.5">
          {applicant.interviewer_note && (
            <span title="메모 있음"><MessageSquare className="w-3.5 h-3.5 text-orange-400" /></span>
          )}
          {applicant.score != null && (
            <span className="text-xs font-black text-orange-500">{applicant.score}점</span>
          )}
        </div>
      </div>
    </div>
  );
}
