import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/features/home/services/commentService';
import { patchFeedItem } from '@/features/home/utils/feedCache';
import { patchComment } from '@/features/home/utils/commentCache';
import type { CreateCommentInput } from '@/types/social';

/**
 * Posts a top-level comment, or a reply when `input.parentCommentId` is
 * set (see docs/DECISIONS.md, "One Reply Level"). On success:
 * - Top-level: refetches this post's top-level comment list (simplest
 *   correct way to include the new comment in a paginated cache without
 *   manually reconstructing page shape).
 * - Reply: refetches the parent comment's reply thread instead, and
 *   bumps that parent's `replyCount` by 1 wherever it's cached.
 * - Either way: bumps the post's overall `commentCount` by 1  a reply
 *   still counts toward the post's total, same as X's own reply-count
 *   model (see docs/DECISIONS.md).
 */
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) => createComment(postId, input),
    onSuccess: (_result, input) => {
      if (input.parentCommentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', input.parentCommentId] });
        patchComment(queryClient, postId, input.parentCommentId, (item) => ({
          ...item,
          replyCount: item.replyCount + 1,
        }));
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
      patchFeedItem(queryClient, postId, (item) => ({
        ...item,
        commentCount: item.commentCount + 1,
      }));
    },
  });
}
