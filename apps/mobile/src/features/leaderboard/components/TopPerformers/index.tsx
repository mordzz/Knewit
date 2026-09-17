import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { formatCompactUsd } from '@/utils/formatCurrency';
import type { LeaderboardEntry } from '@/types/leaderboard';

export interface TopPerformersProps {
  entries: [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry];
}

/**
 * A visual highlight for the top 3 — only ever rendered by
 * `LeaderboardScreen` when the first page actually has 3 real ranked
 * entries; there is no placeholder/skeleton version of this component,
 * since a "podium" implies a real #1/#2/#3, and showing one without
 * real data would be exactly the fabricated "winner" visual Sprint 10's
 * spec warns against. Deliberately labeled "Top Performers," not
 * "Winners" or "Best Traders" — neutral, not a marketing claim.
 *
 * Display only: a slot is a `View`, not a `Pressable` — it shows a
 * Polymarket trader identified by proxy wallet, not a Knewit account, so
 * there is no profile behind it to open (docs/DECISIONS.md, "Round 6:
 * Leaderboard Is a Read-Only Polymarket Ranking — No Follow, No Profile
 * Links"). Volumes use `formatCompactUsd` so a billion-dollar figure fits a
 * narrow slot — the same formatting the list rows below use.
 */
export function TopPerformers({ entries }: TopPerformersProps) {
  const [first, second, third] = entries;

  return (
    <View className="gap-3 border-b border-border py-3">
      <Text variant="bodyStrong" className="text-center">
        Top Performers
      </Text>
      <View className="flex-row items-end justify-center gap-3">
        <PodiumSlot entry={second} avatarSize={48} />
        <PodiumSlot entry={first} avatarSize={60} emphasized />
        <PodiumSlot entry={third} avatarSize={48} />
      </View>
    </View>
  );
}

function PodiumSlot({
  entry,
  avatarSize,
  emphasized,
}: {
  entry: LeaderboardEntry;
  avatarSize: number;
  emphasized?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`Rank ${entry.rank}, ${entry.user.displayName}, ${formatCompactUsd(entry.metric.value)} trading volume`}
      className="flex-1 items-center gap-1"
    >
      <Text variant={emphasized ? 'title' : 'bodyStrong'} color="accent">
        #{entry.rank}
      </Text>
      <Avatar uri={entry.user.avatarUrl} fallbackLabel={entry.user.displayName} size={avatarSize} />
      <Text variant="caption" numberOfLines={1}>
        {entry.user.displayName}
      </Text>
      <Text variant="micro" color="textSecondary">
        {formatCompactUsd(entry.metric.value)}
      </Text>
    </View>
  );
}
