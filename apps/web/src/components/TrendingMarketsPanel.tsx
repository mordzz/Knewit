'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Skeleton } from '@/components/ui/Skeleton';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';
import { useMarkets } from '@/features/markets/hooks/useMarkets';
import type { MarketListItem } from '@/types/social';

const TRENDING_COUNT = 4;

function rowOf(item: MarketListItem) {
  return item.kind === 'market'
    ? { id: item.market.id, name: item.market.label ?? item.market.question, imageUrl: item.market.imageUrl }
    : { id: item.group.id, name: item.group.title, imageUrl: item.group.imageUrl };
}

/** Desktop right-rail card: the top four Trending markets — image and
 * name only; a row opens Market Detail (event mode for a group). */
export function TrendingMarketsPanel() {
  const router = useRouter();
  const markets = useMarkets('Trending');

  if (markets.status === 'error') return null;
  const rows =
    markets.status === 'success'
      ? markets.data.pages
          .flatMap((page) => page.items)
          .slice(0, TRENDING_COUNT)
          .map(rowOf)
      : [];
  if (markets.status === 'success' && rows.length === 0) return null;

  return (
    <section className={CARD_SURFACE_CLASS} aria-label="Trending markets">
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <Text variant="bodyStrong">Trending markets</Text>
        <Link href="/markets" className="text-caption text-text-secondary hover:text-text-primary">
          See all
        </Link>
      </div>
      <div className="pb-2">
        {markets.status === 'pending'
          ? Array.from({ length: TRENDING_COUNT }, (_, index) => (
              <div key={index} className="flex items-center gap-2.5 px-4 py-2.5">
                <Skeleton width={40} height={40} className="rounded-xl" />
                <Skeleton height={16} className="flex-1" />
              </div>
            ))
          : rows.map((row) => (
              <div
                key={row.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/markets/${row.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') router.push(`/markets/${row.id}`);
                }}
                aria-label={`Open market: ${row.name}`}
                className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 hover:bg-white/5"
              >
                <MarketVisual imageUrl={row.imageUrl} fallbackIcon="trending-up-outline" />
                <Text variant="bodyStrong" numberOfLines={2} className="flex-1 font-inter-bold">
                  {row.name}
                </Text>
              </div>
            ))}
      </div>
    </section>
  );
}
