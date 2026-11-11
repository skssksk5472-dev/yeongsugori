'use client';

// 화면 헤더 — 높이 56. 탭 화면은 제목 24/800, 서브 화면은 뒤로 화살표 + 18/700 (06 문서 4절)

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { IconButton } from './IconButton';
import s from './header.module.css';

type Props = {
  title: string;
  back?: boolean; // 탭 화면이면 false
  right?: React.ReactNode; // 오른쪽 버튼 (예: 삭제)
};

export function Header({ title, back = true, right }: Props) {
  const router = useRouter();
  return (
    <header className={back ? s.header : `${s.header} ${s.tab}`}>
      {back && <IconButton icon={ChevronLeft} label="뒤로" onClick={() => router.back()} />}
      <h1 className={back ? s.title : `${s.title} ${s.big}`}>{title}</h1>
      {right}
    </header>
  );
}
