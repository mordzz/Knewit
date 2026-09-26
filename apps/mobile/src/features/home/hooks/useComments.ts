import { useInfiniteQuery } from '@tanstack/react-query';
import { getComments } from '@/features/home/services/commentService';

/** Comments tab of Post/Call Detail  paginated, newest first (backend's
 * own default ordering; no client-side re-sorting/ranking  see
 * docs/DECISIONS.md). Mirrors `useHomeFeed`'s infinite-query shape. */
export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) => getComments(postId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
