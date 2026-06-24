import React from 'react';
import { Scale, Info } from 'lucide-react';

// B2B 거래 리스크 보완용 공용 고지 — 출처: B2B_RISK_REMEDIATION_PLAN.md
// 도급/제안서/세무 화면에서 재사용하여 카피 드리프트를 방지한다.

// R1. 도급 성격 고지 — 위장도급(실질 파견/고용) 재분류 방어
export function ContractNatureBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-2 border border-brand-peach bg-brand-tint rounded-ctl px-4 py-3 text-xs font-bold leading-relaxed text-sand-600 ${className}`}>
      <Scale className="w-4 h-4 shrink-0 mt-0.5 text-brand" strokeWidth={2.5} />
      <span>
        본 협업은 <strong className="text-brand-dark">결과물 단위 도급</strong>입니다. 기업 사무실 상주 근무·개별 학생에 대한 직접 지휘는
        도급의 성격을 훼손할 수 있으며, 소통은 PL(프로젝트 책임자) 단일 창구·산출물 단위로 진행합니다.
      </span>
    </div>
  );
}

// R3. 학생 소득 발생 부작용 고지 — 건강보험 피부양자·국가장학금 등 영향
export function StudentIncomeNotice({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-2 border border-sand-200 bg-sand-50 rounded-ctl px-4 py-3 text-xs font-bold leading-relaxed text-sand-600 ${className}`}>
      <Info className="w-4 h-4 shrink-0 mt-0.5 text-sand-400" strokeWidth={2.5} />
      <span>
        프로젝트 보수는 소득으로 잡혀 <strong>건강보험 피부양자 자격·국가장학금 소득기준</strong> 등에 영향을 줄 수 있습니다.
        대금은 기업이 사업소득세 3.3%를 원천징수 후 지급하며, 참여 전 본인 상황을 확인하세요.
      </span>
    </div>
  );
}
