import { useState } from 'react';
import { Pressable } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { formatCompactNumber } from '@/utils/formatNumber';

export interface LikeButtonProps {
  initialLiked?: boolean;
  count: number;
}

/**
 * Local optimistic toggle only — no backend exists yet to persist a like
 * (see docs/API.md `POST /calls/:id/like`). Wiring a real mutation is a
 * later-sprint follow-up; this establishes the interaction foundation.
 */
export function LikeButton({ initialLiked = false, count }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const displayCount = liked && !initialLiked ? count + 1 : count;

  return (
    <Pressable
      onPress={() => setLiked((prev) => !prev)}
      className="min-h-8 flex-row items-center gap-1.5 py-1 pr-3"
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Unlike' : 'Like'}
      accessibilityState={{ selected: liked }}
      hitSlop={8}
    >
      <Icon
        name={liked ? 'heart' : 'heart-outline'}
        size={18}
        color={liked ? 'no' : 'textTertiary'}
      />
      {displayCount > 0 ? (
        <Text variant="caption" color={liked ? 'no' : 'textTertiary'}>
          {formatCompactNumber(displayCount)}
        </Text>
      ) : null}
    </Pressable>
  );
}
