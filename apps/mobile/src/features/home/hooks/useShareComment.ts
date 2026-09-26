import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shareComment } from '@/features/home/services/commentService';
import { patchComment, restoreComment } from '@/features/home/utils/commentCache';
import type { CommentItem } from '@/types/social';

interface ShareCommentInput {
  postId: string;
  commentId: string;
}

/**
 * Optimistic +1 for a comment's share count, fired once the native
 * share sheet (`Share.share`) resolves without throwing  see
 * `CommentRow`. Unlike Like, there's no "unshare" to toggle back to, so
 * this only ever increments; the rollback path still exists for the
 * same reason `useToggleLike`'s does  in this no-backend dev
 * environment the real request fails and the optimistic +1 reverts,
 * which is the correct, honest behavior, not a bug.
 */
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
      if (context) {
        restoreComment(queryClient, context.snapshot);
      }
    },
    onSuccess: (result, { postId, commentId }) => {
      patchComment(queryClient, postId, commentId, (item) => ({
        ...item,
        shareCount: result.shareCount,
      }));
    },
  });
}
