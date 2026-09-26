import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { LikeButton } from '@/components/ui/LikeButton';
import { useToggleLike } from '@/hooks/useToggleLike';
import { formatCompactNumber } from '@/lib/formatters';

export interface SocialActionBarProps {
  postId: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  /** Omit on the Detail page itself  the comments are already right
   * below, so the count renders as plain (non-interactive) text there. */
  onPressComment?: () => void;
  /** Rendered at the far right of the row (e.g. the post's timestamp). */
  trailing?: ReactNode;
}

/**
 * Web equivalent of `apps/mobile/src/features/home/components/SocialActionBar`
 *  the reusable Like + Comment row, used by `CallCard` and the Post
 * Detail page so the same post shows identical, always-current social
 * counts wherever it appears. No Share action here  the OS-level
 * native share sheet mobile's `Share.share` opens has no web
 * equivalent worth building for this pass (same scope note the old web
 * port already carried).
 */
export function SocialActionBar({ postId, liked, likeCount, commentCount, onPressComment, trailing }: SocialActionBarProps) {
  const toggleLike = useToggleLike();

  return (
    <div className="mt-3 flex items-center gap-6">
      <LikeButton
        liked={liked}
        count={likeCount}
        disabled={toggleLike.isPending}
        onPress={() => toggleLike.mutate({ postId, liked })}
      />
      {onPressComment ? (
        <button
          type="button"
          onClick={onPressComment}
          aria-label="View comments"
          className="flex min-h-8 items-center gap-1.5 py-1"
        >
          <Icon name="chatbubble-outline" size={18} color="textTertiary" />
          {commentCount > 0 ? (
            <Text variant="caption" color="textTertiary">
              {formatCompactNumber(commentCount)}
            </Text>
          ) : null}
        </button>
      ) : (
        <div className="flex min-h-8 items-center gap-1.5 py-1">
          <Icon name="chatbubble-outline" size={18} color="textTertiary" />
          {commentCount > 0 ? (
            <Text variant="caption" color="textTertiary">
              {formatCompactNumber(commentCount)}
            </Text>
          ) : null}
        </div>
      )}
      {trailing ? <div className="ml-auto">{trailing}</div> : null}
    </div>
  );
}
