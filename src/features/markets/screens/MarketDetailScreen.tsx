import { useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import type { AppParamList } from '@/types/navigation';

/**
 * Placeholder — full Market Detail (chart, stats, rules, Buy YES/NO) is a
 * later sprint (see docs/PRD.md). This establishes the correct navigation
 * relationship from CallCard/MarketAttachment now, per Sprint 2 scope.
 */
export function MarketDetailScreen() {
  const route = useRoute<RouteProp<AppParamList, 'MarketDetail'>>();

  return (
    <Screen className="gap-2 pt-4">
      <Text variant="heading">Market Detail</Text>
      <Text variant="body" color="textSecondary">
        Market {route.params.marketId} — full detail (chart, stats, Buy YES/NO) lands in a later
        sprint.
      </Text>
    </Screen>
  );
}
