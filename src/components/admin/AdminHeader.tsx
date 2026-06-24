import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminHeaderProps {
  /** 명시하면 우선, 아니면 현재 관리 중인 동아리(adminClub)명을 표시 */
  clubName?: string;
  children?: React.ReactNode;
}

// 우상단 동아리명 — 운영 동아리가 2개 이상이면 토글로 전환, 1개면 이름만 표시
function ClubToggle() {
  const { adminClubs, activeClubId, adminClub, setActiveClub } = useAdmin();
  const [open, setOpen] = useState(false);
  const active = adminClubs.find((c) => c.id === activeClubId) ?? adminClub;

  if (adminClubs.length <= 1) {
    return <span className="text-brand">{active?.name ?? '동아리 미선택'}</span>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-brand hover:text-brand-dark transition-colors"
      >
        {active?.name ?? '동아리 선택'}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 min-w-[200px] border border-sand-200 rounded-ctl bg-white shadow-soft-lg overflow-hidden max-h-72 overflow-y-auto">
            {adminClubs.map((club) => {
              const selected = club.id === active?.id;
              return (
                <button
                  key={club.id}
                  onClick={() => { setActiveClub(club.id); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                    selected ? 'font-black bg-brand-tint text-ink' : 'font-bold text-sand-600 hover:bg-sand-50'
                  }`}
                >
                  <span className="truncate">{club.name}</span>
                  {selected && <Check className="w-4 h-4 flex-shrink-0 text-brand" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function AdminHeader({ clubName, children }: AdminHeaderProps) {
  return (
    <header className="relative h-14 border-b border-sand-200 bg-white flex items-center justify-between px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-sand-100 transition-colors rounded-full border border-transparent hover:border-sand-200">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </Link>
        <h1 className="font-black text-lg tracking-tight text-ink">운영진 워크스페이스</h1>
      </div>
      <div className="flex items-center gap-4 text-sm font-bold text-sand-600">
        현재 관리 중인 동아리: {clubName ? <span className="text-brand">{clubName}</span> : <ClubToggle />}
        {children}
      </div>
    </header>
  );
}
