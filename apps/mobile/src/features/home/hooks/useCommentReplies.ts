import { useInfiniteQuery } from '@tanstack/react-query';
import { getCommentReplies } from '@/features/home/services/commentService';

/**
 * A single top-level comment's reply thread — one level deep (see
 * docs/DECISIONS.md, "One Reply Level"). `enabled` keeps this from
 * fetching until the thread is actually expanded (`CommentRow`'s "View
 * N replies" toggle) — a screen with dozens of comments shouldn't fetch
 * dozens of reply threads it hasn't been asked to show.
 */
export function useCommentReplies(commentId: string, postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['commentReplies', commentId],
    queryFn: ({ pageParam }) => getCommentReplies(commentId, postId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
