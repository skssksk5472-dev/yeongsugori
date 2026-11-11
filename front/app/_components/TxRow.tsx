// 내역 한 줄 — 아이콘 40, 제목 15/600, 보조줄 13(상호 · 카테고리), 금액 16/700. 영수증 내역은 보조줄 앞에 영수증 아이콘 (06 문서 3절)

import { ReceiptText } from 'lucide-react';
import { formatSignedAmount, isPlusAmount, type TransactionType } from '../_lib/format';
import { CategoryIcon } from './CategoryIcon';
import s from './txRow.module.css';

type Props = {
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  merchant?: string | null;
  hasReceipt?: boolean;
  onClick?: () => void;
};

export function TxRow({ type, amount, category, title, merchant, hasReceipt = false, onClick }: Props) {
  const sub = merchant ? `${merchant} · ${category}` : category;
  return (
    <button type="button" className={s.row} onClick={onClick}>
      <CategoryIcon category={category} />
      <span className={s.text}>
        <span className={s.title}>{title}</span>
        <span className={s.sub}>
          {hasReceipt && <ReceiptText size={14} color="var(--ink-3)" aria-label="영수증 내역" />}
          <span className={s.ellipsis}>{sub}</span>
        </span>
      </span>
      <span className={isPlusAmount(type, amount) ? `${s.amount} ${s.plus}` : s.amount}>
        {formatSignedAmount(type, amount)}
      </span>
    </button>
  );
}
