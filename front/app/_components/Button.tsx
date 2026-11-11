// 버튼 — 높이 54(작은 것 50), 라운드 16, 17/700. 제출 중에는 스피너와 비활성 (06 문서 3절, 5절)

import type { LucideIcon } from 'lucide-react';
import s from './button.module.css';

type Props = {
  children: React.ReactNode;
  variant?: 'primary' | 'soft' | 'outline' | 'danger' | 'dangerOutline';
  size?: 'md' | 'sm';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
};

export function Button({
  children, variant = 'primary', size = 'md', icon: Icon, disabled = false, loading = false, type = 'button', onClick,
}: Props) {
  const off = disabled || loading;
  const className = [s.button, s[variant], size === 'sm' && s.sm, disabled && s.disabled].filter(Boolean).join(' ');

  return (
    <button type={type} className={className} disabled={off} aria-busy={loading} onClick={onClick}>
      {loading ? <span className={s.spinner} aria-hidden="true" /> : Icon && <Icon size={22} strokeWidth={2} aria-hidden="true" />}
      {children}
    </button>
  );
}
