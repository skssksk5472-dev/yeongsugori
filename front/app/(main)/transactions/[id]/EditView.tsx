'use client';

// H4 내역 수정 — H3 폼에 기존 값을 채운다. 휴지통은 삭제 확인, 영수증 내역은 안내 줄과 이미지 보기 (02 문서 5절)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';
import { Banner } from '../../../_components/Banner';
import { Button } from '../../../_components/Button';
import { Dialog } from '../../../_components/Dialog';
import { Header } from '../../../_components/Header';
import { IconButton } from '../../../_components/IconButton';
import { NotFoundMessage } from '../../../_components/NotFoundMessage';
import { Skeleton } from '../../../_components/Skeleton';
import { useToast } from '../../../_components/Toast';
import {
  ApiError, deleteTransaction, editTransaction, errorText, getTransaction, receiptImageUrl, type Transaction, type TransactionInput,
} from '../../../_lib/api';
import { TransactionForm } from '../../_transaction/TransactionForm';
import s from './edit.module.css';

export function EditView({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'notFound' | 'failed'>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getTransaction(transactionId)
      .then((item) => {
        setTransaction(item);
        setState('ready');
      })
      .catch((err) => setState(err instanceof ApiError && err.code === 'not_found' ? 'notFound' : 'failed'));
  }, [transactionId, reloadKey]);

  async function handleSubmit(input: TransactionInput) {
    setSubmitting(true);
    try {
      await editTransaction(transactionId, input);
      showToast('저장되었습니다');
      router.back();
    } catch (err) {
      showToast(errorText(err));
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteTransaction(transactionId);
      showToast('삭제되었습니다');
      router.back();
    } catch (err) {
      setDeleteOpen(false);
      showToast(errorText(err));
    }
  }

  const trash = state === 'ready'
    ? <IconButton icon={Trash2} label="삭제" color="var(--danger)" onClick={() => setDeleteOpen(true)} />
    : undefined;

  return (
    <main>
      <Header title="내역 수정" right={trash} />

      {state === 'loading' && <Skeleton />}
      {state === 'notFound' && <NotFoundMessage />}
      {state === 'failed' && (
        <div className={s.banner}>
          <Banner variant="danger" action={<button type="button" onClick={() => setReloadKey(reloadKey + 1)}>다시 시도</button>}>
            불러오지 못했습니다
          </Banner>
        </div>
      )}

      {state === 'ready' && transaction && (
        <>
          {transaction.receipt_id && (
            <div className={s.banner}>
              <Banner variant="info" action={<button type="button" onClick={() => setImageOpen(true)}>영수증 보기</button>}>
                영수증으로 등록된 내역
              </Banner>
            </div>
          )}
          <TransactionForm initial={transaction} isReceipt={transaction.receipt_id !== null}
            submitting={submitting} onSubmit={handleSubmit} />
        </>
      )}

      <Dialog open={deleteOpen} title="삭제하시겠습니까?" actions={<>
        <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>취소</Button>
        <Button variant="danger" size="sm" onClick={handleDelete}>삭제</Button>
      </>} />

      {imageOpen && transaction?.receipt_id && (
        <ReceiptImageViewer receiptId={transaction.receipt_id} onClose={() => setImageOpen(false)} />
      )}
    </main>
  );
}

// 영수증 이미지 뷰어 — 전체 화면, 어두운 배경, 오른쪽 위 닫기. 확대는 브라우저 기본 (06 문서 5절)
function ReceiptImageViewer({ receiptId, onClose }: { receiptId: string; onClose: () => void }) {
  return (
    <div className={s.viewer} role="dialog" aria-modal="true" aria-label="영수증 이미지">
      {/* eslint-disable-next-line @next/next/no-img-element -- 로그인한 본인만 받는 API 이미지라 next/image 최적화를 쓰지 않는다 */}
      <img className={s.image} src={receiptImageUrl(receiptId)} alt="영수증 이미지" />
      <div className={s.close}>
        <IconButton icon={X} label="닫기" color="#fff" onClick={onClose} />
      </div>
    </div>
  );
}
