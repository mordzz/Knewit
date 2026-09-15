import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CallCard } from '@/features/home/components/CallCard';
import { FeedTabs, FeedTabKey } from '@/features/home/components/FeedTabs';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { colors } from '@/theme';
import { formatUsd } from '@/utils/formatCurrency';
import type { FeedItem } from '@/types/social';

/**
 * The primary social feed — see docs/PRODUCT-FLOW.md. Rows are full-width
 * and borderless with a hairline divider (X-style), not gapped cards —
 * `CallCard` owns its own padding/divider, so this screen adds no
 * horizontal padding of its own.
 */
export function HomeScreen() {
  const navigation = useNavigation();
  const feed = useHomeFeed();
  const [activeTab, setActiveTab] = useState<FeedTabKey>('trending');

  const openMarket = useCallback(
    (marketId: string) => navigation.navigate('MarketDetail', { marketId }),
    [navigation]
  );
  const openAuthor = useCallback(
    (userId: string) => navigation.navigate('UserProfile', { userId }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <CallCard item={item} onOpenMarket={openMarket} onOpenAuthor={openAuthor} />
    ),
    [openMarket, openAuthor]
  );

  if (activeTab === 'following') {
    return (
      <Screen className="px-0" edges={['top']}>
        <Header />
        <FeedTabs value={activeTab} onChange={setActiveTab} />
        <EmptyState
          icon="search"
          title="Follow people to see them here"
          message="Calls from accounts you follow will show up in this tab."
        />
      </Screen>
    );
  }

  if (feed.status === 'pending') {
    return (
      <Screen className="px-0 pb-4" edges={['top']}>
        <Header />
        <FeedTabs value={activeTab} onChange={setActiveTab} />
        <View className="px-4 pt-4">
          <LoadingState rows={4} />
        </View>
      </Screen>
    );
  }

  if (feed.status === 'error') {
    return (
      <Screen className="px-0" edges={['top']}>
        <Header />
        <FeedTabs value={activeTab} onChange={setActiveTab} />
        <ErrorState message="Couldn't load your feed." onRetry={() => feed.refetch()} />
      </Screen>
    );
  }

  const items = feed.data.pages.flatMap((page) => page.items);

  return (
    <Screen edges={['top']} className="px-0">
      <FlatList
        className="flex-1"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            <Header />
            <FeedTabs value={activeTab} onChange={setActiveTab} />
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => feed.refetch()}
            tintColor={colors.textSecondary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="No Calls yet"
            message="Be the first to back a prediction and post about it."
          />
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          ) : !feed.hasNextPage && items.length > 0 ? (
            <Text variant="caption" color="textTertiary" className="py-4 text-center">
              You&apos;re all caught up
            </Text>
          ) : null
        }
      />
    </Screen>
  );
}

/**
 * Single row: balance on the left, Deposit + notifications on the
 * right — matches the FOMO/pump.fun-style header this product is
 * modeled on. Balance intentionally uses a raw
 * `className="text-5xl font-bold"` override rather than the `jumbo`
 * typography variant, by explicit request — kept as-is even though it
 * carries the known caveats documented in docs/DECISIONS.md: `Text`'s
 * own default (`body`) classes are still applied underneath and aren't
 * guaranteed
 * to lose a size/weight conflict to a later raw className the way two
 * recognized Tailwind utilities would, and stacking a numeric
 * `fontWeight` (`font-bold`) on top of a specific static Inter file can
 * make Android quietly fall back to the system font instead of erroring
 * — a real but purely cosmetic risk, not a crash.
 *
 * Balance is a placeholder ("$0.00") until a real wallet balance
 * endpoint exists, same honesty rule as Portfolio's placeholder cards —
 * plain text, not tappable. Notifications icon has no feature behind it
 * yet (out of scope, see docs/PRD.md), so it's inert.
 */
function Header() {
  const navigation = useNavigation();

  return (
    <View className="flex-row items-center justify-between px-4 pb-8 pl-6 pt-4">
      <Text className="text-5xl font-bold">{formatUsd(0)}</Text>
      <Button
        label="Deposit"
        onPress={() => navigation.navigate('Auth')}
        className="h-12 min-h-0 rounded-full px-12 py-0 text-lg font-semibold"
      />
    </View>
  );
}
