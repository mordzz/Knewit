'use client';

import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompactUsd } from '@/lib/formatters';
import type { MarketGroupSummary, MarketListItem, MarketOutcomeRow, MarketSummary } from '@/types/social';

export interface MarketCardProps {
  item: MarketListItem;
}

/**
 * Direct conversion of `apps/mobile`'s Markets tab card
 * (`features/markets/components/MarketCard`) — a flat, borderless list
 * row (same convention as `CallCard`), not a boxed card. No price
 * anywhere on this card (price/trading only ever appears in Market
 * Detail) — the choice *types* still show (Yes/No pills, or each
 * combo-market outcome's name + Yes/No pills), just not a probability
 * number. Every tap (the whole single-market row, or one of a group's
 * outcome rows) opens Market Detail — a group's own header does not
 * (see the comment inside `GroupCard`).
 */
export function MarketCard({ item }: MarketCardProps) {
  if (item.kind === 'group') {
    return <GroupCard group={item.group} />;
  }
  return <SingleMarketCard market={item.market} />;
}

async function shareMarket(title: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text: `${title}\n\nvia Knewit` });
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
  const isBinary = market.isBinary !== false;

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

      {!isBinary ? (
        <MultiOutcomeNotice outcomeCount={market.outcomeCount} />
      ) : (
        <div className="flex gap-2">
          <ChoiceBlock label={market.outcomeLabels?.yes ?? 'Yes'} color="yes" />
          <ChoiceBlock label={market.outcomeLabels?.no ?? 'No'} color="no" />
        </div>
      )}

      <VolumeAndShare volume={market.volume} title={market.question} />
    </div>
  );
}

const ROW_LIMIT = 4;

/**
 * A combo market (several named outcomes under one market entity) —
 * still a flat list row, just a taller one. `group.id` is Polymarket's
 * *event* id, not a market id — `GET /markets/:id` only ever resolves
 * a real market id — so this header is plain (not a link); only each
 * `OutcomeRow` below is a real market id and navigable.
 */
function GroupCard({ group }: { group: MarketGroupSummary }) {
  const visibleRows = group.outcomes.slice(0, ROW_LIMIT);
  const remaining = group.outcomes.length - visibleRows.length;
  const isHeadToHead = group.outcomes.length === 2;

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
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
  const router = useRouter();
  const avatarSize = large ? 32 : 22;

  return (
    <button
      type="button"
      onClick={() => router.push(`/markets/${row.id}`)}
      aria-label={row.label}
      className="flex items-center gap-2 text-left transition-opacity hover:opacity-70"
    >
      {row.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.imageUrl}
          alt=""
          style={{ width: avatarSize, height: avatarSize }}
          className="flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          style={{ width: avatarSize, height: avatarSize }}
          className="flex flex-shrink-0 items-center justify-center rounded-full bg-accent-muted"
        >
          <Icon name="person-outline" size={Math.round(avatarSize * 0.55)} color="accent" />
        </div>
      )}
      <Text variant={large ? 'body' : 'caption'} numberOfLines={1} className="flex-1">
        {row.label}
      </Text>
      <div className="flex flex-shrink-0 gap-1">
        <MiniPill label="Yes" color="yes" />
        <MiniPill label="No" color="no" />
      </div>
    </button>
  );
}

function ChoiceBlock({ label, color }: { label: string; color: 'yes' | 'no' }) {
  const bgClass = color === 'yes' ? 'bg-yes' : 'bg-no';
  const textColor = color === 'yes' ? 'textInverse' : 'textPrimary';
  return (
    <div className={`flex-1 items-center rounded-md px-3 py-2.5 text-center ${bgClass}`}>
      <Text variant="bodyStrong" color={textColor}>
        {label}
      </Text>
    </div>
  );
}

function MiniPill({ label, color }: { label: string; color: 'yes' | 'no' }) {
  const bgClass = color === 'yes' ? 'bg-yes' : 'bg-no';
  const textColor = color === 'yes' ? 'textInverse' : 'textPrimary';
  return (
    <div className={`rounded-full px-2.5 py-1 ${bgClass}`}>
      <Text variant="micro" color={textColor}>
        {label}
      </Text>
    </div>
  );
}

function MultiOutcomeNotice({ outcomeCount }: { outcomeCount?: number | null }) {
  const label = outcomeCount != null ? `${outcomeCount} outcomes` : 'Multiple outcomes';

  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-elevated p-2.5">
      <Icon name="layers-outline" size={16} color="textSecondary" />
      <Text variant="caption" color="textSecondary" className="flex-1">
        {label} · not available for YES/NO trading yet
      </Text>
    </div>
  );
}

/** Loading placeholder matching the single-market row's shape, so a
 * loading list doesn't visually jump once real rows swap in. */
export function MarketCardSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Skeleton width={40} height={40} className="rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton height={18} />
        <Skeleton height={18} className="w-3/4" />
      </div>
    </div>
  );
}
