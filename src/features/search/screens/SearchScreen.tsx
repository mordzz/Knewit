import { useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SearchInput } from '@/features/search/components/SearchInput';
import { PersonResult } from '@/features/search/components/PersonResult';
import { useSearch, MIN_QUERY_LENGTH } from '@/features/search/hooks/useSearch';
import { MarketCard } from '@/features/markets/components/MarketCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useRecentSearchesStore } from '@/store/search/recentSearchesStore';
import { KNOWN_CATEGORIES } from '@/types/common';
import { spacing } from '@/theme';
import type { MarketListItem, User } from '@/types/social';

const SEARCH_DEBOUNCE_MS = 400;

/** Many options (All + Polymarket's taxonomy) — scrolls, same as
 * Markets' own category row; a small fixed set (Home/Profile/Market
 * Detail's tabs) doesn't need to. */
const CATEGORY_CHIP_OPTIONS: TabRowOption<string>[] = ['All', ...KNOWN_CATEGORIES].map(
  (category) => ({ key: category, label: category })
);

type ResultItem =
  | { kind: 'person'; key: string; user: User }
  | { kind: 'market'; key: string; item: MarketListItem }
  | { kind: 'empty'; key: string; message: string };

/**
 * Global discovery: a category filter row up top, a bottom-anchored
 * search bar (matching the reference this screen was modeled on — see
 * docs/DECISIONS.md), and — with no query — a "Recents" list of past
 * searches instead of a category-grid/trending preview. A resolved
 * query still shows People + Markets together, no scope toggle.
 */
export function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const trimmed = debouncedQuery.trim();
  const hasQuery = trimmed.length > 0;
  const isTooShort = hasQuery && trimmed.length < MIN_QUERY_LENGTH;

  const search = useSearch(debouncedQuery);
  const recent = useRecentSearchesStore((state) => state.recent);
  const addRecent = useRecentSearchesStore((state) => state.addRecent);

  const openMarket = (marketId: string) => navigation.navigate('MarketDetail', { marketId });
  const openProfile = (userId: string) => navigation.navigate('Profile', { userId });
  const openCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    navigation.navigate('Main', {
      screen: 'MarketsTab',
      params: nextCategory === 'All' ? undefined : { category: nextCategory },
    });
  };

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
    <Screen className="gap-0 pt-2">
      <View className="flex-1">
        {!hasQuery ? (
          <View className="flex-1">
            <Text className="text-2xl mb-1 mt-2 pb-4 font-bold">Recents</Text>
            <TabRow
              options={CATEGORY_CHIP_OPTIONS}
              value={category}
              onChange={openCategory}
              scroll
            />
            {recent.length === 0 ? (
              <EmptyState icon="time-outline" title="No recent searches" />
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {recent.map((item) => (
                  <RecentSearchRow key={item} query={item} onPress={() => setQuery(item)} />
                ))}
              </ScrollView>
            )}
          </View>
        ) : isTooShort ? (
          <EmptyState
            icon="search"
            title="Keep typing"
            message={`Enter at least ${MIN_QUERY_LENGTH} characters to search.`}
          />
        ) : search.status === 'pending' ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text variant="title" className="mb-2 mt-2">
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
            contentContainerStyle={{ paddingBottom: spacing.md }}
            renderSectionHeader={({ section }) => (
              <Text variant="title" className="mb-2 mt-4">
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => {
              if (item.kind === 'person') {
                return <PersonResult user={item.user} onPress={() => openProfile(item.user.id)} />;
              }
              if (item.kind === 'market') {
                return <MarketCard item={item.item} onOpenMarket={openMarket} />;
              }
              return (
                <Text variant="caption" color="textSecondary" className="px-1 py-2">
                  {item.message}
                </Text>
              );
            }}
          />
        )}
      </View>

      <View className="pb-6 pt-2">
        <SearchInput value={query} onChangeText={setQuery} onSubmit={handleSubmit} />
      </View>
    </Screen>
  );
}

function RecentSearchRow({ query, onPress }: { query: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-1 py-2.5 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`Search again for ${query}`}
    >
      <Icon name="time-outline" size={16} color="textTertiary" />
      <Text variant="body" className="flex-1">
        {query}
      </Text>
    </Pressable>
  );
}
