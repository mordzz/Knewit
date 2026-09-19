'use client';

import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompactUsd } from '@/lib/formatters';
import { choiceTone, type ChoiceTone } from '@/lib/choiceTone';
import type { MarketChoice } from '@/types/market';
import type { MarketGroupSummary, MarketListItem, MarketOutcomeRow, MarketSummary } from '@/types/social';

export interface MarketCardProps {
  item: MarketListItem;
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
export function MarketCard({ item }: MarketCardProps) {
  if (item.kind === 'group') {
    // One click target only: the whole card opens the same Market Detail
    // surface in event mode; the rows below are display-only.
    return <GroupCard group={item.group} />;
  }
  return <SingleMarketCard market={item.market} />;
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

      {market.choices.length === 2 ? (
        <div className="flex gap-2">
          {market.choices.map((choice) => (
            <ChoiceBlock key={choice.index} label={choice.label} tone={choiceTone(choice)} />
          ))}
        </div>
      ) : (
        <ChoiceList choices={market.choices} />
      )}

      <VolumeAndShare volume={market.volume} title={market.question} />
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

function ChoiceBlock({ label, tone }: { label: string; tone: ChoiceTone }) {
  return (
    <div className={`flex-1 items-center rounded-md px-3 py-2.5 text-center ${TONE_BLOCK_CLASS[tone]}`}>
      <Text variant="bodyStrong" color={TONE_TEXT_COLOR[tone]}>
        {label}
      </Text>
    </div>
  );
}

function MiniPill({ label, tone }: { label: string; tone: ChoiceTone }) {
  return (
    <div className={`rounded-full px-2.5 py-1 ${TONE_BLOCK_CLASS[tone]}`}>
      <Text variant="micro" color={TONE_TEXT_COLOR[tone]}>
        {label}
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
