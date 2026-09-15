import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CategoryTabs } from '@/features/markets/components/CategoryTabs';
import { MarketCard, MarketCardSkeleton } from '@/features/markets/components/MarketCard';
import { useMarkets } from '@/features/markets/hooks/useMarkets';
import { colors } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';
import type { MarketListItem } from '@/types/social';

const SKELETON_ROWS = [0, 1, 2, 3];

function itemKey(item: MarketListItem): string {
  return item.kind === 'market' ? item.market.id : item.group.id;
}

/**
 * Dedicated prediction-market discovery — Trending is the default
 * category. No header title/subtitle and no search box: Search is its
 * own bottom tab, and this screen's job is to get straight into
 * browsing, not repeat chrome the tab bar already provides — see
 * docs/DECISIONS.md (Markets visual refresh). Renders `MarketCard`,
 * distinct from the Home feed's `MarketAttachment` — see that
 * component's own docs for why they're separate.
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
    ({ item }: { item: MarketListItem }) => <MarketCard item={item} onOpenMarket={openMarket} />,
    [openMarket]
  );

  const header = <CategoryTabs value={category} onChange={setCategory} />;

  if (markets.status === 'pending') {
    return (
      <Screen className="gap-3 pt-4">
        {header}
        <View>
          {SKELETON_ROWS.map((row) => (
            <MarketCardSkeleton key={row} />
          ))}
        </View>
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
        keyExtractor={itemKey}
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
