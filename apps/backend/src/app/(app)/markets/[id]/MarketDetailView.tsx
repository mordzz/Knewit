'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Skeleton } from '@/components/ui/Skeleton';
import { TabRow, type TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SocialActionBar } from '@/components/SocialActionBar';
import { TradingPanel } from '@/components/TradingPanel';
import { MyPositionCard } from '@/components/MyPositionCard';
import { MarketPriceChart } from '@/components/MarketPriceChart';
import { useMarket } from '@/hooks/useMarket';
import { useMarketActivity } from '@/hooks/useMarketActivity';
import { useTopHolders } from '@/hooks/useTopHolders';
import { useMarketPosition } from '@/hooks/useMarketPosition';
import { ApiRequestError } from '@/lib/apiClient';
import { formatRelativeTime } from '@/lib/formatters';
import type { FeedItem, MarketDetail, MarketHolder } from '@/types/social';

type DetailTab = 'comments' | 'holders';

const DETAIL_TAB_OPTIONS: TabRowOption<DetailTab>[] = [
  { key: 'comments', label: 'Callouts' },
  { key: 'holders', label: 'Top Holders' },
];

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
export function MarketDetailView({ marketId }: { marketId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<DetailTab>('comments');
  const market = useMarket(marketId);
  const position = useMarketPosition(marketId);

  const openAuthor = (userId: string) => router.push(`/profile/${userId}`);
  const openPost = (postId: string) => router.push(`/calls/${postId}`);

  const isNotFound = market.status === 'error' && market.error instanceof ApiRequestError && market.error.status === 404;

  return (
    <div className="flex h-full w-full flex-col pt-4">
      {market.status !== 'success' ? (
        <div className="flex flex-shrink-0 items-center px-4 pb-2">
          <button type="button" onClick={() => router.back()} aria-label="Go back">
            <Icon name="chevron-back" size={24} />
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        {market.status === 'pending' ? <MarketDetailSkeleton /> : null}

        {market.status === 'error' && isNotFound ? (
          <EmptyState
            icon="search"
            title="Market not found"
            message="This market may have been removed or the link is incorrect."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        ) : null}

        {market.status === 'error' && !isNotFound ? (
          <div className="px-4">
            <ErrorState message="Unable to load market. Try again." onRetry={() => market.refetch()} />
          </div>
        ) : null}

        {market.status === 'success' ? (
          <>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <MarketHero market={market.data} onBack={() => router.back()} />
              {market.data.isBinary === false ? (
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <MultiOutcomeNotice outcomeCount={market.data.outcomeCount} />
                </div>
              ) : (
                <MarketPriceChart marketId={marketId} labels={market.data.outcomeLabels ?? { yes: 'Yes', no: 'No' }} />
              )}
              {position.status === 'success' && position.data ? (
                <MyPositionCard
                  position={position.data}
                  liveCurrentPriceCents={position.data.outcome === 'YES' ? market.data.yesPrice : market.data.noPrice}
                />
              ) : null}
              <TradingPanel market={market.data} />
            </div>

            <TabRow options={DETAIL_TAB_OPTIONS} value={tab} onChange={setTab} />

            {tab === 'comments' ? <CommentsTab marketId={marketId} onOpenAuthor={openAuthor} onOpenPost={openPost} /> : null}
            {tab === 'holders' ? <HoldersTab marketId={marketId} /> : null}
          </>
        ) : null}
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
      <Text variant="title" numberOfLines={3} className="flex-1 font-inter-bold">
        {market.question}
      </Text>
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
  const color = holder.outcome === 'YES' ? 'yes' : 'no';

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

function MultiOutcomeNotice({ outcomeCount }: { outcomeCount?: number | null }) {
  const label = outcomeCount != null ? `${outcomeCount} outcomes` : 'Multiple outcomes';

  return (
    <div className="flex items-center gap-2">
      <Icon name="layers-outline" size={16} color="textSecondary" />
      <Text variant="caption" color="textSecondary" className="flex-1">
        {label} · not available for YES/NO trading yet
      </Text>
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
