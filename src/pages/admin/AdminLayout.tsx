import { createContext, useContext, useState, Suspense, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

// 운영진 워크스페이스 공통 레이아웃.
// 헤더/사이드바를 한 번만 마운트하고 콘텐츠만 Outlet으로 교체 → 라우트 전환 시 사이드바가 깜빡이지 않음.
// 콘텐츠 영역에만 Suspense를 둬, lazy 청크 로딩 중에도 사이드바는 그대로 유지된다.

const HeaderSlotContext = createContext<HTMLElement | null>(null);

/**
 * 어드민 페이지가 헤더 우측에 페이지별 액션 버튼을 주입할 때 사용.
 * 페이지 본문 어디서든 <AdminHeaderPortal>{버튼들}</AdminHeaderPortal> 로 렌더하면 헤더 슬롯으로 포털된다.
 */
export function AdminHeaderPortal({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlotContext);
  return slot ? createPortal(children, slot) : null;
}

export default function AdminLayout() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  // 각 페이지는 자신의 <main>(배경·패딩·overflow·스크롤 ref 포함)을 그대로 루트로 반환한다.
  // 레이아웃은 헤더·사이드바·Outlet 컨테이너만 소유 → 페이지별 시각 차이를 그대로 보존.
  return (
    <div className="flex flex-col h-screen bg-sand-50 overflow-hidden font-sans">
      <AdminHeader>
        <div ref={setSlot} className="flex items-center gap-2" />
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-sand-200 bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <HeaderSlotContext.Provider value={slot}>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </HeaderSlotContext.Provider>
      </div>
    </div>
  );
}
