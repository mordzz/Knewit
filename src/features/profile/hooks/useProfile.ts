import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/features/profile/services/userService';

/**
 * The one profile-fetch hook for both "my own profile" and "someone
 * else's" — `userId` omitted means the viewer's own (resolved
 * server-side from the session via the literal `"me"` id — see
 * docs/API.md), matching the single unified `Profile(userId?)` route
 * this sprint consolidates onto (see docs/DECISIONS.md, "One Profile
 * Route/Screen for Self and Other Users").
 */
export function useProfile(userId?: string, enabled = true) {
  const id = userId ?? 'me';

  return useQuery({
    queryKey: ['profile', id],
    queryFn: () => getUserProfile(id),
    enabled,
  });
}
