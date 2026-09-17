'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { IoShareOutline, IoTrendingUpOutline, IoPersonOutline } from 'react-icons/io5';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import { formatCompactUsd } from '@/lib/formatters';
import type { Paginated, Category } from '@/types/common';
import type { MarketGroupSummary, MarketListItem, MarketOutcomeRow, MarketSummary } from '@/types/social';

/**
 * Web port of `apps/frontend`'s Markets tab
 * (`features/markets/screens/MarketsScreen.tsx` + `MarketCard`) — same
 * flat list-row layout (no boxed cards — docs/DECISIONS.md, "List Rows,
 * Not Cards, for the Markets Tab"), same rule for combo markets
 * (`{ kind: 'group' }`): one flexible row shape decided by the data,
 * never a component per category. No price shown outside Market
 * Detail, matching the mobile screen's own choice.
 *
 * Categories come from `GET /categories` (live, Polymarket-sourced —
 * see `apps/backend/src/app/api/categories/route.ts`) rather than
 * `apps/frontend`'s hardcoded `KNOWN_CATEGORIES` fallback list, since
 * this page can call that real endpoint directly instead of needing a
 * placeholder.
 *
 * Deliberately smaller than the mobile screen: a "Load more" button
 * instead of scroll-triggered infinite pagination, and Share is
 * omitted (no OS share sheet on web worth building for this pass).
 */
export default function MarketsPage() {
  const [category, setCategory] = useState('Trending');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<MarketListItem[]>([]);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/api/categories'),
  });

  const marketsQuery = useQuery({
    queryKey: ['markets', category, cursor],
    queryFn: () => {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (category !== 'Trending') params.set('category', category);
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiRequest<Paginated<MarketListItem>>(`/api/markets${query}`);
    },
  });

  // Accumulate pages client-side (no infinite-query cache here, unlike
  // the mobile app's TanStack `useInfiniteQuery` — this project's
  // simpler "Load more" button doesn't need it).
  const items = cursor ? [...allItems, ...(marketsQuery.data?.items ?? [])] : marketsQuery.data?.items ?? [];

  const changeCategory = (next: string) => {
    setCategory(next);
    setCursor(undefined);
    setAllItems([]);
  };

  const loadMore = () => {
    if (marketsQuery.data) {
      setAllItems(items);
      setCursor(marketsQuery.data.nextCursor ?? undefined);
    }
  };

  const categories = ['Trending', ...(categoriesQuery.data ?? [])];

  return (
    <main className="w-full">
      <h1 className="px-4 pb-3 pt-6 text-4xl font-extrabold">Markets</h1>
      <div className="border-b border-border" />

      <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => changeCategory(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              category === cat
                ? 'bg-text-primary text-text-inverse'
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {marketsQuery.isError && !cursor ? (
        <p className="p-6 text-center text-danger">
          {marketsQuery.error instanceof ApiRequestError
            ? marketsQuery.error.message
            : "Couldn't load markets."}
        </p>
      ) : marketsQuery.isPending && !cursor ? (
        <p className="p-6 text-center text-text-secondary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-text-secondary">No markets in this category yet.</p>
      ) : (
        <>
          {items.map((item) => (
            <MarketRow key={item.kind === 'market' ? item.market.id : item.group.id} item={item} />
          ))}
          {marketsQuery.data?.nextCursor ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={marketsQuery.isFetching}
              className="w-full py-4 text-center font-semibold text-accent disabled:opacity-50"
            >
              {marketsQuery.isFetching ? 'Loading…' : 'Load more'}
            </button>
          ) : null}
        </>
      )}
    </main>
  );
}

function MarketVisual({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <IoTrendingUpOutline size={18} className="text-text-tertiary" />
      )}
    </div>
  );
}

function VolumeFooter({ volume }: { volume: number | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-tertiary">
        {volume != null ? `${formatCompactUsd(volume)} Volume` : ''}
      </span>
      <IoShareOutline size={16} className="text-text-tertiary" />
    </div>
  );
}

function ChoicePills({ market }: { market: MarketSummary }) {
  const isBinary = market.isBinary !== false;
  if (!isBinary) {
    return (
      <p className="text-xs text-text-tertiary">
        {market.outcomeCount ?? 'Multiple'} outcomes — preview only
      </p>
    );
  }
  return (
    <div className="flex gap-2">
      <span className="flex-1 rounded-md bg-yes-muted py-1.5 text-center text-sm font-semibold text-yes">
        {market.outcomeLabels?.yes ?? 'Yes'}
      </span>
      <span className="flex-1 rounded-md bg-no-muted py-1.5 text-center text-sm font-semibold text-no">
        {market.outcomeLabels?.no ?? 'No'}
      </span>
    </div>
  );
}

function MarketRow({ item }: { item: MarketListItem }) {
  if (item.kind === 'group') {
    return <GroupRow group={item.group} />;
  }
  return <SingleMarketRow market={item.market} />;
}

function SingleMarketRow({ market }: { market: MarketSummary }) {
  return (
    <Link
      href={`/markets/${market.id}`}
      className="flex flex-col gap-3 border-b border-border px-4 py-3 hover:bg-surface"
    >
      <div className="flex items-center gap-2.5">
        <MarketVisual imageUrl={market.imageUrl} />
        <p className="line-clamp-3 flex-1 font-bold">{market.question}</p>
      </div>
      <ChoicePills market={market} />
      <VolumeFooter volume={market.volume} />
    </Link>
  );
}

const ROW_LIMIT = 4;

function GroupRow({ group }: { group: MarketGroupSummary }) {
  const visible = group.outcomes.slice(0, ROW_LIMIT);
  const remaining = group.outcomes.length - visible.length;

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
      {/* `group.id` is Polymarket's *event* id, not a market id —
          `GET /markets/:id` (this app's only detail route) only ever
          resolves a real market id (see docs/ARCHITECTURE.md: "a
          group's individual outcome row is still just an ordinary
          market with its own id"). A combo market has no single-market
          detail page to send this header to, so it's plain text, not a
          link — only each outcome row below is real market by id and
          navigable. Previously linked here anyway, which 404'd every
          time (`GET /api/markets/:eventId` can never find a match). */}
      <div className="flex items-center gap-2.5">
        <MarketVisual imageUrl={group.imageUrl} />
        <p className="line-clamp-3 flex-1 font-bold">{group.title}</p>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map((row) => (
          <OutcomeRow key={row.id} row={row} />
        ))}
        {remaining > 0 ? (
          <p className="text-xs text-text-tertiary">+{remaining} more</p>
        ) : null}
      </div>

      <VolumeFooter volume={group.volume} />
    </div>
  );
}

function OutcomeRow({ row }: { row: MarketOutcomeRow }) {
  return (
    <Link href={`/markets/${row.id}`} className="flex items-center gap-2 hover:opacity-80">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-muted">
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <IoPersonOutline size={14} className="text-accent" />
        )}
      </div>
      <span className="flex-1 text-sm">{row.label}</span>
    </Link>
  );
}
