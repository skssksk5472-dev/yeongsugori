// 불러오는 중 — seg 색 라운드 블록, 높이 64 x 3줄 (06 문서 5절)

import s from './skeleton.module.css';

export function Skeleton() {
  return (
    <div className={s.list} aria-busy="true" aria-label="불러오는 중">
      <div className={s.row} />
      <div className={s.row} />
      <div className={s.row} />
    </div>
  );
}
