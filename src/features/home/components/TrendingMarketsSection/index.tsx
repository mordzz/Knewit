import { View } from 'react-native';
import { DiscoverySection } from '@/features/home/components/DiscoverySection';
import { MarketCard } from '@/features/markets/components/MarketCard';
import { useTrendingMarkets } from '@/features/markets/hooks/useTrendingMarkets';

const CARD_WIDTH = 280;

export interface TrendingMarketsSectionProps {
  onOpenMarket: (marketId: string) => void;
}

/** Reuses `MarketCard` (Sprint 3) exactly as the Markets tab renders
 * it — no second market-card component for this horizontal context,
 * just a fixed-width wrapper around it. */
export function TrendingMarketsSection({ onOpenMarket }: TrendingMarketsSectionProps) {
  const trending = useTrendingMarkets();

  return (
    <DiscoverySection
      title="Trending Markets"
      status={trending.status}
      isEmpty={trending.status === 'success' && trending.data.length === 0}
      emptyMessage="No markets available right now."
      onRetry={() => trending.refetch()}
      cardWidth={CARD_WIDTH}
    >
      {trending.data?.map((market) => (
        <View key={market.id} style={{ width: CARD_WIDTH }}>
          <MarketCard item={{ kind: 'market', market }} onOpenMarket={onOpenMarket} />
        </View>
      ))}
    </DiscoverySection>
  );
}
