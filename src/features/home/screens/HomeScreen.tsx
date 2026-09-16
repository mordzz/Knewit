import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { CallCard } from '@/features/home/components/CallCard';
import { TrendingCallsSection } from '@/features/home/components/TrendingCallsSection';
import { TrendingMarketsSection } from '@/features/home/components/TrendingMarketsSection';
import { ClosingSoonSection } from '@/features/home/components/ClosingSoonSection';
import { CategoryDiscoverySection } from '@/features/home/components/CategoryDiscoverySection';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { useFollowingFeed } from '@/features/home/hooks/useFollowingFeed';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';
import { formatUsd } from '@/utils/formatCurrency';
import type { FeedItem } from '@/types/social';

type FeedTabKey = 'forYou' | 'following';

const FEED_TAB_OPTIONS: TabRowOption<FeedTabKey>[] = [
  { key: 'forYou', label: 'For You' },
  { key: 'following', label: 'Following' },
];

/**
 * The primary social feed and discovery surface — see
 * docs/PRODUCT-FLOW.md and docs/DECISIONS.md ("Home Feed Becomes a
 * Discovery Surface"). "For You" is rule-based discovery (trending
 * Calls/markets, category browsing, closing-soon markets, then the
 * backend-ranked `/feed` itself) — explicitly **not** an AI/ML
 * recommendation system, see docs/DECISIONS.md. "Following" shows only
 * real content from accounts the viewer follows (Sprint 9's Follow
 * relationships) with no dev-mock fallback, since fabricating it would
 * misrepresent a real social relationship — see docs/DECISIONS.md.
 */
export function HomeScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTabKey>('forYou');
  const feed = useHomeFeed();
  const followingFeed = useFollowingFeed();

  const openMarket = useCallback(
    (marketId: string) => navigation.navigate('MarketDetail', { marketId }),
    [navigation]
  );
  const openAuthor = useCallback(
    (userId: string) => navigation.navigate('Profile', { userId }),
    [navigation]
  );
  const openPost = useCallback(
    (postId: string) => navigation.navigate('PostDetail', { postId }),
    [navigation]
  );
  const openCategory = useCallback(
    (category: string) =>
      navigation.navigate('Main', { screen: 'MarketsTab', params: { category } }),
    [navigation]
  );
  const openSearch = useCallback(
    () => navigation.navigate('Main', { screen: 'SearchTab' }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <CallCard
        item={item}
        onOpenMarket={openMarket}
        onOpenAuthor={openAuthor}
        onOpenPost={openPost}
      />
    ),
    [openMarket, openAuthor, openPost]
  );

  const tabs = <TabRow options={FEED_TAB_OPTIONS} value={activeTab} onChange={setActiveTab} />;

  if (activeTab === 'following') {
    if (!isAuthenticated) {
      return (
        <Screen className="px-0" edges={['top']}>
          <Header />
          {tabs}
          <EmptyState
            icon="person-outline"
            title="Sign in to see your Following feed"
            message="Calls from accounts you follow will show up here once you're signed in."
            actionLabel="Connect Wallet"
            onAction={() => navigation.navigate('Auth')}
          />
        </Screen>
      );
    }

    if (followingFeed.status === 'pending') {
      return (
        <Screen className="px-0 pb-4" edges={['top']}>
          <Header />
          {tabs}
          <View className="px-4 pt-4">
            <LoadingState rows={4} />
          </View>
        </Screen>
      );
    }

    if (followingFeed.status === 'error') {
      return (
        <Screen className="px-0" edges={['top']}>
          <Header />
          {tabs}
          <ErrorState
            message="Couldn't load your Following feed."
            onRetry={() => followingFeed.refetch()}
          />
        </Screen>
      );
    }

    const followingItems = followingFeed.data.pages.flatMap((page) => page.items);

    return (
      <Screen edges={['top']} className="px-0">
        <FlatList
          className="flex-1"
          data={followingItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <>
              <Header />
              {tabs}
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={followingFeed.isRefetching && !followingFeed.isFetchingNextPage}
              onRefresh={() => followingFeed.refetch()}
              tintColor={colors.textSecondary}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (followingFeed.hasNextPage && !followingFeed.isFetchingNextPage) {
              followingFeed.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            <EmptyState
              icon="person-outline"
              title="Your feed is quiet"
              message="Follow traders and creators to see their Calls here."
              actionLabel="Find people to follow"
              onAction={openSearch}
            />
          }
          ListFooterComponent={
            followingFeed.isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator color={colors.textSecondary} />
              </View>
            ) : null
          }
        />
      </Screen>
    );
  }

  const discoverySections = (
    <>
      <TrendingCallsSection onOpenPost={openPost} />
      <TrendingMarketsSection onOpenMarket={openMarket} />
      <CategoryDiscoverySection onSelectCategory={openCategory} />
      <ClosingSoonSection onOpenMarket={openMarket} />
      <Text variant="bodyStrong" className="px-4 pb-1 pt-2">
        Latest
      </Text>
    </>
  );

  if (feed.status === 'pending') {
    return (
      <Screen className="px-0 pb-4" edges={['top']}>
        <Header />
        {tabs}
        {discoverySections}
        <View className="px-4 pt-2">
          <LoadingState rows={4} />
        </View>
      </Screen>
    );
  }

  if (feed.status === 'error') {
    return (
      <Screen className="px-0" edges={['top']}>
        <Header />
        {tabs}
        {discoverySections}
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
            {tabs}
            {discoverySections}
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
