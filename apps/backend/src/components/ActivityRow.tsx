import type { ReactNode } from 'react';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName, type ColorToken } from '@/components/ui/Icon';
import { formatUsd, formatRelativeTime } from '@/lib/formatters';
import type { ActivityItem } from '@/types/activity';

export interface ActivityRowProps {
  item: ActivityItem;
  onOpenPost: (postId: string) => void;
  onOpenMarket: (marketId: string) => void;
  onOpenUser: (userId: string) => void;
}

/**
 * Web equivalent of `apps/mobile/src/features/profile/components/ActivityRow`
 * — renders exactly one of the four real, server-verified activity
 * types (docs/DECISIONS.md, "Activity Types Limited to What This App
 * Can Actually Produce").
 */
export function ActivityRow({ item, onOpenPost, onOpenMarket, onOpenUser }: ActivityRowProps) {
  switch (item.type) {
    case 'TRADE':
      return (
        <ActivityRowShell icon="trending-up-outline" onPress={() => onOpenMarket(item.marketId)} createdAt={item.createdAt}>
          <Text variant="bodyStrong" color={item.outcome === 'YES' ? 'yes' : 'no'} className="block">
            {item.outcome} position opened
          </Text>
          <Text variant="body" numberOfLines={2} className="block">
            {item.marketQuestion}
          </Text>
          <Text variant="caption" color="textSecondary">
            {formatUsd(item.usdAmount)}
          </Text>
        </ActivityRowShell>
      );
    case 'CALL':
      return (
        <ActivityRowShell icon="checkmark-circle" onPress={() => onOpenPost(item.postId)} createdAt={item.createdAt}>
          <Text variant="bodyStrong" className="block">
            Created a Call
          </Text>
          <Text variant="body" numberOfLines={2} className="block">
            {item.marketQuestion}
          </Text>
        </ActivityRowShell>
      );
    case 'POST':
      return (
        <ActivityRowShell icon="chatbubble-outline" onPress={() => onOpenPost(item.postId)} createdAt={item.createdAt}>
          <Text variant="bodyStrong">Created a post</Text>
        </ActivityRowShell>
      );
    case 'FOLLOW':
      return (
        <ActivityRowShell icon="person-outline" onPress={() => onOpenUser(item.followedUser.id)} createdAt={item.createdAt}>
          <Text variant="bodyStrong">Followed {item.followedUser.displayName}</Text>
        </ActivityRowShell>
      );
  }
}

function ActivityRowShell({
  icon,
  onPress,
  createdAt,
  children,
}: {
  icon: IconName;
  onPress: () => void;
  createdAt: string;
  children: ReactNode;
}) {
  const iconColor: ColorToken = icon === 'checkmark-circle' ? 'accent' : 'textTertiary';

  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left hover:bg-surface"
    >
      <Icon name={icon} size={20} color={iconColor} />
      <div className="min-w-0 flex-1">
        {children}
        <Text variant="caption" color="textTertiary">
          {formatRelativeTime(createdAt)}
        </Text>
      </div>
    </button>
  );
}
