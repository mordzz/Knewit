import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '@/features/home/services/postService';

/** On success, invalidates the feed so the new Post/Call appears without
 * a full app reload — see docs/DECISIONS.md ("Query Invalidation, Not
 * Manual Cache Insertion"). */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
