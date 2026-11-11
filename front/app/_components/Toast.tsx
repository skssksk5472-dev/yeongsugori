'use client';

// 토스트 — 하단 탭 위 16, 짙은 배경 흰 글씨 14/600, 3초 뒤 사라진다. 어느 화면에서든 useToast()로 띄운다 (06 문서 3절)

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import s from './toast.module.css';

const SHOW_MS = 3000;

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // 같은 문구를 연달아 띄워도 다시 3초를 세도록 번호를 함께 둔다.
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`fixedInApp ${s.area}`} role="status" aria-live="polite">
        {toast && <p key={toast.key} className={s.toast}>{toast.message}</p>}
      </div>
    </ToastContext.Provider>
  );
}
