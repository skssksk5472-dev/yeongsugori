// 안내 줄 — 라운드 14, 13/700. success(일치), warn(불일치), info(영수증 안내), danger(불러오기 실패) (06 문서 3절, 5절)

import { Check, CircleAlert, ReceiptText, TriangleAlert, type LucideIcon } from 'lucide-react';
import s from './banner.module.css';

type Variant = 'success' | 'warn' | 'info' | 'danger';

const ICONS: Record<Variant, LucideIcon> = {
  success: Check,
  warn: TriangleAlert,
  info: ReceiptText,
  danger: CircleAlert,
};

type Props = {
  variant: Variant;
  children: React.ReactNode;
  action?: React.ReactNode; // 오른쪽 글자 버튼·링크 (예: 다시 시도, 영수증 보기)
};

export function Banner({ variant, children, action }: Props) {
  const Icon = ICONS[variant];
  return (
    <div className={`${s.banner} ${s[variant]}`} role={variant === 'danger' ? 'alert' : 'status'}>
      <Icon size={18} strokeWidth={variant === 'success' ? 3 : 2} aria-hidden="true" />
      <span className={s.text}>{children}</span>
      {action && <span className={s.action}>{action}</span>}
    </div>
  );
}
