// 카테고리 아이콘 원 — 배경은 카테고리 색 14%, 아이콘은 진한 색. 기본 40 (06 문서 2절)

import { getCategory, softColor } from '../_lib/categories';

type Props = { category: string; size?: number };

export function CategoryIcon({ category, size = 40 }: Props) {
  const { color, iconColor, Icon } = getCategory(category);
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: '50%', background: softColor(color), flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={Math.round(size * 0.5)} color={iconColor} strokeWidth={2} />
    </span>
  );
}
