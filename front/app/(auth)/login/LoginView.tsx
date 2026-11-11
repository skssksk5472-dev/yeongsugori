'use client';

// A1 로그인 — 이메일·비밀번호를 받아 로그인한다. 실패하면 비밀번호 아래에 문구 (02 문서 5절)

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../_components/Button';
import { Field } from '../../_components/Field';
import { LogoMark } from '../../_components/LogoMark';
import { ReceiptIllustration } from '../../_components/ReceiptIllustration';
import { useToast } from '../../_components/Toast';
import { ApiError } from '../../_lib/api';
import { login } from '../../_lib/session';
import s from './login.module.css';

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 다른 화면에서 로그인이 만료되어 넘어온 경우 (api.ts 의 전역 401 처리)
  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      showToast('로그인이 만료되었습니다');
      router.replace('/login');
    }
  }, [searchParams, showToast, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_credentials') setError(err.message);
      else showToast(err instanceof Error ? err.message : '서버에 연결할 수 없습니다');
      setSubmitting(false);
    }
  }

  return (
    <main className={s.page}>
      <div className={s.hero}>
        <div className={s.brand}>
          <LogoMark size={52} background="#fff" color="var(--primary)" />
          <p className={s.name}>잘씀</p>
          <p className={s.english}>ZALSSM</p>
          <p className={s.tagline}>영수증으로 기록하는 가계부</p>
        </div>
        <div className={s.illustration}>
          <ReceiptIllustration width={124} height={168} rows={5} label="영수증 일러스트" />
        </div>
      </div>

      <form className={s.panel} onSubmit={handleSubmit} noValidate>
        <h1 className={s.title}>로그인</h1>
        <Field label="이메일" type="email" value={email} onChange={setEmail} placeholder="example@email.com"
          inputMode="email" autoComplete="email" />
        <Field label="비밀번호" type="password" value={password} onChange={setPassword} error={error}
          autoComplete="current-password" />
        <div className={s.space} />
        <Button type="submit" disabled={!email || !password} loading={submitting}>로그인</Button>
        <p className={s.link}>
          <span>계정이 없으신가요?</span>
          <Link href="/signup">회원가입</Link>
        </p>
      </form>
    </main>
  );
}
