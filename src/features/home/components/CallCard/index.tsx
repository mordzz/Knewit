import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { LikeButton } from '@/features/home/components/LikeButton';
import { MarketAttachment } from '@/features/home/components/MarketAttachment';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { formatCompactNumber } from '@/utils/formatNumber';
import type { FeedItem } from '@/types/social';

export interface CallCardProps {
  item: FeedItem;
  onOpenMarket: (marketId: string) => void;
  onOpenAuthor: (userId: string) => void;
}

/**
 * X-style feed row: borderless, full-width, separated from the next item
 * by a hairline bottom border rather than a bordered/rounded card — see
 * docs/DESIGN.md. Renders both variants of the unified Post/Call model
 * (docs/SOCIAL-FEATURE.md): a normal Post when `item.market` is null, and
 * a position-backed Call — with the MarketAttachment's Verified badge —
 * when it isn't. There is deliberately no separate PostCard component;
 * see docs/DECISIONS.md.
 */
function CallCardComponent({ item, onOpenMarket, onOpenAuthor }: CallCardProps) {
  return (
    <View className="flex-row gap-3 border-b border-border px-4 py-3">
      <Pressable
        onPress={() => onOpenAuthor(item.author.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.author.displayName}'s profile`}
      >
        <Avatar uri={item.author.avatarUrl} fallbackLabel={item.author.displayName} size={40} />
      </Pressable>

      <View className="flex-1">
        <Pressable
          onPress={() => onOpenAuthor(item.author.id)}
          className="flex-row items-baseline gap-1"
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.author.displayName}'s profile`}
        >
          <Text variant="bodyStrong" numberOfLines={1} className="shrink">
            {item.author.displayName}
          </Text>
          <Text variant="caption" color="textTertiary" numberOfLines={1} className="shrink">
            @{item.author.handle}
          </Text>
          <Text variant="caption" color="textTertiary">
            · {formatRelativeTime(item.createdAt)}
          </Text>
        </Pressable>

        <Text variant="body" className="mt-0.5">
          {item.body}
        </Text>

        {item.market ? (
          <MarketAttachment
            market={item.market}
            positionSnapshot={item.positionSnapshot}
            onPress={() => onOpenMarket(item.market!.id)}
          />
        ) : null}

        <View className="mt-3 flex-row items-center gap-6">
          <LikeButton count={item.likeCount} />
          <View className="min-h-8 flex-row items-center gap-1.5">
            <Icon name="chatbubble-outline" size={18} color="textTertiary" />
            {item.commentCount > 0 ? (
              <Text variant="caption" color="textTertiary">
                {formatCompactNumber(item.commentCount)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export const CallCard = memo(CallCardComponent);
