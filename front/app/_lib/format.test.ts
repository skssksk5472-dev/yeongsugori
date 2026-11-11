// format.ts 단위 테스트 — npm test (node --test)

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addMonth, currentMonth, formatDate, formatDayTitle, formatMonth, formatMonthShort, formatNetAmount,
  formatAmountInput, formatSignedAmount, formatWon, parseAmountInput, roundRatio, todayKorea,
} from './format.ts';

test('formatWon: 천 단위 콤마, 부호 없음', () => {
  assert.equal(formatWon(9000), '9,000');
  assert.equal(formatWon(-1284500), '1,284,500');
  assert.equal(formatWon(0), '0');
});

test('formatSignedAmount: 지출은 -, 수입과 할인(음수 지출)은 +', () => {
  assert.equal(formatSignedAmount('expense', 9000), '-9,000');
  assert.equal(formatSignedAmount('income', 2000000), '+2,000,000');
  assert.equal(formatSignedAmount('expense', -1000), '+1,000');
});

test('formatNetAmount: 0 이하는 -, 초과는 +', () => {
  assert.equal(formatNetAmount(-13500), '-13,500');
  assert.equal(formatNetAmount(0), '-0');
  assert.equal(formatNetAmount(1000), '+1,000');
});

test('날짜 표시', () => {
  assert.equal(formatDate('2026-11-03'), '2026.11.03 (화)');
  assert.equal(formatDayTitle('2026-11-03'), '11월 3일 화요일');
  assert.equal(formatDayTitle('2026-11-01'), '11월 1일 일요일');
});

test('월 표시와 계산', () => {
  assert.equal(formatMonth('2026-11'), '2026년 11월');
  assert.equal(formatMonthShort('2026-01'), '1월');
  assert.equal(addMonth('2026-12', 1), '2027-01');
  assert.equal(addMonth('2026-01', -1), '2025-12');
});

test('currentMonth: 한국 시간 기준', () => {
  // UTC 10월 31일 16시 = 한국 11월 1일 01시
  assert.equal(currentMonth(new Date('2026-10-31T16:00:00Z')), '2026-11');
  assert.equal(currentMonth(new Date('2026-10-31T14:00:00Z')), '2026-10');
  assert.equal(todayKorea(new Date('2026-10-31T16:00:00Z')), '2026-11-01');
});

test('금액 입력 칸', () => {
  assert.equal(parseAmountInput('9,000'), 9000);
  assert.equal(parseAmountInput('12a3'), 123);
  assert.equal(parseAmountInput(''), 0);
  assert.equal(parseAmountInput('1234567890'), 123456789); // 9자리까지
  assert.equal(parseAmountInput('-1,000'), 1000);
  assert.equal(parseAmountInput('-1,000', true), -1000);
  assert.equal(formatAmountInput(0), '');
  assert.equal(formatAmountInput(9000), '9,000');
  assert.equal(formatAmountInput(-1000), '-1,000');
});

test('roundRatio: 소수 첫째 자리, 0.05는 올림', () => {
  assert.equal(roundRatio(412300, 1119000), 36.8);
  assert.equal(roundRatio(1, 16), 6.3);
  assert.equal(roundRatio(5, 0), 0);
});
