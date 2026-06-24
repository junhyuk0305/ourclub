import { useCallback, useEffect, useRef, useState } from 'react';

export interface ToastState {
  msg: string;
  ok: boolean;
}

/**
 * 자동 사라짐 토스트 훅. 컴포넌트 unmount 시 타이머를 안전하게 정리한다.
 */
export function useToast(durationMs = 2500) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const show = useCallback((msg: string, ok = true) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, ok });
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, [durationMs]);

  return { toast, show };
}
