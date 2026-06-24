import { createContext, useContext, useState, Suspense, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { CorpHeader } from '../../components/corp/CorpHeader';
import { CorpSidebar } from '../../components/corp/CorpSidebar';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useCorp } from '../../contexts/CorpContext';

// 기업(파트너) 워크스페이스 공통 레이아웃. 헤더/사이드바를 한 번만 마운트하고 콘텐츠만 Outlet으로 교체.
const HeaderSlotContext = createContext<HTMLElement | null>(null);

/** 기업 페이지가 헤더 우측에 페이지별 액션 버튼을 주입할 때 사용. */
export function CorpHeaderPortal({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlotContext);
  return slot ? createPortal(children, slot) : null;
}

export default function CorpLayout() {
  const { corporation } = useCorp();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  return (
    <div className="flex flex-col h-screen bg-sand-50 overflow-hidden font-sans">
      <CorpHeader corpName={corporation?.name} creditBalance={corporation?.credit_balance}>
        <div ref={setSlot} className="flex items-center gap-2" />
      </CorpHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-sand-200 bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <CorpSidebar />
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
