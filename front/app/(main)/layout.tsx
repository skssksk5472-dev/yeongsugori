'use client';

// 로그인이 필요한 화면들의 틀 — 들어올 때 로그인을 확인하고, 아니면 /login 으로 보낸다.
// 하단 탭은 탭 화면(내역 /, 분석 /stats, 설정 /settings)에서만 보인다 (02 문서 2절).

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMe } from '../_lib/session';
import { TabBar } from '../_components/TabBar';
import s from './main.module.css';

const TAB_PATHS = ['/', '/stats', '/settings'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getMe()
      .then((user) => {
        if (user) setChecked(true);
        else router.replace('/login');
      })
      .catch(() => setChecked(true)); // 서버 오류는 각 화면이 안내한다
  }, [router]);

  // 확인 전에는 보호된 화면을 그리지 않는다 (로그아웃 후 뒤로가기 대비)
  if (!checked) return null;

  if (!TAB_PATHS.includes(pathname)) return children;
  return (
    <>
      <div className={s.content}>{children}</div>
      <TabBar />
    </>
  );
}
