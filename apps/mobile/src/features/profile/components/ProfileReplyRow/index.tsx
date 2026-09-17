import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import type { CommentItem } from '@/types/social';

export interface ProfileReplyRowProps {
  item: CommentItem;
  onOpenPost: (postId: string) => void;
}

/**
 * A comment this user left on someone's (or their own) Post/Call —
 * opens that post's detail for the full thread, same as X's own
 * "Replies" tab always needing the original post's context to make
 * sense of a reply in isolation. Deliberately simpler than `CommentRow`
 * (no inline Like/Reply/Share/delete) — those actions belong to the
 * comment's own thread on Post Detail, not a second copy of them here.
 */
export function ProfileReplyRow({ item, onOpenPost }: ProfileReplyRowProps) {
  return (
    <Pressable
      onPress={() => onOpenPost(item.postId)}
      className="border-b border-border px-4 py-3 active:bg-surface"
      accessibilityRole="button"
      accessibilityLabel={`Replying to a post: ${item.body}`}
    >
      <View className="flex-row items-center justify-between">
        <Text variant="caption" color="textTertiary">
          Replying to a post
        </Text>
        <Text variant="caption" color="textTertiary">
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>
      <Text variant="body" className="mt-0.5">
        {item.body}
      </Text>
    </Pressable>
  );
}
