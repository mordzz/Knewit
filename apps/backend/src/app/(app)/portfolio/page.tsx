'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { apiRequest } from '@/lib/apiClient';
import { formatProbability } from '@/lib/formatters';
import type { UserPosition } from '@/types/social';

/**
 * Direct conversion of `apps/mobile`'s `PortfolioScreen` — same wallet
 * row + "Open Positions" stat + position list layout. Real, not a
 * static shell: mobile's own screen hardcodes "0 Open Positions" rather
 * than calling `GET /positions` (its `usePositions` hook exists but
 * isn't wired into that screen yet) — this page calls the real
 * endpoint, which is strictly more truthful, never less. No PnL figure
 * anywhere (not even $0.00) — this app's data model has no realized/
 * unrealized PnL computation (docs/DECISIONS.md, "Leaderboard Metric —
 * Volume, Not PnL"), so showing one would be fabricated precision.
 */
export default function PortfolioPage() {
  const router = useRouter();
  const { user } = usePrivy();
  const address = user?.wallet?.address ?? null;

  const positionsQuery = useQuery({
    queryKey: ['positions'],
    queryFn: () => apiRequest<UserPosition[]>('/api/positions'),
  });

  const positions = positionsQuery.data ?? [];

  return (
    <main className="flex w-full flex-col gap-3 px-0 pt-4">
      <Text variant="heading" className="px-4">
        Portfolio
      </Text>

      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Icon name="wallet-outline" color={address ? 'yes' : 'textTertiary'} />
        <div className="flex-1">
          <Text variant="bodyStrong" className="block">
            {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'No wallet connected'}
          </Text>
          <Text variant="caption" color="textSecondary">
            {address ? 'Connected' : 'Connect to see your positions'}
          </Text>
        </div>
        {!address ? (
          <Button label="Connect" variant="secondary" onClick={() => router.push('/wallet')} />
        ) : null}
      </div>

      <div className="flex border-b border-border px-4 py-3">
        <div className="flex-1">
          <Text variant="caption" color="textSecondary" className="block">
            Open Positions
          </Text>
          <Text variant="title">{positions.length}</Text>
        </div>
      </div>

      {positionsQuery.isError ? (
        <ErrorState message="Couldn't load your positions." onRetry={() => positionsQuery.refetch()} />
      ) : positionsQuery.isPending ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
        </div>
      ) : positions.length === 0 ? (
        <EmptyState
          icon="trending-up-outline"
          title="No positions yet"
          message="Positions you take on markets will show up here."
        />
      ) : (
        positions.map((position, index) => (
          <div key={position.id}>
            <PositionRow position={position} />
            {index < positions.length - 1 ? <Divider /> : null}
          </div>
        ))
      )}
    </main>
  );
}

function PositionRow({ position }: { position: UserPosition }) {
  return (
    <article className="px-4 py-3">
      <Text variant="bodyStrong" numberOfLines={2} className="block">
        {position.marketQuestion}
      </Text>
      <div className="mt-2 flex gap-6">
        <div>
          <Text variant="caption" color="textTertiary" className="block">
            Position
          </Text>
          <Text variant="bodyStrong" color={position.outcome === 'YES' ? 'yes' : 'no'}>
            {position.outcome}
          </Text>
        </div>
        <div>
          <Text variant="caption" color="textTertiary" className="block">
            Entry
          </Text>
          <Text variant="bodyStrong">{formatProbability(position.entryPrice)}</Text>
        </div>
        <div>
          <Text variant="caption" color="textTertiary" className="block">
            Current
          </Text>
          <Text variant="bodyStrong">
            {position.currentPrice != null ? formatProbability(position.currentPrice) : '—'}
          </Text>
        </div>
        <div>
          <Text variant="caption" color="textTertiary" className="block">
            Size
          </Text>
          <Text variant="bodyStrong">{position.size}</Text>
        </div>
      </div>
    </article>
  );
}
