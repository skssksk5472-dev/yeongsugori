// 내역 목록을 날짜별로 묶는다 — 홈(H1)과 카테고리 상세(N2)의 날짜 카드에 쓴다.

import type { Transaction } from './api';

export type DayGroupData = {
  day: string; // "YYYY-MM-DD"
  net: number; // 그날의 순합계 (수입 - 지출)
  items: Transaction[];
};

// 서버가 이미 최신순으로 주므로, 앞에서부터 같은 날짜끼리 모으기만 한다.
export function groupByDay(items: Transaction[]): DayGroupData[] {
  const groups: DayGroupData[] = [];
  for (const item of items) {
    let group = groups[groups.length - 1];
    if (!group || group.day !== item.occurred_on) {
      group = { day: item.occurred_on, net: 0, items: [] };
      groups.push(group);
    }
    group.items.push(item);
    group.net += item.type === 'income' ? item.amount : -item.amount;
  }
  return groups;
}
