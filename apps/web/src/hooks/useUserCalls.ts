import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserCalls } from '@/lib/postService';

export function useUserCalls(userId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['profile-calls', userId],
    queryFn: ({ pageParam }) => getUserCalls(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
