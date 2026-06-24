import React from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CorpHeaderProps {
  corpName?: string;
  creditBalance?: number;
  children?: React.ReactNode;
}

export function CorpHeader({ corpName = '기업명', creditBalance = 0, children }: CorpHeaderProps) {
  return (
    <header className="h-14 border-b border-sand-200 bg-white flex items-center justify-between px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-sand-50 transition-colors rounded-ctl border border-transparent hover:border-sand-300">
          <ArrowLeft className="w-5 h-5 text-sand-600" strokeWidth={2.5} />
        </Link>
        <h1 className="font-black text-lg tracking-tight text-ink">파트너 비즈니스 센터</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-sm font-bold flex items-center gap-2 text-sand-600">
           <Building2 className="w-4 h-4 text-brand" strokeWidth={2.5} /> 환영합니다, <span className="text-brand">{corpName} 담당자</span>님
        </div>
        <div className="h-6 w-px bg-sand-200"></div>
        <div className="text-sm font-bold text-sand-600">
           잔여 크레딧: <span className="text-brand font-black">{creditBalance.toLocaleString()} C</span>
        </div>
        {children}
      </div>
    </header>
  );
}
