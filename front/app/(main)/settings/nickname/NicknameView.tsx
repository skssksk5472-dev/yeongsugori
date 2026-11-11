'use client';

// 닉네임 변경 — 지금 닉네임을 채워 두고, 바꾸면 뒤로 가며 토스트 (02 문서 5절 S2 패턴)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionBar } from '../../../_components/ActionBar';
import { Button } from '../../../_components/Button';
import { Field } from '../../../_components/Field';
import { Header } from '../../../_components/Header';
import { useToast } from '../../../_components/Toast';
import { ApiError, changeNickname } from '../../../_lib/api';
import { getMe } from '../../../_lib/session';
import { checkNickname } from '../../../_lib/validators';
import s from '../form.module.css';

export function NicknameView() {
  const router = useRouter();
  const showToast = useToast();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMe().then((user) => setNickname(user?.nickname ?? '')).catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const message = checkNickname(nickname);
    setError(message);
    if (message) return;

    setSubmitting(true);
    try {
      await changeNickname(nickname.trim());
      showToast('변경되었습니다');
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'validation') setError(err.fields.nickname);
      else showToast(err instanceof Error ? err.message : '서버에 연결할 수 없습니다');
      setSubmitting(false);
    }
  }

  return (
    <form className={s.page} onSubmit={handleSubmit} noValidate>
      <Header title="닉네임 변경" />
      <div className={s.fields}>
        <Field label="닉네임" value={nickname} onChange={setNickname} error={error} autoComplete="nickname" />
      </div>
      <ActionBar>
        <Button type="submit" loading={submitting}>변경</Button>
      </ActionBar>
    </form>
  );
}
