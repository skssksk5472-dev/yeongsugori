'use client';

// 없는 내역·주소 — 가운데 "페이지를 찾을 수 없습니다" + 내역으로 버튼 (06 문서 5절)

import { useRouter } from 'next/navigation';
import { Button } from './Button';
import s from './notFoundMessage.module.css';

export function NotFoundMessage() {
  const router = useRouter();
  return (
    <div className={s.box}>
      <p className={s.text}>페이지를 찾을 수 없습니다</p>
      <div className={s.button}>
        <Button variant="soft" onClick={() => router.replace('/')}>내역으로</Button>
      </div>
    </div>
  );
}
