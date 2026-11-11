import { ResultView } from './ResultView';

// O3 인식 결과 (O3b 합계 불일치, O4 품목 수정 시트)
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultView receiptId={id} />;
}
