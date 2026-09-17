import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { RankNumber } from '@/features/leaderboard/components/RankNumber';
import { formatUsd } from '@/utils/formatCurrency';
import type { LeaderboardSelf } from '@/types/leaderboard';

const METRIC_LABEL: Record<LeaderboardSelf['metric']['name'], string> = {
  volume: 'Trading Volume',
};

export interface YourRankCardProps {
  self: LeaderboardSelf | null | undefined;
}

/**
 * A plain hairline-divided row, not a bounded card — same rows-over-
 * cards convention as the rest of the main tabs (see docs/DESIGN.md).
 * Never computed client-side from a partial/cached dataset — `self`
 * comes straight from the backend's own ranking (`LeaderboardPage.currentUser`,
 * first page only) or is honestly absent — see docs/DECISIONS.md.
 *
 * The signed-out state is no longer this component's concern — by
 * request, "Your Rank" doesn't render at all when signed out, so the
 * caller (`LeaderboardScreen`) simply doesn't mount this component in
 * that case rather than this component showing a sign-in prompt — see
 * docs/DECISIONS.md ("Decorated Top-3 Rank Numbers").
 */
export function YourRankCard({ self }: YourRankCardProps) {
  if (!self) {
    return (
      <View className="gap-0.5 border-b border-border py-3">
        <Text variant="bodyStrong">Your Rank</Text>
        <Text variant="caption" color="textSecondary">
          Your ranking is unavailable.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between border-b border-border py-3">
      <View>
        <Text variant="caption" color="textSecondary">
          Your Rank
        </Text>
        <RankNumber rank={self.rank} size="hero" />
      </View>
      <View className="items-end">
        <Text variant="bodyStrong">{formatUsd(self.metric.value)}</Text>
        <Text variant="micro" color="textTertiary">
          {METRIC_LABEL[self.metric.name]}
        </Text>
      </View>
    </View>
  );
}
