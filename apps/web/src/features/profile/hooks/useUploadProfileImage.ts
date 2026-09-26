'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProfileImage, type ProfileImageKind } from '@/features/profile/lib/userService';

/**
 * Uploads an avatar or banner through the backend and refreshes every
 * place the image/author data is embedded (feed cards, comments, the
 * viewer's own profile)  same invalidation rule as `useUpdateProfile`.
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, file }: { kind: ProfileImageKind; file: File }) =>
      uploadProfileImage(kind, file),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', 'me'], profile);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
