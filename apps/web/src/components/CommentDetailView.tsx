'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CommentRow } from '@/components/CommentRow';
import { CommentComposer } from '@/components/CommentComposer';
import { createComment, getCommentDetail } from '@/lib/commentService';
import { useCommentReplies } from '@/hooks/useCommentReplies';

export function CommentDetailView({ commentId }: { commentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const detail = useQuery({ queryKey: ['comment', commentId], queryFn: () => getCommentDetail(commentId) });
  const replies = useCommentReplies(commentId, detail.isSuccess);
  const createReply = useMutation({
    mutationFn: (body: string) => createComment(detail.data!.comment.postId, { body, parentCommentId: replyingTo ?? commentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentReplies'] });
      queryClient.invalidateQueries({ queryKey: ['comment', commentId] });
      setReplyingTo(null);
    },
  });
  if (detail.isPending) return <LoadingState rows={4} />;
  if (detail.isError) return <ErrorState message="Couldn't load this comment." onRetry={() => detail.refetch()} />;
  const item = detail.data.comment;
  const replyItems = replies.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <button type="button" onClick={() => router.back()} aria-label="Go back"><Icon name="chevron-back" size={24} /></button>
        <span className="font-semibold">Comment</span>
      </div>
      <div className="border-b border-border">
        <CommentRow comment={item} postId={item.postId} onDelete={() => undefined} onOpenAuthor={(id) => router.push(`/profile/${id}`)} onOpenComment={(comment) => router.push(`/comments/${comment.id}`)} onReply={(comment) => setReplyingTo(comment.id)} deletingCommentId={null} />
        {replyingTo ? <CommentComposer isSubmitting={createReply.isPending} replyingToHandle={replyingTo === item.id ? item.author.handle : null} onClose={() => setReplyingTo(null)} onSubmit={(body) => createReply.mutate(body)} /> : null}
      </div>
      {replies.isPending ? <LoadingState rows={3} /> : replies.isError ? <ErrorState message="Couldn't load replies." onRetry={() => replies.refetch()} /> : replyItems.map((reply) => <CommentRow key={reply.id} comment={reply} postId={item.postId} onDelete={() => undefined} onOpenAuthor={(id) => router.push(`/profile/${id}`)} onOpenComment={(comment) => router.push(`/comments/${comment.id}`)} onReply={(comment) => setReplyingTo(comment.id)} deletingCommentId={null} isReply depth={1} />)}
    </div>
  );
}
