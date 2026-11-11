// 월 선택 — 이전·다음 달 버튼과 "2026년 11월". 이번 달보다 뒤로는 갈 수 없다 (02 문서 3절)

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonth, currentMonth, formatMonth } from '../_lib/format';
import { IconButton } from './IconButton';
import s from './monthSelector.module.css';

type Props = { month: string; onChange: (month: string) => void };

export function MonthSelector({ month, onChange }: Props) {
  const isCurrent = month >= currentMonth();
  return (
    <div className={s.selector}>
      <IconButton icon={ChevronLeft} label="이전 달" onClick={() => onChange(addMonth(month, -1))} />
      <p className={s.month} aria-live="polite">{formatMonth(month)}</p>
      <IconButton icon={ChevronRight} label="다음 달" disabled={isCurrent} onClick={() => onChange(addMonth(month, 1))} />
    </div>
  );
}
