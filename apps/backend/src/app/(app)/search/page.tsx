'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Divider } from '@/components/ui/Divider';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SearchInput } from '@/components/SearchInput';
import { PersonResult } from '@/components/PersonResult';
import { MarketCard } from '@/components/MarketCard';
import { useSearch, MIN_QUERY_LENGTH } from '@/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { useRecentSearchesStore } from '@/store/recentSearchesStore';
import type { MarketListItem, User } from '@/types/social';

const SEARCH_DEBOUNCE_MS = 400;

type ResultItem =
  | { kind: 'person'; key: string; user: User }
  | { kind: 'market'; key: string; item: MarketListItem }
  | { kind: 'empty'; key: string; message: string };

/**
 * Direct conversion of `apps/mobile`'s `SearchScreen` — search, and
 * only search: a bottom-anchored search bar (same position mobile
 * uses), and with no query, a "Recents" list of past searches (Zustand,
 * in-memory only, same store copied verbatim). A resolved query shows
 * People + Markets together, no scope toggle.
 */
export default function SearchPage() {
  const router = useRouter();
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

  const openProfile = (userId: string) => router.push(`/profile/${userId}`);

  const handleSubmit = () => {
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

  const noResultsAtAll = search.data && search.data.people.length === 0 && search.data.markets.length === 0;

  return (
    <div className="flex h-full w-full flex-col">
      <Text variant="heading" className="block px-4 pb-3 pt-2 text-4xl font-inter-extrabold">
        Search
      </Text>
      <Divider />

      <div className="flex-1 overflow-y-auto">
        {!hasQuery ? (
          recent.length > 0 ? (
            <div>
              <div className="mb-2 mt-2 flex items-center justify-between px-4">
                <Text variant="title">Recents</Text>
                <button type="button" onClick={clearRecent} aria-label="Clear recent searches">
                  <Text variant="caption" color="accent">
                    Clear
                  </Text>
                </button>
              </div>
              {recent.map((item) => (
                <RecentSearchRow
                  key={item}
                  query={item}
                  onPress={() => setQuery(item)}
                  onRemove={() => removeRecent(item)}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState icon="time-outline" title="No recent searches" />
            </div>
          )
        ) : isTooShort ? (
          <EmptyState icon="search" title="Keep typing" message={`Enter at least ${MIN_QUERY_LENGTH} characters to search.`} />
        ) : search.status === 'pending' ? (
          <div>
            <Text variant="title" className="mb-2 mt-2 block px-4">
              People
            </Text>
            <LoadingState rows={2} />
          </div>
        ) : search.status === 'error' ? (
          <ErrorState message="Unable to search. Try again." onRetry={() => search.refetch()} />
        ) : noResultsAtAll ? (
          <EmptyState icon="search" title="No results found" message="Try another search term." />
        ) : (
          sections.map((section) => (
            <div key={section.title}>
              <Text variant="title" className="mb-2 mt-4 block px-4">
                {section.title}
              </Text>
              {section.data.map((item) => {
                if (item.kind === 'person') {
                  return <PersonResult key={item.key} user={item.user} onPress={() => openProfile(item.user.id)} />;
                }
                if (item.kind === 'market') {
                  return <MarketCard key={item.key} item={item.item} />;
                }
                return (
                  <Text key={item.key} variant="caption" color="textSecondary" className="block px-4 py-2">
                    {item.message}
                  </Text>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex-shrink-0 px-4 pb-6 pt-2">
        <SearchInput value={query} onChangeText={setQuery} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

function RecentSearchRow({ query, onPress, onRemove }: { query: string; onPress: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-surface">
      <button type="button" onClick={onPress} aria-label={`Search again for ${query}`} className="flex flex-1 items-center gap-3 text-left">
        <Icon name="time-outline" size={16} color="textTertiary" />
        <Text variant="body" className="flex-1">
          {query}
        </Text>
      </button>
      <button type="button" onClick={onRemove} aria-label={`Remove ${query} from recent searches`}>
        <Icon name="close" size={16} color="textTertiary" />
      </button>
    </div>
  );
}
