import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FollowListRow } from '@/features/profile/components/FollowListRow';
import { useFollowing } from '@/features/profile/hooks/useFollowing';
import { colors } from '@/theme';
import type { AppParamList } from '@/types/navigation';

/** Paginated list of who `userId` follows — see `FollowersScreen` for
 * why this is a separate, near-identical file rather than a shared
 * parameterized component. */
export function FollowingScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppParamList, 'Following'>>();
  const { userId } = route.params;
  const following = useFollowing(userId);

  const items = following.data?.pages.flatMap((page) => page.items) ?? [];

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
          Following
        </Text>
      </View>

      {following.status === 'pending' ? (
        <View className="px-4">
          <LoadingState rows={5} />
        </View>
      ) : null}

      {following.status === 'error' ? (
        <View className="px-4">
          <ErrorState message="Unable to load following." onRetry={() => following.refetch()} />
        </View>
      ) : null}

      {following.status === 'success' ? (
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
            if (following.hasNextPage && !following.isFetchingNextPage) {
              following.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            <EmptyState icon="person-outline" title="Not following anyone yet." />
          }
          ListFooterComponent={
            following.isFetchingNextPage ? (
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
