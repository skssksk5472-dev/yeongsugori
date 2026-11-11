import { EditView } from './EditView';

// H4 내역 수정
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditView transactionId={id} />;
}
