import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CallCard } from '@/features/home/components/CallCard';
import { ActivityRow } from '@/features/profile/components/ActivityRow';
import { ProfileReplyRow } from '@/features/profile/components/ProfileReplyRow';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useFollowToggle } from '@/features/profile/hooks/useFollowToggle';
import { useUserReplies } from '@/features/profile/hooks/useUserReplies';
import { useUserCalls } from '@/features/profile/hooks/useUserCalls';
import { useUserActivity } from '@/features/profile/hooks/useUserActivity';
import { usePositions } from '@/features/portfolio/hooks/usePositions';
import { navigateToMarketDetail } from '@/features/markets/utils/openMarketDetail';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { ApiRequestError } from '@/services/api/client';
import { formatCompactNumber } from '@/utils/formatNumber';
import { formatPrice, formatUsd } from '@/utils/formatCurrency';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import type { CommentItem, FeedItem, MarketSummary } from '@/types/social';
import type { ActivityItem } from '@/types/activity';
import type { AppParamList } from '@/types/navigation';

type ProfileTab = 'replies' | 'calls' | 'activity';

const PROFILE_TAB_OPTIONS: TabRowOption<ProfileTab>[] = [
  { key: 'calls', label: 'Calls' },
  { key: 'replies', label: 'Replies' },
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
  const [settingsVisible, setSettingsVisible] = useState(false);

  const profile = useProfile(userId, !needsSignIn);
  const toggleFollow = useFollowToggle();
  const replies = useUserReplies(targetId, tab === 'replies' && profile.status === 'success');
  const calls = useUserCalls(targetId, tab === 'calls' && profile.status === 'success');
  const activity = useUserActivity(targetId, tab === 'activity' && profile.status === 'success');
  const positions = usePositions();

  const openAuthor = (id: string) => navigation.navigate('Profile', { userId: id });
  const openMarket = (market: MarketSummary) => navigateToMarketDetail(navigation, market);
  // Activity rows only carry a market id (no parent-event info), so they
  // still open that market directly.
  const openActivityMarket = (marketId: string) =>
    navigation.navigate('MarketDetail', { marketId });
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
  // calling methods on it — `calls` (FeedItem pages), `replies`
  // (CommentItem pages), and `activity` (ActivityItem pages) are
  // differently-typed `UseInfiniteQueryResult`s, and TypeScript doesn't
  // distribute method calls (e.g. `.data.pages.flatMap`) correctly
  // across that kind of union — see docs/DECISIONS.md.
  const items: (FeedItem | CommentItem | ActivityItem)[] =
    tab === 'activity'
      ? (activity.data?.pages.flatMap((page) => page.items) ?? [])
      : tab === 'calls'
        ? (calls.data?.pages.flatMap((page) => page.items) ?? [])
        : (replies.data?.pages.flatMap((page) => page.items) ?? []);
  const activeStatus =
    tab === 'activity' ? activity.status : tab === 'calls' ? calls.status : replies.status;
  const activeHasNextPage =
    tab === 'activity'
      ? activity.hasNextPage
      : tab === 'calls'
        ? calls.hasNextPage
        : replies.hasNextPage;
  const activeIsFetchingNextPage =
    tab === 'activity'
      ? activity.isFetchingNextPage
      : tab === 'calls'
        ? calls.isFetchingNextPage
        : replies.isFetchingNextPage;
  const fetchNextActivePage = () => {
    if (tab === 'activity') activity.fetchNextPage();
    else if (tab === 'calls') calls.fetchNextPage();
    else replies.fetchNextPage();
  };
  const refetchActive = () => {
    if (tab === 'activity') activity.refetch();
    else if (tab === 'calls') calls.refetch();
    else replies.refetch();
  };

  const header = (
    <View className="gap-3 px-4 pb-3 pt-4">
      <View className="flex-row items-start justify-between">
        <Avatar uri={user.avatarUrl} fallbackLabel={user.displayName} size={64} />
        {user.isSelf ? (
          <Pressable
            onPress={() => setSettingsVisible(true)}
            className="mt-1 h-10 w-10 items-center justify-center rounded-full border border-border"
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Icon name="settings-outline" size={20} color="textSecondary" />
          </Pressable>
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
          className="flex-row items-center gap-3 border-b border-border py-3 active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel="Open Wallet"
        >
          <Icon name="wallet-outline" color="accent" />
          <View className="flex-1">
            <Text variant="bodyStrong">Wallet</Text>
            <Text variant="caption" color="textSecondary">
              Address, positions, and PnL
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="textTertiary" />
        </Pressable>
      ) : user.walletAddress ? (
        <View className="gap-1 border-b border-border py-3">
          <Text variant="caption" color="textSecondary">
            Wallet
          </Text>
          <WalletAddress address={user.walletAddress} />
        </View>
      ) : null}

      {user.tradingVolume != null ? (
        <View className="gap-2 border-b border-border py-3">
          <Text variant="bodyStrong">Trading Performance</Text>
          <View className="flex-row justify-between">
            <StatColumn label="Trading Volume" value={formatUsd(user.tradingVolume)} />
            <StatColumn label="Calls" value={String(user.callCount)} />
          </View>
        </View>
      ) : null}

      {user.leaderboardRank != null ? (
        <Pressable
          onPress={() => navigation.navigate('Main', { screen: 'LeaderboardTab' })}
          className="flex-row items-center justify-between border-b border-border py-3 active:opacity-90"
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
        <View className="gap-2 border-b border-border py-3">
          <Text variant="bodyStrong">Wallet Activity</Text>
          {positions.data.map((position) => (
            <View key={position.id} className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  variant="caption"
                  color={choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }))}
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
        </View>
      ) : null}

      <Divider />

      <TabRow options={PROFILE_TAB_OPTIONS} value={tab} onChange={setTab} />
    </View>
  );

  return (
    <Screen className="gap-0 px-0" edges={['top']}>
      <FlatList<FeedItem | CommentItem | ActivityItem>
        className="flex-1"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          tab === 'activity' ? (
            <ActivityRow
              item={item as ActivityItem}
              onOpenPost={openPost}
              onOpenMarket={openActivityMarket}
              onOpenUser={openAuthor}
            />
          ) : tab === 'replies' ? (
            <ProfileReplyRow item={item as CommentItem} onOpenPost={openPost} />
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
                tab === 'replies'
                  ? 'No replies yet'
                  : tab === 'calls'
                    ? 'No Calls yet'
                    : 'No activity yet'
              }
              message={
                tab === 'replies'
                  ? 'Comments this user has made on Posts and Calls will show up here.'
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

      <BottomSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)}>
        <View className="gap-3">
          <Text variant="heading">Settings</Text>
          <SettingsRow
            icon="person-outline"
            label="Edit Profile"
            onPress={() => {
              setSettingsVisible(false);
              navigation.navigate('EditProfile');
            }}
          />
          <SettingsRow
            icon="wallet-outline"
            label="Wallet"
            onPress={() => {
              setSettingsVisible(false);
              navigation.navigate('Wallet');
            }}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

/**
 * Deliberately minimal — "Edit Profile" and "Wallet" are the only real
 * destinations this app has today. Adding more rows here just to make
 * the sheet look fuller would be inventing settings that don't exist
 * yet — same "don't invent infrastructure a sprint doesn't need"
 * principle as `EditProfileScreen`'s own scope (display name/bio only)
 * — see docs/DECISIONS.md.
 */
function SettingsRow({
  icon,
  label,
  onPress,
}: {
  icon: 'person-outline' | 'wallet-outline';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border p-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} color="accent" />
      <Text variant="bodyStrong" className="flex-1">
        {label}
      </Text>
      <Icon name="chevron-forward" size={18} color="textTertiary" />
    </Pressable>
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
