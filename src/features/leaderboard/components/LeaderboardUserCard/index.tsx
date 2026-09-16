import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { RankNumber } from '@/features/leaderboard/components/RankNumber';
import { useFollowToggle } from '@/features/profile/hooks/useFollowToggle';
import { formatUsd } from '@/utils/formatCurrency';
import type { LeaderboardEntry } from '@/types/leaderboard';

const METRIC_LABEL: Record<LeaderboardEntry['metric']['name'], string> = {
  volume: 'Trading Volume',
};

export interface LeaderboardUserCardProps {
  entry: LeaderboardEntry;
  onPress: () => void;
}

/**
 * A plain divided row — same convention as `FollowListRow`/`CallCard`
 * (`border-b border-border px-4 py-3`, no card/blur) rather than a
 * glass card per row, so a long ranked list reads as one coherent list
 * instead of a stack of individual boxes — see docs/DECISIONS.md
 * ("Glass Surfaces Reserved for Overlays Only"). `isFollowing`/`isSelf`
 * come from the leaderboard response itself (server-computed, see
 * docs/DECISIONS.md), not a per-row profile fetch — avoids an N+1
 * request pattern across a page of dozens of rows. Follow state after
 * a toggle is kept in sync here by `useFollowToggle` itself (it patches
 * every cached `['leaderboard', ...]` entry) — this component doesn't
 * need its own cache-patch logic.
 */
export function LeaderboardUserCard({ entry, onPress }: LeaderboardUserCardProps) {
  const toggleFollow = useFollowToggle();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-surface"
      accessibilityRole="button"
      accessibilityLabel={`Rank ${entry.rank}, ${entry.user.displayName}, ${METRIC_LABEL[entry.metric.name]} ${formatUsd(entry.metric.value)}`}
    >
      <RankNumber rank={entry.rank} />
      <Avatar uri={entry.user.avatarUrl} fallbackLabel={entry.user.displayName} size={44} />
      <View className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {entry.user.displayName}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          @{entry.user.handle}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="bodyStrong">{formatUsd(entry.metric.value)}</Text>
        <Text variant="micro" color="textTertiary">
          {METRIC_LABEL[entry.metric.name]}
        </Text>
      </View>
      {!entry.isSelf ? (
        <Button
          label={entry.isFollowing ? 'Following' : 'Follow'}
          variant={entry.isFollowing ? 'secondary' : 'primary'}
          loading={toggleFollow.isPending}
          onPress={() =>
            toggleFollow.mutate({ userId: entry.user.id, following: entry.isFollowing })
          }
          accessibilityLabel={entry.isFollowing ? 'Unfollow' : 'Follow'}
        />
      ) : null}
    </Pressable>
  );
}
