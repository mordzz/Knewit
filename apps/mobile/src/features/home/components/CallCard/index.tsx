import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { MarketAttachment } from '@/features/home/components/MarketAttachment';
import { SocialActionBar } from '@/features/home/components/SocialActionBar';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import type { FeedItem, MarketSummary } from '@/types/social';

export interface CallCardProps {
  item: FeedItem;
  /** Receives the market itself so the caller can route a child market
   * to its parent event (docs/DECISIONS.md). */
  onOpenMarket: (market: MarketSummary) => void;
  onOpenAuthor: (userId: string) => void;
  onOpenPost: (postId: string) => void;
}

/**
 * X-style feed row: borderless, full-width, separated from the next item
 * by a hairline bottom border rather than a bordered/rounded card — see
 * docs/DESIGN.md. Renders both variants of the unified Post/Call model
 * (docs/SOCIAL-FEATURE.md): a normal Post when `item.market` is null, and
 * a position-backed Call — with the MarketAttachment's Verified badge —
 * when it isn't. There is deliberately no separate PostCard component;
 * see docs/DECISIONS.md.
 *
 * The whole row opens Post/Call Detail (Sprint 9) — the avatar/author
 * name and the Market Attachment are their own nested `Pressable`s with
 * their own destinations (author profile, Market Detail), which React
 * Native resolves correctly (only the innermost pressable under the
 * touch fires), so they don't fight this outer one.
 *
 * Header row is name/handle on the left, the callout's post time on the
 * far right — X/Twitter's own layout, rather than the time trailing
 * inline after the handle — see docs/DECISIONS.md.
 */
function CallCardComponent({ item, onOpenMarket, onOpenAuthor, onOpenPost }: CallCardProps) {
  const shareMessage = item.market
    ? `${item.body}\n\n${item.market.question} — via Knewit`
    : `${item.body}\n\nvia Knewit`;

  return (
    <Pressable
      onPress={() => onOpenPost(item.id)}
      className="flex-row gap-3 border-b border-border px-4 py-3 active:bg-surface"
      accessibilityRole="button"
      accessibilityLabel={`Open post by ${item.author.displayName}`}
    >
      <Pressable
        onPress={() => onOpenAuthor(item.author.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.author.displayName}'s profile`}
      >
        <Avatar uri={item.author.avatarUrl} fallbackLabel={item.author.displayName} size={40} />
      </Pressable>

      <View className="flex-1">
        <View className="flex-row items-baseline justify-between gap-2">
          <Pressable
            onPress={() => onOpenAuthor(item.author.id)}
            className="flex-1 flex-row items-baseline gap-1"
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.author.displayName}'s profile`}
          >
            <Text variant="bodyStrong" numberOfLines={1} className="shrink">
              {item.author.displayName}
            </Text>
            <Text variant="caption" color="textTertiary" numberOfLines={1} className="shrink">
              @{item.author.handle}
            </Text>
          </Pressable>
          <Text variant="caption" color="textTertiary">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        <Text variant="body" className="mt-0.5">
          {item.body}
        </Text>

        {item.market ? (
          <MarketAttachment
            market={item.market}
            positionSnapshot={item.positionSnapshot}
            onPress={() => onOpenMarket(item.market!)}
          />
        ) : null}

        <SocialActionBar
          postId={item.id}
          liked={item.liked}
          likeCount={item.likeCount}
          commentCount={item.commentCount}
          onPressComment={() => onOpenPost(item.id)}
          shareMessage={shareMessage}
        />
      </View>
    </Pressable>
  );
}

export const CallCard = memo(CallCardComponent);
