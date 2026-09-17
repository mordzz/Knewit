import { useInfiniteQuery } from '@tanstack/react-query';
import { getCommentReplies } from '@/lib/commentService';

/** Web equivalent of `apps/mobile/src/features/home/hooks/useCommentReplies.ts`
 * — one level deep, only fetched once a thread is expanded. */
export function useCommentReplies(commentId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['commentReplies', commentId],
    queryFn: ({ pageParam }) => getCommentReplies(commentId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
