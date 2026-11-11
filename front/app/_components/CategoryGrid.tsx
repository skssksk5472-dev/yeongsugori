// 카테고리 선택 격자 — 3열, 칸 높이 64. 선택하면 초록 테두리와 연한 배경 (06 문서 3절)

import type { Category } from '../_lib/categories';
import s from './categoryGrid.module.css';

type Props = {
  categories: Category[];
  value: string;
  onChange: (name: string) => void;
};

export function CategoryGrid({ categories, value, onChange }: Props) {
  return (
    <div className={s.grid}>
      {categories.map(({ name, iconColor, Icon }) => (
        <button key={name} type="button" aria-pressed={name === value}
          className={name === value ? `${s.cell} ${s.selected}` : s.cell} onClick={() => onChange(name)}>
          <Icon size={22} color={iconColor} aria-hidden="true" />
          {name}
        </button>
      ))}
    </div>
  );
}
