'use client';

// 아래에서 올라오는 시트 — 위쪽 라운드 28, 손잡이 40x4, 240ms. 어두운 배경을 누르거나 아래로 끌면 닫힌다 (06 문서 3절)

import { useRef } from 'react';
import s from './sheet.module.css';

// 이만큼(px) 아래로 끌면 닫는다
const CLOSE_DRAG = 80;

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Sheet({ open, onClose, title, children }: Props) {
  const startY = useRef(0);

  if (!open) return null;
  return (
    <>
      <div className={s.overlay} onClick={onClose} aria-hidden="true" />
      <div className={`fixedInApp ${s.sheet}`} role="dialog" aria-modal="true" aria-label={title}
        onTouchStart={(event) => { startY.current = event.touches[0].clientY; }}
        onTouchEnd={(event) => { if (event.changedTouches[0].clientY - startY.current > CLOSE_DRAG) onClose(); }}>
        <div className={s.handle} aria-hidden="true" />
        {title && <h2 className={s.title}>{title}</h2>}
        {children}
      </div>
    </>
  );
}
