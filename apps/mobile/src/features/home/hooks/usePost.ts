import { useQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { getPostById } from '@/features/home/services/postService';
import type { Paginated } from '@/types/common';
import type { FeedItem } from '@/types/social';

/** Scans the feed's already-cached pages for this post, so opening a
 * Call/Post already visible in the feed renders instantly instead of a
 * blank skeleton  same `placeholderData` pattern as
 * `features/markets/hooks/useMarket.ts`. */
function findCachedPost(
  postId: string,
  queryClient: ReturnType<typeof useQueryClient>
): FeedItem | undefined {
  const cachedPages = queryClient.getQueriesData<InfiniteData<Paginated<FeedItem>>>({
    queryKey: ['feed'],
  });

  for (const [, data] of cachedPages) {
    if (!data) continue;
    for (const page of data.pages) {
      const match = page.items.find((item) => item.id === postId);
      if (match) return match;
    }
  }

  return undefined;
}

/** Call/Post Detail  always re-fetches its own copy (never trusts only
 * the cached feed row), same reasoning as `useMarket`. */
export function usePost(postId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
    placeholderData: () => findCachedPost(postId, queryClient),
  });
}
