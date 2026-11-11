// 아이콘만 있는 버튼 — 터치 영역 44 이상. 화면 헤더의 뒤로·삭제, 월 이동 등에 쓴다.

import type { LucideIcon } from 'lucide-react';
import s from './iconButton.module.css';

type Props = {
  icon: LucideIcon;
  label: string; // 화면에 글자가 없으므로 읽어 줄 이름
  size?: number;
  color?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function IconButton({ icon: Icon, label, size = 44, color = 'var(--ink)', disabled = false, onClick }: Props) {
  return (
    <button type="button" className={s.button} style={{ width: size, height: size }} aria-label={label}
      disabled={disabled} onClick={onClick}>
      <Icon size={24} color={disabled ? 'var(--icon-off)' : color} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
