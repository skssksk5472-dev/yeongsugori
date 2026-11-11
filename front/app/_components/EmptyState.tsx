// 빈 상태 — 빈 영수증 그림, 제목 18/800, 보조 문구, 아래 버튼 (H1e, 빈 분석)

import { ReceiptIllustration } from './ReceiptIllustration';
import s from './emptyState.module.css';

type Props = {
  title: string;
  description?: string;
  children?: React.ReactNode; // 버튼
};

export function EmptyState({ title, description, children }: Props) {
  return (
    <div className={s.empty}>
      <ReceiptIllustration width={104} height={136} stamp={false} rows={4} label="빈 영수증 일러스트" />
      <p className={s.title}>{title}</p>
      {description && <p className={s.description}>{description}</p>}
      {children && <div className={s.actions}>{children}</div>}
    </div>
  );
}
