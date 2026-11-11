// 로고 마크 — 둥근 사각형 안의 영수증 아이콘 (06 문서 1절)

import { ReceiptText } from 'lucide-react';

type Props = { size?: number; background?: string; color?: string };

export function LogoMark({ size = 40, background = 'var(--primary)', color = '#fff' }: Props) {
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3), background, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <ReceiptText size={Math.round(size * 0.58)} color={color} strokeWidth={2.2} />
    </span>
  );
}
