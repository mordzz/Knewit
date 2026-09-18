import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, unlikePost } from '@/lib/feedService';
import { patchFeedItem, restoreFeedItem } from '@/lib/feedCache';
import type { FeedItem } from '@/types/social';

interface ToggleLikeInput {
  postId: string;
  liked: boolean;
}

/**
 * Web equivalent of `apps/mobile/src/features/home/hooks/useToggleLike.ts`
 * — optimistic like/unlike, same flip-then-reconcile-then-rollback
 * shape: flips `liked`/`likeCount` in every cache holding this post the
 * instant the button is pressed, fires the real mutation, and rolls
 * back to the exact previous cache state on failure.
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, liked }: ToggleLikeInput) => (liked ? unlikePost(postId) : likePost(postId)),
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
      patchFeedItem(queryClient, postId, (item) => ({
        ...item,
        liked: result.liked,
        likeCount: result.likeCount,
      }));
    },
  });
}
