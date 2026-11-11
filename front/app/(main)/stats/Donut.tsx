// 카테고리 도넛 — SVG 원 하나에 카테고리마다 선 길이(stroke-dasharray)를 나눠 그린다. 차트 라이브러리 없음 (07 문서 2절)

import type { CategoryStat } from '../../_lib/api';
import { getCategory } from '../../_lib/categories';
import { formatWon } from '../../_lib/format';
import s from './stats.module.css';

const RADIUS = 76;
const STROKE = 30;
const CIRCLE = 2 * Math.PI * RADIUS;
const GAP = 2; // 조각 사이 흰 틈

type Slice = { category: string; length: number; start: number };

// 카테고리마다 원 둘레에서 차지할 길이와 시작 위치를 미리 계산한다.
function toSlices(categories: CategoryStat[]): Slice[] {
  const sum = categories.reduce((total, item) => total + item.amount, 0);
  const slices: Slice[] = [];
  let start = 0;
  for (const item of categories) {
    const length = (item.amount / sum) * CIRCLE;
    slices.push({ category: item.category, length, start });
    start += length;
  }
  return slices;
}

type Props = { categories: CategoryStat[]; totalExpense: number };

export function Donut({ categories, totalExpense }: Props) {
  return (
    <div className={s.donut}>
      <svg width={200} height={200} viewBox="0 0 200 200" role="img" aria-label="카테고리별 지출 비율 도넛 차트">
        {toSlices(categories).map((slice) => (
          <circle key={slice.category} cx={100} cy={100} r={RADIUS} fill="none" stroke={getCategory(slice.category).color}
            strokeWidth={STROKE} strokeDasharray={`${Math.max(slice.length - GAP, 0)} ${CIRCLE - slice.length + GAP}`}
            strokeDashoffset={-slice.start} transform="rotate(-90 100 100)" />
        ))}
      </svg>
      <div className={s.donutCenter}>
        <p className={s.donutLabel}>총 지출</p>
        <p className={s.donutTotal}>{formatWon(totalExpense)}원</p>
      </div>
    </div>
  );
}
