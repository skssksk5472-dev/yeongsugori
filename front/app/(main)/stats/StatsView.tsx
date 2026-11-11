'use client';

// N1 분석 — 월별 지출을 카테고리 도넛, 전월 대비 칩, 카테고리 행으로 보여 준다. 수입은 분석하지 않는다 (02 문서 5절)

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Banner } from '../../_components/Banner';
import { CategoryIcon } from '../../_components/CategoryIcon';
import { EmptyState } from '../../_components/EmptyState';
import { Header } from '../../_components/Header';
import { MonthSelector } from '../../_components/MonthSelector';
import { Skeleton } from '../../_components/Skeleton';
import { getCategoryStats, type CategoryStat, type CategoryStats } from '../../_lib/api';
import { getCategory } from '../../_lib/categories';
import { currentMonth, formatWon } from '../../_lib/format';
import { Donut } from './Donut';
import s from './stats.module.css';

export function StatsView() {
  const router = useRouter();
  const month = useSearchParams().get('month') || currentMonth();
  const [stats, setStats] = useState<CategoryStats | null>(null); // null = 불러오는 중
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    getCategoryStats(month)
      .then((data) => {
        if (ignore) return;
        setStats(data);
        setLoadFailed(false);
      })
      .catch(() => { if (!ignore) setLoadFailed(true); });
    return () => { ignore = true; };
  }, [month, reloadKey]);

  function changeMonth(next: string) {
    setStats(null);
    router.replace(`/stats?month=${next}`);
  }

  return (
    <main>
      <Header title="분석" back={false} />
      <MonthSelector month={month} onChange={changeMonth} />

      {loadFailed && (
        <div className={s.banner}>
          <Banner variant="danger" action={<button type="button" onClick={() => setReloadKey(reloadKey + 1)}>다시 시도</button>}>
            불러오지 못했습니다
          </Banner>
        </div>
      )}

      {stats === null && !loadFailed && <Skeleton />}

      {stats && stats.categories.length === 0 && <EmptyState title="해당 월의 지출이 없습니다" />}

      {stats && stats.categories.length > 0 && (
        <>
          <div className={s.chart}>
            <Donut categories={stats.categories} totalExpense={stats.total_expense} />
          </div>
          <CompareChip total={stats.total_expense} previous={stats.prev_month_expense} />
          <section className={s.card}>
            {stats.categories.map((item) => (
              <CategoryRow key={item.category} item={item}
                onClick={() => router.push(`/stats/${encodeURIComponent(item.category)}?month=${month}`)} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}

// 전월 대비 — 늘면 경고색, 줄면 연한 초록. 전월이 0원이면 보여 주지 않는다.
function CompareChip({ total, previous }: { total: number; previous: number }) {
  if (previous === 0) return null;
  const diff = total - previous;
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
  const Icon = diff > 0 ? TrendingUp : TrendingDown;
  return (
    <div className={s.chipRow}>
      <p className={diff > 0 ? `${s.chip} ${s.up}` : `${s.chip} ${s.down}`}>
        <Icon size={16} aria-hidden="true" />
        전월 대비 {sign}{formatWon(diff)}원
      </p>
    </div>
  );
}

function CategoryRow({ item, onClick }: { item: CategoryStat; onClick: () => void }) {
  return (
    <button type="button" className={s.row} onClick={onClick}>
      <CategoryIcon category={item.category} />
      <span className={s.rowBody}>
        <span className={s.rowTop}>
          <span className={s.rowName}>{item.category}</span>
          <span className={s.rowAmount}>{formatWon(item.amount)}원</span>
        </span>
        <span className={s.rowBottom}>
          <span className={s.track}>
            <span className={s.bar} style={{ width: `${item.ratio}%`, background: getCategory(item.category).color }} />
          </span>
          <span className={s.rowRatio}>{item.ratio.toFixed(1)}% · {item.count}건</span>
        </span>
      </span>
    </button>
  );
}
