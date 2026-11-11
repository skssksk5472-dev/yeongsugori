'use client';

// H3 직접 입력 — 저장하면 그 달의 내역(/?month=)으로 가며 토스트 (02 문서 5절)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../_components/Header';
import { useToast } from '../../_components/Toast';
import { createTransaction, errorText, type TransactionInput } from '../../_lib/api';
import { todayKorea } from '../../_lib/format';
import { TransactionForm } from '../_transaction/TransactionForm';

export function AddView() {
  const router = useRouter();
  const showToast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [initial] = useState<TransactionInput>(() => ({
    type: 'expense', amount: 0, category: '', title: '', memo: '', occurred_on: todayKorea(),
  }));

  async function handleSubmit(input: TransactionInput) {
    setSubmitting(true);
    try {
      await createTransaction(input);
      showToast('저장되었습니다');
      router.replace(`/?month=${input.occurred_on.slice(0, 7)}`);
    } catch (err) {
      showToast(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Header title="내역 추가" />
      <TransactionForm initial={initial} autoFocusAmount submitting={submitting} onSubmit={handleSubmit} />
    </main>
  );
}
