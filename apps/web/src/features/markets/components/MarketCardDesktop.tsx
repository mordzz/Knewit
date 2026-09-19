'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Sparkline } from '@/components/ui/Sparkline';
import { getMarketPriceHistory } from '@/features/markets/lib/marketService';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';
import { formatCompactUsd, formatTimeRemaining } from '@/lib/formatters';
import type { MarketListItem } from '@/types/social';

const MAX_ROWS = 2;

const cents = (value: number) => Math.round(value);

interface Row {
  label: string;
  cents: number;
}

async function share(title: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text: `${title}\n\nvia Knew it` });
    } catch {
      // Dismissed share sheet — nothing to recover from.
    }
  }
}

function formatEnds(iso: string | null): string | null {
  return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
}

/**
 * Desktop market card, modeled on `apps/dekstop`'s `PredictionCard`:
 * thumbnail + title with a share button, a fixed-height body (a two-way
 * market shows its chance and Yes/No buttons; anything with more options
 * shows its top three as bars), and a ruled footer with volume and end
 * date. Every card has the same height whatever its option count.
 */
export function MarketCardDesktop({ item }: { item: MarketListItem }) {
  const router = useRouter();

  const isGroup = item.kind === 'group';
  const id = isGroup ? item.group.id : item.market.id;
  const title = isGroup ? item.group.title : item.market.question;
  const imageUrl = isGroup ? item.group.imageUrl : item.market.imageUrl;
  const volume = isGroup ? item.group.volume : item.market.volume;
  const endDate = isGroup ? item.group.endDate : item.market.endDate;
  const ends = formatEnds(endDate);

  const binary = !isGroup && item.market.choices.length === 2 ? item.market.choices : null;
  const rows: Row[] = isGroup
    ? item.group.outcomes.map((outcome) => ({ label: outcome.label, cents: outcome.yesPrice }))
    : item.market.choices.map((choice) => ({ label: choice.label, cents: choice.price }));

  // Real 1D price history of the first choice (the same series and cache
  // key the detail page's chart uses); until it loads, the probability
  // bar below fills the space.
  const historyMarketId = binary && !isGroup ? item.market.id : null;
  const history = useQuery({
    queryKey: ['market-price-history', historyMarketId, '1D', binary?.[0]?.price, 0],
    queryFn: () => getMarketPriceHistory(historyMarketId!, '1D', 0),
    enabled: historyMarketId != null,
    staleTime: 60_000,
  });
  const points = history.data?.map((point) => point.price) ?? [];
  const showChart = points.length >= 2;

  const moreCount = Math.max(0, rows.length - MAX_ROWS);

  const open = () => router.push(`/markets/${id}`);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open();
      }}
      aria-label={`Open ${isGroup ? 'event' : 'market'}: ${title}`}
      className={`group flex h-full cursor-pointer flex-col p-4 transition-colors hover:border-white/25 hover:bg-white/5 ${CARD_SURFACE_CLASS}`}
    >
      <div className="flex items-center gap-3">
        <MarketVisual imageUrl={imageUrl} fallbackIcon="trending-up-outline" size={48} />
        <div className="flex min-h-12 min-w-0 flex-1 items-center">
          <p className="line-clamp-2 text-sm font-semibold leading-5 transition-colors group-hover:text-accent">{title}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            share(title);
          }}
          aria-label="Share this market"
          className="-mr-1 -mt-1 grid size-8 shrink-0 self-start place-items-center rounded-md text-text-tertiary hover:bg-white/10 hover:text-text-primary"
        >
          <Icon name="share-outline" size={16} color="textTertiary" />
        </button>
      </div>

      <div className="mt-4 h-28">
        {binary ? (
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="grid grid-cols-[2fr_8fr] items-end gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-semibold tabular-nums">{cents(binary[0]!.price)}%</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">chance</p>
                </div>
                {showChart ? (
                  <div className="w-full shrink-0">
                    <Sparkline points={points} positive={points[points.length - 1]! >= points[0]!} height={44} />
                  </div>
                ) : endDate ? (
                  <span className="pb-0.5 text-xs text-text-tertiary">{formatTimeRemaining(endDate)}</span>
                ) : null}
              </div>
              {showChart ? null : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min(100, Math.max(cents(binary[0]!.price), 2))}%` }}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="truncate rounded-md bg-accent px-3 py-2.5 text-center text-xs font-semibold text-text-inverse">
                {binary[0]!.label}
              </span>
              <span className="truncate rounded-md border border-white/15 bg-black px-3 py-2.5 text-center text-xs font-semibold text-text-primary">
                {binary[1]!.label}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-center gap-2">
            {rows.slice(0, MAX_ROWS).map((row) => (
              <div key={row.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="h-8 overflow-hidden rounded-md bg-white/[0.06]">
                  <div
                    className="h-full truncate bg-accent/15 px-2 text-xs leading-8"
                    style={{ width: `${Math.min(100, Math.max(row.cents * 2.6, 35))}%` }}
                  >
                    {row.label}
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums">{cents(row.cents)}%</span>
              </div>
            ))}
            {moreCount > 0 ? <p className="text-[11px] text-text-tertiary">+{moreCount} more options</p> : null}
          </div>
        )}
      </div>

      <div className="mt-auto flex justify-between border-t border-border pt-4 text-[11px] text-text-tertiary">
        <span>{volume != null ? `${formatCompactUsd(volume)} vol.` : ''}</span>
        <span>{ends ? `Ends ${ends}` : ''}</span>
      </div>
    </article>
  );
}
