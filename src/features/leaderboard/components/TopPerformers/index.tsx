import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { formatUsd } from '@/utils/formatCurrency';
import type { LeaderboardEntry } from '@/types/leaderboard';

export interface TopPerformersProps {
  entries: [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry];
  onPressUser: (userId: string) => void;
}

/**
 * A visual highlight for the top 3 — only ever rendered by
 * `LeaderboardScreen` when the first page actually has 3 real ranked
 * entries; there is no placeholder/skeleton version of this component,
 * since a "podium" implies a real #1/#2/#3, and showing one without
 * real data would be exactly the fabricated "winner" visual Sprint 10's
 * spec warns against. Deliberately labeled "Top Performers," not
 * "Winners" or "Best Traders" — neutral, not a marketing claim.
 */
export function TopPerformers({ entries, onPressUser }: TopPerformersProps) {
  const [first, second, third] = entries;

  return (
    <GlassSurface contentClassName="gap-3 p-4">
      <Text variant="bodyStrong" className="text-center">
        Top Performers
      </Text>
      <View className="flex-row items-end justify-center gap-3">
        <PodiumSlot entry={second} avatarSize={48} onPress={onPressUser} />
        <PodiumSlot entry={first} avatarSize={60} emphasized onPress={onPressUser} />
        <PodiumSlot entry={third} avatarSize={48} onPress={onPressUser} />
      </View>
    </GlassSurface>
  );
}

function PodiumSlot({
  entry,
  avatarSize,
  emphasized,
  onPress,
}: {
  entry: LeaderboardEntry;
  avatarSize: number;
  emphasized?: boolean;
  onPress: (userId: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(entry.user.id)}
      className="flex-1 items-center gap-1"
      accessibilityRole="button"
      accessibilityLabel={`Rank ${entry.rank}, ${entry.user.displayName}, ${formatUsd(entry.metric.value)} trading volume`}
    >
      <Text variant={emphasized ? 'title' : 'bodyStrong'} color="accent">
        #{entry.rank}
      </Text>
      <Avatar uri={entry.user.avatarUrl} fallbackLabel={entry.user.displayName} size={avatarSize} />
      <Text variant="caption" numberOfLines={1}>
        {entry.user.displayName}
      </Text>
      <Text variant="micro" color="textSecondary">
        {formatUsd(entry.metric.value)}
      </Text>
    </Pressable>
  );
}
