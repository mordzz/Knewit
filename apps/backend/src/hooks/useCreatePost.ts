import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '@/lib/postService';

/** Web equivalent of `apps/mobile/src/features/home/hooks/useCreatePost.ts`
 * — same invalidation: the feed, the author's own Profile tabs/counters,
 * and the referenced market's activity list. */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-calls'] });
      queryClient.invalidateQueries({ queryKey: ['profile-activity'] });
      queryClient.invalidateQueries({ queryKey: ['market-activity'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
