'use client';

// O4 품목 수정 시트 — 품목명, 금액(원), 카테고리. 할인 품목은 양수로 적어도 음수로 저장한다 (02 문서 5절)

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../_components/Button';
import { Field } from '../../../_components/Field';
import { IconButton } from '../../../_components/IconButton';
import { Sheet } from '../../../_components/Sheet';
import { formatAmountInput, parseAmountInput } from '../../../_lib/format';
import { CategoryChoices } from './CategoryChoices';
import type { EditItem } from './ResultView';
import s from './result.module.css';

type Props = {
  item: EditItem; // 새 품목이면 빈 값
  isNew: boolean;
  onConfirm: (item: EditItem) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function ItemSheet({ item, isNew, onConfirm, onDelete, onClose }: Props) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(Math.abs(item.amount)); // 화면에서는 늘 양수로 보여 준다
  const [category, setCategory] = useState(item.category);
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});

  function handleConfirm() {
    const found = {
      name: name.trim() ? '' : '품목명을 입력하세요',
      amount: amount > 0 ? '' : '금액을 입력하세요',
    };
    setErrors(found);
    if (found.name || found.amount) return;
    onConfirm({ ...item, name: name.trim(), amount: item.is_discount ? -amount : amount, category });
  }

  return (
    <Sheet open onClose={onClose}>
      <div className={s.sheetBody}>
        <div className={s.sheetHeader}>
          <h2 className={s.sheetTitle}>{isNew ? '품목 추가' : '품목 수정'}</h2>
          <IconButton icon={X} label="닫기" size={36} onClick={onClose} />
        </div>
        <Field label="품목명" value={name} onChange={(value) => setName(value.slice(0, 40))} error={errors.name} />
        <Field label="금액" value={formatAmountInput(amount)} onChange={(value) => setAmount(parseAmountInput(value))}
          error={errors.amount} suffix="원" inputMode="numeric" />
        <p className={s.sheetLabel}>카테고리</p>
        <CategoryChoices value={category} onChange={setCategory} />
        <div className={s.sheetButtons}>
          {!isNew && <div className={s.deleteButton}><Button variant="dangerOutline" onClick={onDelete}>삭제</Button></div>}
          <div className={s.confirmButton}><Button onClick={handleConfirm}>확인</Button></div>
        </div>
      </div>
    </Sheet>
  );
}
