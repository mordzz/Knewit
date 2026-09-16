import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CallCard } from '@/features/home/components/CallCard';
import { ActivityRow } from '@/features/profile/components/ActivityRow';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useFollowToggle } from '@/features/profile/hooks/useFollowToggle';
import { useUserPosts } from '@/features/profile/hooks/useUserPosts';
import { useUserCalls } from '@/features/profile/hooks/useUserCalls';
import { useUserActivity } from '@/features/profile/hooks/useUserActivity';
import { usePositions } from '@/features/portfolio/hooks/usePositions';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { ApiRequestError } from '@/services/api/client';
import { formatCompactNumber } from '@/utils/formatNumber';
import { formatPrice, formatUsd } from '@/utils/formatCurrency';
import type { FeedItem } from '@/types/social';
import type { ActivityItem } from '@/types/activity';
import type { AppParamList } from '@/types/navigation';

type ProfileTab = 'posts' | 'calls' | 'activity';

const PROFILE_TAB_OPTIONS: TabRowOption<ProfileTab>[] = [
  { key: 'calls', label: 'Calls' },
  { key: 'posts', label: 'Posts' },
  { key: 'activity', label: 'Activity' },
];

/**
 * The one Profile route/screen for both the viewer's own profile and
 * anyone else's — see docs/DECISIONS.md ("One Profile Route/Screen for
 * Self and Other Users"). `route.params?.userId` absent means "my own"
 * (`useProfile` resolves this via the literal `"me"` id — see
 * docs/API.md); present means viewing that specific user. Every
 * viewer-relative fact (`isSelf`, `isFollowing`) is server-computed —
 * see docs/DECISIONS.md, Sprint 9's original rule, still in force here.
 */
export function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppParamList, 'Profile'>>();
  const userId = route.params?.userId;
  const targetId = userId ?? 'me';
  const { isAuthenticated } = useAuth();
  const { isConnected: walletConnected } = useWallet();
  const [tab, setTab] = useState<ProfileTab>('calls');

  const isOwnProfileRoute = userId === undefined;
  const needsSignIn = isOwnProfileRoute && !isAuthenticated;

  const profile = useProfile(userId, !needsSignIn);
  const toggleFollow = useFollowToggle();
  const posts = useUserPosts(targetId, tab === 'posts' && profile.status === 'success');
  const calls = useUserCalls(targetId, tab === 'calls' && profile.status === 'success');
  const activity = useUserActivity(targetId, tab === 'activity' && profile.status === 'success');
  const positions = usePositions();

  const openAuthor = (id: string) => navigation.navigate('Profile', { userId: id });
  const openMarket = (marketId: string) => navigation.navigate('MarketDetail', { marketId });
  const openPost = (postId: string) => navigation.navigate('PostDetail', { postId });

  if (needsSignIn) {
    return (
      <Screen className="gap-3 pt-4">
        <Text variant="heading">Profile</Text>
        <EmptyState
          icon="person-outline"
          title="Sign in to see your profile"
          message="Your Calls, followers, and activity will live here."
          actionLabel="Connect Wallet"
          onAction={() => navigation.navigate('Auth')}
        />
      </Screen>
    );
  }

  const isNotFound =
    profile.status === 'error' &&
    profile.error instanceof ApiRequestError &&
    profile.error.status === 404;

  if (profile.status === 'pending') {
    return (
      <Screen className="gap-3 pt-4">
        <LoadingState rows={3} />
      </Screen>
    );
  }

  if (profile.status === 'error' && isNotFound) {
    return (
      <Screen className="gap-3 pt-4">
        <EmptyState
          icon="person-outline"
          title="User not found"
          message="This profile may have been removed or the link is incorrect."
        />
      </Screen>
    );
  }

  if (profile.status === 'error') {
    return (
      <Screen className="gap-3 pt-4">
        <ErrorState message="Unable to load profile." onRetry={() => profile.refetch()} />
      </Screen>
    );
  }

  const user = profile.data;

  // Read each active-tab value through its own ternary branch, rather
  // than selecting one polymorphic `activeQuery` object up front and
  // calling methods on it — `posts`/`calls` (FeedItem pages) and
  // `activity` (ActivityItem pages) are differently-typed
  // `UseInfiniteQueryResult`s, and TypeScript doesn't distribute method
  // calls (e.g. `.data.pages.flatMap`) correctly across that kind of
  // union — see docs/DECISIONS.md.
  const items: (FeedItem | ActivityItem)[] =
    tab === 'activity'
      ? (activity.data?.pages.flatMap((page) => page.items) ?? [])
      : tab === 'calls'
        ? (calls.data?.pages.flatMap((page) => page.items) ?? [])
        : (posts.data?.pages.flatMap((page) => page.items) ?? []);
  const activeStatus =
    tab === 'activity' ? activity.status : tab === 'calls' ? calls.status : posts.status;
  const activeHasNextPage =
    tab === 'activity'
      ? activity.hasNextPage
      : tab === 'calls'
        ? calls.hasNextPage
        : posts.hasNextPage;
  const activeIsFetchingNextPage =
    tab === 'activity'
      ? activity.isFetchingNextPage
      : tab === 'calls'
        ? calls.isFetchingNextPage
        : posts.isFetchingNextPage;
  const fetchNextActivePage = () => {
    if (tab === 'activity') activity.fetchNextPage();
    else if (tab === 'calls') calls.fetchNextPage();
    else posts.fetchNextPage();
  };
  const refetchActive = () => {
    if (tab === 'activity') activity.refetch();
    else if (tab === 'calls') calls.refetch();
    else posts.refetch();
  };

  const header = (
    <View className="gap-3 px-4 pb-3 pt-4">
      <View className="flex-row items-start justify-between">
        <Avatar uri={user.avatarUrl} fallbackLabel={user.displayName} size={64} />
        {user.isSelf ? (
          <Button
            label="Edit Profile"
            variant="secondary"
            onPress={() => navigation.navigate('EditProfile')}
            className="mt-1"
          />
        ) : (
          <Button
            label={user.isFollowing ? 'Following' : 'Follow'}
            variant={user.isFollowing ? 'secondary' : 'primary'}
            loading={toggleFollow.isPending}
            onPress={() => toggleFollow.mutate({ userId: user.id, following: user.isFollowing })}
            className="mt-1"
            accessibilityLabel={user.isFollowing ? 'Unfollow' : 'Follow'}
          />
        )}
      </View>

      <View className="gap-0.5">
        <Text variant="title">{user.displayName}</Text>
        <Text variant="caption" color="textSecondary">
          @{user.handle}
        </Text>
      </View>

      <Text variant="body" color="textSecondary">
        {user.bio ?? 'No bio yet.'}
      </Text>

      <View className="flex-row gap-4">
        <Pressable
          onPress={() => navigation.navigate('Following', { userId: user.id })}
          className="flex-row items-baseline gap-1"
          accessibilityRole="button"
          accessibilityLabel={`${user.followingCount} following`}
        >
          <Text variant="bodyStrong">{formatCompactNumber(user.followingCount)}</Text>
          <Text variant="caption" color="textSecondary">
            Following
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Followers', { userId: user.id })}
          className="flex-row items-baseline gap-1"
          accessibilityRole="button"
          accessibilityLabel={`${user.followerCount} followers`}
        >
          <Text variant="bodyStrong">{formatCompactNumber(user.followerCount)}</Text>
          <Text variant="caption" color="textSecondary">
            Followers
          </Text>
        </Pressable>
      </View>

      {user.isSelf ? (
        <Pressable
          onPress={() => navigation.navigate('Wallet')}
          className="flex-row items-center gap-3 rounded-xl border border-border p-3 active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel="Open Wallet"
        >
          <Icon name="wallet-outline" color="accent" />
          <View className="flex-1">
            <Text variant="bodyStrong">Wallet</Text>
            <Text variant="caption" color="textSecondary">
              Connection status and wallet address
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="textTertiary" />
        </Pressable>
      ) : user.walletAddress ? (
        <Card contentClassName="gap-1">
          <Text variant="caption" color="textSecondary">
            Wallet
          </Text>
          <WalletAddress address={user.walletAddress} />
        </Card>
      ) : null}

      {user.tradingVolume != null ? (
        <Card contentClassName="gap-2">
          <Text variant="bodyStrong">Trading Performance</Text>
          <View className="flex-row justify-between">
            <StatColumn label="Trading Volume" value={formatUsd(user.tradingVolume)} />
            <StatColumn label="Calls" value={String(user.callCount)} />
            <StatColumn label="Posts" value={String(user.postCount)} />
          </View>
        </Card>
      ) : null}

      {user.leaderboardRank != null ? (
        <Pressable
          onPress={() => navigation.navigate('Main', { screen: 'LeaderboardTab' })}
          className="flex-row items-center justify-between rounded-xl border border-border p-3 active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel={`Leaderboard rank ${user.leaderboardRank}`}
        >
          <Text variant="bodyStrong">Leaderboard Rank</Text>
          <Text variant="bodyStrong" color="accent">
            #{user.leaderboardRank}
          </Text>
        </Pressable>
      ) : null}

      {user.isSelf &&
      walletConnected &&
      positions.status === 'success' &&
      positions.data.length > 0 ? (
        <Card contentClassName="gap-2">
          <Text variant="bodyStrong">Wallet Activity</Text>
          {positions.data.map((position) => (
            <View key={position.id} className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  variant="caption"
                  color={position.outcome === 'YES' ? 'yes' : 'no'}
                  className="mb-0.5"
                >
                  {position.outcome}
                </Text>
                <Text variant="caption" numberOfLines={1}>
                  {position.marketQuestion}
                </Text>
              </View>
              <View className="items-end">
                <Text variant="caption">
                  {formatUsd((position.entryPrice / 100) * position.size)}
                </Text>
                <Text variant="micro" color="textTertiary">
                  Entry {formatPrice(position.entryPrice)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <Divider />

      <TabRow options={PROFILE_TAB_OPTIONS} value={tab} onChange={setTab} />
    </View>
  );

  return (
    <Screen className="gap-0 px-0" edges={['top']}>
      <FlatList<FeedItem | ActivityItem>
        className="flex-1"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          tab === 'activity' ? (
            <ActivityRow
              item={item as ActivityItem}
              onOpenPost={openPost}
              onOpenMarket={openMarket}
              onOpenUser={openAuthor}
            />
          ) : (
            <CallCard
              item={item as FeedItem}
              onOpenAuthor={openAuthor}
              onOpenMarket={openMarket}
              onOpenPost={openPost}
            />
          )
        }
        ListHeaderComponent={header}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (activeHasNextPage && !activeIsFetchingNextPage) {
            fetchNextActivePage();
          }
        }}
        ListEmptyComponent={
          activeStatus === 'pending' ? (
            <View className="px-4">
              <LoadingState rows={3} />
            </View>
          ) : activeStatus === 'error' ? (
            <View className="px-4">
              <ErrorState message={`Unable to load ${tab}.`} onRetry={refetchActive} />
            </View>
          ) : (
            <EmptyState
              title={
                tab === 'posts'
                  ? 'No posts yet'
                  : tab === 'calls'
                    ? 'No Calls yet'
                    : 'No activity yet'
              }
              message={
                tab === 'posts'
                  ? 'Commentary this user has posted will show up here.'
                  : tab === 'calls'
                    ? 'Position-backed Calls this user has published will show up here.'
                    : 'Trades, Calls, Posts, and follows will show up here.'
              }
            />
          )
        }
        ListFooterComponent={
          activeIsFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center gap-0.5">
      <Text variant="bodyStrong">{value}</Text>
      <Text variant="micro" color="textTertiary">
        {label}
      </Text>
    </View>
  );
}
