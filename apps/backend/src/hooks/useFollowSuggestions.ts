import { useInfiniteQuery } from '@tanstack/react-query';
import { getFollowSuggestions } from '@/lib/userService';

/**
 * Follow suggestions for the "Who to follow" rail — five per page, with
 * "Show more" fetching the next page (docs/DECISIONS.md, "Follow
 * Suggestions Sourced From Our Own Most-Followed Accounts"). Following
 * someone invalidates this key (`useFollowToggle`), so the row disappears
 * instead of lingering with a stale Follow button.
 */
export function useFollowSuggestions() {
  return useInfiniteQuery({
    queryKey: ['follow-suggestions'],
    queryFn: ({ pageParam }) => getFollowSuggestions(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
