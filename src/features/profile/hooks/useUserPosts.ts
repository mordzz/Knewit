import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserPosts } from '@/features/home/services/postService';

/** `enabled` lets `ProfileScreen` skip fetching a tab that isn't
 * currently open — see docs/DECISIONS.md ("Profile Tabs Fetch Lazily,
 * On First Selection Only"). */
export function useUserPosts(userId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['profile-posts', userId],
    queryFn: ({ pageParam }) => getUserPosts(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
