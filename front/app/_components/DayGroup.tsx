// 날짜 묶음 카드 — 흰 카드 라운드 20. 헤더 왼쪽은 날짜, 오른쪽은 그날의 순합계 (06 문서 3절)

import { formatDayTitle, formatNetAmount } from '../_lib/format';
import s from './dayGroup.module.css';

type Props = {
  day: string; // "YYYY-MM-DD"
  net: number; // 수입 - 지출
  children: React.ReactNode; // TxRow 목록
};

export function DayGroup({ day, net, children }: Props) {
  return (
    <section className={s.card}>
      <header className={s.header}>
        <h3 className={s.day}>{formatDayTitle(day)}</h3>
        <span className={s.net}>{formatNetAmount(net)}</span>
      </header>
      {children}
    </section>
  );
}
