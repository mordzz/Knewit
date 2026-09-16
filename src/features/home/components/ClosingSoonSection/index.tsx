import { View } from 'react-native';
import { DiscoverySection } from '@/features/home/components/DiscoverySection';
import { MarketCard } from '@/features/markets/components/MarketCard';
import { useClosingSoonMarkets } from '@/features/markets/hooks/useClosingSoonMarkets';

const CARD_WIDTH = 280;

export interface ClosingSoonSectionProps {
  onOpenMarket: (marketId: string) => void;
}

/** Markets whose real `endDate` is near — the backend decides the
 * window (see docs/DECISIONS.md); this never derives "soon" from a
 * client-invented threshold. Reuses `MarketCard`, same as
 * `TrendingMarketsSection`. */
export function ClosingSoonSection({ onOpenMarket }: ClosingSoonSectionProps) {
  const closingSoon = useClosingSoonMarkets();

  return (
    <DiscoverySection
      title="Closing Soon"
      status={closingSoon.status}
      isEmpty={closingSoon.status === 'success' && closingSoon.data.length === 0}
      emptyMessage="No markets closing soon."
      onRetry={() => closingSoon.refetch()}
      cardWidth={CARD_WIDTH}
    >
      {closingSoon.data?.map((market) => (
        <View key={market.id} style={{ width: CARD_WIDTH }}>
          <MarketCard item={{ kind: 'market', market }} onOpenMarket={onOpenMarket} />
        </View>
      ))}
    </DiscoverySection>
  );
}
