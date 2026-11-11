// 카테고리 칩 — 높이 32, 배경 카테고리 색 14%, 오른쪽 아래 화살표. 누르면 카테고리를 고르는 시트를 연다 (06 문서 3절)

import { ChevronDown } from 'lucide-react';
import { getCategory, softColor } from '../_lib/categories';
import s from './categoryChip.module.css';

type Props = { category: string; onClick?: () => void };

export function CategoryChip({ category, onClick }: Props) {
  const { color, iconColor, Icon } = getCategory(category);
  return (
    <button type="button" className={s.chip} style={{ background: softColor(color) }} onClick={onClick}
      aria-label={`카테고리 ${category} 바꾸기`}>
      <Icon size={16} color={iconColor} aria-hidden="true" />
      {category}
      <ChevronDown size={14} color="var(--ink-2)" aria-hidden="true" />
    </button>
  );
}
