import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/features/home/services/commentService';
import { patchFeedItem } from '@/features/home/utils/feedCache';
import type { CreateCommentInput } from '@/types/social';

/** On success: refetches this post's comment list (simplest correct way
 * to include the new comment in a paginated cache without manually
 * reconstructing page shape) and bumps `commentCount` by exactly 1
 * wherever this post is cached — see docs/DECISIONS.md. */
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) => createComment(postId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      patchFeedItem(queryClient, postId, (item) => ({
        ...item,
        commentCount: item.commentCount + 1,
      }));
    },
  });
}
