// group.ts 단위 테스트 — npm test (node --test)

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Transaction } from './api.ts';
import { groupByDay } from './group.ts';

function tx(occurred_on: string, type: 'expense' | 'income', amount: number): Transaction {
  return { transaction_id: `${occurred_on}-${amount}`, type, amount, category: '식비', title: '', merchant: null, memo: '', occurred_on, receipt_id: null };
}

test('같은 날짜끼리 순서대로 묶고 순합계를 계산한다', () => {
  const groups = groupByDay([
    tx('2026-11-03', 'expense', 9000),
    tx('2026-11-03', 'expense', 4500),
    tx('2026-11-02', 'expense', -1000), // 할인(음수 지출)은 순합계를 늘린다
    tx('2026-11-01', 'income', 2000000),
    tx('2026-11-01', 'expense', 300000),
  ]);
  assert.deepEqual(groups.map((g) => [g.day, g.items.length, g.net]), [
    ['2026-11-03', 2, -13500],
    ['2026-11-02', 1, 1000],
    ['2026-11-01', 2, 1700000],
  ]);
});

test('빈 목록', () => {
  assert.deepEqual(groupByDay([]), []);
});
