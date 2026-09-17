import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { FeedItem } from '@/types/social';
import type { Paginated } from '@/types/common';

/**
 * Applies the same patch to a `FeedItem` wherever it's cached — the
 * feed's infinite-query pages (`['feed']`) and the single-post detail
 * query (`['post', id]`) both store the identical shape, and Sprint 9
 * requires their counts/like-state to never visibly disagree (see
 * docs/DECISIONS.md, "One Patch Function, Two Cache Entries"). Used for
 * both optimistic updates (like/unlike) and settled-count adjustments
 * (comment create/delete) — never for anything a real refetch wouldn't
 * eventually confirm.
 *
 * Returns the previous feed/detail cache values (for optimistic-update
 * rollback); callers that don't need rollback can ignore the return.
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

/** Restores exactly what `patchFeedItem` returned — used to roll back
 * an optimistic update when the real mutation fails. */
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
