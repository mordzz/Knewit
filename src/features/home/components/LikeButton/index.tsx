import { Pressable } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { formatCompactNumber } from '@/utils/formatNumber';

export interface LikeButtonProps {
  liked: boolean;
  count: number;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Purely presentational — real like/unlike state and the mutation live
 * in `useToggleLike` (Sprint 9), owned by whichever screen renders this
 * (`SocialActionBar`). `disabled` covers the brief window a mutation is
 * in flight, so a rapid double-tap can't fire two requests.
 */
export function LikeButton({ liked, count, onPress, disabled }: LikeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="min-h-8 flex-row items-center gap-1.5 py-1 pr-3"
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Unlike' : 'Like'}
      accessibilityState={{ selected: liked, disabled }}
      hitSlop={8}
    >
      <Icon
        name={liked ? 'heart' : 'heart-outline'}
        size={18}
        color={liked ? 'no' : 'textTertiary'}
      />
      {count > 0 ? (
        <Text variant="caption" color={liked ? 'no' : 'textTertiary'}>
          {formatCompactNumber(count)}
        </Text>
      ) : null}
    </Pressable>
  );
}
