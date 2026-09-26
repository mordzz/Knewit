'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LeaderboardUserCard } from '@/components/LeaderboardUserCard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Direct conversion of `apps/mobile`'s `LeaderboardScreen`  Polymarket's
 * own global ranking, read-only (docs/DECISIONS.md, "Round 6"): no
 * Follow button, no profile links, a row is a ranked Polymarket trader
 * identified by proxy wallet, never a Knewit account. Every rank uses the
 * same row layout, with a subtle gold/silver/bronze treatment for the top 3.
 *
 * No viewer-relative row at all: the old "Your Rank" self-standing line
 * was removed by request, UI and backend alike (docs/DECISIONS.md, "Your
 * Rank Removed From the Leaderboard").
 */
export default function LeaderboardPage() {
  const leaderboard = useLeaderboard();

  const items = useMemo(() => leaderboard.data?.pages.flatMap((page) => page.items) ?? [], [leaderboard.data]);

  const mobileTitleBlock = (
    <div>
      <Text variant="heading" className="block px-4 pb-3 pt-2 text-4xl font-inter-extrabold">
        Leaderboard
      </Text>
      <Divider />
    </div>
  );

  const titleBlock = (
    <>
      <div className="hidden lg:block">
        <PageHeader title="Leaderboard" subtitle="See how traders are performing across the platform." />
      </div>
      <div className="lg:hidden">{mobileTitleBlock}</div>
    </>
  );

  if (leaderboard.status === 'pending') {
    return (
      <main className="w-full lg:py-8">
        {titleBlock}
        <div className="px-4 pt-3">
          <LoadingState rows={5} />
        </div>
      </main>
    );
  }

  if (leaderboard.status === 'error') {
    return (
      <main className="w-full lg:py-8">
        {titleBlock}
        <ErrorState message="Unable to load leaderboard." onRetry={() => leaderboard.refetch()} />
      </main>
    );
  }

  return (
    <main className="w-full lg:py-8">
      {titleBlock}

      {items.length === 0 ? (
        <div className="px-4">
          <EmptyState
            icon="trophy-outline"
            title="No leaderboard data yet"
            message="Polymarket's ranked traders will appear here when the ranking is available."
          />
        </div>
      ) : (
        <div className="pt-3">
          {items.map((entry) => (
            <LeaderboardUserCard key={entry.user.id} entry={entry} />
          ))}
          <InfiniteScrollSentinel
            hasNextPage={!!leaderboard.hasNextPage}
            isFetchingNextPage={leaderboard.isFetchingNextPage}
            onLoadMore={() => leaderboard.fetchNextPage()}
          />
        </div>
      )}

      {/* Bottom clearance so the last row never sits flush against the
          tab bar. */}
      <div className="h-6" />
    </main>
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
