import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeProfileImage } from '@/features/profile/services/userService';

/** Removes the avatar or banner on the server right away — same cache
 * refresh as `useUploadProfileImage`, since the result is the same kind
 * of profile change. */
export function useRemoveProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kind: 'avatar' | 'banner') => removeProfileImage(kind),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', 'me'], profile);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
