'use client';

// 날짜별 내역 카드 목록 — 홈(H1)과 카테고리 상세(N2)가 같이 쓴다. 행을 누르면 수정 화면(H4)으로 간다.

import { useRouter } from 'next/navigation';
import type { Transaction } from '../_lib/api';
import { groupByDay } from '../_lib/group';
import { DayGroup } from './DayGroup';
import { TxRow } from './TxRow';

export function TransactionDayList({ items }: { items: Transaction[] }) {
  const router = useRouter();
  return groupByDay(items).map((group) => (
    <DayGroup key={group.day} day={group.day} net={group.net}>
      {group.items.map((item) => (
        <TxRow key={item.transaction_id} type={item.type} amount={item.amount} category={item.category}
          title={item.title} merchant={item.merchant} hasReceipt={item.receipt_id !== null}
          onClick={() => router.push(`/transactions/${item.transaction_id}`)} />
      ))}
    </DayGroup>
  ));
}
