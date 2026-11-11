import { Suspense } from 'react';
import { CategoryDetailView } from './CategoryDetailView';

// N2 카테고리 상세. 주소의 ?month= 를 읽으므로 Suspense 로 감싼다 (Next.js 규칙)
export default async function CategoryDetailPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return (
    <Suspense>
      <CategoryDetailView category={decodeURIComponent(category)} />
    </Suspense>
  );
}
