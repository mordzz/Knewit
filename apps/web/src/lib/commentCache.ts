import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { CommentItem } from '@/types/social';
import type { Paginated } from '@/types/common';

/** Web equivalent of `apps/mobile/src/features/home/utils/commentCache.ts`
 * — applies the same patch to a `CommentItem` wherever it's cached (a
 * top-level comment in `['comments', postId]`, a reply in whichever
 * `['commentReplies', parentCommentId]` cache its thread was expanded
 * into). */
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

  queryClient.setQueriesData<InfiniteData<Paginated<CommentItem>>>({ queryKey: ['comments', postId] }, patchPages);
  queryClient.setQueriesData<InfiniteData<Paginated<CommentItem>>>({ queryKey: ['commentReplies'] }, patchPages);

  return { previousTopLevel, previousReplies };
}

export function restoreComment(queryClient: QueryClient, snapshot: ReturnType<typeof patchComment>) {
  for (const [queryKey, data] of snapshot.previousTopLevel) {
    queryClient.setQueryData(queryKey, data);
  }
  for (const [queryKey, data] of snapshot.previousReplies) {
    queryClient.setQueryData(queryKey, data);
  }
}
