'use client';

// N2 카테고리 상세 — 그달 한 카테고리의 지출 합계, 전체 지출 중 비율, 건수, 날짜별 내역 (02 문서 5절)

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Banner } from '../../../_components/Banner';
import { Header } from '../../../_components/Header';
import { Skeleton } from '../../../_components/Skeleton';
import { TransactionDayList } from '../../../_components/TransactionDayList';
import { getMonthList, type MonthSummary, type Transaction } from '../../../_lib/api';
import { currentMonth, formatMonth, formatWon, roundRatio } from '../../../_lib/format';
import s from './detail.module.css';

export function CategoryDetailView({ category }: { category: string }) {
  const month = useSearchParams().get('month') || currentMonth();
  const [data, setData] = useState<{ summary: MonthSummary; items: Transaction[] } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getMonthList(month, 'expense', category)
      .then((result) => {
        setData(result);
        setLoadFailed(false);
      })
      .catch(() => setLoadFailed(true));
  }, [month, category, reloadKey]);

  const amount = data ? data.items.reduce((total, item) => total + item.amount, 0) : 0;
  const ratio = data ? roundRatio(amount, data.summary.total_expense) : 0;

  return (
    <main>
      <Header title={category} />

      {loadFailed && (
        <div className={s.banner}>
          <Banner variant="danger" action={<button type="button" onClick={() => setReloadKey(reloadKey + 1)}>다시 시도</button>}>
            불러오지 못했습니다
          </Banner>
        </div>
      )}

      {data === null && !loadFailed && <Skeleton />}

      {data && (
        <>
          <section className={s.card}>
            <p className={s.month}>{formatMonth(month)}</p>
            <p className={s.amount}>
              <span className={s.amountNumber}>{formatWon(amount)}</span>
              <span className={s.unit}>원</span>
            </p>
            <div className={s.tags}>
              <span className={s.tag}>전체 지출의 {ratio.toFixed(1)}%</span>
              <span className={s.tag}>{data.items.length}건</span>
            </div>
          </section>
          <TransactionDayList items={data.items} />
        </>
      )}
    </main>
  );
}
