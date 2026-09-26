import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LikeButton } from '@/features/home/components/LikeButton';
import { useToggleCommentLike } from '@/features/home/hooks/useToggleCommentLike';
import { useShareComment } from '@/features/home/hooks/useShareComment';
import { useCommentReplies } from '@/features/home/hooks/useCommentReplies';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { formatCompactNumber } from '@/utils/formatNumber';
import { cn } from '@/utils/cn';
import type { CommentItem } from '@/types/social';

export interface CommentRowProps {
  comment: CommentItem;
  postId: string;
  onDelete: (commentId: string) => void;
  onOpenAuthor: (userId: string) => void;
  /** Puts the composer into "Replying to @handle" mode targeting this
   * comment's thread  see `CommentComposer`. */
  onReply: (comment: CommentItem) => void;
  /** The id of whichever comment (top-level or reply) is currently being
   * deleted, or `null`  compared against this row's own id rather than
   * a single precomputed boolean, since that boolean would otherwise be
   * tied to whichever comment `PostDetailScreen`'s `renderItem` last
   * computed it for and wrongly apply to every nested reply too. */
  deletingCommentId: string | null;
  /** Replies render slightly indented, with a smaller avatar, and never
   * show their own "View replies" toggle  threads are one level deep,
   * not a recursive tree (see docs/DECISIONS.md, "One Reply Level").
   * Tapping Reply on a reply still targets the same top-level thread. */
  isReply?: boolean;
  depth?: number;
}

/**
 * `comment.canDelete` is server-computed (see docs/DECISIONS.md)  this
 * component never derives ownership itself, so the "..." menu with
 * Delete simply doesn't render at all for a comment it isn't true for.
 * A confirmation dialog always sits between the menu and the actual
 * delete  no destructive action fires on a single tap. The author's
 * avatar/name are their own pressable opening Profile (Sprint 11)  see
 * docs/SOCIAL-FEATURE.md ("Profile From Comment").
 *
 * Every comment (top-level or reply) carries its own X-style action row
 *  Like, Reply, Share, each with a count  see docs/DECISIONS.md
 * ("Threaded Comment Replies"). Only top-level comments show a "View N
 * replies" toggle, which lazily fetches (`useCommentReplies`, `enabled`-
 * gated) and renders that thread nested directly below, one level deep.
 */
export function CommentRow({
  comment,
  postId,
  onDelete,
  onOpenAuthor,
  onReply,
  deletingCommentId,
  isReply = false,
  depth = 0,
}: CommentRowProps) {
  const isDeleting = deletingCommentId === comment.id;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const toggleLike = useToggleCommentLike();
  const shareComment = useShareComment();
  const replies = useCommentReplies(comment.id, postId, repliesExpanded);

  async function handleShare() {
    try {
      await Share.share({
        message: `${comment.author.displayName}: ${comment.body}\n\nvia Knewit`,
      });
      shareComment.mutate({ postId, commentId: comment.id });
    } catch {
      // User dismissed the share sheet  no share to count.
    }
  }

  const replyItems = replies.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View
      className={cn(
        'border-b border-border px-4 py-3',
        isReply && 'border-b-0 pb-0 pt-2'
      )}
      style={depth > 0 ? { marginLeft: Math.min(depth, 4) * 28 } : undefined}
    >
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => onOpenAuthor(comment.author.id)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${comment.author.displayName}'s profile`}
        >
          <Avatar
            uri={comment.author.avatarUrl}
            fallbackLabel={comment.author.displayName}
            size={isReply ? 26 : 32}
          />
        </Pressable>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => onOpenAuthor(comment.author.id)}
              className="flex-row items-baseline gap-1"
              accessibilityRole="button"
              accessibilityLabel={`Open ${comment.author.displayName}'s profile`}
            >
              <Text variant="bodyStrong" numberOfLines={1}>
                {comment.author.displayName}
              </Text>
              <Text variant="caption" color="textTertiary">
                · {formatRelativeTime(comment.createdAt)}
              </Text>
            </Pressable>
            {comment.canDelete ? (
              <Pressable
                onPress={() => setConfirmVisible(true)}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel="Comment options"
                hitSlop={8}
              >
                <Icon name="ellipsis-horizontal" size={16} color="textTertiary" />
              </Pressable>
            ) : null}
          </View>
          <Text variant="body" className="mt-0.5">
            {comment.body}
          </Text>

          <View className="mt-2 flex-row items-center gap-5">
            <LikeButton
              liked={comment.liked}
              count={comment.likeCount}
              disabled={toggleLike.isPending}
              onPress={() =>
                toggleLike.mutate({ postId, commentId: comment.id, liked: comment.liked })
              }
            />
            <Pressable
              onPress={() => onReply(comment)}
              className="min-h-8 flex-row items-center gap-1.5 py-1"
              accessibilityRole="button"
              accessibilityLabel={`Reply to ${comment.author.displayName}`}
              hitSlop={8}
            >
              <Icon name="chatbubble-outline" size={16} color="textTertiary" />
              {comment.replyCount > 0 ? (
                <Text variant="caption" color="textTertiary">
                  {formatCompactNumber(comment.replyCount)}
                </Text>
              ) : null}
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="min-h-8 flex-row items-center gap-1.5 py-1"
              accessibilityRole="button"
              accessibilityLabel="Share this comment"
              hitSlop={8}
            >
              <Icon name="share-outline" size={16} color="textTertiary" />
              {comment.shareCount > 0 ? (
                <Text variant="caption" color="textTertiary">
                  {formatCompactNumber(comment.shareCount)}
                </Text>
              ) : null}
            </Pressable>
          </View>

          {comment.replyCount > 0 ? (
            <Pressable
              onPress={() => setRepliesExpanded((current) => !current)}
              className="mt-2 min-h-8 flex-row items-center gap-1.5 py-1"
              accessibilityRole="button"
              accessibilityLabel={repliesExpanded ? 'Hide replies' : 'View replies'}
            >
              <View className="h-px w-6 bg-border" />
              <Text variant="caption" color="accent">
                {repliesExpanded
                  ? 'Hide replies'
                  : `View ${formatCompactNumber(comment.replyCount)} ${
                      comment.replyCount === 1 ? 'reply' : 'replies'
                    }`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {repliesExpanded
        ? replyItems.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              postId={postId}
              onDelete={onDelete}
              onOpenAuthor={onOpenAuthor}
              onReply={onReply}
              deletingCommentId={deletingCommentId}
              isReply
              depth={depth + 1}
            />
          ))
        : null}

      <Modal visible={confirmVisible} onClose={() => setConfirmVisible(false)}>
        <View className="gap-3">
          <Text variant="bodyStrong">Delete comment?</Text>
          <Text variant="body" color="textSecondary">
            This action cannot be undone.
          </Text>
          <View className="flex-row gap-2">
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setConfirmVisible(false)}
              className="flex-1"
            />
            <Button
              label="Delete"
              variant="no"
              onPress={() => {
                setConfirmVisible(false);
                onDelete(comment.id);
              }}
              className="flex-1"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
