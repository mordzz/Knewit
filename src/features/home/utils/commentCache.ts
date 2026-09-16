import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { CommentItem } from '@/types/social';
import type { Paginated } from '@/types/common';

/**
 * Applies the same patch to a `CommentItem` wherever it's cached — a
 * top-level comment lives in `['comments', postId]`; a reply lives in
 * whichever `['commentReplies', parentCommentId]` cache its thread was
 * expanded into. The caller doesn't necessarily know which parent a
 * given comment id belongs to (a `CommentRow` only has its own id), so
 * every currently-cached `['commentReplies', ...]` query is scanned for
 * a matching item — the same prefix-scan approach `feedCache.ts` uses
 * for `['feed']`. Used for both optimistic updates (like, share) and
 * settled-count adjustments (reply create) — never for anything a real
 * refetch wouldn't eventually confirm. See docs/DECISIONS.md ("One
 * Patch Function, Two Cache Entries", extended here to comments).
 *
 * Returns the previous cache values (for optimistic-update rollback);
 * callers that don't need rollback can ignore the return.
 */
export function patchComment(
  queryClient: QueryClient,
  postId: string,
  commentId: string,
  patch: (item: CommentItem) => CommentItem
) {
  const previousTopLevel = queryClient.getQueriesData<InfiniteData<Paginated<CommentItem>>>({
    queryKey: ['comments', postId],
  });
  const previousReplies = queryClient.getQueriesData<InfiniteData<Paginated<CommentItem>>>({
    queryKey: ['commentReplies'],
  });

  function patchPages(data: InfiniteData<Paginated<CommentItem>> | undefined) {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === commentId ? patch(item) : item)),
      })),
    };
  }

  queryClient.setQueriesData<InfiniteData<Paginated<CommentItem>>>(
    { queryKey: ['comments', postId] },
    patchPages
  );
  queryClient.setQueriesData<InfiniteData<Paginated<CommentItem>>>(
    { queryKey: ['commentReplies'] },
    patchPages
  );

  return { previousTopLevel, previousReplies };
}

/** Restores exactly what `patchComment` returned — used to roll back an
 * optimistic update when the real mutation fails. */
export function restoreComment(
  queryClient: QueryClient,
  snapshot: ReturnType<typeof patchComment>
) {
  for (const [queryKey, data] of snapshot.previousTopLevel) {
    queryClient.setQueryData(queryKey, data);
  }
  for (const [queryKey, data] of snapshot.previousReplies) {
    queryClient.setQueryData(queryKey, data);
  }
}
