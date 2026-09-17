'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { IoArrowBack, IoTrendingUpOutline } from 'react-icons/io5';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import { formatProbability, formatCompactUsd, formatRelativeTime } from '@/lib/formatters';
import type { FeedItem, MarketDetail, MarketHolder } from '@/types/social';
import type { Order, Outcome } from '@/types/market';
import type { UserPosition } from '@/types/social';

type DetailTab = 'callouts' | 'holders';

/**
 * Web port of `apps/frontend`'s `MarketDetailScreen` — trimmed down
 * from its 394 lines: no price chart (charting is a real scope of its
 * own, not worth adding for this pass) and no `BottomSheet` trade
 * flow — the trade form is inline instead. Everything it shows is
 * real, same as the mobile screen's own standing rule: rules/
 * resolution text from the live market, real Callouts (Posts/Calls
 * referencing this market), real (usually empty) Top Holders, and a
 * trade form that actually calls `POST /trading/orders` — which is
 * itself flagged elsewhere (`docs/INTEGRATION.md`) as unverified
 * end-to-end pending Privy wallet delegation. A failure here shows the
 * backend's real error, never a fabricated success.
 */
export function MarketDetailView({ marketId }: { marketId: string }) {
  const [tab, setTab] = useState<DetailTab>('callouts');

  const marketQuery = useQuery({
    queryKey: ['market', marketId],
    queryFn: () => apiRequest<MarketDetail>(`/api/markets/${marketId}`),
  });

  const positionQuery = useQuery({
    queryKey: ['position', marketId],
    queryFn: () => apiRequest<UserPosition>(`/api/positions/${marketId}`),
    retry: false,
  });

  const tabQuery = useQuery<FeedItem[] | MarketHolder[]>({
    queryKey: ['market', marketId, tab],
    queryFn: () =>
      tab === 'callouts'
        ? apiRequest<FeedItem[]>(`/api/markets/${marketId}/activity`)
        : apiRequest<MarketHolder[]>(`/api/markets/${marketId}/holders`),
  });

  if (marketQuery.isPending) {
    return <p className="p-6 text-center text-text-secondary">Loading…</p>;
  }

  if (marketQuery.isError) {
    const notFound = marketQuery.error instanceof ApiRequestError && marketQuery.error.status === 404;
    return (
      <div className="p-6 text-center">
        <Link href="/markets" className="mb-3 inline-flex items-center gap-1 text-text-secondary">
          <IoArrowBack size={16} /> Back
        </Link>
        <p className="text-text-secondary">
          {notFound ? 'Market not found.' : "Couldn't load this market."}
        </p>
      </div>
    );
  }

  const market = marketQuery.data;
  const hasPosition = !!positionQuery.data;

  return (
    <main className="w-full">
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link href="/markets" aria-label="Back to Markets">
          <IoArrowBack size={22} />
        </Link>
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated">
          {market.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={market.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <IoTrendingUpOutline size={20} className="text-text-tertiary" />
          )}
        </div>
        <h1 className="flex-1 text-xl font-bold">{market.question}</h1>
      </div>

      <div className="flex justify-between border-b border-t border-border px-4 py-3 text-sm">
        <Stat label="Volume" value={market.volume != null ? formatCompactUsd(market.volume) : '—'} />
        <Stat
          label="Liquidity"
          value={market.liquidity != null ? formatCompactUsd(market.liquidity) : '—'}
        />
        <Stat
          label="Ends"
          value={market.endDate ? new Date(market.endDate).toLocaleDateString() : '—'}
        />
      </div>

      {market.resolved ? (
        <div className="border-b border-border bg-surface px-4 py-3">
          <p className="text-sm text-text-secondary">Resolution</p>
          <p className="font-bold">{market.resolvedOutcome ?? 'Resolved'}</p>
        </div>
      ) : (
        <TradeForm market={market} hasPosition={hasPosition} />
      )}

      {market.rules ? (
        <div className="border-b border-border px-4 py-3">
          <p className="font-bold">About</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{market.rules}</p>
        </div>
      ) : null}

      <div className="flex border-b border-border">
        {(['callouts', 'holders'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-center font-semibold capitalize transition-colors ${
              tab === key ? 'border-b-2 border-accent text-text-primary' : 'text-text-secondary'
            }`}
          >
            {key === 'callouts' ? 'Callouts' : 'Top Holders'}
          </button>
        ))}
      </div>

      {tabQuery.isPending ? (
        <p className="p-6 text-center text-text-secondary">Loading…</p>
      ) : tab === 'callouts' ? (
        (tabQuery.data as FeedItem[])?.length ? (
          (tabQuery.data as FeedItem[]).map((item) => (
            <div key={item.id} className="border-b border-border px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-bold">{item.author.displayName}</p>
                <span className="text-sm text-text-tertiary">{formatRelativeTime(item.createdAt)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap">{item.body}</p>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-text-secondary">
            No Calls or Posts reference this market yet.
          </p>
        )
      ) : (tabQuery.data as MarketHolder[])?.length ? (
        (tabQuery.data as MarketHolder[]).map((holder) => (
          <div key={holder.id} className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-bold">{holder.displayName}</p>
              <p className="text-sm text-text-secondary">@{holder.handle}</p>
            </div>
            <span className={`font-bold ${holder.outcome === 'YES' ? 'text-yes' : 'text-no'}`}>
              {holder.outcome} · {holder.shares}
            </span>
          </div>
        ))
      ) : (
        <p className="p-6 text-center text-text-secondary">No holders to show yet.</p>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-tertiary">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function TradeForm({ market, hasPosition }: { market: MarketDetail; hasPosition: boolean }) {
  const [outcome, setOutcome] = useState<Outcome>('YES');
  const [amount, setAmount] = useState('10');

  const trade = useMutation({
    mutationFn: () =>
      apiRequest<Order>('/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify({ marketId: market.id, outcome, usdAmount: Number(amount) }),
      }),
  });

  return (
    <div className="border-b border-border px-4 py-3">
      {hasPosition ? (
        <p className="mb-2 text-sm text-yes">You have a position in this market.</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOutcome('YES')}
          className={`flex-1 rounded-md py-2.5 font-semibold ${
            outcome === 'YES' ? 'bg-yes text-text-inverse' : 'bg-yes-muted text-yes'
          }`}
        >
          {market.outcomeLabels?.yes ?? 'Yes'} {formatProbability(market.yesPrice)}
        </button>
        <button
          type="button"
          onClick={() => setOutcome('NO')}
          className={`flex-1 rounded-md py-2.5 font-semibold ${
            outcome === 'NO' ? 'bg-no text-text-inverse' : 'bg-no-muted text-no'
          }`}
        >
          {market.outcomeLabels?.no ?? 'No'} {formatProbability(market.noPrice)}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-text-secondary">$</span>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="min-h-10 flex-1 rounded-md border border-border bg-surface-elevated px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => trade.mutate()}
          disabled={trade.isPending || !market.isBinary || Number(amount) <= 0}
          className="rounded-md bg-accent px-5 py-2 font-semibold text-text-inverse disabled:opacity-50"
        >
          {trade.isPending ? 'Placing…' : 'Trade'}
        </button>
      </div>

      {!market.isBinary ? (
        <p className="mt-2 text-xs text-text-tertiary">
          This market has more than two outcomes — trading isn&apos;t supported for it yet.
        </p>
      ) : null}

      {trade.isError ? (
        <p className="mt-2 text-sm text-danger">
          {trade.error instanceof ApiRequestError ? trade.error.message : 'Trade failed.'}
        </p>
      ) : null}
      {trade.isSuccess ? (
        <p className="mt-2 text-sm text-yes">Order placed — status: {trade.data.status}.</p>
      ) : null}
    </div>
  );
}
