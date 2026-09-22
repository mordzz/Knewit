import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { CallCard } from '@/features/home/components/CallCard';
import { useHomeFeed } from '@/features/home/hooks/useHomeFeed';
import { useFollowingFeed } from '@/features/home/hooks/useFollowingFeed';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useDeposit } from '@/features/wallet/hooks/useDeposit';
import { isUserCancelledFunding } from '@/features/wallet/utils/privyErrors';
import { getDepositErrorMessage, logDepositFailure } from '@/features/wallet/utils/depositErrors';
import { navigateToMarketDetail } from '@/features/markets/utils/openMarketDetail';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { colors, FAB_CLEARANCE } from '@/theme';
import { formatUsd } from '@/utils/formatCurrency';
import type { FeedItem, MarketSummary } from '@/types/social';

type FeedTabKey = 'forYou' | 'following';

const FEED_TAB_OPTIONS: TabRowOption<FeedTabKey>[] = [
  { key: 'forYou', label: 'Trending' },
  { key: 'following', label: 'Following' },
];

/**
 * The primary social feed. The first tab (key still `forYou`) is
 * labeled **"Trending"** — the backend-ranked `/feed` itself, with no
 * personalized recommendation algorithm behind it, and "For You" would
 * imply one that doesn't exist — see docs/DECISIONS.md. "Following"
 * shows only real content from accounts the viewer follows (Sprint 9's
 * Follow relationships) with no dev-mock fallback, since fabricating it
 * would misrepresent a real social relationship — see
 * docs/DECISIONS.md. Discovery strips (Trending Calls/Markets, Closing
 * Soon) were deleted, not relocated.
 */
export function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { canUseApp } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTabKey>('forYou');
  const feed = useHomeFeed();
  const followingFeed = useFollowingFeed();
  // The FAB is only ever shown while Home's tab is focused (see
  // MainTabNavigator) — but that's always true while this screen is on
  // screen, regardless of which of *its own* internal tabs (Trending/
  // Following) is selected, so both lists below reserve this clearance.
  const fabClearance = insets.bottom + FAB_CLEARANCE;

  const openMarket = useCallback(
    (market: MarketSummary) => navigateToMarketDetail(navigation, market),
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
    if (!canUseApp) {
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
          contentContainerStyle={{ paddingBottom: fabClearance }}
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

  if (feed.status === 'pending') {
    return (
      <Screen className="px-0 pb-4" edges={['top']}>
        <Header />
        {tabs}
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
        <ErrorState message="Couldn't load your feed." onRetry={() => feed.refetch()} />
      </Screen>
    );
  }

  const items = feed.data.pages.flatMap((page) => page.items);

  return (
    <Screen edges={['top']} className="px-0">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ paddingBottom: fabClearance }}
        data={items}
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
            message="Be the first to back a prediction and publish a Callout."
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
 * Single row: balance on the left, Deposit on the right, separated
 * from the tabs below by a hairline bottom border. Balance is the real
 * USDC collateral read from Polymarket's CLOB (`useWalletBalance`) —
 * "—" when it's unavailable (no wallet, or signing not delegated yet),
 * never a fabricated `$0.00`. Kept as a raw `className` size override
 * (see docs/DECISIONS.md for the caveats) — same treatment as before.
 * Deposit opens Privy's funding flow once a wallet exists; before that
 * it routes to sign-in like any gated action.
 */
function Header() {
  const navigation = useNavigation();
  const { canUseApp } = useAuth();
  const { isConnected } = useWallet();
  const balance = useWalletBalance();
  const { deposit } = useDeposit();
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const balanceLabel = balance.data?.usdc != null ? formatUsd(balance.data.usdc) : '—';

  const handleDeposit = async () => {
    if (!canUseApp || !isConnected) {
      navigation.navigate('Auth');
      return;
    }
    setDepositError(null);
    setIsDepositing(true);
    try {
      await deposit();
    } catch (depositFailure) {
      if (isUserCancelledFunding(depositFailure)) return; // closing Privy's modal is not a failure
      logDepositFailure(depositFailure);
      setDepositError(getDepositErrorMessage(depositFailure));
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <View className="border-b border-border px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-4xl font-bold">{balanceLabel}</Text>
        <Button
          label="Deposit"
          loading={isDepositing}
          onPress={handleDeposit}
          className="min-h-0 px-4 py-2"
        />
      </View>
      {depositError ? (
        <Text variant="caption" color="danger" className="mt-1">
          {depositError}
        </Text>
      ) : null}
    </View>
  );
}
