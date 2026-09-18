import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useFollowToggle } from '@/hooks/useFollowToggle';
import type { FollowListItem } from '@/types/social';

export interface FollowListRowProps {
  item: FollowListItem;
  onPress: () => void;
}

/**
 * Web equivalent of `apps/mobile/src/features/profile/components/FollowListRow`
 * — one row of a Followers/Following list: avatar, name, handle, and a
 * live Follow/Following button (hidden on the viewer's own row).
 */
export function FollowListRow({ item, onPress }: FollowListRowProps) {
  const toggleFollow = useFollowToggle();

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-surface">
      <button type="button" onClick={onPress} className="flex flex-1 items-center gap-3 text-left">
        <Avatar uri={item.user.avatarUrl} fallbackLabel={item.user.displayName} size={44} />
        <div className="min-w-0 flex-1">
          <Text variant="bodyStrong" numberOfLines={1} className="block truncate">
            {item.user.displayName}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1} className="block truncate">
            @{item.user.handle}
          </Text>
        </div>
      </button>
      {!item.isSelf ? (
        <Button
          label={item.isFollowing ? 'Following' : 'Follow'}
          variant={item.isFollowing ? 'secondary' : 'primary'}
          loading={toggleFollow.isPending}
          onClick={() => toggleFollow.mutate({ userId: item.user.id, following: item.isFollowing })}
        />
      ) : null}
    </div>
  );
}
