import { useInfiniteQuery } from '@tanstack/react-query';
import { getFollowing } from '@/features/profile/services/userService';

export function useFollowing(userId: string) {
  return useInfiniteQuery({
    queryKey: ['following', userId],
    queryFn: ({ pageParam }) => getFollowing(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
