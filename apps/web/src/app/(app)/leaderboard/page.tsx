'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LeaderboardUserCard } from '@/components/LeaderboardUserCard';
import { TopPerformers } from '@/components/TopPerformers';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import type { LeaderboardEntry } from '@/types/leaderboard';

/**
 * Direct conversion of `apps/mobile`'s `LeaderboardScreen` — Polymarket's
 * own global ranking, read-only (docs/DECISIONS.md, "Round 6"): no
 * Follow button, no profile links, a row is a ranked Polymarket trader
 * identified by proxy wallet, never a Knewit account. Same Top
 * Performers podium for the first 3 real ranked entries.
 *
 * No viewer-relative row at all: the old "Your Rank" self-standing line
 * was removed by request, UI and backend alike (docs/DECISIONS.md, "Your
 * Rank Removed From the Leaderboard").
 */
export default function LeaderboardPage() {
  const leaderboard = useLeaderboard();

  const items = useMemo(() => leaderboard.data?.pages.flatMap((page) => page.items) ?? [], [leaderboard.data]);
  const topThree = items.length >= 3 ? (items.slice(0, 3) as [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry]) : null;
  const rest = topThree ? items.slice(3) : items;

  const titleBlock = (
    <div>
      <Text variant="heading" className="block px-4 pb-3 pt-2 text-4xl font-inter-extrabold">
        Leaderboard
      </Text>
      <Divider />
    </div>
  );

  if (leaderboard.status === 'pending') {
    return (
      <main className="w-full">
        {titleBlock}
        <div className="px-4 pt-3">
          <LoadingState rows={5} />
        </div>
      </main>
    );
  }

  if (leaderboard.status === 'error') {
    return (
      <main className="w-full">
        {titleBlock}
        <ErrorState message="Unable to load leaderboard." onRetry={() => leaderboard.refetch()} />
      </main>
    );
  }

  return (
    <main className="w-full">
      {titleBlock}
      {topThree ? (
        <div className="pt-3">
          <TopPerformers entries={topThree} />
        </div>
      ) : null}

      {rest.length === 0 && !topThree ? (
        <div className="px-4">
          <EmptyState
            icon="trophy-outline"
            title="No leaderboard data yet"
            message="Polymarket's ranked traders will appear here when the ranking is available."
          />
        </div>
      ) : (
        <>
          {rest.map((entry) => (
            <LeaderboardUserCard key={entry.user.id} entry={entry} />
          ))}
          <InfiniteScrollSentinel
            hasNextPage={!!leaderboard.hasNextPage}
            isFetchingNextPage={leaderboard.isFetchingNextPage}
            onLoadMore={() => leaderboard.fetchNextPage()}
          />
        </>
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
