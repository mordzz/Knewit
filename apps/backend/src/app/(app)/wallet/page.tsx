'use client';

import { useState } from 'react';
import { usePrivy, useLogout, useCreateWallet } from '@privy-io/react-auth';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatProbability, formatUsd } from '@/lib/formatters';
import { usePositions } from '@/hooks/usePositions';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import type { UserPosition } from '@/types/social';

/**
 * Wallet — the one account/funds screen (the old separate Portfolio page
 * and its Profile row are gone; docs/DECISIONS.md, "Wallet Replaces
 * Portfolio"). Connection state, the real USDC collateral balance read
 * from Polymarket's CLOB, and the viewer's open positions with unrealized
 * PnL computed from live current prices. No fabricated figures anywhere:
 * balance "—" until the CLOB read works (delegated signing), PnL "—" when
 * no current price is available.
 */
export default function WalletPage() {
  const { ready, user, authenticated } = usePrivy();
  const { logout } = useLogout();
  const { createWallet } = useCreateWallet();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [createWalletError, setCreateWalletError] = useState<string | null>(null);

  const address = user?.wallet?.address ?? null;

  const balance = useWalletBalance();
  const positionsQuery = usePositions();
  const positions = positionsQuery.data ?? [];

  // Unrealized PnL per position: (current − entry) cents × shares. Total
  // only sums positions whose live price exists, so it never invents one.
  const pricedPositions = positions.filter((p) => p.currentPrice != null);
  const totalPnl = pricedPositions.length
    ? pricedPositions.reduce((sum, p) => sum + ((p.currentPrice! - p.entryPrice) / 100) * p.size, 0)
    : null;

  const handleConnectWallet = async () => {
    setCreateWalletError(null);
    setIsCreatingWallet(true);
    try {
      await createWallet();
    } catch (error) {
      console.error('Embedded wallet creation failed:', error);
      setCreateWalletError("Couldn't create your wallet. Try again.");
    } finally {
      setIsCreatingWallet(false);
    }
  };

  return (
    <main className="flex w-full flex-col gap-3 px-0 pt-4">
      <Text variant="heading" className="px-4">
        Wallet
      </Text>

      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Icon name="wallet-outline" color={address ? 'yes' : 'textTertiary'} />
        <div className="flex-1">
          <Text variant="bodyStrong" className="block">
            {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'No wallet connected'}
          </Text>
          <Text variant="caption" color="textSecondary">
            {address ? 'Connected' : 'Connect to take positions or create verified Calls.'}
          </Text>
        </div>
        {!ready ? null : address ? (
          <Button label="Log Out" variant="ghost" onClick={() => logout()} className="min-h-0 px-3 py-2" />
        ) : (
          <Button
            label="Connect Wallet"
            variant="secondary"
            loading={isCreatingWallet}
            onClick={handleConnectWallet}
          />
        )}
      </div>

      {createWalletError ? (
        <Text variant="caption" color="danger" className="block px-4">
          {createWalletError}
        </Text>
      ) : null}

      <div className="flex border-b border-border px-4 py-3">
        <div className="flex-1">
          <Text variant="caption" color="textSecondary" className="block">
            Balance
          </Text>
          <Text variant="title">
            {balance.isPending && address ? '···' : balance.data?.usdc != null ? formatUsd(balance.data.usdc) : '—'}
          </Text>
          {address && balance.data?.usdc == null && !balance.isPending ? (
            <Text variant="micro" color="textTertiary">
              Shows once wallet signing is active.
            </Text>
          ) : null}
        </div>
      </div>

      <div className="flex border-b border-border px-4 py-3">
        <div className="flex-1">
          <Text variant="caption" color="textSecondary" className="block">
            Open Positions
          </Text>
          <Text variant="title">{positions.length}</Text>
        </div>
        <div className="flex-1">
          <Text variant="caption" color="textSecondary" className="block">
            Unrealized PnL
          </Text>
          <Text variant="title" color={totalPnl == null ? 'textSecondary' : totalPnl >= 0 ? 'yes' : 'no'}>
            {totalPnl == null ? '—' : `${totalPnl >= 0 ? '+' : '−'}${formatUsd(Math.abs(totalPnl))}`}
          </Text>
        </div>
      </div>

      {!authenticated || !address ? (
        <EmptyState
          icon="wallet-outline"
          title="Connect your wallet"
          message="Your balance and positions appear here once a wallet is connected."
        />
      ) : positionsQuery.isError ? (
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
  const pnl =
    position.currentPrice != null ? ((position.currentPrice - position.entryPrice) / 100) * position.size : null;

  return (
    <article className="px-4 py-3">
      <Text variant="bodyStrong" numberOfLines={2} className="block">
        {position.marketQuestion}
      </Text>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="flex gap-6">
          <div>
            <Text variant="caption" color="textTertiary" className="block">
              Position
            </Text>
            <Text
              variant="bodyStrong"
              color={choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }))}
            >
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
        <div className="flex-shrink-0 text-right">
          <Text variant="caption" color="textTertiary" className="block">
            P/L
          </Text>
          <Text variant="bodyStrong" color={pnl == null ? 'textSecondary' : pnl >= 0 ? 'yes' : 'no'}>
            {pnl == null ? '—' : `${pnl >= 0 ? '+' : '−'}${formatUsd(Math.abs(pnl))}`}
          </Text>
        </div>
      </div>
    </article>
  );
}
