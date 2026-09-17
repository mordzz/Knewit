import type { MarketSummary } from '@/types/social';

interface MarketDetailNavigation {
  navigate: (
    screen: 'MarketDetail',
    params: { marketId?: string; eventId?: string }
  ) => void;
}

/**
 * Opens a market's detail the one correct way: a market that is a
 * **child** of a multi-market event opens its parent event instead of
 * its own page (docs/DECISIONS.md, "Attachment of a Child Market Opens
 * Its Parent Event"). When the viewer is already on that event's page,
 * nothing happens rather than pushing the same screen again.
 */
export function navigateToMarketDetail(
  navigation: MarketDetailNavigation,
  market: Pick<MarketSummary, 'id' | 'parentEventId'>,
  options?: { currentEventId?: string }
): void {
  if (market.parentEventId) {
    if (options?.currentEventId === market.parentEventId) return;
    navigation.navigate('MarketDetail', { eventId: market.parentEventId });
    return;
  }
  navigation.navigate('MarketDetail', { marketId: market.id });
}
