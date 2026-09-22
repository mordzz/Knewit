'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TabRow, type TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CallCard } from '@/components/CallCard';
import { CalloutComposerPanel } from '@/components/CalloutComposerPanel';
import { TrendingMarketsPanel } from '@/components/TrendingMarketsPanel';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { useFollowingFeed } from '@/hooks/useFollowingFeed';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useBuyWithCardFlow } from '@/features/wallet/hooks/useBuyWithCardFlow';
import { useSession } from '@/hooks/useSession';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { formatUsd } from '@/lib/formatters';
import { PageHeader } from '@/components/ui/PageHeader';

type FeedTabKey = 'forYou' | 'following';

const FEED_TAB_OPTIONS: TabRowOption<FeedTabKey>[] = [
  { key: 'forYou', label: 'Trending' },
  { key: 'following', label: 'Following' },
];

/**
 * Direct conversion of `apps/mobile`'s `HomeScreen` — same two tabs
 * (labeled "Trending", not "For You" — the backend's `/feed` has no
 * personalization behind it, see docs/DECISIONS.md), same balance +
 * Deposit header, same infinite-scroll feed (an `IntersectionObserver`
 * sentinel replaces `FlatList`'s `onEndReached`).
 */
export default function CalloutsPage() {
  const router = useRouter();
  const { canUseApp } = useSession();
  const [tab, setTab] = useState<FeedTabKey>('forYou');
  const feed = useHomeFeed('trending');
  const followingFeed = useFollowingFeed();
  const isDesktop = useIsDesktop();

  const tabs = <TabRow options={FEED_TAB_OPTIONS} value={tab} onChange={setTab} />;

  if (tab === 'following') {
    if (!canUseApp) {
      return (
        <CalloutsLayout isDesktop={isDesktop}>
          <Header isDesktop={isDesktop} />
          {tabs}
          <EmptyState
            icon="person-outline"
            title="Sign in to see your Following feed"
            message="Calls from accounts you follow will show up here once you're signed in."
            actionLabel="Connect Wallet"
            onAction={() => router.push('/sign-in')}
          />
        </CalloutsLayout>
      );
    }

    if (followingFeed.status === 'pending') {
      return (
        <CalloutsLayout isDesktop={isDesktop}>
          <Header isDesktop={isDesktop} />
          {tabs}
          <div className="px-4 pt-4">
            <LoadingState rows={4} />
          </div>
        </CalloutsLayout>
      );
    }

    if (followingFeed.status === 'error') {
      return (
        <CalloutsLayout isDesktop={isDesktop}>
          <Header isDesktop={isDesktop} />
          {tabs}
          <ErrorState message="Couldn't load your Following feed." onRetry={() => followingFeed.refetch()} />
        </CalloutsLayout>
      );
    }

    const followingItems = followingFeed.data.pages.flatMap((page) => page.items);

    return (
      <CalloutsLayout isDesktop={isDesktop}>
        <Header isDesktop={isDesktop} />
        {tabs}
        {followingItems.length === 0 ? (
          <EmptyState
            icon="person-outline"
            title="Your feed is quiet"
            message="Follow traders and creators to see their Calls here."
            actionLabel="Find people to follow"
            onAction={() => router.push('/search')}
          />
        ) : (
          followingItems.map((item) => <CallCard key={item.id} item={item} />)
        )}
        <InfiniteScrollSentinel
          hasNextPage={!!followingFeed.hasNextPage}
          isFetchingNextPage={followingFeed.isFetchingNextPage}
          onLoadMore={() => followingFeed.fetchNextPage()}
        />
      </CalloutsLayout>
    );
  }

  if (feed.status === 'pending') {
    return (
      <CalloutsLayout isDesktop={isDesktop}>
        <Header isDesktop={isDesktop} />
        {tabs}
        <div className="px-4 pt-2">
          <LoadingState rows={4} />
        </div>
      </CalloutsLayout>
    );
  }

  if (feed.status === 'error') {
    return (
      <CalloutsLayout isDesktop={isDesktop}>
        <Header isDesktop={isDesktop} />
        {tabs}
        <ErrorState message="Couldn't load your feed." onRetry={() => feed.refetch()} />
      </CalloutsLayout>
    );
  }

  const items = feed.data.pages.flatMap((page) => page.items);

  return (
    <CalloutsLayout isDesktop={isDesktop}>
      <Header isDesktop={isDesktop} />
      {tabs}
      {items.length === 0 ? (
        <EmptyState icon="heart-outline" title="No Calls yet" message="Be the first to back a prediction and post about it." />
      ) : (
        items.map((item) => <CallCard key={item.id} item={item} />)
      )}
      <InfiniteScrollSentinel
        hasNextPage={!!feed.hasNextPage}
        isFetchingNextPage={feed.isFetchingNextPage}
        onLoadMore={() => feed.fetchNextPage()}
      />
      {!feed.hasNextPage && items.length > 0 ? (
        <Text variant="caption" color="textTertiary" className="block py-4 text-center">
          You&apos;re all caught up
        </Text>
      ) : null}
    </CalloutsLayout>
  );
}

/**
 * Phone: the edge-to-edge list, unchanged. Desktop (`lg:`): a full-width
 * page with a title, the feed on the left, and a sticky New Callout
 * composer on the right instead of the phone's floating button.
 */
function CalloutsLayout({ isDesktop, children }: { isDesktop: boolean; children: React.ReactNode }) {
  if (!isDesktop) return <main className="w-full">{children}</main>;
  return (
    <main className="w-full py-8">
      <PageHeader title="Callouts" subtitle="Share your market views and follow the conversation." />
      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-8">
        <div className="min-w-0">{children}</div>
        <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-y-auto [&>*]:shrink-0">
          <CalloutComposerPanel />
          <TrendingMarketsPanel />
        </div>
      </div>
    </main>
  );
}

/** Web equivalent of `FlatList`'s `onEndReached` — an `IntersectionObserver`
 * on a sentinel div at the bottom of the list, same 0.4 threshold
 * (`rootMargin` approximates it) as mobile's `onEndReachedThreshold`. */
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

/**
 * Single row: balance on the left, Deposit on the right, separated
 * from the tabs below by a hairline bottom border. Balance is the real
 * USDC collateral read from Polymarket's CLOB (`useWalletBalance`) —
 * "—" when it's unavailable (no wallet, or signing not delegated yet),
 * never a fabricated `$0.00`. Deposit opens Privy's funding flow once a
 * wallet exists; before that it routes to sign-in like any gated action.
 */
function Header({ isDesktop }: { isDesktop: boolean }) {
  const router = useRouter();
  const { canUseApp, walletConnected } = useSession();
  const balance = useWalletBalance();
  const { isBuying, buyError, handleBuyWithCard } = useBuyWithCardFlow();

  const balanceLabel = balance.data?.usdc != null ? formatUsd(balance.data.usdc) : '—';

  const handleDeposit = () => {
    if (!canUseApp || !walletConnected) {
      router.push('/sign-in');
      return;
    }
    void handleBuyWithCard();
  };

  // Desktop's `TopHeader` already shows balance + Deposit above every page.
  if (isDesktop) return null;

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <Text className="text-4xl font-bold">{balanceLabel}</Text>
        <Button
          label={isBuying ? 'Depositing…' : 'Deposit'}
          loading={isBuying}
          onClick={handleDeposit}
          className="min-h-0 px-4 py-2"
        />
      </div>
      {buyError ? (
        <Text variant="caption" color="danger" className="mt-1 block">
          {buyError}
        </Text>
      ) : null}
    </div>
  );
}
