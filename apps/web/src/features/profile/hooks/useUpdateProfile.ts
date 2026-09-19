import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile } from '@/features/profile/lib/userService';
import type { UpdateProfileInput, UserProfile } from '@/types/social';

/** Web equivalent of `apps/mobile/src/features/profile/hooks/useUpdateProfile.ts`
 * — invalidates by refetch, not by patching every embedded author
 * (docs/DECISIONS.md). */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateMyProfile(input),
    onSuccess: (updated: UserProfile) => {
      queryClient.setQueryData(['profile', 'me'], updated);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['profile-calls', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['profile-replies', 'me'] });
    },
  });
}
