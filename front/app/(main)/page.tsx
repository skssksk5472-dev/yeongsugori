import { Suspense } from 'react';
import { HomeView } from './HomeView';

// H1 내역. 주소의 ?month= 를 읽으므로 Suspense 로 감싼다 (Next.js 규칙)
export default function HomePage() {
  return (
    <Suspense>
      <HomeView />
    </Suspense>
  );
}
