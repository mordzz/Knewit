import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getPostById } from '@/lib/postService';
import type { Paginated } from '@/types/common';
import type { FeedItem } from '@/types/social';

function findCachedPost(postId: string, queryClient: ReturnType<typeof useQueryClient>): FeedItem | undefined {
  const cachedPages = queryClient.getQueriesData<InfiniteData<Paginated<FeedItem>>>({ queryKey: ['feed'] });

  for (const [, data] of cachedPages) {
    if (!data) continue;
    for (const page of data.pages) {
      const match = page.items.find((item) => item.id === postId);
      if (match) return match;
    }
  }

  return undefined;
}

/** Web equivalent of `apps/mobile/src/features/home/hooks/usePost.ts`
 * — scans the feed's already-cached pages so opening a post already
 * visible in the feed renders instantly, but always re-fetches its own
 * copy too. */
export function usePost(postId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
    placeholderData: () => findCachedPost(postId, queryClient),
  });
}
