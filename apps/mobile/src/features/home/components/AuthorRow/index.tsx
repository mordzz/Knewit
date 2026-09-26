import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useFollowToggle } from '@/features/profile/hooks/useFollowToggle';
import type { User } from '@/types/social';

export interface AuthorRowProps {
  author: Pick<User, 'id' | 'displayName' | 'handle' | 'avatarUrl'>;
  onPress: () => void;
}

/**
 * Author header used on Post/Call Detail  avatar, name, handle, and a
 * live Follow/Following button. Fetches this author's profile itself
 * (`useProfile`) since Follow needs real, current per-viewer status
 * (`isFollowing`) that a `FeedItem.author` (just a `User`) doesn't
 * carry. Never shows Follow on the viewer's own author row  gated on
 * the server-computed `isSelf`, not a client-side id comparison (see
 * docs/DECISIONS.md).
 */
export function AuthorRow({ author, onPress }: AuthorRowProps) {
  const profile = useProfile(author.id);
  const toggleFollow = useFollowToggle();

  const isFollowing = profile.data?.isFollowing ?? false;

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={onPress}
        className="flex-1 flex-row items-center gap-3"
        accessibilityRole="button"
        accessibilityLabel={`Open ${author.displayName}'s profile`}
      >
        <Avatar uri={author.avatarUrl} fallbackLabel={author.displayName} size={44} />
        <View className="flex-1">
          <Text variant="bodyStrong" numberOfLines={1}>
            {author.displayName}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            @{author.handle}
          </Text>
        </View>
      </Pressable>

      {profile.status === 'success' && !profile.data.isSelf ? (
        <Button
          label={isFollowing ? 'Following' : 'Follow'}
          variant={isFollowing ? 'secondary' : 'primary'}
          loading={toggleFollow.isPending}
          onPress={() => toggleFollow.mutate({ userId: author.id, following: isFollowing })}
          accessibilityLabel={isFollowing ? 'Unfollow' : 'Follow'}
        />
      ) : null}
    </View>
  );
}
