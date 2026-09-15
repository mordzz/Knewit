import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

type ProfileTab = 'posts' | 'calls' | 'activity';

const TAB_COPY: Record<ProfileTab, { title: string; message: string }> = {
  posts: { title: 'No posts yet', message: 'Commentary you post will show up here.' },
  calls: { title: 'No Calls yet', message: 'Position-backed Calls you publish will show up here.' },
  activity: {
    title: 'No activity yet',
    message: 'Likes, follows, and other activity will show up here.',
  },
};

/**
 * X-style social profile — identity (avatar, name, handle, bio,
 * follower counts) + content tabs, plus a link into Portfolio for
 * wallet/trading visibility (Portfolio has no bottom tab of its own —
 * see docs/DECISIONS.md). Bio/follower counts are honest placeholders
 * (no backend `User` fields for them yet), not fabricated numbers.
 */
export function ProfileScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState<ProfileTab>('calls');

  if (!isAuthenticated) {
    return (
      <Screen className="gap-3 pt-4">
        <Text variant="heading">Profile</Text>
        <EmptyState
          icon="person-outline"
          title="Sign in to see your profile"
          message="Your Calls, followers, and activity will live here."
          actionLabel="Connect Wallet"
          onAction={() => navigation.navigate('Auth')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll className="gap-3 pt-4">
      <View className="flex-row items-start justify-between">
        <Avatar uri={user?.avatarUrl} fallbackLabel={user?.displayName ?? '?'} size={64} />
        <Button label="Edit Profile" variant="secondary" onPress={() => {}} className="mt-1" />
      </View>

      <View className="gap-0.5">
        <Text variant="title">{user?.displayName}</Text>
        <Text variant="caption" color="textSecondary">
          @{user?.handle}
        </Text>
      </View>

      <Text variant="body" color="textSecondary">
        No bio yet.
      </Text>

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

      <Pressable
        onPress={() => navigation.navigate('Portfolio')}
        className="flex-row items-center gap-3 rounded-xl border border-border p-3 active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel="Open Portfolio and wallet activity"
      >
        <Icon name="wallet-outline" color="accent" />
        <View className="flex-1">
          <Text variant="bodyStrong">Wallet & Trading</Text>
          <Text variant="caption" color="textSecondary">
            Positions, PnL, and transaction history
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color="textTertiary" />
      </Pressable>

      <Divider />

      <View className="flex-row gap-2">
        {(['posts', 'calls', 'activity'] as const).map((key) => {
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

      <Button label="Sign Out" variant="ghost" onPress={() => {}} />
    </Screen>
  );
}
