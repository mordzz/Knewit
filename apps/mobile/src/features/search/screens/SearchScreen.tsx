import { useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useKeyboardPadding } from '@/hooks/useKeyboardPadding';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Divider } from '@/components/ui/Divider';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SearchInput } from '@/features/search/components/SearchInput';
import { PersonResult } from '@/features/search/components/PersonResult';
import { useSearch, MIN_QUERY_LENGTH } from '@/features/search/hooks/useSearch';
import { MarketCard } from '@/features/markets/components/MarketCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useRecentSearchesStore } from '@/store/search/recentSearchesStore';
import { typography } from '@/theme';
import type { MarketListItem, User } from '@/types/social';

const SEARCH_DEBOUNCE_MS = 400;

type ResultItem =
  | { kind: 'person'; key: string; user: User }
  | { kind: 'market'; key: string; item: MarketListItem }
  | { kind: 'empty'; key: string; message: string };

/**
 * Search, and only search: a bottom-anchored search bar (matching the
 * reference this screen was modeled on  see docs/DECISIONS.md), and
 * with no query  a "Recents" list of past searches. A resolved query
 * shows People + Markets together, no scope toggle. No discovery
 * content (trending/category strips live  or don't  on other tabs);
 * this screen does one thing.
 *
 * A bare "Search" page title + divider sits above the Recents/results
 * area (outside/above the "Recents" section header, which stays as its
 * own smaller label)  see docs/DECISIONS.md ("Decorated Top-3 Rank
 * Numbers", which also covers this and the other main tabs' title
 * headers). The empty "no recent searches" state is centered in the
 * screen (not just top-aligned under the title)  `EmptyState` already
 * centers its own content, but needs a `flex-1 items-center
 * justify-center` wrapper to center within the full available height.
 *
 * Recent searches can be cleared  a "Clear" action next to the
 * "Recents" label removes all of them (`clearRecent`), and each row has
 * its own remove button (`removeRecent`) for deleting just that one
 * entry  see docs/DECISIONS.md ("Clearable Search History").
 */
export function SearchScreen() {
  const navigation = useNavigation();
  // The tab bar already fills the bottom of the screen, so the keyboard
  // only needs to be cleared by whatever of it rises above the tab bar.
  const keyboardPadding = useKeyboardPadding(useBottomTabBarHeight());
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const trimmed = debouncedQuery.trim();
  const hasQuery = trimmed.length > 0;
  const isTooShort = hasQuery && trimmed.length < MIN_QUERY_LENGTH;

  const search = useSearch(debouncedQuery);
  const recent = useRecentSearchesStore((state) => state.recent);
  const addRecent = useRecentSearchesStore((state) => state.addRecent);
  const removeRecent = useRecentSearchesStore((state) => state.removeRecent);
  const clearRecent = useRecentSearchesStore((state) => state.clearRecent);

  const openMarket = (marketId: string) => navigation.navigate('MarketDetail', { marketId });
  const openProfile = (userId: string) => navigation.navigate('Profile', { userId });

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (trimmed.length >= MIN_QUERY_LENGTH) addRecent(trimmed);
  };

  const sections = useMemo(() => {
    if (!search.data) return [];

    const { people, markets } = search.data;

    const peopleItems: ResultItem[] =
      people.length > 0
        ? people.map((user) => ({ kind: 'person' as const, key: `person-${user.id}`, user }))
        : [{ kind: 'empty' as const, key: 'people-empty', message: 'No people found' }];

    const marketItems: ResultItem[] =
      markets.length > 0
        ? markets.map((item) => ({
            kind: 'market' as const,
            key: `market-${item.kind === 'market' ? item.market.id : item.group.id}`,
            item,
          }))
        : [{ kind: 'empty' as const, key: 'markets-empty', message: 'No markets found' }];

    return [
      { title: 'People', data: peopleItems },
      { title: 'Markets', data: marketItems },
    ];
  }, [search.data]);

  const noResultsAtAll =
    search.data && search.data.people.length === 0 && search.data.markets.length === 0;

  return (
    <Screen className="px-0 pt-4" edges={['top']}>
      {/* The search box sits at the bottom of the screen, so it's lifted
          above the keyboard (see `useKeyboardPadding`). */}
      <View className="flex-1 bg-background" style={{ paddingBottom: keyboardPadding }}>
        <Text
          variant="heading"
          className="px-4 pb-3 pt-2 text-4xl"
          style={{ fontFamily: typography.family.extrabold }}
        >
          Search
        </Text>
        <Divider />
        <View className="flex-1">
          {!hasQuery ? (
            recent.length > 0 ? (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="mb-2 mt-2 flex-row items-center justify-between px-4">
                  <Text variant="title">Recents</Text>
                  <Pressable
                    onPress={clearRecent}
                    accessibilityRole="button"
                    accessibilityLabel="Clear recent searches"
                    hitSlop={8}
                  >
                    <Text variant="caption" color="accent">
                      Clear
                    </Text>
                  </Pressable>
                </View>
                {recent.map((item) => (
                  <RecentSearchRow
                    key={item}
                    query={item}
                    onPress={() => setQuery(item)}
                    onRemove={() => removeRecent(item)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View className="flex-1 items-center justify-center">
                <EmptyState icon="time-outline" title="No recent searches" />
              </View>
            )
          ) : isTooShort ? (
            <EmptyState
              icon="search"
              title="Keep typing"
              message={`Enter at least ${MIN_QUERY_LENGTH} characters to search.`}
            />
          ) : search.status === 'pending' ? (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text variant="title" className="mb-2 mt-2 px-4">
                People
              </Text>
              <LoadingState rows={2} />
            </ScrollView>
          ) : search.status === 'error' ? (
            <ErrorState message="Unable to search. Try again." onRetry={() => search.refetch()} />
          ) : noResultsAtAll ? (
            <EmptyState icon="search" title="No results found" message="Try another search term." />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderSectionHeader={({ section }) => (
                <Text variant="title" className="mb-2 mt-4 px-4">
                  {section.title}
                </Text>
              )}
              renderItem={({ item }) => {
                if (item.kind === 'person') {
                  return (
                    <PersonResult user={item.user} onPress={() => openProfile(item.user.id)} />
                  );
                }
                if (item.kind === 'market') {
                  return <MarketCard item={item.item} onOpenMarket={openMarket} />;
                }
                return (
                  <Text variant="caption" color="textSecondary" className="px-4 py-2">
                    {item.message}
                  </Text>
                );
              }}
            />
          )}
        </View>

        <View className="px-4 pb-6 pt-2">
          <SearchInput value={query} onChangeText={setQuery} onSubmit={handleSubmit} />
        </View>
      </View>
    </Screen>
  );
}

function RecentSearchRow({
  query,
  onPress,
  onRemove,
}: {
  query: string;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-surface"
      accessibilityRole="button"
      accessibilityLabel={`Search again for ${query}`}
    >
      <Icon name="time-outline" size={16} color="textTertiary" />
      <Text variant="body" className="flex-1">
        {query}
      </Text>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${query} from recent searches`}
        hitSlop={8}
      >
        <Icon name="close" size={16} color="textTertiary" />
      </Pressable>
    </Pressable>
  );
}
