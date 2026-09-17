'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { Skeleton } from '@/components/ui/Skeleton';
import { TabRow, type TabRowOption } from '@/components/ui/TabRow';

import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SocialActionBar } from '@/components/SocialActionBar';
import { TradingPanel, TradeSheet } from '@/components/TradingPanel';
import { MyPositionCard } from '@/components/MyPositionCard';
import { MarketPriceChart } from '@/components/MarketPriceChart';
import { EventPriceChart } from '@/components/EventPriceChart';
import { CallCard } from '@/components/CallCard';
import { useMarket } from '@/hooks/useMarket';
import { useMarketActivity } from '@/hooks/useMarketActivity';
import { useTopHolders } from '@/hooks/useTopHolders';
import { useMarketPosition } from '@/hooks/useMarketPosition';
import { useEvent } from '@/hooks/useEvent';
import { useEventActivity } from '@/hooks/useEventActivity';
import { useEventHolders } from '@/hooks/useEventHolders';
import { usePrivy } from '@privy-io/react-auth';
import { ApiRequestError } from '@/lib/apiClient';
import { formatCompactUsd, formatRelativeTime, formatUsd } from '@/lib/formatters';
import type { EventDetail, EventHolderRow, FeedItem, MarketDetail, MarketHolder, MarketSummary } from '@/types/social';

type DetailTab = 'about' | 'comments' | 'holders';

const DETAIL_TAB_OPTIONS: TabRowOption<DetailTab>[] = [
  { key: 'about', label: 'About' },
  { key: 'comments', label: 'Callouts' },
  { key: 'holders', label: 'Top Holders' },
];

/** Compact date for market open/end dates, e.g. "Dec 31, 2026". */
function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Direct conversion of `apps/mobile`'s `MarketDetailScreen` — bare
 * image + title header (back button inline to its left), a real
 * dual-line YES/NO `MarketPriceChart` for binary markets (backed by
 * `GET /markets/:id/price-history`, Polymarket's own CLOB price
 * history, proxied — not fabricated), a real `TradingPanel`
 * (BottomSheet-based Trade flow, same as mobile), a real
 * `MyPositionCard` when the viewer holds one, and Callouts/Top Holders
 * tabs.
 */
/**
 * One detail surface for both a single market and a grouped event —
 * `id` is tried as a market first (`GET /markets/:id`), and only when
 * that honestly 404s is it treated as an event (`GET /events/:id`).
 * Event mode renders the same page shape (hero, chart, tabs) with one
 * chart line per child market, a Trade button per child that opens the
 * shared `TradeSheet` in place, and combined Callouts/Top Holders —
 * there is no separate event page.
 */
export function MarketDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { user } = usePrivy();
  const isConnected = !!user?.wallet?.address;
  const [tab, setTab] = useState<DetailTab>('about');
  const [tradeMarketId, setTradeMarketId] = useState<string | null>(null);

  const market = useMarket(id);
  const marketIsMissing =
    market.status === 'error' && market.error instanceof ApiRequestError && market.error.status === 404;
  const event = useEvent(id, { enabled: marketIsMissing });
  const position = useMarketPosition(id, { enabled: market.status === 'success' });
  const tradeMarket = useMarket(tradeMarketId ?? '', { enabled: tradeMarketId != null });

  const openAuthor = (userId: string) => router.push(`/profile/${userId}`);
  const openPost = (postId: string) => router.push(`/calls/${postId}`);
  const openTrade = (childId: string) => {
    if (!isConnected) {
      router.push('/wallet');
      return;
    }
    setTradeMarketId(childId);
  };

  const isEventMode = marketIsMissing;
  const eventIsMissing =
    event.status === 'error' && event.error instanceof ApiRequestError && event.error.status === 404;
  // A plain market id never reaches event mode; only an event id that
  // 404s both lookups is honestly "not found".
  const isNotFound = isEventMode && eventIsMissing;
  const pending = isEventMode ? event.status === 'pending' : market.status === 'pending';

  return (
    <div className="flex h-full w-full flex-col pt-4">
      {!(market.status === 'success' || (isEventMode && event.status === 'success')) ? (
        <div className="flex flex-shrink-0 items-center px-4 pb-2">
          <button type="button" onClick={() => router.back()} aria-label="Go back">
            <Icon name="chevron-back" size={24} />
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        {pending ? <MarketDetailSkeleton /> : null}

        {isNotFound ? (
          <EmptyState
            icon="search"
            title="Market not found"
            message="This market may have been removed or the link is incorrect."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        ) : null}

        {isEventMode && event.status === 'error' && !eventIsMissing ? (
          <div className="px-4">
            <ErrorState message="Unable to load event. Try again." onRetry={() => event.refetch()} />
          </div>
        ) : null}

        {!isEventMode && market.status === 'error' && !isNotFound ? (
          <div className="px-4">
            <ErrorState message="Unable to load market. Try again." onRetry={() => market.refetch()} />
          </div>
        ) : null}

        {!isEventMode && market.status === 'success' ? (
          <>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <MarketHero market={market.data} onBack={() => router.back()} />
              {market.data.choices.length > 0 ? (
                <MarketPriceChart marketId={id} choices={market.data.choices} />
              ) : null}
              {position.status === 'success' && position.data ? (
                <MyPositionCard
                  position={position.data}
                  liveCurrentPriceCents={
                    market.data.choices.find((c) => c.index === position.data?.choiceIndex)?.price ?? null
                  }
                />
              ) : null}
              <TradingPanel market={market.data} />
            </div>

            <TabRow options={DETAIL_TAB_OPTIONS} value={tab} onChange={setTab} />

            {tab === 'about' ? <AboutTab market={market.data} /> : null}
            {tab === 'comments' ? <CommentsTab marketId={id} onOpenAuthor={openAuthor} onOpenPost={openPost} /> : null}
            {tab === 'holders' ? <HoldersTab marketId={id} /> : null}
          </>
        ) : null}

        {isEventMode && event.status === 'success' ? (
          <>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <EventHero event={event.data} onBack={() => router.back()} />
              <EventPriceChart markets={event.data.markets} />

              <div className="flex flex-col gap-1">
                <Text variant="bodyStrong" className="block pb-1">
                  All markets
                </Text>
                {event.data.markets.map((child) => (
                  <EventMarketRow key={child.id} market={child} onTrade={() => openTrade(child.id)} />
                ))}
              </div>
            </div>

            <TabRow options={DETAIL_TAB_OPTIONS} value={tab} onChange={setTab} />

            {tab === 'about' ? <EventAboutTab event={event.data} /> : null}
            {tab === 'comments' ? <EventCalloutsTab eventId={id} /> : null}
            {tab === 'holders' ? (
              <EventHoldersTab eventId={id} markets={event.data.markets} />
            ) : null}
          </>
        ) : null}
      </div>

      <TradeSheet
        market={tradeMarket.data ?? null}
        visible={tradeMarketId != null}
        onClose={() => setTradeMarketId(null)}
      />
    </div>
  );
}

function EventHero({ event, onBack }: { event: EventDetail; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onBack} aria-label="Go back">
        <Icon name="chevron-back" size={24} />
      </button>
      <MarketVisual imageUrl={event.imageUrl} fallbackIcon="trending-up-outline" size={48} />
      <Text variant="title" numberOfLines={3} className="flex-1 font-inter-bold">
        {event.title}
      </Text>
    </div>
  );
}

/**
 * One child market row — headline is the API's short `label` (what the
 * group card showed), long question as secondary text. The row itself is
 * display-only (no click, no hover); the only action is the yellow Trade
 * button, which opens the shared `TradeSheet` for this child in place.
 */
function EventMarketRow({ market, onTrade }: { market: MarketSummary; onTrade: () => void }) {
  const headline = market.label ?? market.question;

  return (
    <div className="flex items-center gap-3 border-b border-border py-3">
      {market.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={market.imageUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-xl object-cover" />
      ) : null}
      <div className="flex flex-1 flex-col gap-0.5">
        <Text variant="bodyStrong" numberOfLines={2}>
          {headline}
        </Text>
        {market.label ? (
          <Text variant="caption" color="textTertiary" numberOfLines={2}>
            {market.question}
          </Text>
        ) : null}
      </div>
      <Button
        variant="primary"
        label="Trade"
        onClick={onTrade}
        className="min-h-0 px-4 py-2"
      />
    </div>
  );
}

function EventAboutTab({ event }: { event: EventDetail }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <EventAboutSection title="About">
        <Text variant="body" color="textSecondary" className="block">
          {event.description ?? 'No description was provided for this event.'}
        </Text>
      </EventAboutSection>

      <EventAboutSection title="Dates">
        <EventAboutRow label="Ends" value={event.endDate ? formatShortDate(event.endDate) : 'No end date'} />
      </EventAboutSection>

      <EventAboutSection title="Statistics">
        <EventAboutRow label="Volume" value={event.volume != null ? formatCompactUsd(event.volume) : 'Unavailable'} />
        <EventAboutRow label="Liquidity" value={event.liquidity != null ? formatUsd(event.liquidity) : 'Unavailable'} />
      </EventAboutSection>
    </div>
  );
}

function EventAboutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-3">
      <Text variant="bodyStrong">{title}</Text>
      {children}
    </div>
  );
}

function EventAboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption">{value}</Text>
    </div>
  );
}

function EventCalloutsTab({ eventId }: { eventId: string }) {
  const activity = useEventActivity(eventId);

  if (activity.status === 'pending') {
    return (
      <div className="px-4">
        <LoadingState rows={3} />
      </div>
    );
  }
  if (activity.status === 'error') {
    return (
      <div className="px-4">
        <ErrorState message="Couldn't load callouts." onRetry={() => activity.refetch()} />
      </div>
    );
  }
  if (activity.data.length === 0) {
    return (
      <EmptyState
        icon="chatbubble-outline"
        title="No callouts yet"
        message="Callouts referencing any market in this event will show up here."
      />
    );
  }

  return (
    <div>
      {activity.data.map((item) => (
        <CallCard key={item.id} item={item} />
      ))}
    </div>
  );
}

/**
 * Event Top Holders — rows stay per market+outcome, with a horizontally
 * **dropdown** (a native select listing the event's child markets)
 * narrowing the list to one market (`?market=` on the endpoint).
 */
function EventHoldersTab({ eventId, markets }: { eventId: string; markets: MarketSummary[] }) {
  // Polymarket's holder data is per market, so there is no honest "all
  // markets" list — the tab defaults to the event's largest market and
  // the dropdown switches between children.
  const defaultMarket = useMemo(
    () => [...markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0] ?? null,
    [markets]
  );
  const [marketFilter, setMarketFilter] = useState<string | null>(defaultMarket?.id ?? null);
  const holders = useEventHolders(eventId, marketFilter ?? undefined);

  return (
    <div>
      <div className="px-4 pb-3 pt-3">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2.5">
          <select
            value={marketFilter ?? ''}
            onChange={(e) => setMarketFilter(e.target.value)}
            aria-label="Filter holders by market"
            className="flex-1 bg-transparent text-caption text-text-primary outline-none"
          >
            {markets.map((market) => (
              <option key={market.id} value={market.id} className="bg-surface text-text-primary">
                {market.label ?? market.question}
              </option>
            ))}
          </select>
        </label>
      </div>

      {holders.status === 'pending' ? (
        <div className="px-4">
          <LoadingState rows={3} />
        </div>
      ) : holders.status === 'error' ? (
        <div className="px-4">
          <ErrorState message="Couldn't load holders." onRetry={() => holders.refetch()} />
        </div>
      ) : holders.data.length === 0 ? (
        <EmptyState
          icon="person-outline"
          title="No holders yet"
          message="Holders of this market will show up here."
        />
      ) : (
        <div>
          {holders.data.map((holder) => (
            <EventHolderRowView key={holder.id} holder={holder} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventHolderRowView({ holder }: { holder: EventHolderRow }) {
  const color = choiceTextColor(choiceTone({ index: 0, label: holder.outcome }));

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Avatar uri={holder.user.avatarUrl} fallbackLabel={holder.user.displayName} size={36} />
      <div className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1} className="block">
          {holder.user.displayName}
        </Text>
        <Text variant="caption" color="textTertiary" numberOfLines={1} className="block">
          {holder.marketLabel}
        </Text>
      </div>
      <div className="text-right">
        <Text variant="bodyStrong" color={color} className="block">
          {holder.outcome}
        </Text>
        <Text variant="caption" color="textSecondary">
          {holder.shares.toFixed(1)} shares
        </Text>
      </div>
    </div>
  );
}

function MarketHero({ market, onBack }: { market: MarketDetail; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onBack} aria-label="Go back">
        <Icon name="chevron-back" size={24} />
      </button>
      <MarketVisual imageUrl={market.imageUrl} fallbackIcon="trending-up-outline" size={48} />
      <div className="flex flex-1 flex-col gap-0.5">
        <Text variant="title" numberOfLines={3} className="font-inter-bold">
          {market.label ?? market.question}
        </Text>
        {/* A grouped child keeps the long question as a subtitle so the
            headline matches what was clicked on the event page. */}
        {market.label ? (
          <Text variant="caption" color="textTertiary" numberOfLines={2}>
            {market.question}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Market Detail's "About" tab — rules text, resolution state, dates and
 * the volume/liquidity figures already on the summary. Built only from
 * fields the API actually returns; a missing field shows its own honest
 * fallback, never an invented value.
 */
function AboutTab({ market }: { market: MarketDetail }) {
  const resolution = market.resolved
    ? market.resolvedOutcome
      ? `Resolved ${market.resolvedOutcome === 'YES' ? 'Yes' : 'No'}.`
      : 'This market has resolved.'
    : market.closed
      ? 'Trading closed — awaiting resolution.'
      : 'Not resolved yet — this market is still open.';

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <AboutSection title="Rules">
        <Text variant="body" color="textSecondary" className="block">
          {market.rules ?? 'No rules text was provided for this market.'}
        </Text>
      </AboutSection>

      <AboutSection title="Resolution">
        <Text variant="body" color="textSecondary" className="block">
          {resolution}
        </Text>
      </AboutSection>

      <AboutSection title="Dates">
        <AboutRow label="Opened" value={market.openedAt ? formatShortDate(market.openedAt) : 'Unknown'} />
        <AboutRow label="Ends" value={market.endDate ? formatShortDate(market.endDate) : 'No end date'} />
      </AboutSection>

      <AboutSection title="Statistics">
        <AboutRow label="Volume" value={market.volume != null ? formatCompactUsd(market.volume) : 'Unavailable'} />
        <AboutRow label="Liquidity" value={market.liquidity != null ? formatUsd(market.liquidity) : 'Unavailable'} />
      </AboutSection>
    </div>
  );
}

function AboutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-3">
      <Text variant="bodyStrong">{title}</Text>
      {children}
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption">{value}</Text>
    </div>
  );
}

function CommentsTab({
  marketId,
  onOpenAuthor,
  onOpenPost,
}: {
  marketId: string;
  onOpenAuthor: (userId: string) => void;
  onOpenPost: (postId: string) => void;
}) {
  const activity = useMarketActivity(marketId);

  if (activity.status === 'pending') {
    return (
      <div className="px-4">
        <LoadingState rows={3} />
      </div>
    );
  }
  if (activity.status === 'error') {
    return (
      <div className="px-4">
        <ErrorState message="Couldn't load comments." onRetry={() => activity.refetch()} />
      </div>
    );
  }
  if (activity.data.length === 0) {
    return <EmptyState icon="chatbubble-outline" title="No comments yet" message="Posts and Calls about this market will show up here." />;
  }

  return (
    <div>
      {activity.data.map((item) => (
        <MarketActivityRow key={item.id} item={item} onOpenAuthor={onOpenAuthor} onOpenPost={onOpenPost} />
      ))}
    </div>
  );
}

function MarketActivityRow({
  item,
  onOpenAuthor,
  onOpenPost,
}: {
  item: FeedItem;
  onOpenAuthor: (userId: string) => void;
  onOpenPost: (postId: string) => void;
}) {
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => onOpenPost(item.id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpenPost(item.id)}
      aria-label={`Open post by ${item.author.displayName}`}
      className="flex cursor-pointer gap-3 border-b border-border px-4 py-3 hover:bg-surface"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenAuthor(item.author.id);
        }}
        aria-label={`Open ${item.author.displayName}'s profile`}
      >
        <Avatar uri={item.author.avatarUrl} fallbackLabel={item.author.displayName} size={36} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1">
          <Text variant="bodyStrong" numberOfLines={1} className="truncate">
            {item.author.displayName}
          </Text>
          <Text variant="caption" color="textTertiary">
            @{item.author.handle} · {formatRelativeTime(item.createdAt)}
          </Text>
        </div>
        <Text variant="body" className="mt-0.5 block">
          {item.body}
        </Text>
        <div onClick={(e) => e.stopPropagation()}>
          <SocialActionBar
            postId={item.id}
            liked={item.liked}
            likeCount={item.likeCount}
            commentCount={item.commentCount}
            onPressComment={() => onOpenPost(item.id)}
          />
        </div>
      </div>
    </div>
  );
}

function HoldersTab({ marketId }: { marketId: string }) {
  const holders = useTopHolders(marketId);

  if (holders.status === 'pending') {
    return (
      <div className="px-4">
        <LoadingState rows={3} />
      </div>
    );
  }
  if (holders.status === 'error') {
    return (
      <div className="px-4">
        <ErrorState message="Couldn't load holders." onRetry={() => holders.refetch()} />
      </div>
    );
  }
  if (holders.data.length === 0) {
    return <EmptyState icon="person-outline" title="No holders yet" message="Positions in this market will show up here." />;
  }

  return (
    <div>
      {holders.data.map((holder) => (
        <HolderRow key={holder.id} holder={holder} />
      ))}
    </div>
  );
}

function HolderRow({ holder }: { holder: MarketHolder }) {
  const color = choiceTextColor(choiceTone({ index: 0, label: holder.outcome }));

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Avatar uri={holder.avatarUrl} fallbackLabel={holder.displayName} size={36} />
      <Text variant="bodyStrong" numberOfLines={1} className="flex-1">
        {holder.displayName}
      </Text>
      <div className="text-right">
        <Text variant="bodyStrong" color={color} className="block">
          {holder.outcome}
        </Text>
        <Text variant="caption" color="textSecondary">
          {holder.shares.toFixed(1)} shares
        </Text>
      </div>
    </div>
  );
}

function MarketDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex items-center gap-3">
        <Skeleton width={24} height={24} className="rounded-md" />
        <Skeleton width={48} height={48} className="rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton height={20} />
          <Skeleton height={20} className="w-2/3" />
        </div>
      </div>
      <Skeleton height={140} className="rounded-lg" />
    </div>
  );
}
