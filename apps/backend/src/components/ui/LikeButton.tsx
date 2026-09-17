import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { formatCompactNumber } from '@/lib/formatters';

export interface LikeButtonProps {
  liked: boolean;
  count: number;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Web equivalent of `apps/mobile/src/features/home/components/LikeButton`
 * — purely presentational, same as mobile; the real liked/count state
 * and mutation live in `useToggleLike`, owned by `SocialActionBar`.
 */
export function LikeButton({ liked, count, onPress, disabled }: LikeButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
      className="flex min-h-8 items-center gap-1.5 py-1 pr-3 disabled:opacity-50"
    >
      <Icon name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? 'no' : 'textTertiary'} />
      {count > 0 ? (
        <Text variant="caption" color={liked ? 'no' : 'textTertiary'}>
          {formatCompactNumber(count)}
        </Text>
      ) : null}
    </button>
  );
}
