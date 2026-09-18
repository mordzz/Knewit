import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProfileImage, type ProfileImageFile } from '@/features/profile/services/userService';

/**
 * Uploads an avatar or banner and applies the server's updated profile —
 * same cache rule as `useUpdateProfile`: replace `['profile', 'me']`,
 * invalidate feed/comments/profile so already-fetched authors refetch
 * rather than keep showing a stale image.
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, file }: { kind: 'avatar' | 'banner'; file: ProfileImageFile }) =>
      uploadProfileImage(kind, file),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', 'me'], profile);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
