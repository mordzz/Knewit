import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LeaderboardUserCard } from '@/features/leaderboard/components/LeaderboardUserCard';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { colors, typography } from '@/theme';
import type { LeaderboardEntry } from '@/types/leaderboard';

/**
 * Ranked by **Trading Volume only**  not PnL, ROI, or win rate. This
 * app's data model doesn't track position closure/settlement outcomes
 * yet, so any PnL-based metric would have to be estimated or guessed;
 * Volume is the one figure a backend can compute honestly from executed
 * orders alone  see docs/DECISIONS.md ("Leaderboard Metric: Volume,
 * Not PnL"). No period/category filter: the window is fixed at
 * all-time/overall (`ALL`/`OVERALL`), so a filter control would be exactly
 * the "kosmetik" filter the spec forbids.
 *
 * A read-only list, by request. Polymarket's users and this app's users are
 * two different populations, so there is no Global/Following switch (there
 * is no following scope), no Follow button on a row, and no tapping a row
 * to open a profile: a row is a ranked Polymarket trader identified by
 * proxy wallet, never a Knewit account (docs/DECISIONS.md, "Round 6:
 * Leaderboard Is a Read-Only Polymarket Ranking  No Follow, No Profile
 * Links"). The old "Your Rank" self-standing row is gone too  removed by
 * request, UI and backend alike (docs/DECISIONS.md, "Your Rank Removed
 * From the Leaderboard"), so this screen has no viewer-relative content at
 * all.
 *
 * Header is a bare page title (no subtitle) + a divider  see
 * docs/DECISIONS.md ("Decorated Top-3 Rank Numbers").
 */
export function LeaderboardScreen() {
  const leaderboard = useLeaderboard();

  const items = useMemo(
    () => leaderboard.data?.pages.flatMap((page) => page.items) ?? [],
    [leaderboard.data]
  );
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
        data={items}
        keyExtractor={(item) => item.user.id}
        renderItem={renderItem}
        ListHeaderComponent={<View className="pt-3" />}
        // Bottom clearance so the last row never sits flush against the
        // tab bar.
        contentContainerStyle={{ paddingBottom: 24 }}
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
