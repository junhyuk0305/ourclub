import React from 'react';
import { GripVertical, MessageSquare } from 'lucide-react';
import { Applicant } from './types';

export function KanbanCard({ applicant, isDragging, onDragStart, onDragEnd, onClick }: {
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
      // 화면 밖 카드의 레이아웃/페인트를 건너뛰어 큰 칸반에서도 가볍게(미지원 브라우저는 무시)
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 96px' }}
      className={`bg-white border border-sand-200 rounded-card p-3.5 cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging ? 'opacity-40 rotate-1 shadow-none' : 'shadow-soft hover:shadow-soft-lg hover:-translate-y-1'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-black text-sm text-ink">{applicant.profiles?.name ?? '—'}</span>
        <GripVertical className="w-4 h-4 text-sand-300 shrink-0" strokeWidth={2.5} />
      </div>
      {(applicant.profiles?.university || applicant.profiles?.major) && (
        <p className="text-xs text-sand-500 font-bold mb-2 truncate">
          {[applicant.profiles?.university, applicant.profiles?.major].filter(Boolean).join(' · ')}
        </p>
      )}
      {(applicant.tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(applicant.tags ?? []).slice(0, 3).map((t, i) => (
            <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded-ctl bg-brand-tint text-brand">
              #{t}
            </span>
          ))}
          {(applicant.tags?.length ?? 0) > 3 && <span className="text-[10px] text-sand-400 font-bold">+{(applicant.tags?.length ?? 0) - 3}</span>}
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-sand-200">
        <span className="text-xs text-sand-400 font-bold">{daysAgo === 0 ? '오늘 접수' : `${daysAgo}일 전`}</span>
        <div className="flex items-center gap-1.5">
          {applicant.interviewer_note && <span title="메모 있음"><MessageSquare className="w-3.5 h-3.5 text-brand-accent" strokeWidth={2.5} /></span>}
          {applicant.score != null && <span className="text-xs font-black text-brand">{applicant.score}점</span>}
        </div>
      </div>
    </div>
  );
}
