'use client';

// S2 비밀번호 변경 — 현재 비밀번호가 틀리면 그 칸에 문구. 성공하면 뒤로 가며 토스트 (02 문서 5절)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionBar } from '../../../_components/ActionBar';
import { Button } from '../../../_components/Button';
import { Field } from '../../../_components/Field';
import { Header } from '../../../_components/Header';
import { useToast } from '../../../_components/Toast';
import { ApiError, changePassword } from '../../../_lib/api';
import { checkPassword, checkPasswordConfirm } from '../../../_lib/validators';
import s from '../form.module.css';

type Errors = { current?: string; next?: string; confirm?: string };

export function PasswordView() {
  const router = useRouter();
  const showToast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const found = { next: checkPassword(next), confirm: checkPasswordConfirm(next, confirm) };
    setErrors(found);
    if (found.next || found.confirm) return;

    setSubmitting(true);
    try {
      await changePassword(current, next);
      showToast('변경되었습니다');
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'wrong_password') setErrors({ current: err.message });
      else if (err instanceof ApiError && err.code === 'validation') setErrors({ next: err.fields.new_password });
      else showToast(err instanceof Error ? err.message : '서버에 연결할 수 없습니다');
      setSubmitting(false);
    }
  }

  return (
    <form className={s.page} onSubmit={handleSubmit} noValidate>
      <Header title="비밀번호 변경" />
      <div className={s.fields}>
        <Field label="현재 비밀번호" type="password" value={current} onChange={setCurrent} error={errors.current}
          autoComplete="current-password" />
        <Field label="새 비밀번호" type="password" value={next} onChange={setNext} error={errors.next}
          helper="8자 이상, 영문과 숫자 포함" autoComplete="new-password" />
        <Field label="새 비밀번호 확인" type="password" value={confirm} onChange={setConfirm} error={errors.confirm}
          autoComplete="new-password" />
      </div>
      <ActionBar>
        <Button type="submit" loading={submitting}>변경</Button>
      </ActionBar>
    </form>
  );
}
