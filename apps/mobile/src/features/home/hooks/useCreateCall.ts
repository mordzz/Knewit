import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCall } from '@/features/home/services/postService';

/** On success, invalidates every query a new Callout appears in — the
 * feed, the author's own Profile tabs/counters, and the referenced
 * market's activity list — without a full app reload. `['profile']` also
 * covers `['profile', id]` (prefix match). See docs/DECISIONS.md ("Query
 * Invalidation, Not Manual Cache Insertion"). */
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
