// 지출 카테고리 칩 — 줄바꿈으로 늘어놓고 지금 고른 것을 강조한다 (시안 O4)

import { EXPENSE_CATEGORIES } from '../../../_lib/categories';
import s from './result.module.css';

type Props = { value: string; onChange: (category: string) => void };

export function CategoryChoices({ value, onChange }: Props) {
  return (
    <div className={s.choices}>
      {EXPENSE_CATEGORIES.map(({ name }) => (
        <button key={name} type="button" aria-pressed={name === value}
          className={name === value ? `${s.choice} ${s.choiceOn}` : s.choice} onClick={() => onChange(name)}>
          {name}
        </button>
      ))}
    </div>
  );
}
