import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { formatPrice } from '@/utils/formatCurrency';
import { formatCompactNumber } from '@/utils/formatNumber';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { calculatePositionPnlPercent } from '@/utils/calculatePnl';
import type { ColorToken } from '@/theme/colors';
import type { FeedItem } from '@/types/social';

export interface TrendingCallCardProps {
  item: FeedItem;
  onPress: () => void;
}

/**
 * A compact card for Home's horizontal "Trending Calls" strip —
 * deliberately a separate, smaller component from `CallCard` (the
 * full-width feed row), not a duplicate of it: the two serve different
 * contexts (a narrow horizontal strip vs. the main vertical feed) the
 * same way `MarketCard` (Markets tab) and `MarketAttachment` (feed)
 * already coexist as separate components for separate contexts — see
 * docs/DECISIONS.md. Renders only real fields already on `FeedItem`:
 * no separate "trending score" is invented or displayed.
 */
export function TrendingCallCard({ item, onPress }: TrendingCallCardProps) {
  const pnlPercent =
    item.positionSnapshot && item.market
      ? calculatePositionPnlPercent(item.positionSnapshot, item.market)
      : null;
  const outcomeColor: ColorToken = item.positionSnapshot?.outcome === 'NO' ? 'no' : 'yes';

  return (
    <Pressable
      onPress={onPress}
      style={{ width: 260 }}
      accessibilityRole="button"
      accessibilityLabel={`Trending: ${item.author.displayName}, ${item.body}`}
    >
      <GlassSurface contentClassName="gap-2 p-3">
        <View className="flex-row items-center gap-2">
          <Avatar uri={item.author.avatarUrl} fallbackLabel={item.author.displayName} size={28} />
          <View className="flex-1">
            <Text variant="caption" numberOfLines={1}>
              {item.author.displayName}
            </Text>
          </View>
          <Text variant="micro" color="textTertiary">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        <Text variant="body" numberOfLines={3}>
          {item.body}
        </Text>

        {item.positionSnapshot && pnlPercent !== null ? (
          <View
            className={
              outcomeColor === 'yes'
                ? 'gap-0.5 rounded-lg bg-yes-muted p-2'
                : 'gap-0.5 rounded-lg bg-no-muted p-2'
            }
          >
            <View className="flex-row items-center gap-1">
              <Icon name="checkmark-circle" size={12} color="accent" />
              <Text variant="micro" color="accent">
                Verified Position
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text variant="caption" color={outcomeColor}>
                {item.positionSnapshot.outcome} @ {formatPrice(item.positionSnapshot.entryPrice)}
              </Text>
              <Text variant="caption" color={pnlPercent >= 0 ? 'yes' : 'no'}>
                {pnlPercent >= 0 ? '+' : ''}
                {pnlPercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        ) : null}

        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Icon name="heart-outline" size={14} color="textTertiary" />
            <Text variant="micro" color="textTertiary">
              {formatCompactNumber(item.likeCount)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="chatbubble-outline" size={14} color="textTertiary" />
            <Text variant="micro" color="textTertiary">
              {formatCompactNumber(item.commentCount)}
            </Text>
          </View>
        </View>
      </GlassSurface>
    </Pressable>
  );
}
