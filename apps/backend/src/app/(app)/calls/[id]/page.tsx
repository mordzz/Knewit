import { PostDetailView } from './PostDetailView';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetailView postId={id} />;
}
