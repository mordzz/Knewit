import { View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/feedback/EmptyState';

/**
 * Community/performance ranking (rank, user, PnL, volume, win rate) —
 * Polymarket-leaderboard-inspired, original UI, per the product spec.
 * Shell only: no backend exists to reliably calculate PnL/volume/win
 * rate from real positions, and the spec is explicit — don't fabricate
 * metrics. An honest empty state beats mock rankings presented as real
 * — see docs/DECISIONS.md.
 */
export function LeaderboardScreen() {
  return (
    <Screen className="gap-1 pt-4">
      <Text variant="heading">Leaderboard</Text>
      <Text variant="caption" color="textSecondary">
        Ranked by realized PnL, once positions can be reliably tracked.
      </Text>

      <View className="flex-1">
        <EmptyState
          icon="trophy-outline"
          title="Leaderboard isn't live yet"
          message="Ranking real users needs verified positions and PnL data from the backend — nothing shown here is fabricated in the meantime."
        />
      </View>
    </Screen>
  );
}
