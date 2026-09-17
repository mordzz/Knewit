import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteComment } from '@/lib/commentService';
import { patchFeedItem } from '@/lib/feedCache';

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      patchFeedItem(queryClient, postId, (item) => ({
        ...item,
        commentCount: Math.max(0, item.commentCount - 1),
      }));
    },
  });
}
