import { Pressable, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import type { User } from '@/types/social';

export interface PersonResultProps {
  user: User;
  onPress: () => void;
}

/**
 * Compact person row for search results — avatar, display name,
 * handle. Deliberately doesn't show a bio snippet, follower count, or
 * verified badge: none of those exist in the data model yet
 * (`Profile`/`UserProfileScreen` show the same honest placeholders),
 * and fabricating them here would contradict this project's standing
 * "never present fabricated data as real" rule — see
 * docs/DECISIONS.md. Never renders `user.walletAddress`.
 */
export function PersonResult({ user, onPress }: PersonResultProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-surface"
      accessibilityRole="button"
      accessibilityLabel={`Open profile: ${user.displayName}, @${user.handle}`}
    >
      <Avatar uri={user.avatarUrl} fallbackLabel={user.displayName} size={44} />
      <View className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          @{user.handle}
        </Text>
      </View>
    </Pressable>
  );
}
