'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TabRow, type TabRowOption } from '@/components/ui/TabRow';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MarketCard, MarketCardSkeleton } from '@/components/MarketCard';
import { useMarkets } from '@/hooks/useMarkets';
import { getCategories } from '@/lib/marketService';
import type { MarketListItem } from '@/types/social';

const SKELETON_ROWS = [0, 1, 2, 3];

/**
 * Direct conversion of `apps/mobile`'s Markets tab (`MarketsScreen` +
 * `MarketCard`) — Trending is the default category, category tabs come
 * from the live `GET /categories` (Polymarket's own current taxonomy,
 * not a hardcoded list — see docs/DECISIONS.md, "Round 4"), and the
 * list scrolls infinitely (an `IntersectionObserver` sentinel replaces
 * `FlatList`'s `onEndReached`) instead of a "Load more" button.
 */
export default function MarketsPage() {
  const [category, setCategory] = useState('Trending');
  const markets = useMarkets(category);
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  // `key` is the API's tag slug (what the backend filters by); `label`
  // is only what the tab shows — the two are different namespaces
  // upstream (`pop-culture` ↔ "Culture"), never derived from each other.
  const categoryOptions: TabRowOption<string>[] = [
    { key: 'Trending', label: 'Trending' },
    ...(categoriesQuery.data ?? []).map((option) => ({ key: option.slug, label: option.label })),
  ];

  return (
    <main className="w-full">
      <h1 className="px-4 pb-3 pt-2 text-4xl font-extrabold">Markets</h1>
      <div className="border-b border-border" />
      <div className="pt-4">
        <TabRow options={categoryOptions} value={category} onChange={setCategory} scroll />
      </div>

      {markets.status === 'pending' ? (
        <div>
          {SKELETON_ROWS.map((row) => (
            <MarketCardSkeleton key={row} />
          ))}
        </div>
      ) : markets.status === 'error' ? (
        <ErrorState message="Couldn't load markets." onRetry={() => markets.refetch()} />
      ) : (
        <MarketsList markets={markets} />
      )}
    </main>
  );
}

function MarketsList({ markets }: { markets: ReturnType<typeof useMarkets> }) {
  if (markets.status !== 'success') return null;
  const items: MarketListItem[] = markets.data.pages.flatMap((page) => page.items);

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon="trending-up-outline"
          title="No markets in this category yet"
          message="Real Polymarket markets will appear here once the backend is connected."
        />
      ) : (
        items.map((item) => <MarketCard key={item.kind === 'market' ? item.market.id : item.group.id} item={item} />)
      )}
      <InfiniteScrollSentinel
        hasNextPage={!!markets.hasNextPage}
        isFetchingNextPage={markets.isFetchingNextPage}
        onLoadMore={() => markets.fetchNextPage()}
      />
    </>
  );
}

function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) return null;

  return (
    <div ref={ref} className="py-4">
      {isFetchingNextPage ? (
        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
      ) : null}
    </div>
  );
}
