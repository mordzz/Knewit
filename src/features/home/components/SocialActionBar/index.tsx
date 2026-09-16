import { Pressable, View } from 'react-native';
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
}

/**
 * The reusable Like + Comment row — used by `CallCard` (feed row),
 * `PostDetailScreen`, and Market Detail's own Comments tab, so the same
 * post shows identical, always-current social counts wherever it
 * appears (Sprint 9: "Feed dan Detail menggunakan data social yang
 * konsisten"). Share/repost is intentionally omitted — out of scope
 * this sprint, see docs/DECISIONS.md.
 */
export function SocialActionBar({
  postId,
  liked,
  likeCount,
  commentCount,
  onPressComment,
}: SocialActionBarProps) {
  const toggleLike = useToggleLike();

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
    </View>
  );
}
