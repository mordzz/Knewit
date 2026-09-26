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
 * Web equivalent of `apps/mobile/src/features/home/components/AuthorRow`
 *  author header used on Post/Call Detail: avatar, name, handle, and a
 * live Follow/Following button. Fetches this author's own profile for
 * real, current `isFollowing`/`isSelf`.
 */
export function AuthorRow({ author, onPress }: AuthorRowProps) {
  const profile = useProfile(author.id);
  const toggleFollow = useFollowToggle();

  const isFollowing = profile.data?.isFollowing ?? false;

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onPress} className="flex flex-1 items-center gap-3 text-left">
        <Avatar uri={author.avatarUrl} fallbackLabel={author.displayName} size={44} />
        <div className="min-w-0 flex-1">
          <Text variant="bodyStrong" numberOfLines={1} className="block truncate">
            {author.displayName}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1} className="block truncate">
            @{author.handle}
          </Text>
        </div>
      </button>

      {profile.status === 'success' && !profile.data.isSelf ? (
        <Button
          label={isFollowing ? 'Following' : 'Follow'}
          variant={isFollowing ? 'secondary' : 'primary'}
          loading={toggleFollow.isPending}
          className="lg:min-h-0 lg:px-4 lg:py-2"
          onClick={() => toggleFollow.mutate({ userId: author.id, following: isFollowing })}
        />
      ) : null}
    </div>
  );
}
