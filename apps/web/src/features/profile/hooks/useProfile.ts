import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/features/profile/lib/userService';

/** Web equivalent of `apps/mobile/src/features/profile/hooks/useProfile.ts`
 * — one profile-fetch hook for both "my own profile" and "someone
 * else's" — `userId` omitted means the viewer's own. */
export function useProfile(userId?: string, enabled = true) {
  const id = userId ?? 'me';

  return useQuery({
    queryKey: ['profile', id],
    queryFn: () => getUserProfile(id),
    enabled,
  });
}
