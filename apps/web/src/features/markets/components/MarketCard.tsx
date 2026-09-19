'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompactUsd } from '@/lib/formatters';
import { formatTimeRemaining } from '@/lib/formatters';
import { MarketCardDesktop } from '@/features/markets/components/MarketCardDesktop';
import { Sparkline } from '@/components/ui/Sparkline';
import { getMarketPriceHistory } from '@/features/markets/lib/marketService';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';
import { choiceTone, type ChoiceTone } from '@/lib/choiceTone';
import type { MarketChoice } from '@/types/market';
import type { MarketGroupSummary, MarketListItem, MarketOutcomeRow, MarketSummary } from '@/types/social';

export interface MarketCardProps {
  item: MarketListItem;
  /** The flat list row at every width — for dense surfaces like the search dropdown. */
  compact?: boolean;
}

/**
 * Direct conversion of `apps/mobile`'s Markets tab card
 * (`features/markets/components/MarketCard`) — a flat, borderless list
 * row (same convention as `CallCard`), not a boxed card. No price
 * anywhere on this card (price/trading only ever appears in Market
 * Detail) — the choice *types* still show (labels from the market's own
 * API choices, each combo-market outcome's name + pills), just not a
 * probability number. A single-market row opens Market Detail; a group
 * card opens the exact same detail surface in event mode (one chart
 * line per child market, per-child Trade sheets), while each outcome
 * group card opens the exact same detail surface in event mode (one
 * chart line per child market, per-child Trade sheets), and its outcome
 * rows are display-only — one click target per card, see
 * docs/DECISIONS.md ("Group Cards Are One Click").
 */
export function MarketCard({ item, compact = false }: MarketCardProps) {
  if (compact) {
    // One click target only: the whole row opens the same Market Detail
    // surface (event mode for a group); the rows below are display-only.
    return item.kind === 'group' ? <GroupCard group={item.group} /> : <SingleMarketCard market={item.market} />;
  }
  return (
    <>
      <div className="lg:hidden">
        {item.kind === 'group' ? <GroupCard group={item.group} /> : <SingleMarketCard market={item.market} />}
      </div>
      <div className="hidden lg:block lg:h-full">
        <MarketCardDesktop item={item} />
      </div>
    </>
  );
}

async function shareMarket(title: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text: `${title}\n\nvia Knew it` });
    } catch {
      // User dismissed the share sheet — nothing to recover from.
    }
  }
}

function VolumeAndShare({ volume, title }: { volume: number | null; title: string }) {
  return (
    <div className="flex items-center justify-between">
      {volume != null ? (
        <Text variant="micro" color="textTertiary">
          {formatCompactUsd(volume)} Volume
        </Text>
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          shareMarket(title);
        }}
        aria-label="Share this market"
        className="flex min-h-8 min-w-8 items-center justify-center"
      >
        <Icon name="share-outline" size={16} color="textTertiary" />
      </button>
    </div>
  );
}

function SingleMarketCard({ market }: { market: MarketSummary }) {
  const router = useRouter();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/markets/${market.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/markets/${market.id}`);
      }}
      aria-label={`Open market: ${market.question}`}
      className="flex cursor-pointer flex-col gap-3 border-b border-border px-4 py-3 hover:bg-surface"
    >
      <div className="flex items-center gap-2.5">
        <MarketVisual imageUrl={market.imageUrl} fallbackIcon="trending-up-outline" />
        <Text variant="bodyStrong" numberOfLines={3} className="flex-1 font-inter-bold">
          {market.question}
        </Text>
      </div>

      {market.choices.length === 2 ? <BinaryMarketPreview market={market} /> : <ChoiceList choices={market.choices} />}

      <VolumeAndShare volume={market.volume} title={market.question} />
    </div>
  );
}

function BinaryMarketPreview({ market }: { market: MarketSummary }) {
  const firstChoice = market.choices[0];
  const secondChoice = market.choices[1];
  const history = useQuery({
    queryKey: ['market-price-history', market.id, '1D', firstChoice?.price, firstChoice?.index],
    queryFn: () => getMarketPriceHistory(market.id, '1D', firstChoice!.index),
    enabled: firstChoice != null,
    staleTime: 60_000,
  });
  if (!firstChoice || !secondChoice) return null;

  const points = history.data?.map((point) => point.price) ?? [];
  const chance = Math.round(firstChoice.price);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-[2fr_8fr] items-center gap-3">
        <div className="min-w-0">
          <Text variant="title" className="block tabular-nums">
            {chance}%
          </Text>
          <Text variant="micro" color="textTertiary">
            chance
          </Text>
        </div>
        <div className="min-w-0">
          {points.length >= 2 ? (
            <Sparkline points={points} positive={points[points.length - 1]! >= points[0]!} height={48} />
          ) : market.endDate ? (
            <Text variant="micro" color="textTertiary" className="block text-right">
              {formatTimeRemaining(market.endDate)}
            </Text>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <span className="truncate rounded-md bg-accent px-3 py-2 text-center text-xs font-semibold text-text-inverse">
          {firstChoice.label}
        </span>
        <span className="truncate rounded-md border border-white/15 bg-black px-3 py-2 text-center text-xs font-semibold text-text-primary">
          {secondChoice.label}
        </span>
      </div>
    </div>
  );
}

/** Three or more choices — the same `MiniPill` treatment the group
 * rows' Yes/No pills already use, one per choice, wrapping. When the
 * API actually provides an image for a choice, the pills switch to the
 * same image+label row `OutcomeRow` uses; the market's own image is
 * never substituted. Prices stay off this card (docs/DECISIONS.md,
 * "Price Only in Market Detail"). */
function ChoiceList({ choices }: { choices: MarketChoice[] }) {
  if (choices.length === 0) return null;

  if (choices.some((choice) => choice.imageUrl)) {
    return (
      <div className="flex flex-col gap-2">
        {choices.map((choice) => (
          <div key={choice.index} className="flex items-center gap-2">
            {choice.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={choice.imageUrl} alt="" className="h-6 w-6 flex-shrink-0 rounded-full object-cover" />
            ) : null}
            <Text variant="caption" numberOfLines={1} className="flex-1">
              {choice.label}
            </Text>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {choices.map((choice) => (
        <MiniPill key={choice.index} label={choice.label} tone={choiceTone(choice)} />
      ))}
    </div>
  );
}

const ROW_LIMIT = 4;

/**
 * A combo market (several named outcomes under one event) — still a
 * flat list row, just a taller one. **One click target only**: the whole
 * card opens the same Market Detail surface in event mode; the outcome
 * rows below are display-only (no separate press). Rows only show an
 * image when the API provides one that identifies the child — no
 * placeholder art, no shared league/tournament art.
 */
function GroupCard({ group }: { group: MarketGroupSummary }) {
  const router = useRouter();
  const visibleRows = group.outcomes.slice(0, ROW_LIMIT);
  const remaining = group.outcomes.length - visibleRows.length;
  const isHeadToHead = group.outcomes.length === 2;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/markets/${group.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/markets/${group.id}`);
      }}
      aria-label={`Open event: ${group.title}`}
      className="flex cursor-pointer flex-col gap-3 border-b border-border px-4 py-3 hover:bg-surface"
    >
      <div className="flex items-center gap-2.5">
        <MarketVisual imageUrl={group.imageUrl} fallbackIcon="trending-up-outline" />
        <Text variant="bodyStrong" numberOfLines={3} className="flex-1 font-inter-bold">
          {group.title}
        </Text>
      </div>

      <div className="flex flex-col gap-2">
        {visibleRows.map((row) => (
          <OutcomeRow key={row.id} row={row} large={isHeadToHead} />
        ))}
        {remaining > 0 ? (
          <Text variant="micro" color="textTertiary">
            +{remaining} more
          </Text>
        ) : null}
      </div>

      <VolumeAndShare volume={group.volume} title={group.title} />
    </div>
  );
}

function OutcomeRow({ row, large }: { row: MarketOutcomeRow; large: boolean }) {
  const avatarSize = large ? 32 : 22;

  return (
    <div className="flex items-center gap-2">
      {row.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.imageUrl}
          alt=""
          style={{ width: avatarSize, height: avatarSize }}
          className="flex-shrink-0 rounded-full object-cover"
        />
      ) : null}
      <Text variant={large ? 'body' : 'caption'} numberOfLines={1} className="flex-1">
        {row.label}
      </Text>
      <div className="flex flex-shrink-0 gap-1">
        {row.choices.slice(0, 2).map((choice) => (
          <MiniPill key={choice.index} label={choice.label} tone={choiceTone(choice)} />
        ))}
      </div>
    </div>
  );
}

const TONE_BLOCK_CLASS: Record<ChoiceTone, string> = {
  yes: 'bg-yes',
  no: 'bg-no',
  accent: 'bg-accent',
  neutral: 'border border-border bg-surface-elevated',
};

const TONE_TEXT_COLOR: Record<ChoiceTone, 'textInverse' | 'textPrimary'> = {
  yes: 'textInverse',
  no: 'textPrimary',
  accent: 'textInverse',
  neutral: 'textPrimary',
};

function MiniPill({ label, tone }: { label: string; tone: ChoiceTone }) {
  return (
    <div className={`rounded-full px-2.5 py-1 ${TONE_BLOCK_CLASS[tone]}`}>
      <Text variant="micro" color={TONE_TEXT_COLOR[tone]}>
        {label}
      </Text>
    </div>
  );
}

/** Loading placeholder: the flat row on phone, a card-shaped block on desktop. */
export function MarketCardSkeleton() {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
        <Skeleton width={40} height={40} className="rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton height={18} />
          <Skeleton height={18} className="w-3/4" />
        </div>
      </div>
      <div className={`hidden h-[248px] flex-col gap-4 p-4 lg:flex ${CARD_SURFACE_CLASS}`}>
        <div className="flex items-center gap-3">
          <Skeleton width={48} height={48} className="rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton height={14} />
            <Skeleton height={14} className="w-3/4" />
          </div>
        </div>
        <Skeleton height={112} className="rounded-md" />
      </div>
    </>
  );
}
