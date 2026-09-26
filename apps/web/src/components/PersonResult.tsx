import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import type { User } from '@/types/social';

export interface PersonResultProps {
  user: User;
  onPress: () => void;
}

/**
 * Web equivalent of `apps/mobile/src/features/search/components/PersonResult`
 *  compact person row: avatar, display name, handle. No bio, follower
 * count, or verified badge  none exist in the data model yet.
 */
export function PersonResult({ user, onPress }: PersonResultProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={`Open profile: ${user.displayName}, @${user.handle}`}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-surface"
    >
      <Avatar uri={user.avatarUrl} fallbackLabel={user.displayName} size={44} />
      <div className="min-w-0 flex-1">
        <Text variant="bodyStrong" numberOfLines={1} className="block truncate">
          {user.displayName}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1} className="block truncate">
          @{user.handle}
        </Text>
      </div>
    </button>
  );
}
