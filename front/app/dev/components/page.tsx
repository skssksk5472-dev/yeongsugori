import { notFound } from 'next/navigation';
import { ComponentsView } from './ComponentsView';

// 개발용 컴포넌트 모음 — 시안(design/png/DS-design-system.png)과 비교할 때만 쓴다. 배포(npm run build)에서는 404
export default function ComponentsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ComponentsView />;
}
