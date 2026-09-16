import { Pressable, Share, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { LikeButton } from '@/features/home/components/LikeButton';
import { useToggleLike } from '@/features/home/hooks/useToggleLike';
import { formatCompactNumber } from '@/utils/formatNumber';

export interface SocialActionBarProps {
  postId: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  /** Omit on the Detail screen itself — the comments are already right
   * below, so the count renders as plain (non-interactive) text there
   * instead of a button that would do nothing. */
  onPressComment?: () => void;
  /** Text handed to the OS share sheet. Omitting it hides the Share
   * action entirely rather than sharing an empty message. */
  shareMessage?: string;
}

/**
 * The reusable Like + Comment + Share row — used by `CallCard` (feed
 * row), `PostDetailScreen`, and Market Detail's own Comments tab, so the
 * same post shows identical, always-current social counts wherever it
 * appears (Sprint 9: "Feed dan Detail menggunakan data social yang
 * konsisten"). Share opens the device's native share sheet (`Share.share`)
 * — a client-only action with no count/backend, unlike Like/Comment —
 * see docs/DECISIONS.md ("Native Share, Not In-App Repost").
 */
export function SocialActionBar({
  postId,
  liked,
  likeCount,
  commentCount,
  onPressComment,
  shareMessage,
}: SocialActionBarProps) {
  const toggleLike = useToggleLike();

  async function handleShare() {
    try {
      await Share.share({ message: shareMessage ?? '' });
    } catch {
      // User dismissed the share sheet or the OS call failed — nothing
      // to recover from, so no error UI for what's just a share sheet.
    }
  }

  return (
    <View className="mt-3 flex-row items-center gap-6">
      <LikeButton
        liked={liked}
        count={likeCount}
        disabled={toggleLike.isPending}
        onPress={() => toggleLike.mutate({ postId, liked })}
      />
      {onPressComment ? (
        <Pressable
          onPress={onPressComment}
          className="min-h-8 flex-row items-center gap-1.5 py-1"
          accessibilityRole="button"
          accessibilityLabel="View comments"
          hitSlop={8}
        >
          <Icon name="chatbubble-outline" size={18} color="textTertiary" />
          {commentCount > 0 ? (
            <Text variant="caption" color="textTertiary">
              {formatCompactNumber(commentCount)}
            </Text>
          ) : null}
        </Pressable>
      ) : (
        <View className="min-h-8 flex-row items-center gap-1.5 py-1">
          <Icon name="chatbubble-outline" size={18} color="textTertiary" />
          {commentCount > 0 ? (
            <Text variant="caption" color="textTertiary">
              {formatCompactNumber(commentCount)}
            </Text>
          ) : null}
        </View>
      )}
      {shareMessage ? (
        <Pressable
          onPress={handleShare}
          className="min-h-8 flex-row items-center gap-1.5 py-1"
          accessibilityRole="button"
          accessibilityLabel="Share this callout"
          hitSlop={8}
        >
          <Icon name="share-outline" size={18} color="textTertiary" />
        </Pressable>
      ) : null}
    </View>
  );
}
