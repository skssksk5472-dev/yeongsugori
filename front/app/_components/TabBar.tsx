'use client';

// 하단 탭 — 높이 72 + safe-area, 내역·분석·설정 3개. 활성 탭은 초록, 아이콘 두께 2.4 (06 문서 3절)

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartPie, List, Settings } from 'lucide-react';
import s from './tabBar.module.css';

const TABS = [
  { href: '/', label: '내역', Icon: List },
  { href: '/stats', label: '분석', Icon: ChartPie },
  { href: '/settings', label: '설정', Icon: Settings },
];

// "/" 는 분석·설정이 아닌 모든 화면(내역, 추가, 수정, 스캔)에서 활성으로 본다.
function isActive(pathname: string, href: string): boolean {
  if (href === '/') return !TABS.some((tab) => tab.href !== '/' && pathname.startsWith(tab.href));
  return pathname.startsWith(href);
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className={`fixedInApp ${s.bar}`} aria-label="주요 메뉴">
      {TABS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} className={active ? `${s.tab} ${s.active}` : s.tab}
            aria-current={active ? 'page' : undefined}>
            <Icon size={24} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
