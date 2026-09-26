import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shareComment } from '@/lib/commentService';
import { patchComment, restoreComment } from '@/lib/commentCache';
import type { CommentItem } from '@/types/social';

interface ShareCommentInput {
  postId: string;
  commentId: string;
}

/** Web equivalent of `apps/mobile/src/features/home/hooks/useShareComment.ts`
 *  optimistic +1 for a comment's share count, fired once the Web Share
 * API resolves without throwing. */
export function useShareComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: ShareCommentInput) => shareComment(commentId),
    onMutate: async ({ postId, commentId }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      await queryClient.cancelQueries({ queryKey: ['commentReplies'] });

      const snapshot = patchComment(queryClient, postId, commentId, (item: CommentItem) => ({
        ...item,
        shareCount: item.shareCount + 1,
      }));

      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context) restoreComment(queryClient, context.snapshot);
    },
    onSuccess: (result, { postId, commentId }) => {
      patchComment(queryClient, postId, commentId, (item) => ({
        ...item,
        shareCount: result.shareCount,
      }));
    },
  });
}
