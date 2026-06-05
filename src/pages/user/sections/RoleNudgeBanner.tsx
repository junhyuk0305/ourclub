import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
import { useCorp } from '../../../contexts/CorpContext';

// ──────────────────────────────────────────
// 역할별 전환 유도 배너 (운영진/기업 사용자에게만 표시)
// ──────────────────────────────────────────
export default function RoleNudgeBanner() {
  const { isAdmin } = useAdmin();
  const { isCorpUser } = useCorp();

  if (isAdmin) {
    return (
      <Link
        to="/admin/dashboard"
        className="group flex items-center justify-between gap-4 border-2 border-black bg-orange-500 px-6 py-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        <div className="min-w-0">
          <p className="font-black text-lg text-black">운영진 워크스페이스</p>
          <p className="font-bold text-sm text-black/70 truncate">우리 동아리 모집·부원·홈페이지를 관리하세요.</p>
        </div>
        <span className="flex items-center gap-1 font-black text-black whitespace-nowrap">
          이동 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </Link>
    );
  }

  if (isCorpUser) {
    return (
      <Link
        to="/corp/dashboard"
        className="group flex items-center justify-between gap-4 border-2 border-black bg-purple-600 px-6 py-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        <div className="min-w-0">
          <p className="font-black text-lg text-white">기업 비즈니스 센터</p>
          <p className="font-bold text-sm text-white/70 truncate">프로젝트 등록과 동아리 매칭을 관리하세요.</p>
        </div>
        <span className="flex items-center gap-1 font-black text-white whitespace-nowrap">
          이동 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </Link>
    );
  }

  // 일반 학생 — 동아리 운영(등록/합류) 진입 보조 안내
  return (
    <Link
      to="/club-setup"
      className="group flex items-center justify-between gap-4 border-2 border-dashed border-gray-300 bg-white px-6 py-4 hover:border-black transition-colors"
    >
      <div className="min-w-0">
        <p className="font-black text-sm">동아리를 운영하시나요?</p>
        <p className="font-bold text-xs text-gray-500 truncate">새 동아리를 등록하거나 기존 동아리에 운영진으로 합류하세요.</p>
      </div>
      <span className="flex items-center gap-1 font-black text-sm text-gray-600 group-hover:text-orange-500 whitespace-nowrap transition-colors">
        등록·합류 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}
