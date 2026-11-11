// 월 요약 카드 — 짙은 초록 배경, 지출 34/800 흰색, 수입은 민트, 잔액은 흰색 (06 문서 3절)

import { formatWon } from '../_lib/format';
import s from './summaryCard.module.css';

type Props = {
  monthLabel: string; // 예: "11월"
  totalExpense: number;
  totalIncome: number;
  balance: number;
};

export function SummaryCard({ monthLabel, totalExpense, totalIncome, balance }: Props) {
  return (
    <section className={s.card} aria-label={`${monthLabel} 요약`}>
      <p className={s.label}>{monthLabel} 지출</p>
      <p className={s.expense}>
        <span className={s.expenseNumber}>{totalExpense < 0 ? '-' : ''}{formatWon(totalExpense)}</span>
        <span className={s.unit}>원</span>
      </p>
      <div className={s.row}>
        <div>
          <p className={s.smallLabel}>수입</p>
          <p className={`${s.value} ${s.income}`}>{formatWon(totalIncome)}</p>
        </div>
        <div>
          <p className={s.smallLabel}>잔액</p>
          <p className={s.value}>{balance < 0 ? '-' : ''}{formatWon(balance)}</p>
        </div>
      </div>
    </section>
  );
}
