import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserReplies } from '@/features/home/services/commentService';

/** `enabled` lets `ProfileScreen` skip fetching a tab that isn't
 * currently open  see docs/DECISIONS.md ("Profile Tabs Fetch Lazily,
 * On First Selection Only"). Replaces `useUserPosts` on the Profile
 * screen  see `ProfileScreen`'s doc comment for why. */
export function useUserReplies(userId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['profile-replies', userId],
    queryFn: ({ pageParam }) => getUserReplies(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
