'use client';

// 로그인·회원가입 화면의 틀 — 이미 로그인했으면 내역(/)으로 보낸다.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '../_lib/session';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getMe()
      .then((user) => {
        if (user) router.replace('/');
        else setChecked(true);
      })
      .catch(() => setChecked(true)); // 서버 오류여도 로그인 화면은 보여 준다
  }, [router]);

  if (!checked) return null;
  return children;
}
