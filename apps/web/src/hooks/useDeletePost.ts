import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePost } from '@/lib/postService';

/** Deletes a Callout  the API enforces author-only. Invalidates every
 * surface a deleted Call appears on (feeds, the author's Profile tabs,
 * the attached market's activity), and drops the now-404 detail cache. */
export function useDeletePost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-following'] });
      queryClient.invalidateQueries({ queryKey: ['profile-calls'] });
      queryClient.invalidateQueries({ queryKey: ['profile-activity'] });
      queryClient.invalidateQueries({ queryKey: ['market-activity'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
