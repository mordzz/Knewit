'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AuthorRow } from '@/components/AuthorRow';
import { MarketAttachment } from '@/components/MarketAttachment';
import { SocialActionBar } from '@/components/SocialActionBar';
import { CommentRow } from '@/components/CommentRow';
import { CommentComposer } from '@/components/CommentComposer';
import { usePost } from '@/hooks/usePost';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, createComment } from '@/lib/commentService';
import { useDeleteComment } from '@/hooks/useDeleteComment';
import { patchComment } from '@/lib/commentCache';
import { ApiRequestError } from '@/lib/apiClient';
import { formatRelativeTime } from '@/lib/formatters';
import type { CommentItem, CreateCommentInput, FeedItem } from '@/types/social';

/**
 * Direct conversion of `apps/mobile`'s `PostDetailScreen` — serves both
 * a normal Post and a position-backed Call, same screen. Threaded
 * comments (one level deep), infinite scroll on the comment list, and a
 * composer that supports replying to a specific top-level comment.
 */
export function PostDetailView({ postId }: { postId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const post = usePost(postId);
  const comments = useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }: { pageParam?: string }) => getComments(postId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const createCommentMutation = useMutation({
    mutationFn: (input: CreateCommentInput) => createComment(postId, input),
    onSuccess: (_result, input) => {
      if (input.parentCommentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', input.parentCommentId] });
        patchComment(queryClient, postId, input.parentCommentId, (item) => ({ ...item, replyCount: item.replyCount + 1 }));
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
      queryClient.setQueryData<FeedItem>(['post', postId], (current) =>
        current ? { ...current, commentCount: current.commentCount + 1 } : current
      );
    },
  });
  const deleteCommentMutation = useDeleteComment(postId);
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const openAuthor = (userId: string) => router.push(`/profile/${userId}`);
  const openMarket = (marketId: string) => router.push(`/markets/${marketId}`);

  const isNotFound = post.status === 'error' && post.error instanceof ApiRequestError && post.error.status === 404;
  const commentItems = comments.data?.pages.flatMap((page) => page.items) ?? [];

  const hasNextCommentsPage = comments.hasNextPage;
  const isFetchingNextCommentsPage = comments.isFetchingNextPage;
  const fetchNextCommentsPage = comments.fetchNextPage;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextCommentsPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextCommentsPage) fetchNextCommentsPage();
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextCommentsPage, isFetchingNextCommentsPage, fetchNextCommentsPage]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-shrink-0 items-center px-4 pb-2 pt-4">
        <button type="button" onClick={() => router.back()} aria-label="Go back">
          <Icon name="chevron-back" size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {post.status === 'pending' ? (
          <div className="px-4">
            <LoadingState rows={3} />
          </div>
        ) : null}

        {post.status === 'error' && isNotFound ? (
          <EmptyState
            icon="search"
            title="Post not found"
            message="This post may have been removed or the link is incorrect."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        ) : null}

        {post.status === 'error' && !isNotFound ? (
          <div className="px-4">
            <ErrorState message="Couldn't load this post." onRetry={() => post.refetch()} />
          </div>
        ) : null}

        {post.status === 'success' ? (
          <>
            <PostContent item={post.data} onOpenAuthor={openAuthor} onOpenMarket={openMarket} />

            {comments.status === 'pending' ? (
              <div className="px-4">
                <LoadingState rows={2} />
              </div>
            ) : comments.status === 'error' ? (
              <ErrorState message="Couldn't load comments." onRetry={() => comments.refetch()} />
            ) : commentItems.length === 0 ? (
              <EmptyState icon="chatbubble-outline" title="No comments yet" message="Be the first to share your thoughts." />
            ) : (
              <>
                {commentItems.map((item) => (
                  <CommentRow
                    key={item.id}
                    comment={item}
                    postId={postId}
                    onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
                    onOpenAuthor={openAuthor}
                    onReply={setReplyTarget}
                    deletingCommentId={deleteCommentMutation.isPending ? (deleteCommentMutation.variables ?? null) : null}
                  />
                ))}
                <div ref={sentinelRef} className="py-4">
                  {comments.isFetchingNextPage ? (
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
                  ) : null}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>

      {post.status === 'success' ? (
        <div className="flex-shrink-0">
          <CommentComposer
            isSubmitting={createCommentMutation.isPending}
            replyingToHandle={replyTarget?.author.handle ?? null}
            onCancelReply={() => setReplyTarget(null)}
            onSubmit={(body) => {
              const parentCommentId = replyTarget?.id;
              createCommentMutation.mutate({ body, parentCommentId }, { onSuccess: () => setReplyTarget(null) });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function PostContent({
  item,
  onOpenAuthor,
  onOpenMarket,
}: {
  item: FeedItem;
  onOpenAuthor: (userId: string) => void;
  onOpenMarket: (marketId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <AuthorRow author={item.author} onPress={() => onOpenAuthor(item.author.id)} />

      <Text variant="body">{item.body}</Text>
      <Text variant="caption" color="textTertiary">
        {formatRelativeTime(item.createdAt)}
      </Text>

      {item.market ? (
        <MarketAttachment market={item.market} positionSnapshot={item.positionSnapshot} onPress={() => onOpenMarket(item.market!.id)} />
      ) : null}

      <SocialActionBar postId={item.id} liked={item.liked} likeCount={item.likeCount} commentCount={item.commentCount} />

      <div className="mt-2 border-t border-border pt-3">
        <Text variant="bodyStrong">Comments</Text>
      </div>
    </div>
  );
}
