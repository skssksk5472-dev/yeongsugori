'use client';

// A2 회원가입 — 칸을 벗어날 때와 제출할 때 검증한다. 성공하면 바로 로그인되어 내역(/)으로 간다 (02 문서 5절)

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ActionBar, ActionBarSpacer } from '../../_components/ActionBar';
import { Button } from '../../_components/Button';
import { Field } from '../../_components/Field';
import { Header } from '../../_components/Header';
import { useToast } from '../../_components/Toast';
import { ApiError } from '../../_lib/api';
import { signup } from '../../_lib/session';
import { checkEmail, checkNickname, checkPassword, checkPasswordConfirm } from '../../_lib/validators';
import s from './signup.module.css';

type Errors = { email?: string; nickname?: string; password?: string; confirm?: string };

export function SignupView() {
  const router = useRouter();
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function setError(name: keyof Errors, message: string) {
    setErrors((prev) => ({ ...prev, [name]: message }));
  }

  function checkAll(): Errors {
    return {
      email: checkEmail(email),
      nickname: checkNickname(nickname),
      password: checkPassword(password),
      confirm: checkPasswordConfirm(password, confirm),
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const found = checkAll();
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSubmitting(true);
    try {
      await signup(email.trim(), nickname.trim(), password);
      showToast('가입되었습니다');
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_taken') setError('email', err.message);
      else if (err instanceof ApiError && err.code === 'validation') setErrors(err.fields);
      else showToast(err instanceof Error ? err.message : '서버에 연결할 수 없습니다');
      setSubmitting(false);
    }
  }

  return (
    <form className={s.page} onSubmit={handleSubmit} noValidate>
      <Header title="회원가입" />
      <div className={s.fields}>
        <Field label="이메일" type="email" value={email} onChange={setEmail} error={errors.email}
          onBlur={() => setError('email', checkEmail(email))} inputMode="email" autoComplete="email" />
        <Field label="닉네임" value={nickname} onChange={setNickname} error={errors.nickname}
          onBlur={() => setError('nickname', checkNickname(nickname))} autoComplete="nickname" />
        <Field label="비밀번호" type="password" value={password} onChange={setPassword} error={errors.password}
          helper="8자 이상, 영문과 숫자 포함" onBlur={() => setError('password', checkPassword(password))}
          autoComplete="new-password" />
        <Field label="비밀번호 확인" type="password" value={confirm} onChange={setConfirm} error={errors.confirm}
          onBlur={() => setError('confirm', checkPasswordConfirm(password, confirm))} autoComplete="new-password" />
      </div>
      <ActionBarSpacer />
      <ActionBar>
        <Button type="submit" loading={submitting}>가입하기</Button>
        <p className={s.link}>
          <span>이미 계정이 있으신가요?</span>
          <Link href="/login">로그인</Link>
        </p>
      </ActionBar>
    </form>
  );
}
