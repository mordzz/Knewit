import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FollowListRow } from '@/features/profile/components/FollowListRow';
import { useFollowers } from '@/features/profile/hooks/useFollowers';
import { colors } from '@/theme';
import type { AppParamList } from '@/types/navigation';

/** Paginated list of `userId`'s followers  see docs/SOCIAL-FEATURE.md.
 * `FollowingScreen` is the near-identical sibling of this file (its own
 * hook/empty copy), not a shared parameterized component  the two
 * differ only in which hook/copy they use, and duplicating that little
 * is clearer than a generic wrapper both routes would have to thread
 * `kind` through. */
export function FollowersScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppParamList, 'Followers'>>();
  const { userId } = route.params;
  const followers = useFollowers(userId);

  const items = followers.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen className="gap-0 px-0 pt-4" edges={['top']}>
      <View className="flex-row items-center px-4 pb-2">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Icon name="chevron-back" size={24} />
        </Pressable>
        <Text variant="heading" className="ml-2">
          Followers
        </Text>
      </View>

      {followers.status === 'pending' ? (
        <View className="px-4">
          <LoadingState rows={5} />
        </View>
      ) : null}

      {followers.status === 'error' ? (
        <View className="px-4">
          <ErrorState message="Unable to load followers." onRetry={() => followers.refetch()} />
        </View>
      ) : null}

      {followers.status === 'success' ? (
        <FlatList
          className="flex-1"
          data={items}
          keyExtractor={(item) => item.user.id}
          renderItem={({ item }) => (
            <FollowListRow
              item={item}
              onPress={() => navigation.navigate('Profile', { userId: item.user.id })}
            />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (followers.hasNextPage && !followers.isFetchingNextPage) {
              followers.fetchNextPage();
            }
          }}
          ListEmptyComponent={<EmptyState icon="person-outline" title="No followers yet." />}
          ListFooterComponent={
            followers.isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator color={colors.textSecondary} />
              </View>
            ) : null
          }
        />
      ) : null}
    </Screen>
  );
}
