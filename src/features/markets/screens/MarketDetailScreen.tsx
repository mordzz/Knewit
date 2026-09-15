import { View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MarketAttachment } from '@/features/home/components/MarketAttachment';
import { useMarket } from '@/features/markets/hooks/useMarket';
import type { AppParamList } from '@/types/navigation';

/**
 * Only `marketId` travels through navigation (never a full market
 * object — see docs/DECISIONS.md, Sprint 3), so this screen fetches its
 * own up-to-date copy rather than trusting stale data a list screen
 * happened to have. Full detail (price chart, rules, recent activity,
 * Buy YES/NO) is a later sprint — see docs/PRD.md; this establishes the
 * fetch-by-id contract and shows the same market preview card in the
 * meantime, not a placeholder that ignores the id it was given.
 */
export function MarketDetailScreen() {
  const route = useRoute<RouteProp<AppParamList, 'MarketDetail'>>();
  const { marketId } = route.params;
  const market = useMarket(marketId);

  return (
    <Screen className="gap-3 pt-4">
      <Text variant="heading">Market Detail</Text>

      {market.status === 'pending' ? <LoadingState rows={1} /> : null}

      {market.status === 'error' ? (
        <ErrorState message="Couldn't load this market." onRetry={() => market.refetch()} />
      ) : null}

      {market.status === 'success' ? (
        <>
          <View pointerEvents="none">
            <MarketAttachment market={market.data} onPress={() => {}} />
          </View>
          <Text variant="caption" color="textTertiary">
            Price chart, rules, recent activity, and Buy YES/NO land in a later sprint.
          </Text>
        </>
      ) : null}
    </Screen>
  );
}
