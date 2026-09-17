'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { IoWalletOutline } from 'react-icons/io5';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import { formatProbability } from '@/lib/formatters';
import type { UserPosition } from '@/types/social';

/**
 * Web port of `apps/frontend`'s `PortfolioScreen` — but real, not a
 * static shell: the mobile screen hardcodes "0 Open Positions"/"$0.00
 * PnL" rather than calling `GET /positions` (its own `usePositions`
 * hook exists but was never wired into that screen). This page calls
 * the real endpoint — an honestly empty list is exactly as truthful as
 * the mobile screen's hardcoded zero, and a non-empty one is strictly
 * more so. No PnL figure is shown at all (not even $0.00): this app's
 * data model has no realized/unrealized PnL computation
 * (docs/DECISIONS.md, "Leaderboard Metric — Volume, Not PnL" — the
 * same reasoning applies here), so showing one would be fabricated
 * precision this app doesn't have anywhere else.
 */
export default function PortfolioPage() {
  const { user } = usePrivy();
  const address = user?.wallet?.address ?? null;

  const positionsQuery = useQuery({
    queryKey: ['positions'],
    queryFn: () => apiRequest<UserPosition[]>('/api/positions'),
  });

  const positions = positionsQuery.data ?? [];

  return (
    <main className="w-full">
      <h1 className="px-4 pb-3 pt-6 text-2xl font-bold">Portfolio</h1>

      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <IoWalletOutline size={20} className={address ? 'text-yes' : 'text-text-tertiary'} />
        <div className="flex-1">
          <p className="font-bold">
            {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'No wallet connected'}
          </p>
          <p className="text-sm text-text-secondary">
            {address ? 'Connected' : 'Connect to see your positions'}
          </p>
        </div>
      </div>

      <div className="flex border-b border-border px-4 py-3">
        <div className="flex-1">
          <p className="text-sm text-text-secondary">Open Positions</p>
          <p className="text-xl font-bold">{positions.length}</p>
        </div>
      </div>

      {positionsQuery.isError ? (
        <p className="p-6 text-center text-danger">
          {positionsQuery.error instanceof ApiRequestError
            ? positionsQuery.error.message
            : "Couldn't load your positions."}
        </p>
      ) : positionsQuery.isPending ? (
        <p className="p-6 text-center text-text-secondary">Loading…</p>
      ) : positions.length === 0 ? (
        <p className="p-6 text-center text-text-secondary">
          Positions you take on markets will show up here.
        </p>
      ) : (
        positions.map((position) => <PositionRow key={position.id} position={position} />)
      )}
    </main>
  );
}

function PositionRow({ position }: { position: UserPosition }) {
  return (
    <article className="border-b border-border px-4 py-3">
      <p className="line-clamp-2 font-bold">{position.marketQuestion}</p>
      <div className="mt-2 flex gap-6">
        <div>
          <p className="text-xs text-text-tertiary">Position</p>
          <p className={`font-bold ${position.outcome === 'YES' ? 'text-yes' : 'text-no'}`}>
            {position.outcome}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Entry</p>
          <p className="font-bold">{formatProbability(position.entryPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Current</p>
          <p className="font-bold">
            {position.currentPrice != null ? formatProbability(position.currentPrice) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Size</p>
          <p className="font-bold">{position.size}</p>
        </div>
      </div>
    </article>
  );
}
