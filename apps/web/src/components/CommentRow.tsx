'use client';

import { useState, type ReactNode } from 'react';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LikeButton } from '@/components/ui/LikeButton';
import { useToggleCommentLike } from '@/hooks/useToggleCommentLike';
import { useShareComment } from '@/hooks/useShareComment';
import { useCommentReplies } from '@/hooks/useCommentReplies';
import { formatRelativeTime, formatCompactNumber } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import type { CommentItem } from '@/types/social';

export interface CommentRowProps {
  comment: CommentItem;
  postId: string;
  onDelete: (commentId: string) => void;
  onOpenAuthor: (userId: string) => void;
  onOpenComment?: (comment: CommentItem) => void;
  onReply: (comment: CommentItem) => void;
  deletingCommentId: string | null;
  /** Id of the comment whose inline reply composer is open, if any. */
  activeReplyId?: string | null;
  renderComposer?: (comment: CommentItem) => ReactNode;
  isReply?: boolean;
  depth?: number;
}

/**
 * Direct conversion of `apps/mobile`'s `CommentRow` — every comment
 * (top-level or reply) carries its own Like, Reply, Share row. Only
 * top-level comments show a "View N replies" toggle, lazily fetching
 * and rendering each nested thread directly below its parent.
 */
export function CommentRow({ comment, postId, onDelete, onOpenAuthor, onOpenComment, onReply, deletingCommentId, activeReplyId = null, renderComposer, isReply = false, depth = 0 }: CommentRowProps) {
  const isDeleting = deletingCommentId === comment.id;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const toggleLike = useToggleCommentLike();
  const shareComment = useShareComment();
  const replies = useCommentReplies(comment.id, repliesExpanded);

  async function handleShare() {
    const message = `${comment.author.displayName}: ${comment.body}\n\nvia Knew it`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text: message });
      } else {
        await navigator.clipboard.writeText(message);
      }
      shareComment.mutate({ postId, commentId: comment.id });
    } catch {
      // User dismissed the share sheet — no share to count.
    }
  }

  const replyItems = replies.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className={cn('border-b border-border px-4 py-3', isReply && 'border-b-0 pb-0 pt-2')} style={depth > 0 ? { marginLeft: `${Math.min(depth, 4) * 28}px` } : undefined}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => onOpenAuthor(comment.author.id)} aria-label={`Open ${comment.author.displayName}'s profile`}>
          <Avatar uri={comment.author.avatarUrl} fallbackLabel={comment.author.displayName} size={isReply ? 26 : 32} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onOpenAuthor(comment.author.id)}
              className="flex min-w-0 items-baseline gap-1 text-left"
            >
              <Text variant="bodyStrong" numberOfLines={1} className="truncate">
                {comment.author.displayName}
              </Text>
            </button>
            {comment.canDelete ? (
              <button type="button" onClick={() => setConfirmVisible(true)} disabled={isDeleting} aria-label="Comment options">
                <Icon name="ellipsis-horizontal" size={16} color="textTertiary" />
              </button>
            ) : null}
          </div>
          <button type="button" className="mt-0.5 block text-left" onClick={() => onOpenComment?.(comment)}>
            <Text variant="body">{comment.body}</Text>
          </button>

          <div className="mt-2 flex items-center gap-5">
            <LikeButton
              liked={comment.liked}
              count={comment.likeCount}
              disabled={toggleLike.isPending}
              onPress={() => toggleLike.mutate({ postId, commentId: comment.id, liked: comment.liked })}
            />
            <button
              type="button"
              onClick={() => onReply(comment)}
              aria-label={`Reply to ${comment.author.displayName}`}
              className="flex min-h-8 items-center gap-1.5 py-1"
            >
              <Icon name="chatbubble-outline" size={16} color="textTertiary" />
              {!isReply && comment.replyCount > 0 ? (
                <Text variant="caption" color="textTertiary">
                  {formatCompactNumber(comment.replyCount)}
                </Text>
              ) : null}
            </button>
            <button type="button" onClick={handleShare} aria-label="Share this comment" className="flex min-h-8 items-center gap-1.5 py-1">
              <Icon name="share-outline" size={16} color="textTertiary" />
              {comment.shareCount > 0 ? (
                <Text variant="caption" color="textTertiary">
                  {formatCompactNumber(comment.shareCount)}
                </Text>
              ) : null}
            </button>
            <Text variant="caption" color="textTertiary" className="ml-auto">
              {formatRelativeTime(comment.createdAt)}
            </Text>
          </div>

          {activeReplyId === comment.id && renderComposer ? renderComposer(comment) : null}

          {comment.replyCount > 0 ? (
            <button
              type="button"
              onClick={() => setRepliesExpanded((current) => !current)}
              aria-label={repliesExpanded ? 'Hide replies' : 'View replies'}
              className="mt-2 flex min-h-8 items-center gap-1.5 py-1"
            >
              <div className="h-px w-6 bg-border" />
              <Text variant="caption" color="accent">
                {repliesExpanded ? 'Hide replies' : `View ${formatCompactNumber(comment.replyCount)} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
              </Text>
            </button>
          ) : null}
        </div>
      </div>

      {!isReply && repliesExpanded
        ? replyItems.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              postId={postId}
              onDelete={onDelete}
              onOpenAuthor={onOpenAuthor}
              onOpenComment={onOpenComment}
              onReply={onReply}
              deletingCommentId={deletingCommentId}
              activeReplyId={activeReplyId}
              renderComposer={renderComposer}
              isReply
              depth={depth + 1}
            />
          ))
        : null}

      <Modal visible={confirmVisible} onClose={() => setConfirmVisible(false)}>
        <div className="flex flex-col gap-3">
          <Text variant="bodyStrong">Delete comment?</Text>
          <Text variant="body" color="textSecondary">
            This action cannot be undone.
          </Text>
          <div className="flex gap-2">
            <Button label="Cancel" variant="ghost" onClick={() => setConfirmVisible(false)} className="flex-1" />
            <Button
              label="Delete"
              variant="no"
              onClick={() => {
                setConfirmVisible(false);
                onDelete(comment.id);
              }}
              className="flex-1"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
