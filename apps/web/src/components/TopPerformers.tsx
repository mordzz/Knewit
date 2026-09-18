import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { formatCompactUsd } from '@/lib/formatters';
import type { LeaderboardEntry } from '@/types/leaderboard';

export interface TopPerformersProps {
  entries: [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry];
}

/**
 * Web equivalent of `apps/mobile/src/features/leaderboard/components/TopPerformers`
 * — a visual highlight for the top 3, only ever rendered when the first
 * page actually has 3 real ranked entries. Display only: a Polymarket
 * trader identified by proxy wallet has no profile behind it to open.
 */
export function TopPerformers({ entries }: TopPerformersProps) {
  const [first, second, third] = entries;

  return (
    <div className="flex flex-col gap-3 border-b border-border py-3">
      <Text variant="bodyStrong" className="block text-center">
        Top Performers
      </Text>
      <div className="flex items-end justify-center gap-3">
        <PodiumSlot entry={second} avatarSize={48} />
        <PodiumSlot entry={first} avatarSize={60} emphasized />
        <PodiumSlot entry={third} avatarSize={48} />
      </div>
    </div>
  );
}

function PodiumSlot({ entry, avatarSize, emphasized }: { entry: LeaderboardEntry; avatarSize: number; emphasized?: boolean }) {
  return (
    <div
      aria-label={`Rank ${entry.rank}, ${entry.user.displayName}, ${formatCompactUsd(entry.metric.value)} trading volume`}
      className="flex flex-1 flex-col items-center gap-1"
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
    </div>
  );
}
