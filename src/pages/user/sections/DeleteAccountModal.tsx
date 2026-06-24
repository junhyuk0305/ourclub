import { useState } from 'react';
import { X, Loader } from 'lucide-react';

// ──────────────────────────────────────────
// 회원 탈퇴 확인 모달
// ──────────────────────────────────────────
export default function DeleteAccountModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<string | null> }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    const err = await onConfirm();
    setConfirming(false);
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-md mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-red-600">회원 탈퇴</h2>
          <button onClick={onClose} className="text-sand-400 hover:text-brand transition-colors"><X className="w-6 h-6" strokeWidth={2.5} /></button>
        </div>
        <p className="font-bold text-sand-600 mb-2">정말로 탈퇴하시겠습니까?</p>
        <p className="text-sm font-bold text-sand-500 mb-8 leading-relaxed">
          탈퇴 시 프로필 정보(이름, 학교, 전공 등)가 즉시 삭제되며 복구할 수 없습니다.<br />
          지원 내역 및 활동 기록은 익명 처리됩니다.
        </p>
        {error && (
          <p className="text-sm font-bold text-bad-fg bg-bad-bg rounded-ctl p-3 mb-6">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white text-ink border border-sand-300 rounded-ctl font-bold hover:bg-sand-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 py-3 bg-red-500 text-white rounded-ctl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming && <Loader className="w-4 h-4 animate-spin" />}
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
}
