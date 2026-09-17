import { useInfiniteQuery } from '@tanstack/react-query';
import { getFollowers } from '@/features/profile/services/userService';

export function useFollowers(userId: string) {
  return useInfiniteQuery({
    queryKey: ['followers', userId],
    queryFn: ({ pageParam }) => getFollowers(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
