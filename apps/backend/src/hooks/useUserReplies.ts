import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserReplies } from '@/lib/commentService';

export function useUserReplies(userId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['profile-replies', userId],
    queryFn: ({ pageParam }) => getUserReplies(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
