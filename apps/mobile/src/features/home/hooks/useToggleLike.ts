import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, unlikePost } from '@/features/home/services/postService';
import { patchFeedItem, restoreFeedItem } from '@/features/home/utils/feedCache';
import type { FeedItem } from '@/types/social';

interface ToggleLikeInput {
  postId: string;
  liked: boolean;
}

/**
 * Optimistic like/unlike (Sprint 9 spec explicitly invites this for
 * Like specifically): flips `liked`/`likeCount` in every cache that
 * holds this post the instant the button is tapped, fires the real
 * mutation, and rolls back to the exact previous cache state on
 * failure. In this environment (no backend), every like will visibly
 * flip and then revert a moment later  that's the correct, honest
 * behavior of an optimistic update whose real request never lands, not
 * a bug  see docs/DECISIONS.md.
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, liked }: ToggleLikeInput) =>
      liked ? unlikePost(postId) : likePost(postId),
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const snapshot = patchFeedItem(queryClient, postId, (item: FeedItem) => ({
        ...item,
        liked: !liked,
        likeCount: item.likeCount + (liked ? -1 : 1),
      }));

      return { postId, snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        restoreFeedItem(queryClient, context.postId, context.snapshot);
      }
    },
    onSuccess: (result, { postId }) => {
      // Reconciles with the backend's authoritative count rather than
      // trusting the optimistic +/-1 guess forever  matters if other
      // users liked the same post in the meantime.
      patchFeedItem(queryClient, postId, (item) => ({
        ...item,
        liked: result.liked,
        likeCount: result.likeCount,
      }));
    },
  });
}
