// 분할 버튼 — 전체·지출·수입처럼 하나만 고른다. 배경 seg, 활성은 흰 배경 (06 문서 3절)

import s from './segmented.module.css';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function Segmented<T extends string>({ options, value, onChange, disabled = false }: Props<T>) {
  return (
    <div className={s.segmented} role="radiogroup">
      {options.map((option) => (
        <button key={option.value} type="button" role="radio" aria-checked={option.value === value}
          className={option.value === value ? `${s.item} ${s.active}` : s.item}
          disabled={disabled} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
