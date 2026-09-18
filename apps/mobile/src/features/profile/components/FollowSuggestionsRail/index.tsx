import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { FollowListRow } from '@/features/profile/components/FollowListRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useFollowSuggestions } from '@/features/profile/hooks/useFollowSuggestions';

/**
 * Tablet-only right column â€” "Who to follow", the mobile counterpart of
 * the web `RightRail` (docs/DECISIONS.md, "Right Rail: Follow
 * Suggestions on Tablet/Desktop"). Rendered once by `MainTabNavigator`
 * beside the tab content, so it appears on every tab screen; shown from
 * `lg` (1024) up, the width where the left rail, the constrained content
 * column, and this 275px column all fit. Styled as the mirror of the web
 * `SideNav` â€” same 275px bare column and a heading closed by the same
 * white divider (docs/DECISIONS.md, "Right Rail Mirrors the Sidebar;
 * Yellow Wordmark Logo").
 *
 * Every row is a real Knewit account (never a Polymarket trader â€” see
 * docs/DECISIONS.md, "Round 6"), reusing `FollowListRow` so the follow
 * button behaves exactly like the Followers/Following screens. Five per
 * page with an explicit "Show more"; an empty result is an honest empty
 * state, never filler.
 */
export function FollowSuggestionsRail() {
  const navigation = useNavigation();
  const suggestions = useFollowSuggestions();
  const items = suggestions.data?.pages.flatMap((page) => page.items) ?? [];

  const openProfile = (userId: string) =>
    navigation.navigate('Main', {
      screen: 'ProfileTab',
      params: { screen: 'Profile', params: { userId } },
    });

  return (
    <View className="hidden w-[275px] flex-shrink-0 border-l border-border lg:flex">
      <FlatList
        data={items}
        keyExtractor={(item) => item.user.id}
        renderItem={({ item }) => (
          <FollowListRow item={item} onPress={() => openProfile(item.user.id)} />
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListHeaderComponent={
          <View className="mb-1 border-b border-white/30 px-4 pb-4">
            <Text variant="bodyStrong" className="text-lg">
              Who to follow
            </Text>
          </View>
        }
        ListEmptyComponent={
          suggestions.isPending ? (
            <View className="px-4 pt-2">
              <LoadingState rows={3} />
            </View>
          ) : suggestions.isError ? (
            <ErrorState
              message="Couldn't load suggestions."
              onRetry={() => suggestions.refetch()}
            />
          ) : (
            <Text variant="caption" color="textSecondary" className="px-4 py-3">
              No suggestions yet â€” check back once more people join.
            </Text>
          )
        }
        ListFooterComponent={
          suggestions.hasNextPage ? (
            <View className="px-4 pt-3">
              <Button
                label={suggestions.isFetchingNextPage ? 'Loading…' : 'Show more'}
                variant="secondary"
                loading={suggestions.isFetchingNextPage}
                onPress={() => suggestions.fetchNextPage()}
                className="min-h-0 w-full px-4 py-2"
              />
            </View>
          ) : null
        }
      />
    </View>
  );
}
