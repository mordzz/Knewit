import type { ReactNode } from 'react';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName, type ColorToken } from '@/components/ui/Icon';
import { formatUsd, formatRelativeTime } from '@/lib/formatters';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import type { ActivityItem } from '@/types/activity';

export interface ActivityRowProps {
  item: ActivityItem;
  onOpenPost: (postId: string) => void;
  onOpenMarket: (marketId: string) => void;
  onOpenUser: (userId: string) => void;
}

/**
 * Web equivalent of `apps/mobile/src/features/profile/components/ActivityRow`
 *  renders exactly one of the three real, server-verified activity
 * types (docs/DECISIONS.md, "Activity Types Limited to What This App
 * Can Actually Produce").
 */
export function ActivityRow({ item, onOpenPost, onOpenMarket, onOpenUser }: ActivityRowProps) {
  switch (item.type) {
    case 'TRADE':
      return (
        <ActivityRowShell
          icon="trending-up-outline"
          onPress={() => onOpenMarket(item.marketId)}
          createdAt={item.createdAt}
          title={
            <Text variant="bodyStrong" color={choiceTextColor(choiceTone({ index: item.choiceIndex, label: item.outcome }))} className="block">
              {item.outcome} position opened
            </Text>
          }
        >
          <Text variant="body" numberOfLines={2} className="block lg:min-w-0 lg:flex-1">
            {item.marketQuestion}
          </Text>
          <Text variant="caption" color="textSecondary">
            {formatUsd(item.usdAmount)}
          </Text>
        </ActivityRowShell>
      );
    case 'CALL':
      return (
        <ActivityRowShell
          icon="checkmark-circle"
          onPress={() => onOpenPost(item.postId)}
          createdAt={item.createdAt}
          title={
            <Text variant="bodyStrong" className="block">
              Created a Call
            </Text>
          }
        >
          <Text variant="body" numberOfLines={2} className="block lg:min-w-0 lg:flex-1">
            {item.marketQuestion}
          </Text>
        </ActivityRowShell>
      );
    case 'FOLLOW':
      return (
        <ActivityRowShell
          icon="person-outline"
          onPress={() => onOpenUser(item.followedUser.id)}
          createdAt={item.createdAt}
          title={<Text variant="bodyStrong">Followed {item.followedUser.displayName}</Text>}
        />
      );
  }
}

function ActivityRowShell({
  icon,
  onPress,
  createdAt,
  title,
  children,
}: {
  icon: IconName;
  onPress: () => void;
  createdAt: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  const iconColor: ColorToken = icon === 'checkmark-circle' ? 'accent' : 'textTertiary';

  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left hover:bg-surface lg:grid lg:grid-cols-[40px_minmax(0,1fr)_auto] lg:items-center lg:gap-4 lg:px-6 lg:py-5 lg:transition-colors lg:hover:bg-white/[0.03]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-elevated">
        <Icon name={icon} size={20} color={iconColor} />
      </span>
      <div className="min-w-0 flex-1 lg:contents">
        <div className="flex flex-col gap-0.5 lg:flex lg:min-w-0 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex items-baseline justify-between gap-2 lg:contents">
            {title}
            <Text variant="caption" color="textTertiary" className="shrink-0 lg:hidden">
              {formatRelativeTime(createdAt)}
            </Text>
          </div>
          {children}
        </div>
      </div>
      <Text variant="caption" color="textTertiary" className="hidden lg:block lg:whitespace-nowrap">
        {formatRelativeTime(createdAt)}
      </Text>
    </button>
  );
}
