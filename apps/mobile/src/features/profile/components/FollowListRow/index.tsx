import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useFollowToggle } from '@/features/profile/hooks/useFollowToggle';
import type { FollowListItem } from '@/types/social';

export interface FollowListRowProps {
  item: FollowListItem;
  onPress: () => void;
}

/** One row of a Followers/Following list  avatar, name, handle, and a
 * live Follow/Following button (hidden on the viewer's own row). */
export function FollowListRow({ item, onPress }: FollowListRowProps) {
  const toggleFollow = useFollowToggle();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-surface"
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.user.displayName}'s profile`}
    >
      <Avatar uri={item.user.avatarUrl} fallbackLabel={item.user.displayName} size={44} />
      <View className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {item.user.displayName}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          @{item.user.handle}
        </Text>
      </View>
      {!item.isSelf ? (
        <Button
          label={item.isFollowing ? 'Following' : 'Follow'}
          variant={item.isFollowing ? 'secondary' : 'primary'}
          loading={toggleFollow.isPending}
          onPress={() => toggleFollow.mutate({ userId: item.user.id, following: item.isFollowing })}
          accessibilityLabel={item.isFollowing ? 'Unfollow' : 'Follow'}
        />
      ) : null}
    </Pressable>
  );
}
