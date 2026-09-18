'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
import { useDeletePost } from '@/hooks/useDeletePost';
import { patchComment } from '@/lib/commentCache';
import { ApiRequestError } from '@/lib/apiClient';
import { formatRelativeTime } from '@/lib/formatters';
import type { CommentItem, CreateCommentInput, FeedItem, MarketSummary } from '@/types/social';

/**
 * Direct conversion of `apps/mobile`'s `PostDetailScreen` — a
 * position-backed Callout's detail. Threaded comments (one level deep),
 * infinite scroll on the comment list, a composer that supports replying
 * to a specific top-level comment, and a header "…" that deletes the
 * Callout when the viewer authored it (`canDelete`, server-computed).
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
  const deletePostMutation = useDeletePost(postId);
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const openAuthor = (userId: string) => router.push(`/profile/${userId}`);
  // A child market's attachment opens its parent event's detail instead
  // of the child's own page (docs/DECISIONS.md).
  const openMarket = (market: MarketSummary) =>
    router.push(`/markets/${market.parentEventId ?? market.id}`);

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
      <div className="flex flex-shrink-0 items-center justify-between px-4 pb-2 pt-4">
        <button type="button" onClick={() => router.back()} aria-label="Go back">
          <Icon name="chevron-back" size={24} />
        </button>
        {post.status === 'success' && post.data.canDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDeleteVisible(true)}
            disabled={deletePostMutation.isPending}
            aria-label="Call options"
          >
            <Icon name="ellipsis-horizontal" size={24} color="textTertiary" />
          </button>
        ) : null}
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
            title="Callout not found"
            message="This Callout may have been removed or the link is incorrect."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        ) : null}

        {post.status === 'error' && !isNotFound ? (
          <div className="px-4">
            <ErrorState message="Couldn't load this Callout." onRetry={() => post.refetch()} />
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

      <Modal visible={confirmDeleteVisible} onClose={() => setConfirmDeleteVisible(false)}>
        <div className="flex flex-col gap-3">
          <Text variant="bodyStrong">Delete this Callout?</Text>
          <Text variant="body" color="textSecondary">
            Its comments and likes go too. This action cannot be undone.
          </Text>
          <div className="flex gap-2">
            <Button label="Cancel" variant="ghost" onClick={() => setConfirmDeleteVisible(false)} className="flex-1" />
            <Button
              label="Delete"
              variant="no"
              loading={deletePostMutation.isPending}
              onClick={() => {
                deletePostMutation.mutate(undefined, { onSuccess: () => router.back() });
              }}
              className="flex-1"
            />
          </div>
          {deletePostMutation.isError ? (
            <Text variant="caption" color="danger">
              Couldn&apos;t delete this Callout. Please try again.
            </Text>
          ) : null}
        </div>
      </Modal>
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
  onOpenMarket: (market: MarketSummary) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <AuthorRow author={item.author} onPress={() => onOpenAuthor(item.author.id)} />

      <Text variant="body">{item.body}</Text>
      <Text variant="caption" color="textTertiary">
        {formatRelativeTime(item.createdAt)}
      </Text>

      {item.market ? (
        <MarketAttachment market={item.market} positionSnapshot={item.positionSnapshot} onPress={() => onOpenMarket(item.market!)} />
      ) : null}

      <SocialActionBar postId={item.id} liked={item.liked} likeCount={item.likeCount} commentCount={item.commentCount} />

      <div className="mt-2 border-t border-border pt-3">
        <Text variant="bodyStrong">Comments</Text>
      </div>
    </div>
  );
}
