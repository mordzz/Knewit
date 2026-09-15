import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CategoryTabs } from '@/features/markets/components/CategoryTabs';
import { useMarkets } from '@/features/markets/hooks/useMarkets';
import { MarketAttachment } from '@/features/home/components/MarketAttachment';
import { colors } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';
import type { MarketSummary } from '@/types/social';

/**
 * Dedicated prediction-market discovery — Trending is the default
 * category (per product spec). Reuses `MarketAttachment` for the list
 * (same component the Home feed uses) rather than a separate market
 * card — see docs/DECISIONS.md for why.
 */
export function MarketsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainTabParamList, 'MarketsTab'>>();
  const [category, setCategory] = useState(route.params?.category ?? 'Trending');
  const markets = useMarkets(category);

  const openMarket = useCallback(
    (marketId: string) => navigation.navigate('MarketDetail', { marketId }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: MarketSummary }) => (
      <MarketAttachment market={item} onPress={() => openMarket(item.id)} />
    ),
    [openMarket]
  );

  const header = (
    <>
      <Text variant="heading" className="mb-1">
        Markets
      </Text>
      <Input placeholder="Search markets" editable={false} accessibilityHint="Use the Search tab" />
      <CategoryTabs value={category} onChange={setCategory} />
    </>
  );

  if (markets.status === 'pending') {
    return (
      <Screen className="gap-3 pt-4">
        {header}
        <LoadingState rows={4} />
      </Screen>
    );
  }

  if (markets.status === 'error') {
    return (
      <Screen className="gap-3 pt-4">
        {header}
        <ErrorState message="Couldn't load markets." onRetry={() => markets.refetch()} />
      </Screen>
    );
  }

  const items = markets.data.pages.flatMap((page) => page.items);

  return (
    <Screen className="gap-3 pt-4">
      {header}
      <FlatList
        className="flex-1"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={markets.isRefetching && !markets.isFetchingNextPage}
            onRefresh={() => markets.refetch()}
            tintColor={colors.textSecondary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (markets.hasNextPage && !markets.isFetchingNextPage) {
            markets.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          <EmptyState
            icon="trending-up-outline"
            title="No markets in this category yet"
            message="Real Polymarket markets will appear here once the backend is connected."
          />
        }
        ListFooterComponent={
          markets.isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
