import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { RankNumber } from '@/components/RankNumber';
import { formatCompactUsd } from '@/lib/formatters';
import type { LeaderboardEntry } from '@/types/leaderboard';

const METRIC_LABEL: Record<LeaderboardEntry['metric']['name'], string> = {
  volume: 'Trading Volume',
};

export interface LeaderboardUserCardProps {
  entry: LeaderboardEntry;
}

/**
 * Web equivalent of `apps/mobile/src/features/leaderboard/components/LeaderboardUserCard`
 * — a plain divided row, not pressable and with no Follow button: a
 * ranked row is a Polymarket trader (proxy wallet), not a Knewit
 * account (docs/DECISIONS.md, "Round 6").
 */
export function LeaderboardUserCard({ entry }: LeaderboardUserCardProps) {
  return (
    <div
      aria-label={`Rank ${entry.rank}, ${entry.user.displayName}, ${METRIC_LABEL[entry.metric.name]} ${formatCompactUsd(entry.metric.value)}`}
      className="flex items-center gap-3 border-b border-border px-4 py-3"
    >
      <RankNumber rank={entry.rank} />
      <Avatar uri={entry.user.avatarUrl} fallbackLabel={entry.user.displayName} size={44} />
      <div className="min-w-0 flex-1">
        <Text variant="bodyStrong" numberOfLines={1} className="block truncate">
          {entry.user.displayName}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1} className="block truncate">
          @{entry.user.handle}
        </Text>
      </div>
      <div className="flex-shrink-0 text-right">
        <Text variant="bodyStrong" className="block">
          {formatCompactUsd(entry.metric.value)}
        </Text>
        <Text variant="micro" color="textTertiary">
          {METRIC_LABEL[entry.metric.name]}
        </Text>
      </div>
    </div>
  );
}
