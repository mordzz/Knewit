import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/utils/cn';
import type { AppParamList } from '@/types/navigation';

type ProfileTab = 'posts' | 'calls';

const TAB_COPY: Record<ProfileTab, { title: string; message: string }> = {
  posts: { title: 'No posts yet', message: 'Commentary this user has posted will show up here.' },
  calls: {
    title: 'No Calls yet',
    message: 'Position-backed Calls this user has published will show up here.',
  },
};

/**
 * Viewing another user's profile — not the current user's own Profile
 * tab (`ProfileScreen.tsx`). No backend `GET /users/:id` exists yet
 * (docs/API.md), so this deliberately doesn't fabricate a name/avatar/
 * bio for `userId` — it shows the real layout shell honestly labeled as
 * a placeholder, same rule as every other unimplemented data source in
 * this app, rather than inventing a fake profile.
 */
export function UserProfileScreen() {
  const route = useRoute<RouteProp<AppParamList, 'UserProfile'>>();
  const [tab, setTab] = useState<ProfileTab>('calls');
  const { userId } = route.params;

  return (
    <Screen scroll className="gap-3 pt-4">
      <View className="flex-row items-start justify-between">
        <Avatar uri={null} fallbackLabel={userId} size={64} />
        <Button label="Follow" onPress={() => {}} className="mt-1" />
      </View>

      <View className="gap-0.5">
        <Text variant="title">User {userId}</Text>
        <Text variant="caption" color="textSecondary">
          Profile data isn&apos;t wired up yet
        </Text>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-row items-baseline gap-1">
          <Text variant="bodyStrong">0</Text>
          <Text variant="caption" color="textSecondary">
            Following
          </Text>
        </View>
        <View className="flex-row items-baseline gap-1">
          <Text variant="bodyStrong">0</Text>
          <Text variant="caption" color="textSecondary">
            Followers
          </Text>
        </View>
      </View>

      <Divider />

      <View className="flex-row gap-2">
        {(['calls', 'posts'] as const).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              className={cn(
                'rounded-full border px-3 py-1.5',
                active ? 'border-accent bg-accent-muted' : 'border-border'
              )}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text
                variant="caption"
                color={active ? 'accent' : 'textSecondary'}
                className="capitalize"
              >
                {key}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="py-4">
        <EmptyState title={TAB_COPY[tab].title} message={TAB_COPY[tab].message} />
      </View>
    </Screen>
  );
}
