import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { formatUsd } from '@/utils/formatCurrency';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import type { ActivityItem } from '@/types/activity';
import type { ColorToken } from '@/theme/colors';
import { solidPanel } from '@/theme';

export interface ActivityRowProps {
  item: ActivityItem;
  onOpenPost: (postId: string) => void;
  onOpenMarket: (marketId: string) => void;
  onOpenUser: (userId: string) => void;
}

/**
 * Renders exactly one of the four real, server-verified activity types
 * (see docs/DECISIONS.md, "Activity Types Limited to What This App Can
 * Actually Produce")  a `switch` on the discriminated `type`, so each
 * branch only ever reads fields that variant actually has.
 */
export function ActivityRow({ item, onOpenPost, onOpenMarket, onOpenUser }: ActivityRowProps) {
  switch (item.type) {
    case 'TRADE':
      return (
        <ActivityRowShell
          icon="trending-up-outline"
          onPress={() => onOpenMarket(item.marketId)}
          accessibilityLabel={`${item.outcome} position opened in ${item.marketQuestion}, ${formatUsd(item.usdAmount)}`}
          createdAt={item.createdAt}
        >
          <Text
            variant="bodyStrong"
            color={choiceTextColor(choiceTone({ index: item.choiceIndex, label: item.outcome }))}
          >
            {item.outcome} position opened
          </Text>
          <Text variant="body" numberOfLines={2}>
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
          accessibilityLabel={`Created a Call, ${item.outcome}, ${item.marketQuestion}`}
          createdAt={item.createdAt}
        >
          <Text variant="bodyStrong">Created a Call</Text>
          <Text variant="body" numberOfLines={2}>
            {item.marketQuestion}
          </Text>
        </ActivityRowShell>
      );
    case 'FOLLOW':
      return (
        <ActivityRowShell
          icon="person-outline"
          onPress={() => onOpenUser(item.followedUser.id)}
          accessibilityLabel={`Followed ${item.followedUser.displayName}`}
          createdAt={item.createdAt}
        >
          <Text variant="bodyStrong">
            Followed <Text variant="bodyStrong">{item.followedUser.displayName}</Text>
          </Text>
        </ActivityRowShell>
      );
  }
}

function ActivityRowShell({
  icon,
  onPress,
  accessibilityLabel,
  createdAt,
  children,
}: {
  icon: 'trending-up-outline' | 'checkmark-circle' | 'chatbubble-outline' | 'person-outline';
  onPress: () => void;
  accessibilityLabel: string;
  createdAt: string;
  children: React.ReactNode;
}) {
  const iconColor: ColorToken = icon === 'checkmark-circle' ? 'accent' : 'textTertiary';

  return (
    <Pressable
      onPress={onPress}
      style={[solidPanel, { borderRadius: 16 }]}
      className="mx-4 mb-3 flex-row items-start gap-3 p-4 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated">
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-baseline justify-between gap-2">
          <View className="flex-1">{children}</View>
          <Text variant="caption" color="textTertiary">
            {formatRelativeTime(createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
