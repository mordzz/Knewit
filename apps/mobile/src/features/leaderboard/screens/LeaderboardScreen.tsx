import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Divider } from '@/components/ui/Divider';
import { FAB } from '@/components/ui/FAB';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LeaderboardUserCard } from '@/features/leaderboard/components/LeaderboardUserCard';
import { YourRankCard } from '@/features/leaderboard/components/YourRankCard';
import { TopPerformers } from '@/features/leaderboard/components/TopPerformers';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { colors, typography, spacing } from '@/theme';
import type { LeaderboardEntry, LeaderboardScope } from '@/types/leaderboard';

const SCOPE_OPTIONS: { key: LeaderboardScope; label: string }[] = [
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
 *
 * Header is a bare page title (no subtitle) + a divider — see
 * docs/DECISIONS.md ("Decorated Top-3 Rank Numbers"). The Global/
 * Following scope switch moved out of an always-visible `TabRow` into a
 * screen-local FAB (`LeaderboardFilterFab` below) that opens a
 * `BottomSheet` — a filter control scoped to this screen only, not the
 * global cross-tab Create FAB. "Your Rank" doesn't render at all when
 * signed out (no sign-in prompt in its place) — see `YourRankCard`.
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
      <LeaderboardUserCard entry={item} onPress={() => openUser(item.user.id)} />
    ),
    [openUser]
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
  const showYourRank =
    isAuthenticated && scope === 'global' && (!currentUser || currentUser.rank > 3);

  const header = (
    <View className="gap-3 pt-3">
      {showYourRank ? (
        <View className="px-4">
          <YourRankCard self={currentUser} />
        </View>
      ) : null}
      {topThree ? <TopPerformers entries={topThree} onPressUser={openUser} /> : null}
    </View>
  );

  if (leaderboard.status === 'pending') {
    return (
      <Screen className="gap-0 px-0" edges={['top']}>
        {titleBlock}
        <View className="px-4 pt-3">
          <LoadingState rows={5} />
        </View>
        <LeaderboardFilterFab scope={scope} onChangeScope={setScope} />
      </Screen>
    );
  }

  if (leaderboard.status === 'error') {
    return (
      <Screen className="gap-0 px-0" edges={['top']}>
        {titleBlock}
        <ErrorState message="Unable to load leaderboard." onRetry={() => leaderboard.refetch()} />
        <LeaderboardFilterFab scope={scope} onChangeScope={setScope} />
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
      <LeaderboardFilterFab scope={scope} onChangeScope={setScope} />
    </Screen>
  );
}

/**
 * The Global/Following switch, as a screen-local FAB + `BottomSheet`
 * rather than an always-visible `TabRow` — "like the FAB, but scoped to
 * this screen only," not the global cross-tab Create FAB (which only
 * ever shows on Home) — see docs/DECISIONS.md.
 */
function LeaderboardFilterFab({
  scope,
  onChangeScope,
}: {
  scope: LeaderboardScope;
  onChangeScope: (scope: LeaderboardScope) => void;
}) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <FAB
        icon="options-outline"
        accessibilityLabel="Filter leaderboard"
        onPress={() => setVisible(true)}
        className="absolute right-6"
        style={{ bottom: insets.bottom + spacing.md }}
      />
      <BottomSheet visible={visible} onClose={() => setVisible(false)}>
        <View className="gap-3">
          <Text variant="heading">Filter</Text>
          {SCOPE_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => {
                onChangeScope(option.key);
                setVisible(false);
              }}
              className="flex-row items-center justify-between rounded-xl border border-border p-3 active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: scope === option.key }}
            >
              <Text variant="bodyStrong">{option.label}</Text>
              {scope === option.key ? <Icon name="checkmark" size={18} color="accent" /> : null}
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </>
  );
}
