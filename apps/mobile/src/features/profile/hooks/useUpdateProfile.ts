import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile } from '@/features/profile/services/userService';

/**
 * On success: replaces the cached `['profile', 'me']` entry with the
 * server's own updated record (never trusts the submitted form values
 * as the new truth  the backend may normalize/reject fields), and
 * invalidates the feed/comment caches so author names embedded in
 * already-fetched posts/comments refetch fresh on next view rather than
 * keep showing a stale display name  see docs/DECISIONS.md ("Edit
 * Profile Invalidates by Refetch, Not by Patching Every Embedded
 * Author").
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', 'me'], profile);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['profile-calls', 'me'] });
    },
  });
}
