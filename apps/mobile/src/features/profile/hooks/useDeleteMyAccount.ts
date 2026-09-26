import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMyAccount } from '@/features/profile/services/userService';

export function useDeleteMyAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => queryClient.clear(),
  });
}
