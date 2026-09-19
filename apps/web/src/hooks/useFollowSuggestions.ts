import { useQuery } from '@tanstack/react-query';
import { getFollowSuggestions } from '@/lib/userService';

/** First page of "accounts you don't follow yet" for the desktop right
 * rail; `useFollowToggle` invalidates this key after every follow. */
export function useFollowSuggestions(enabled: boolean) {
  return useQuery({
    queryKey: ['follow-suggestions'],
    queryFn: () => getFollowSuggestions(),
    enabled,
  });
}
