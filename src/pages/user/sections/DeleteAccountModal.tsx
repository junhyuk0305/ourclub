import { useState } from 'react';
import { X, Loader } from 'lucide-react';

// ──────────────────────────────────────────
// 회원 탈퇴 확인 모달
// ──────────────────────────────────────────
export default function DeleteAccountModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-red-600">회원 탈퇴</h2>
          <button onClick={onClose}><X className="w-6 h-6 hover:text-orange-500 transition-colors" /></button>
        </div>
        <p className="font-bold text-gray-700 mb-2">정말로 탈퇴하시겠습니까?</p>
        <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">
          탈퇴 시 프로필 정보(이름, 학교, 전공 등)가 즉시 삭제되며 복구할 수 없습니다.<br />
          지원 내역 및 활동 기록은 익명 처리됩니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 py-3 bg-red-600 text-white font-black hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming && <Loader className="w-4 h-4 animate-spin" />}
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
}
