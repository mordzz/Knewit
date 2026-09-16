import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { formatUsd } from '@/utils/formatCurrency';
import type { LeaderboardSelf } from '@/types/leaderboard';

const METRIC_LABEL: Record<LeaderboardSelf['metric']['name'], string> = {
  volume: 'Trading Volume',
};

export interface YourRankCardProps {
  isAuthenticated: boolean;
  self: LeaderboardSelf | null | undefined;
}

/**
 * Never computed client-side from a partial/cached dataset — `self`
 * comes straight from the backend's own ranking (`LeaderboardPage.currentUser`,
 * first page only) or is honestly absent — see docs/DECISIONS.md.
 */
export function YourRankCard({ isAuthenticated, self }: YourRankCardProps) {
  if (!isAuthenticated) {
    return (
      <Card contentClassName="gap-1">
        <Text variant="bodyStrong">Your Rank</Text>
        <Text variant="caption" color="textSecondary">
          Sign in to see your rank.
        </Text>
      </Card>
    );
  }

  if (!self) {
    return (
      <Card contentClassName="gap-1">
        <Text variant="bodyStrong">Your Rank</Text>
        <Text variant="caption" color="textSecondary">
          Your ranking is unavailable.
        </Text>
      </Card>
    );
  }

  return (
    <Card contentClassName="flex-row items-center justify-between">
      <View>
        <Text variant="caption" color="textSecondary">
          Your Rank
        </Text>
        <Text variant="display">#{self.rank}</Text>
      </View>
      <View className="items-end">
        <Text variant="bodyStrong">{formatUsd(self.metric.value)}</Text>
        <Text variant="micro" color="textTertiary">
          {METRIC_LABEL[self.metric.name]}
        </Text>
      </View>
    </Card>
  );
}
