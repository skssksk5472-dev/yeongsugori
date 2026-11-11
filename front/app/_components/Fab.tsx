// 내역 추가 버튼(FAB) — 56 원형, 오른쪽 20, 하단 탭 위 16 (06 문서 3절)

import { Plus } from 'lucide-react';
import s from './fab.module.css';

type Props = { onClick: () => void };

export function Fab({ onClick }: Props) {
  // 폰 폭 컨테이너와 같은 폭의 고정 줄 안에 두어, 넓은 화면에서도 컨테이너 오른쪽 끝에 붙는다.
  return (
    <div className={`fixedInApp ${s.line}`}>
      <button type="button" className={s.fab} aria-label="내역 추가" onClick={onClick}>
        <Plus size={28} color="#fff" strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}
