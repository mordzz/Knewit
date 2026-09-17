import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { RankNumber } from '@/features/leaderboard/components/RankNumber';
import { formatCompactUsd } from '@/utils/formatCurrency';
import type { LeaderboardEntry } from '@/types/leaderboard';

const METRIC_LABEL: Record<LeaderboardEntry['metric']['name'], string> = {
  volume: 'Trading Volume',
};

export interface LeaderboardUserCardProps {
  entry: LeaderboardEntry;
}

/**
 * A plain divided row — same convention as `FollowListRow`/`CallCard`
 * (`border-b border-border px-4 py-3`, no card/blur) rather than a
 * glass card per row, so a long ranked list reads as one coherent list
 * instead of a stack of individual boxes — see docs/DECISIONS.md
 * ("Glass Surfaces Reserved for Overlays Only").
 *
 * Deliberately **not** pressable and with no Follow button: a ranked row is
 * a Polymarket trader, identified by proxy wallet, which is not a Knewit
 * account — there is no profile here to open and no relationship to toggle,
 * because this app's users and Polymarket's users are different populations
 * (docs/DECISIONS.md, "Round 6: Leaderboard Is a Read-Only Polymarket
 * Ranking — No Follow, No Profile Links"). It renders as a `View` rather
 * than a `Pressable` on purpose, so nothing promises an action that doesn't
 * exist. The row is still `accessible` with a spoken label, since rank +
 * volume is real information for a screen reader even with no tap target.
 */
export function LeaderboardUserCard({ entry }: LeaderboardUserCardProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Rank ${entry.rank}, ${entry.user.displayName}, ${METRIC_LABEL[entry.metric.name]} ${formatCompactUsd(entry.metric.value)}`}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3"
    >
      <RankNumber rank={entry.rank} />
      <Avatar uri={entry.user.avatarUrl} fallbackLabel={entry.user.displayName} size={44} />
      <View className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {entry.user.displayName}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          @{entry.user.handle}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="bodyStrong">{formatCompactUsd(entry.metric.value)}</Text>
        <Text variant="micro" color="textTertiary">
          {METRIC_LABEL[entry.metric.name]}
        </Text>
      </View>
    </View>
  );
}
