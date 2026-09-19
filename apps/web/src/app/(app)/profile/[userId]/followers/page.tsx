import { FollowListView } from '@/features/profile/components/FollowListView';

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <FollowListView userId={userId} kind="followers" />;
}
