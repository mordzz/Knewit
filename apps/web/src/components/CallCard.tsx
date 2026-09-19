import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { MarketAttachment } from '@/features/markets/components/MarketAttachment';
import { SocialActionBar } from '@/components/SocialActionBar';
import { formatRelativeTime } from '@/lib/formatters';
import type { FeedItem } from '@/types/social';

export interface CallCardProps {
  item: FeedItem;
}

/**
 * Web equivalent of `apps/mobile/src/features/home/components/CallCard`
 * — X-style feed row: borderless, full-width, separated from the next
 * item by a hairline bottom border. Renders both variants of the
 * unified Post/Call model: a normal Post when `item.market` is null,
 * and a position-backed Call (with the Market Attachment) when it
 * isn't. The whole row opens Post/Call Detail; the author name and the
 * Market Attachment are their own nested links with their own
 * destinations, `stopPropagation`d so they don't also trigger the
 * outer row's navigation (the DOM doesn't resolve nested
 * click-through the way React Native's `Pressable` does on its own).
 */
export function CallCard({ item }: CallCardProps) {
  const router = useRouter();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/calls/${item.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/calls/${item.id}`);
      }}
      aria-label={`Open post by ${item.author.displayName}`}
      className="flex cursor-pointer gap-3 border-b border-border px-4 py-3 hover:bg-surface"
    >
      <Link
        href={`/profile/${item.author.id}`}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Open ${item.author.displayName}'s profile`}
      >
        <Avatar uri={item.author.avatarUrl} fallbackLabel={item.author.displayName} size={40} />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href={`/profile/${item.author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex min-w-0 flex-1 items-baseline gap-1"
            aria-label={`Open ${item.author.displayName}'s profile`}
          >
            <Text variant="bodyStrong" numberOfLines={1} className="truncate">
              {item.author.displayName}
            </Text>
            <Text variant="caption" color="textTertiary" numberOfLines={1} className="shrink-0">
              @{item.author.handle}
            </Text>
          </Link>
          <Text variant="caption" color="textTertiary" className="flex-shrink-0">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </div>

        <Text variant="body" className="mt-0.5 block whitespace-pre-wrap">
          {item.body}
        </Text>

        {item.market ? (
          <div onClick={(e) => e.stopPropagation()}>
            <MarketAttachment
              market={item.market}
              positionSnapshot={item.positionSnapshot}
              // A child market's attachment opens its parent event's
              // detail instead of the child's own page (docs/DECISIONS.md).
              onPress={() =>
                router.push(`/markets/${item.market!.parentEventId ?? item.market!.id}`)
              }
            />
          </div>
        ) : null}

        <div onClick={(e) => e.stopPropagation()}>
          <SocialActionBar
            postId={item.id}
            liked={item.liked}
            likeCount={item.likeCount}
            commentCount={item.commentCount}
            onPressComment={() => router.push(`/calls/${item.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
