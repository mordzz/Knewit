'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TabRow, type TabRowOption } from '@/components/ui/TabRow';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MarketCard, MarketCardSkeleton } from '@/features/markets/components/MarketCard';
import { useMarkets } from '@/features/markets/hooks/useMarkets';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { getCategories } from '@/features/markets/lib/marketService';
import type { MarketListItem } from '@/types/social';
import { PageHeader } from '@/components/ui/PageHeader';

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

// Desktop/tablet swaps the phone's single-column list for a grid
// same `MarketCard`s, styled after `apps/dekstop`'s `MarketsPage`
// (which browses markets in a grid too), each just wrapped in its own
// bordered tile since `MarketCard` itself only carries a bottom border
// (the right convention for a list row, not a grid cell).
const GRID_CLASS = 'grid grid-cols-2 gap-4 pt-6 2xl:grid-cols-3';
const TILE_CLASS = 'flex flex-col';

/**
 * Direct conversion of `apps/mobile`'s Markets tab (`MarketsScreen` +
 * `MarketCard`)  Trending is the default category, category tabs come
 * from the live `GET /categories` (Polymarket's own current taxonomy,
 * not a hardcoded list  see docs/DECISIONS.md, "Round 4"), and the
 * list scrolls infinitely (an `IntersectionObserver` sentinel replaces
 * `FlatList`'s `onEndReached`) instead of a "Load more" button.
 */
export default function MarketsPage() {
  const [category, setCategory] = useState('Trending');
  const markets = useMarkets(category);
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const isDesktop = useIsDesktop();

  // `key` is the API's tag slug (what the backend filters by); `label`
  // is only what the tab shows  the two are different namespaces
  // upstream (`pop-culture` ↔ "Culture"), never derived from each other.
  const categoryOptions: TabRowOption<string>[] = [
    { key: 'Trending', label: 'Trending' },
    ...(categoriesQuery.data ?? []).map((option) => ({ key: option.slug, label: option.label })),
  ];

  return (
    <main className={isDesktop ? 'w-full py-8' : 'w-full'}>
      {isDesktop ? (
        <PageHeader title="Markets" subtitle="Explore prediction markets and find your next position." />
      ) : (
        <h1 className="px-4 pb-3 pt-2 text-4xl font-extrabold">Markets</h1>
      )}
      {isDesktop ? null : <div className="border-b border-border" />}
      <div className={isDesktop ? 'pt-6' : 'pt-4'}>
        <TabRow options={categoryOptions} value={category} onChange={setCategory} scroll />
      </div>

      {markets.status === 'pending' ? (
        isDesktop ? (
          <div className={GRID_CLASS}>
            {SKELETON_ROWS.map((row) => (
              <div key={row} className={TILE_CLASS}>
                <MarketCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {SKELETON_ROWS.map((row) => (
              <MarketCardSkeleton key={row} />
            ))}
          </div>
        )
      ) : markets.status === 'error' ? (
        <ErrorState message="Couldn't load markets." onRetry={() => markets.refetch()} />
      ) : (
        <MarketsList markets={markets} isDesktop={isDesktop} />
      )}
    </main>
  );
}

function MarketsList({ markets, isDesktop }: { markets: ReturnType<typeof useMarkets>; isDesktop: boolean }) {
  if (markets.status !== 'success') return null;
  const items: MarketListItem[] = markets.data.pages.flatMap((page) => page.items);
  const key = (item: MarketListItem) => (item.kind === 'market' ? item.market.id : item.group.id);

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon="trending-up-outline"
          title="No markets in this category yet"
          message="Real Polymarket markets will appear here once the backend is connected."
        />
      ) : isDesktop ? (
        <div className={GRID_CLASS}>
          {items.map((item) => (
            <div key={key(item)} className={TILE_CLASS}>
              <MarketCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        items.map((item) => <MarketCard key={key(item)} item={item} />)
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
