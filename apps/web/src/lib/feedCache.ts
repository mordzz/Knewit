import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { FeedItem } from '@/types/social';
import type { Paginated } from '@/types/common';

/**
 * Web equivalent of `apps/mobile/src/features/home/utils/feedCache.ts`
 * — applies the same patch to a `FeedItem` wherever it's cached
 * (`['feed']`'s infinite-query pages and `['post', id]`'s single-post
 * detail query), so a like/comment-count change never visibly disagrees
 * between the feed and the detail page. Used for both optimistic
 * updates (like/unlike) and settled-count adjustments.
 */
export function patchFeedItem(
  queryClient: QueryClient,
  postId: string,
  patch: (item: FeedItem) => FeedItem
) {
  const previousDetail = queryClient.getQueryData<FeedItem>(['post', postId]);
  const previousFeedPages = queryClient.getQueriesData<InfiniteData<Paginated<FeedItem>>>({
    queryKey: ['feed'],
  });

  if (previousDetail) {
    queryClient.setQueryData<FeedItem>(['post', postId], patch(previousDetail));
  }

  queryClient.setQueriesData<InfiniteData<Paginated<FeedItem>>>({ queryKey: ['feed'] }, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === postId ? patch(item) : item)),
      })),
    };
  });

  return { previousDetail, previousFeedPages };
}

/** Restores exactly what `patchFeedItem` returned — rolls back an
 * optimistic update when the real mutation fails. */
export function restoreFeedItem(
  queryClient: QueryClient,
  postId: string,
  snapshot: ReturnType<typeof patchFeedItem>
) {
  if (snapshot.previousDetail) {
    queryClient.setQueryData(['post', postId], snapshot.previousDetail);
  }
  for (const [queryKey, data] of snapshot.previousFeedPages) {
    queryClient.setQueryData(queryKey, data);
  }
}
