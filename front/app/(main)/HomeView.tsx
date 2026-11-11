'use client';

// H1 내역 — 월 선택, 요약 카드, 전체·지출·수입 필터, 날짜별 내역. 내역이 없으면 H1e, + 버튼은 H2 시트 (02 문서 5절)

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, PencilLine } from 'lucide-react';
import { Banner } from '../_components/Banner';
import { Button } from '../_components/Button';
import { EmptyState } from '../_components/EmptyState';
import { Fab } from '../_components/Fab';
import { LogoMark } from '../_components/LogoMark';
import { MonthSelector } from '../_components/MonthSelector';
import { Segmented } from '../_components/Segmented';
import { Skeleton } from '../_components/Skeleton';
import { SummaryCard } from '../_components/SummaryCard';
import { TransactionDayList } from '../_components/TransactionDayList';
import { getMonthList, type MonthSummary, type Transaction } from '../_lib/api';
import { currentMonth, formatMonthShort } from '../_lib/format';
import { AddSheet } from './AddSheet';
import s from './home.module.css';

type Filter = '' | 'expense' | 'income';

const FILTERS: { value: Filter; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'expense', label: '지출' },
  { value: 'income', label: '수입' },
];

const EMPTY_SUMMARY: MonthSummary = { total_expense: 0, total_income: 0, balance: 0 };

export function HomeView() {
  const router = useRouter();
  // 저장 후 돌아올 때 그 달을 보여 주려고 월은 주소(?month=)에 둔다.
  const month = useSearchParams().get('month') || currentMonth();
  const [filter, setFilter] = useState<Filter>('');
  const [summary, setSummary] = useState<MonthSummary>(EMPTY_SUMMARY);
  const [items, setItems] = useState<Transaction[] | null>(null); // null = 불러오는 중
  const [loadFailed, setLoadFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false; // 월·필터를 빨리 바꿀 때 늦게 온 이전 응답을 버린다
    getMonthList(month, filter)
      .then((data) => {
        if (ignore) return;
        setSummary(data.summary);
        setItems(data.items);
        setLoadFailed(false);
      })
      .catch(() => { if (!ignore) setLoadFailed(true); });
    return () => { ignore = true; };
  }, [month, filter, reloadKey]);

  function changeMonth(next: string) {
    setItems(null);
    router.replace(`/?month=${next}`);
  }

  function changeFilter(next: Filter) {
    setItems(null);
    setFilter(next);
  }

  // H1e: 전체 필터에서 그달 내역이 하나도 없을 때
  const isEmpty = filter === '' && items !== null && items.length === 0;

  return (
    <main>
      <div className={s.brand}>
        <LogoMark size={28} />
        <span className={s.brandName}>잘씀</span>
      </div>
      <MonthSelector month={month} onChange={changeMonth} />
      <SummaryCard monthLabel={formatMonthShort(month)} totalExpense={summary.total_expense}
        totalIncome={summary.total_income} balance={summary.balance} />

      {loadFailed && (
        <div className={s.banner}>
          <Banner variant="danger" action={<button type="button" onClick={() => setReloadKey(reloadKey + 1)}>다시 시도</button>}>
            불러오지 못했습니다
          </Banner>
        </div>
      )}

      {isEmpty ? (
        <EmptyState title="아직 내역이 없습니다" description="영수증을 촬영하거나 직접 입력하세요">
          <Button icon={Camera} onClick={() => router.push('/scan')}>영수증 촬영</Button>
          <Button variant="soft" icon={PencilLine} onClick={() => router.push('/add')}>직접 입력</Button>
        </EmptyState>
      ) : (
        <>
          <div className={s.filter}>
            <Segmented options={FILTERS} value={filter} onChange={changeFilter} />
          </div>
          {items === null && !loadFailed ? <Skeleton /> : <TransactionDayList items={items ?? []} />}
          <Fab onClick={() => setSheetOpen(true)} />
        </>
      )}

      <AddSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </main>
  );
}
