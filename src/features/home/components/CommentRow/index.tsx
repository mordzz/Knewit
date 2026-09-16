import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import type { CommentItem } from '@/types/social';

export interface CommentRowProps {
  comment: CommentItem;
  onDelete: (commentId: string) => void;
  onOpenAuthor: (userId: string) => void;
  isDeleting: boolean;
}

/**
 * `comment.canDelete` is server-computed (see docs/DECISIONS.md) — this
 * component never derives ownership itself, so the "..." menu with
 * Delete simply doesn't render at all for a comment it isn't true for.
 * A confirmation dialog always sits between the menu and the actual
 * delete — no destructive action fires on a single tap. The author's
 * avatar/name are their own pressable opening Profile (Sprint 11) — see
 * docs/SOCIAL-FEATURE.md ("Profile From Comment").
 */
export function CommentRow({ comment, onDelete, onOpenAuthor, isDeleting }: CommentRowProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <View className="flex-row gap-3 border-b border-border px-4 py-3">
      <Pressable
        onPress={() => onOpenAuthor(comment.author.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${comment.author.displayName}'s profile`}
      >
        <Avatar
          uri={comment.author.avatarUrl}
          fallbackLabel={comment.author.displayName}
          size={32}
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
      </View>

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
