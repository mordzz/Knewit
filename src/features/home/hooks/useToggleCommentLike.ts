import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likeComment, unlikeComment } from '@/features/home/services/commentService';
import { patchComment, restoreComment } from '@/features/home/utils/commentCache';
import type { CommentItem } from '@/types/social';

interface ToggleCommentLikeInput {
  postId: string;
  commentId: string;
  liked: boolean;
}

/**
 * Optimistic like/unlike for a comment — same pattern and same "no
 * backend in this environment means it visibly flips and reverts" honest
 * behavior as `useToggleLike` (see that hook's own comment for the
 * reasoning; not repeated here).
 */
export function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, liked }: ToggleCommentLikeInput) =>
      liked ? unlikeComment(commentId) : likeComment(commentId),
    onMutate: async ({ postId, commentId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      await queryClient.cancelQueries({ queryKey: ['commentReplies'] });

      const snapshot = patchComment(queryClient, postId, commentId, (item: CommentItem) => ({
        ...item,
        liked: !liked,
        likeCount: item.likeCount + (liked ? -1 : 1),
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
        liked: result.liked,
        likeCount: result.likeCount,
      }));
    },
  });
}
