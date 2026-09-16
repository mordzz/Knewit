import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LeaderboardUserCard } from '@/features/leaderboard/components/LeaderboardUserCard';
import { YourRankCard } from '@/features/leaderboard/components/YourRankCard';
import { TopPerformers } from '@/features/leaderboard/components/TopPerformers';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';
import type { LeaderboardEntry, LeaderboardScope } from '@/types/leaderboard';

const SCOPE_OPTIONS: TabRowOption<LeaderboardScope>[] = [
  { key: 'global', label: 'Global' },
  { key: 'following', label: 'Following' },
];

/**
 * Ranked by **Trading Volume only** — not PnL, ROI, or win rate. This
 * app's data model doesn't track position closure/settlement outcomes
 * yet, so any PnL-based metric would have to be estimated or guessed;
 * Volume is the one figure a backend can compute honestly from executed
 * orders alone — see docs/DECISIONS.md ("Leaderboard Metric: Volume,
 * Not PnL"). No period/category filter: this app has no historical
 * time-series or category-tagged trading data to filter by yet, and a
 * filter that doesn't actually filter anything would be exactly the
 * "kosmetik" filter the spec forbids.
 */
export function LeaderboardScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const leaderboard = useLeaderboard(scope);

  const openUser = useCallback(
    (userId: string) => navigation.navigate('Profile', { userId }),
    [navigation]
  );

  const items = useMemo(
    () => leaderboard.data?.pages.flatMap((page) => page.items) ?? [],
    [leaderboard.data]
  );
  const currentUser = leaderboard.data?.pages[0]?.currentUser;
  const topThree =
    items.length >= 3
      ? (items.slice(0, 3) as [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry])
      : null;
  const rest = topThree ? items.slice(3) : items;

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <View className="mb-2 px-4">
        <LeaderboardUserCard entry={item} onPress={() => openUser(item.user.id)} />
      </View>
    ),
    [openUser]
  );

  const header = (
    <View className="gap-3 px-4 pb-3">
      <View className="gap-1">
        <Text variant="heading">Leaderboard</Text>
        <Text variant="caption" color="textSecondary">
          See how the community is performing.
        </Text>
      </View>

      <TabRow options={SCOPE_OPTIONS} value={scope} onChange={setScope} />

      <View className="flex-row items-center gap-1.5">
        <Text variant="caption" color="textTertiary">
          Period:
        </Text>
        <Text variant="caption" color="textSecondary">
          All Time
        </Text>
      </View>

      {scope === 'global' ? (
        <YourRankCard isAuthenticated={isAuthenticated} self={currentUser} />
      ) : null}

      {topThree ? <TopPerformers entries={topThree} onPressUser={openUser} /> : null}
    </View>
  );

  if (leaderboard.status === 'pending') {
    return (
      <Screen className="gap-0 px-0" edges={['top']}>
        {header}
        <View className="px-4">
          <LoadingState rows={5} />
        </View>
      </Screen>
    );
  }

  if (leaderboard.status === 'error') {
    return (
      <Screen className="gap-0 px-0" edges={['top']}>
        {header}
        <ErrorState message="Unable to load leaderboard." onRetry={() => leaderboard.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen className="gap-0 px-0" edges={['top']}>
      <FlatList
        className="flex-1"
        data={rest}
        keyExtractor={(item) => item.user.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (leaderboard.hasNextPage && !leaderboard.isFetchingNextPage) {
            leaderboard.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          <View className="px-4">
            {scope === 'following' ? (
              <EmptyState
                icon="trophy-outline"
                title="No followed traders yet"
                message="Follow traders to see their activity here."
              />
            ) : (
              <EmptyState
                icon="trophy-outline"
                title="No leaderboard data yet"
                message="Trading activity will appear here when reliable performance data is available."
              />
            )}
          </View>
        }
        ListFooterComponent={
          leaderboard.isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
