// 하단 액션 바 — 폼 화면의 주요 버튼을 아래에 고정한다. 흰 배경, 위 1px 선 (06 문서 4절)

import s from './actionBar.module.css';

export function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className={`fixedInApp ${s.bar}`}>{children}</div>;
}

// 액션 바에 가려지지 않도록 화면 아래에 두는 빈 공간
export function ActionBarSpacer() {
  return <div className={s.spacer} aria-hidden="true" />;
}
