'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IoClose, IoSearchOutline, IoTimeOutline, IoTrendingUpOutline } from 'react-icons/io5';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import type { SearchResults } from '@/types/search';
import type { MarketListItem, User } from '@/types/social';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 400;
const RECENTS_KEY = 'knewit:recentSearches';
const MAX_RECENTS = 10;

function readRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeRecents(recents: string[]) {
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  } catch {
    // Private-window/blocked storage — recents just won't persist.
  }
}

/**
 * Direct conversion of `apps/mobile`'s Search tab (`SearchScreen`) —
 * People and Markets shown together for one query, no scope toggle
 * (same as mobile — see docs/DECISIONS.md), with a "Recents" list when
 * there's no query. Recents live in `localStorage` here instead of the
 * mobile app's Zustand store — both are genuinely client-only,
 * per-device state (docs/ARCHITECTURE.md's state-management split),
 * just persisted rather than in-memory, since a browser tab can be
 * closed and reopened far more casually than the mobile app is killed.
 */
export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  // Lazy initializer, not an effect + setState — this is a synchronous
  // read of an external system on first render, which is exactly what
  // `useState`'s lazy-init argument is for; `typeof window` guards the
  // SSR/build-time pass, where there's no localStorage to read (this
  // page's parent layout also never renders it there — see
  // `app/(app)/layout.tsx` — but the guard is cheap insurance either way).
  const [recents, setRecents] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : readRecents()
  );

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const trimmed = debounced.trim();
  const hasQuery = trimmed.length > 0;
  const isTooShort = hasQuery && trimmed.length < MIN_QUERY_LENGTH;

  const searchQuery = useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(trimmed)}`),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
  });

  const addRecent = (value: string) => {
    if (value.trim().length < MIN_QUERY_LENGTH) return;
    const next = [value, ...recents.filter((r) => r !== value)].slice(0, MAX_RECENTS);
    setRecents(next);
    writeRecents(next);
  };

  const removeRecent = (value: string) => {
    const next = recents.filter((r) => r !== value);
    setRecents(next);
    writeRecents(next);
  };

  const clearRecents = () => {
    setRecents([]);
    writeRecents([]);
  };

  return (
    <main className="w-full">
      <h1 className="px-4 pb-3 pt-6 text-4xl font-extrabold">Search</h1>
      <div className="border-b border-border" />

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2.5">
          <IoSearchOutline className="text-text-tertiary" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addRecent(query.trim());
            }}
            placeholder="Search people and markets"
            className="min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>
      </div>

      {!hasQuery ? (
        recents.length > 0 ? (
          <div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="font-bold">Recents</span>
              <button type="button" onClick={clearRecents} className="text-sm text-accent">
                Clear
              </button>
            </div>
            {recents.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between border-b border-border px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => setQuery(item)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <IoTimeOutline size={18} className="text-text-tertiary" />
                  <span>{item}</span>
                </button>
                <button type="button" onClick={() => removeRecent(item)} aria-label={`Remove ${item}`}>
                  <IoClose size={18} className="text-text-tertiary" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-center text-text-secondary">No recent searches.</p>
        )
      ) : isTooShort ? (
        <p className="p-6 text-center text-text-secondary">
          Enter at least {MIN_QUERY_LENGTH} characters to search.
        </p>
      ) : searchQuery.isPending ? (
        <p className="p-6 text-center text-text-secondary">Searching…</p>
      ) : searchQuery.isError ? (
        <p className="p-6 text-center text-danger">
          {searchQuery.error instanceof ApiRequestError
            ? searchQuery.error.message
            : "Couldn't search right now."}
        </p>
      ) : (
        <SearchResultsSections results={searchQuery.data ?? { people: [], markets: [] }} />
      )}
    </main>
  );
}

function SearchResultsSections({ results }: { results: SearchResults }) {
  return (
    <>
      <SectionHeader title="People" />
      {results.people.length === 0 ? (
        <p className="px-4 py-3 text-sm text-text-tertiary">No people found</p>
      ) : (
        results.people.map((user) => <PersonRow key={user.id} user={user} />)
      )}

      <SectionHeader title="Markets" />
      {results.markets.length === 0 ? (
        <p className="px-4 py-3 text-sm text-text-tertiary">No markets found</p>
      ) : (
        results.markets.map((item) => (
          <SearchMarketRow key={item.kind === 'market' ? item.market.id : item.group.id} item={item} />
        ))
      )}
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <p className="px-4 pb-2 pt-4 font-bold">{title}</p>;
}

function PersonRow({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="font-bold text-text-inverse">
            {user.displayName.trim().charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold">{user.displayName}</p>
        <p className="truncate text-sm text-text-secondary">@{user.handle}</p>
      </div>
    </div>
  );
}

function SearchMarketRow({ item }: { item: MarketListItem }) {
  const question = item.kind === 'market' ? item.market.question : item.group.title;
  const imageUrl = item.kind === 'market' ? item.market.imageUrl : item.group.imageUrl;

  return (
    <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <IoTrendingUpOutline size={18} className="text-text-tertiary" />
        )}
      </div>
      <p className="line-clamp-2 flex-1 font-semibold">{question}</p>
    </div>
  );
}
