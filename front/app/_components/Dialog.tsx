// 확인 다이얼로그 — 가운데, 좌우 32 여백, 라운드 24, 제목 20/800. 버튼은 actions 에 두 개 넣는다 (06 문서 3절)

import s from './dialog.module.css';

type Props = {
  open: boolean;
  title: string;
  children?: React.ReactNode; // 설명, 입력 칸
  actions: React.ReactNode; // 예: 취소 / 확인 버튼
};

export function Dialog({ open, title, children, actions }: Props) {
  if (!open) return null;
  return (
    <div className={s.overlay}>
      <div className={s.dialog} role="alertdialog" aria-modal="true" aria-label={title}>
        <h2 className={s.title}>{title}</h2>
        {children}
        <div className={s.actions}>{actions}</div>
      </div>
    </div>
  );
}
