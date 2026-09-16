import { useQuery } from '@tanstack/react-query';
import { getTrendingCalls } from '@/features/home/services/feedService';

/** Home's horizontal "Trending Calls" strip — a small, non-paginated
 * list, so a plain query rather than an infinite one. */
export function useTrendingCalls() {
  return useQuery({
    queryKey: ['feed-trending'],
    queryFn: getTrendingCalls,
  });
}
