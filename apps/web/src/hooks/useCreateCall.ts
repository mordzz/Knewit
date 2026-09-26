import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCall } from '@/lib/postService';

/** Web equivalent of `apps/mobile/src/features/home/hooks/useCreateCall.ts`
 *  same invalidation: the feed, the author's own Profile tabs/counters,
 * and the referenced market's activity list. */
export function useCreateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-calls'] });
      queryClient.invalidateQueries({ queryKey: ['profile-activity'] });
      queryClient.invalidateQueries({ queryKey: ['market-activity'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
