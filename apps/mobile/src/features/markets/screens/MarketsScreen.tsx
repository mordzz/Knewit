import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { MarketCard, MarketCardSkeleton } from '@/features/markets/components/MarketCard';
import { useMarkets } from '@/features/markets/hooks/useMarkets';
import { getCategories } from '@/features/markets/services/eventService';
import { colors, typography } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';
import type { MarketListItem } from '@/types/social';

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

function itemKey(item: MarketListItem): string {
  return item.kind === 'market' ? item.market.id : item.group.id;
}

/**
 * Dedicated prediction-market discovery — Trending is the default
 * category. A bare "Markets" page title + divider sits above the
 * category row (no subtitle) — see docs/DECISIONS.md ("Decorated Top-3
 * Rank Numbers", which also covers this and the other main tabs' title
 * headers). No search box: Search is its own bottom tab. Renders
 * `MarketCard`, distinct from the Home feed's `MarketAttachment` — see
 * that component's own docs for why they're separate.
 *
 * Category tabs come from the live `GET /categories`
 * (`eventService.ts::getCategories`) — Polymarket's own current tag
 * taxonomy, not a hardcoded list this app decided on. This replaces the
 * previous `KNOWN_CATEGORIES` (`types/common.ts`, now deleted) static
 * list, which had silently drifted out of sync with what the shared
 * backend actually resolves category filters against (e.g. "Technology"/
 * "World Events" matched nothing real — see the web app's
 * `gammaClient.ts::CATEGORY_SLUG_CANDIDATES` for the same fix applied
 * there first).
 */
export function MarketsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainTabParamList, 'MarketsTab'>>();
  const [category, setCategory] = useState(route.params?.category ?? 'Trending');
  const markets = useMarkets(category);
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  // `key` is the API's tag slug (what the backend filters by); `label`
  // is only what the tab shows — the two are different namespaces
  // upstream (`pop-culture` ↔ "Culture"), never derived from each other.
  const categoryOptions: TabRowOption<string>[] = [
    { key: 'Trending', label: 'Trending' },
    ...(categoriesQuery.data ?? []).map((option) => ({ key: option.slug, label: option.label })),
  ];

  const openMarket = useCallback(
    (marketId: string) => navigation.navigate('MarketDetail', { marketId }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: MarketListItem }) => <MarketCard item={item} onOpenMarket={openMarket} />,
    [openMarket]
  );

  const header = (
    <View>
      <Text
        variant="heading"
        className="px-4 pb-3 pt-2 text-4xl"
        style={{ fontFamily: typography.family.extrabold }}
      >
        Markets
      </Text>
      <Divider />
      <View className="pt-4">
        <TabRow options={categoryOptions} value={category} onChange={setCategory} scroll />
      </View>
    </View>
  );

  if (markets.status === 'pending') {
    return (
      <Screen className="px-0" edges={['top']}>
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
      <Screen className="px-0" edges={['top']}>
        {header}
        <View className="px-4">
          <ErrorState message="Couldn't load markets." onRetry={() => markets.refetch()} />
        </View>
      </Screen>
    );
  }

  const items = markets.data.pages.flatMap((page) => page.items);

  return (
    <Screen className="px-0" edges={['top']}>
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
