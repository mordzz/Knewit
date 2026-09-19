import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserActivity } from '@/features/activity/lib/activityService';

export function useUserActivity(userId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['profile-activity', userId],
    queryFn: ({ pageParam }) => getUserActivity(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
