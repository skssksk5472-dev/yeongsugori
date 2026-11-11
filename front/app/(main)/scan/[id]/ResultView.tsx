'use client';

// O3 인식 결과 — 상호·날짜와 품목을 고친 뒤 내역으로 한 번에 저장한다. 합계가 달라도 경고만 하고 저장은 막지 않는다 (02 문서 5절)

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, PencilLine, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { ActionBar, ActionBarSpacer } from '../../../_components/ActionBar';
import { Banner } from '../../../_components/Banner';
import { Button } from '../../../_components/Button';
import { CategoryChip } from '../../../_components/CategoryChip';
import { Header } from '../../../_components/Header';
import { IconButton } from '../../../_components/IconButton';
import { NotFoundMessage } from '../../../_components/NotFoundMessage';
import { Sheet } from '../../../_components/Sheet';
import { Skeleton } from '../../../_components/Skeleton';
import { useToast } from '../../../_components/Toast';
import { ApiError, confirmReceipt, errorText, getReceipt, type Receipt, type ReceiptItem } from '../../../_lib/api';
import { formatDate, formatWon, todayKorea } from '../../../_lib/format';
import { CategoryChoices } from './CategoryChoices';
import { ItemSheet } from './ItemSheet';
import s from './result.module.css';

// 화면에서 고치는 품목. key 는 목록에서 줄을 구분하려고 붙인 번호다.
export type EditItem = ReceiptItem & { key: number };

const NEW_ITEM: EditItem = { key: 0, name: '', quantity: 1, amount: 0, category: '기타', is_discount: false };

export function ResultView({ receiptId }: { receiptId: string }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'notFound' | 'failed'>('loading');

  useEffect(() => {
    getReceipt(receiptId)
      .then((data) => {
        // 이미 내역으로 저장한 영수증은 다시 고칠 수 없다.
        setReceipt(data);
        setState(data.status === 'analyzed' ? 'ready' : 'notFound');
      })
      .catch((err) => setState(err instanceof ApiError && err.code === 'not_found' ? 'notFound' : 'failed'));
  }, [receiptId]);

  return (
    <main>
      <Header title="인식 결과" />
      {state === 'loading' && <Skeleton />}
      {state === 'notFound' && <NotFoundMessage />}
      {state === 'failed' && <div className={s.banner}><Banner variant="danger">불러오지 못했습니다</Banner></div>}
      {state === 'ready' && receipt && <ResultForm receipt={receipt} />}
    </main>
  );
}

function ResultForm({ receipt }: { receipt: Receipt }) {
  const router = useRouter();
  const showToast = useToast();
  const [merchant, setMerchant] = useState(receipt.merchant ?? '');
  const [editingMerchant, setEditingMerchant] = useState(false);
  const [occurredOn, setOccurredOn] = useState(receipt.purchased_on ?? todayKorea());
  const [items, setItems] = useState<EditItem[]>(() => receipt.items.map((item, index) => ({ ...item, key: index + 1 })));
  const [editing, setEditing] = useState<EditItem | null>(null); // O4 시트에서 고치는 품목
  const [choosingCategory, setChoosingCategory] = useState<EditItem | null>(null); // 카테고리만 고르는 시트
  const [submitting, setSubmitting] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  const itemsSum = items.reduce((total, item) => total + item.amount, 0);
  const mismatch = receipt.total_amount !== null && itemsSum !== receipt.total_amount;
  const canSave = items.length > 0 && items.every((item) => item.name.trim() && item.amount !== 0);

  function saveItem(next: EditItem) {
    const exists = items.some((item) => item.key === next.key);
    setItems(exists ? items.map((item) => (item.key === next.key ? next : item)) : [...items, next]);
    setEditing(null);
  }

  function removeItem(key: number) {
    setItems(items.filter((item) => item.key !== key));
    setEditing(null);
  }

  function chooseCategory(category: string) {
    if (choosingCategory) saveItem({ ...choosingCategory, category });
    setChoosingCategory(null);
  }

  function addItem() {
    const nextKey = Math.max(0, ...items.map((item) => item.key)) + 1;
    setEditing({ ...NEW_ITEM, key: nextKey });
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      const result = await confirmReceipt(receipt.receipt_id, merchant.trim(), occurredOn,
        items.map(({ name, amount, category }) => ({ name, amount, category })));
      showToast(`${result.created}건 저장되었습니다`);
      router.replace(`/?month=${result.month}`);
    } catch (err) {
      showToast(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className={s.top}>
        <span className={s.receiptIcon}><ReceiptText size={26} color="var(--primary)" aria-hidden="true" /></span>
        <div className={s.topBody}>
          <div className={s.topRow}>
            {editingMerchant ? (
              <input className={s.merchantInput} value={merchant} placeholder="상호" autoFocus maxLength={40}
                aria-label="상호" onChange={(event) => setMerchant(event.target.value)} onBlur={() => setEditingMerchant(false)} />
            ) : (
              <button type="button" className={s.merchant} onClick={() => setEditingMerchant(true)}>
                <span>{merchant || '상호'}</span>
                <PencilLine size={18} color="var(--ink-3)" aria-label="상호 고치기" />
              </button>
            )}
          </div>
          <label className={s.dateRow} onClick={() => dateRef.current?.showPicker?.()}>
            <span>{formatDate(occurredOn)}</span>
            <Calendar size={18} color="var(--ink-3)" aria-hidden="true" />
            <input ref={dateRef} type="date" className={s.dateInput} value={occurredOn} min="2000-01-01" max={todayKorea()}
              aria-label="날짜" onChange={(event) => { if (event.target.value) setOccurredOn(event.target.value); }} />
          </label>
        </div>
      </section>

      <div className={s.banner}>
        {mismatch
          ? <Banner variant="warn">품목 합계와 영수증 합계가 다릅니다 (차액 {formatWon(itemsSum - (receipt.total_amount ?? 0))}원)</Banner>
          : <Banner variant="success">품목 합계가 영수증 합계와 일치합니다</Banner>}
      </div>

      <p className={s.count}>품목 {items.length}개</p>
      {items.length > 0 && (
        <section className={s.items}>
          {items.map((item) => (
            <div key={item.key} className={s.item} onClick={() => setEditing(item)}>
              <div className={s.itemTop}>
                <span className={s.itemName}>
                  <span className={s.ellipsis}>{item.name}</span>
                  {item.quantity >= 2 && <span className={s.quantity}>x{item.quantity}</span>}
                </span>
                <span className={item.is_discount ? `${s.itemAmount} ${s.discount}` : s.itemAmount}>
                  {item.amount < 0 ? '-' : ''}{formatWon(item.amount)}
                </span>
              </div>
              {/* 칩과 휴지통을 눌렀을 때는 행 전체의 수정 시트가 열리지 않게 한다 */}
              <div className={s.itemBottom} onClick={(event) => event.stopPropagation()}>
                <CategoryChip category={item.category} onClick={() => setChoosingCategory(item)} />
                <IconButton icon={Trash2} label="품목 삭제" size={32} color="var(--ink-3)" onClick={() => removeItem(item.key)} />
              </div>
            </div>
          ))}
        </section>
      )}

      <button type="button" className={s.addButton} onClick={addItem}>
        <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
        품목 추가
      </button>

      <ActionBarSpacer />
      <div className={s.barSpace} />
      <ActionBar>
        {mismatch ? (
          <div className={s.sumRow}>
            <div className={s.sumBlock}>
              <span className={s.sumLabel}>영수증 합계</span>
              <span className={s.receiptTotal}>{formatWon(receipt.total_amount ?? 0)}원</span>
            </div>
            <div className={`${s.sumBlock} ${s.sumRight}`}>
              <span className={`${s.sumLabel} ${s.warn}`}>품목 합계</span>
              <span className={`${s.sumValue} ${s.warn}`}>{itemsSum < 0 ? '-' : ''}{formatWon(itemsSum)}원</span>
            </div>
          </div>
        ) : (
          <div className={s.sumRow}>
            <span className={s.sumPlainLabel}>합계</span>
            <span className={s.sumValue}>{itemsSum < 0 ? '-' : ''}{formatWon(itemsSum)}원</span>
          </div>
        )}
        <Button disabled={!canSave} loading={submitting} onClick={handleSave}>{items.length}건 저장</Button>
      </ActionBar>

      {editing && (
        <ItemSheet item={editing} isNew={!items.some((item) => item.key === editing.key)}
          onConfirm={saveItem} onDelete={() => removeItem(editing.key)} onClose={() => setEditing(null)} />
      )}

      <Sheet open={choosingCategory !== null} onClose={() => setChoosingCategory(null)} title="카테고리">
        {choosingCategory && (
          <CategoryChoices value={choosingCategory.category} onChange={chooseCategory} />
        )}
      </Sheet>
    </>
  );
}
