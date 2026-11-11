import { Suspense } from 'react';
import { StatsView } from './StatsView';

// N1 분석. 주소의 ?month= 를 읽으므로 Suspense 로 감싼다 (Next.js 규칙)
export default function StatsPage() {
  return (
    <Suspense>
      <StatsView />
    </Suspense>
  );
}
