import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LeaderboardUserCard } from '@/features/leaderboard/components/LeaderboardUserCard';
import { YourRankCard } from '@/features/leaderboard/components/YourRankCard';
import { TopPerformers } from '@/features/leaderboard/components/TopPerformers';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { colors, typography } from '@/theme';
import type { LeaderboardEntry } from '@/types/leaderboard';

/**
 * Ranked by **Trading Volume only** — not PnL, ROI, or win rate. This
 * app's data model doesn't track position closure/settlement outcomes
 * yet, so any PnL-based metric would have to be estimated or guessed;
 * Volume is the one figure a backend can compute honestly from executed
 * orders alone — see docs/DECISIONS.md ("Leaderboard Metric: Volume,
 * Not PnL"). No period/category filter: the window is fixed at
 * all-time/overall (`ALL`/`OVERALL`), so a filter control would be exactly
 * the "kosmetik" filter the spec forbids.
 *
 * A read-only list, by request. Polymarket's users and this app's users are
 * two different populations, so there is no Global/Following switch (there
 * is no following scope), no Follow button on a row, and no tapping a row
 * to open a profile: a row is a ranked Polymarket trader identified by
 * proxy wallet, never a Knewit account (docs/DECISIONS.md, "Round 6:
 * Leaderboard Is a Read-Only Polymarket Ranking — No Follow, No Profile
 * Links"). The one personal element left is "Your Rank" — the viewer's own
 * live standing, read from their own wallet, rendered only when signed in
 * and only when their rank falls outside the podium.
 *
 * Header is a bare page title (no subtitle) + a divider — see
 * docs/DECISIONS.md ("Decorated Top-3 Rank Numbers"). "Your Rank" doesn't
 * render at all when signed out (no sign-in prompt in its place) — see
 * `YourRankCard`.
 */
export function LeaderboardScreen() {
  const { isAuthenticated } = useAuth();
  const leaderboard = useLeaderboard();

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
    ({ item }: { item: LeaderboardEntry }) => <LeaderboardUserCard entry={item} />,
    []
  );

  const titleBlock = (
    <View>
      <Text
        variant="heading"
        className="px-4 pb-3 pt-2 text-4xl"
        style={{ fontFamily: typography.family.extrabold }}
      >
        Leaderboard
      </Text>
      <Divider />
    </View>
  );

  // Rank #1-3 already have their own prominent slot in `TopPerformers`
  // just below — showing the exact same rank number again in "Your
  // Rank" right above it would be the same person's rank doubled on
  // screen at once. "Your Rank" only renders once the viewer's rank
  // falls outside the podium — see docs/DECISIONS.md ("Less
  // Transparent Glass", which also covers this).
  const showYourRank = isAuthenticated && (!currentUser || currentUser.rank > 3);

  const header = (
    <View className="gap-3 pt-3">
      {showYourRank ? (
        <View className="px-4">
          <YourRankCard self={currentUser} />
        </View>
      ) : null}
      {topThree ? <TopPerformers entries={topThree} /> : null}
    </View>
  );

  if (leaderboard.status === 'pending') {
    return (
      <Screen className="gap-0 px-0" edges={['top']}>
        {titleBlock}
        <View className="px-4 pt-3">
          <LoadingState rows={5} />
        </View>
      </Screen>
    );
  }

  if (leaderboard.status === 'error') {
    return (
      <Screen className="gap-0 px-0" edges={['top']}>
        {titleBlock}
        <ErrorState message="Unable to load leaderboard." onRetry={() => leaderboard.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen className="gap-0 px-0" edges={['top']}>
      {titleBlock}
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
            <EmptyState
              icon="trophy-outline"
              title="No leaderboard data yet"
              message="Polymarket's ranked traders will appear here when the ranking is available."
            />
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
