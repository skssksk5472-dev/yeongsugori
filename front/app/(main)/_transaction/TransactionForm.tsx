'use client';

// 내역 입력 폼 — 직접 입력(H3)과 수정(H4)이 같이 쓴다. 지출/수입, 큰 금액 칸, 카테고리 격자, 날짜·내용·메모 (02 문서 5절)

import { useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { ActionBar, ActionBarSpacer } from '../../_components/ActionBar';
import { Button } from '../../_components/Button';
import { CategoryGrid } from '../../_components/CategoryGrid';
import { Segmented } from '../../_components/Segmented';
import type { TransactionInput } from '../../_lib/api';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../_lib/categories';
import { formatAmountInput, formatDate, parseAmountInput, todayKorea, type TransactionType } from '../../_lib/format';
import s from './transactionForm.module.css';

const TYPES: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: '지출' },
  { value: 'income', label: '수입' },
];

type Props = {
  initial: TransactionInput;
  isReceipt?: boolean; // 영수증으로 만든 내역: 지출/수입을 바꿀 수 없고, 할인처럼 음수 금액을 둘 수 있다
  autoFocusAmount?: boolean;
  submitting: boolean;
  onSubmit: (input: TransactionInput) => void;
};

export function TransactionForm({ initial, isReceipt = false, autoFocusAmount = false, submitting, onSubmit }: Props) {
  const [type, setType] = useState<TransactionType>(initial.type);
  const [amount, setAmount] = useState(initial.amount);
  const [category, setCategory] = useState(initial.category);
  const [occurredOn, setOccurredOn] = useState(initial.occurred_on);
  const [title, setTitle] = useState(initial.title);
  const [memo, setMemo] = useState(initial.memo);
  const dateRef = useRef<HTMLInputElement>(null);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  // 저장 조건: 금액이 있고(영수증 할인 내역은 음수 가능) 카테고리를 골랐을 때
  const canSave = (isReceipt ? amount !== 0 : amount > 0) && categories.some((item) => item.name === category);

  function changeType(next: TransactionType) {
    setType(next);
    // 지출 ↔ 수입을 바꾸면 카테고리 목록이 달라지므로 다시 고르게 한다.
    setCategory('');
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || submitting) return;
    onSubmit({ type, amount, category, occurred_on: occurredOn, title: title.trim(), memo: memo.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={s.body}>
        <Segmented options={TYPES} value={type} onChange={changeType} disabled={isReceipt} />

        <label className={s.amountLabel} htmlFor="amount">금액</label>
        <div className={s.amountRow}>
          <input id="amount" className={s.amountInput} inputMode="numeric" autoComplete="off"
            autoFocus={autoFocusAmount} value={formatAmountInput(amount)}
            onChange={(event) => setAmount(parseAmountInput(event.target.value, isReceipt))} />
          <span className={s.won}>원</span>
        </div>

        <p className={s.sectionLabel}>카테고리</p>
        <CategoryGrid categories={categories} value={category} onChange={setCategory} />

        <div className={s.list}>
          {/* 날짜: 행 전체를 누르면 기기의 날짜 선택이 열린다 */}
          <label className={s.listRow} onClick={() => dateRef.current?.showPicker?.()}>
            <span className={s.listLabel}>날짜</span>
            <span className={s.dateText}>{formatDate(occurredOn)}</span>
            <Calendar size={20} color="var(--ink-3)" aria-hidden="true" />
            <input ref={dateRef} type="date" className={s.dateInput} value={occurredOn} min="2000-01-01" max={todayKorea()}
              aria-label="날짜" onChange={(event) => { if (event.target.value) setOccurredOn(event.target.value); }} />
          </label>
          <label className={s.listRow}>
            <span className={s.listLabel}>내용</span>
            <input className={s.plainInput} value={title} placeholder="내용 입력" maxLength={40}
              onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className={s.listRow}>
            <span className={s.listLabel}>메모</span>
            <input className={s.plainInput} value={memo} placeholder="선택 입력" maxLength={100}
              onChange={(event) => setMemo(event.target.value)} />
          </label>
        </div>
      </div>

      <ActionBarSpacer />
      <ActionBar>
        <Button type="submit" disabled={!canSave} loading={submitting}>저장</Button>
      </ActionBar>
    </form>
  );
}
