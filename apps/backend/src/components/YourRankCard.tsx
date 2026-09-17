import { Text } from '@/components/ui/Text';
import { RankNumber } from '@/components/RankNumber';
import { formatCompactUsd } from '@/lib/formatters';
import type { LeaderboardSelf } from '@/types/leaderboard';

const METRIC_LABEL: Record<LeaderboardSelf['metric']['name'], string> = {
  volume: 'Trading Volume',
};

export interface YourRankCardProps {
  self: LeaderboardSelf | null | undefined;
}

/**
 * Web equivalent of `apps/mobile/src/features/leaderboard/components/YourRankCard`
 * — a plain hairline-divided row, never computed client-side: `self`
 * comes straight from the backend's own ranking or is honestly absent.
 */
export function YourRankCard({ self }: YourRankCardProps) {
  if (!self) {
    return (
      <div className="border-b border-border py-3">
        <Text variant="bodyStrong" className="block">
          Your Rank
        </Text>
        <Text variant="caption" color="textSecondary">
          Your ranking is unavailable.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-border py-3">
      <div>
        <Text variant="caption" color="textSecondary" className="block">
          Your Rank
        </Text>
        <RankNumber rank={self.rank} size="hero" />
      </div>
      <div className="text-right">
        <Text variant="bodyStrong" className="block">
          {formatCompactUsd(self.metric.value)}
        </Text>
        <Text variant="micro" color="textTertiary">
          {METRIC_LABEL[self.metric.name]}
        </Text>
      </div>
    </div>
  );
}
