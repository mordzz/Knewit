'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeProfileImage, type ProfileImageKind } from '@/features/profile/lib/userService';

/** Removes the avatar or banner on the server right away — same cache
 * refresh as `useUploadProfileImage`, since the result is the same kind
 * of profile change. */
export function useRemoveProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kind: ProfileImageKind) => removeProfileImage(kind),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', 'me'], profile);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
