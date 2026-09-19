'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ActivityRow } from '@/components/ActivityRow';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';

/**
 * The signed-in user's activity feed — split out of `ProfileView`'s old
 * "Activity" tab into its own page, styled after `apps/dekstop`'s
 * `ActivityPage` (a centered, generously-wide card on desktop) and
 * linked from `SideNav`. Same data (`useUserActivity('me', true)`) and
 * the same `ActivityRow` used before, just no longer nested inside
 * Profile's tab row.
 */
export default function ActivityPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const activity = useUserActivity('me', true);

  const openAuthor = (userId: string) => router.push(`/profile/${userId}`);
  const openMarket = (marketId: string) => router.push(`/markets/${marketId}`);
  const openPost = (postId: string) => router.push(`/calls/${postId}`);

  const containerClass = isDesktop ? 'w-full py-8' : 'w-full';

  return (
    <main className={containerClass}>
      <Text variant="heading" className={isDesktop ? 'block pb-6 text-5xl font-inter-extrabold' : 'block px-4 pb-3 pt-2 text-4xl font-inter-extrabold'}>
        Activity
      </Text>
      {isDesktop ? null : <div className="border-b border-border" />}

      <div className={isDesktop ? CARD_SURFACE_CLASS : ''}>
        {activity.status === 'pending' ? (
          <div className="px-4 pt-4">
            <LoadingState rows={4} />
          </div>
        ) : activity.status === 'error' ? (
          <ErrorState message="Couldn't load your activity." onRetry={() => activity.refetch()} />
        ) : (
          <ActivityList
            activity={activity}
            onOpenAuthor={openAuthor}
            onOpenMarket={openMarket}
            onOpenPost={openPost}
          />
        )}
      </div>
    </main>
  );
}

function ActivityList({
  activity,
  onOpenAuthor,
  onOpenMarket,
  onOpenPost,
}: {
  activity: ReturnType<typeof useUserActivity>;
  onOpenAuthor: (userId: string) => void;
  onOpenMarket: (marketId: string) => void;
  onOpenPost: (postId: string) => void;
}) {
  if (activity.status !== 'success') return null;
  const items = activity.data.pages.flatMap((page) => page.items);

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No activity yet"
          message="Trades, Calls, and follows will show up here."
        />
      ) : (
        items.map((item) => (
          <ActivityRow key={item.id} item={item} onOpenUser={onOpenAuthor} onOpenMarket={onOpenMarket} onOpenPost={onOpenPost} />
        ))
      )}
      <InfiniteScrollSentinel
        hasNextPage={!!activity.hasNextPage}
        isFetchingNextPage={activity.isFetchingNextPage}
        onLoadMore={() => activity.fetchNextPage()}
      />
    </>
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
