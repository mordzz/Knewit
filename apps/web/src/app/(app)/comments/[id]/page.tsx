import { CommentDetailView } from '@/components/CommentDetailView';

export default async function CommentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CommentDetailView commentId={id} />;
}
