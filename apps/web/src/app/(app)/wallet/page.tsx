'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@privy-io/react-auth';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Modal } from '@/components/ui/Modal';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatProbability, formatUsd } from '@/lib/formatters';
import { ApiRequestError } from '@/lib/apiClient';
import { usePositions } from '@/features/wallet/hooks/usePositions';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useDepositFlow } from '@/features/wallet/hooks/useDepositFlow';
import { useSellPosition } from '@/features/wallet/hooks/useSellPosition';
import { useSession } from '@/hooks/useSession';
import { useGuestStore } from '@/lib/guest/guestStore';
import type { UserPosition } from '@/types/social';

const ALLOCATION_TOP_N = 4;

/**
 * Wallet — the one account/funds screen (the old separate Portfolio page
 * and its Profile row are gone; docs/DECISIONS.md, "Wallet Replaces
 * Portfolio"). Styled after `apps/dekstop`'s `PortfolioPage` — a stat
 * row, an allocation breakdown, a recent-activity preview, and the open
 * positions list — as **one** responsive layout (mobile-first classes,
 * `lg:grid-cols-[1.5fr_1fr]` etc. only at `lg:`) rather than separate
 * phone/desktop branches, so both get the same "Portfolio" composition.
 * Real data only: dekstop's allocation splits by a fictional asset-class
 * taxonomy (Predictions/Crypto/Perps/Stocks) this app doesn't have —
 * here it's each open position's real share of total position value
 * instead. Activity remains available on its dedicated `/activity` page.
 *
 * **No manual setup buttons any more**: wallet creation and the signing
 * grant both run automatically through `useAutoWalletSetup` (the app
 * shell's setup gate renders until they finish) — see docs/DECISIONS.md,
 * "Automatic Wallet & Trading Setup — No Manual Buttons".
 */
export default function WalletPage() {
  const router = useRouter();
  const { address, authenticated, isGuest, walletConnected } = useSession();
  const { logout } = useLogout();
  const exitGuest = useGuestStore((state) => state.exitGuest);
  const sell = useSellPosition();
  const [sellTarget, setSellTarget] = useState<UserPosition | null>(null);
  const [sellNotice, setSellNotice] = useState<{ tone: 'yes' | 'danger'; message: string } | null>(null);

  const balance = useWalletBalance();
  const positionsQuery = usePositions();
  const positions = positionsQuery.data ?? [];
  const { isDepositing, depositError, handleDeposit } = useDepositFlow();

  const handleLogout = () => {
    // A guest session has no Privy session to end — leaving guest mode is
    // the logout, and the app shell routes back to `/sign-in`.
    if (isGuest) {
      exitGuest();
      return;
    }
    logout();
  };

  // Unrealized PnL per position: (current − entry) cents × shares. No
  // positions is a real $0.00; positions whose live price is missing make
  // the total unavailable ("—") rather than inventing a number.
  const pricedPositions = positions.filter((p) => p.currentPrice != null);
  const totalPnl =
    positions.length === 0
      ? 0
      : pricedPositions.length
        ? pricedPositions.reduce((sum, p) => sum + ((p.currentPrice! - p.entryPrice) / 100) * p.size, 0)
        : null;

  const balanceLabel = balance.isPending && address ? '···' : balance.data?.usdc != null ? formatUsd(balance.data.usdc) : '—';
  const pnlLabel =
    totalPnl == null ? '—' : totalPnl === 0 ? formatUsd(0) : `${totalPnl > 0 ? '+' : '−'}${formatUsd(Math.abs(totalPnl))}`;
  const pnlColor = totalPnl == null || totalPnl === 0 ? 'textSecondary' : totalPnl > 0 ? 'yes' : 'no';

  return (
    <main className="mx-auto flex w-full max-w-none flex-col gap-3 px-0 pt-4 lg:gap-6 lg:py-10">
      <div className="flex items-end justify-between gap-4 px-4 lg:px-0">
        <div>
        <button type="button" onClick={() => router.back()} aria-label="Go back" className="lg:hidden">
          <Icon name="chevron-back" size={24} />
        </button>
        <Text variant="heading" className="block text-4xl font-inter-extrabold lg:text-[42px] lg:tracking-[-0.03em]">
          Portfolio
        </Text>
          <Text variant="caption" color="textSecondary" className="mt-1 hidden lg:block">
            A clear view of your balance, positions, and performance.
          </Text>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-2 lg:grid-cols-[1.35fr_.8fr_.8fr] lg:px-0 lg:gap-4">
        <StatCard
          label="Balance"
          value={balanceLabel}
          error={depositError}
          className="col-span-2 flex items-center justify-between gap-4 sm:col-span-2 lg:col-span-1 lg:block lg:min-h-[164px]"
          valueClassName="text-3xl font-inter-extrabold"
        >
          {address ? (
            <Button label="Deposit" variant="primary" loading={isDepositing} onClick={handleDeposit} className="mt-3 min-h-0 shrink-0 px-4 py-2 lg:hidden" />
          ) : null}
        </StatCard>
        <StatCard label="Open Positions" value={String(positions.length)} className="lg:min-h-[164px]" valueClassName="text-3xl font-inter-extrabold" />
        <StatCard label="Unrealized PnL" value={pnlLabel} valueColor={pnlColor} className="lg:min-h-[164px]" valueClassName="text-3xl font-inter-extrabold" />
      </section>

      <div className="flex items-center gap-3 border-y border-border px-4 py-3 lg:rounded-[18px] lg:border lg:border-white/[0.14] lg:bg-[rgba(14,15,19,0.88)] lg:px-5 lg:py-4">
        <Icon name="wallet-outline" color={address ? 'yes' : 'textTertiary'} />
        <div className="flex-1">
          {address ? (
            <WalletAddress address={address} compact fullOnDesktop />
          ) : (
            <Text variant="bodyStrong" className="block">
              Setting up your wallet…
            </Text>
          )}
          <Text variant="caption" color="textSecondary">
            {address ? 'Connected' : 'This happens automatically — no action needed.'}
          </Text>
        </div>
        {address ? <Button label="Log Out" variant="no" onClick={handleLogout} className="min-h-0 px-3 py-2 lg:hidden" /> : null}
      </div>

      {sellNotice ? (
        <Text variant="caption" color={sellNotice.tone} className="block px-4 lg:px-0">
          {sellNotice.message}
        </Text>
      ) : null}

      {walletConnected && positions.length > 0 ? (
        <section className="grid gap-3 px-4 lg:grid-cols-1 lg:gap-4 lg:px-0">
          <AllocationPanel positions={positions} />
        </section>
      ) : null}

      <section className="lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-white/[0.14] lg:bg-[rgba(14,15,19,0.88)]">
        <div className="hidden border-b border-border px-5 py-4 lg:grid lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(72px,.45fr))_72px_76px] lg:items-center lg:gap-4">
          <Text variant="bodyStrong">Open positions</Text>
          <Text variant="micro" color="textTertiary" className="text-right">Position</Text>
          <Text variant="micro" color="textTertiary" className="text-right">Entry</Text>
          <Text variant="micro" color="textTertiary" className="text-right">Current</Text>
          <Text variant="micro" color="textTertiary" className="text-right">Size</Text>
          <Text variant="micro" color="textTertiary" className="text-right">P/L</Text>
          <span aria-hidden />
        </div>

        {!walletConnected ? (
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
              <PositionRow
                position={position}
                onSell={() => {
                  setSellNotice(null);
                  sell.reset();
                  setSellTarget(position);
                }}
              />
              {index < positions.length - 1 ? <Divider /> : null}
            </div>
          ))
        )}
      </section>

      <Modal
        visible={sellTarget != null}
        onClose={() => {
          if (sell.isPending) return;
          setSellTarget(null);
        }}
      >
        {sellTarget ? (
          <div className="flex flex-col gap-3">
            <Text variant="heading" className="block">
              Sell position
            </Text>
            <Text variant="body" className="block">
              {sellTarget.marketQuestion}
            </Text>
            <div className="flex gap-6">
              <div>
                <Text variant="caption" color="textTertiary" className="block">
                  Position
                </Text>
                <Text
                  variant="bodyStrong"
                  color={choiceTextColor(choiceTone({ index: sellTarget.choiceIndex, label: sellTarget.outcome }))}
                >
                  {sellTarget.outcome}
                </Text>
              </div>
              <div>
                <Text variant="caption" color="textTertiary" className="block">
                  Shares
                </Text>
                <Text variant="bodyStrong">{sellTarget.size}</Text>
              </div>
              <div>
                <Text variant="caption" color="textTertiary" className="block">
                  Current
                </Text>
                <Text variant="bodyStrong">
                  {sellTarget.currentPrice != null ? formatProbability(sellTarget.currentPrice) : '—'}
                </Text>
              </div>
            </div>
            <Text variant="caption" color="textSecondary" className="block">
              Sells the whole position at market — the final price is set when it fills. Proceeds are
              sent to your Privy wallet, so they won&apos;t appear in this screen&apos;s trading
              balance.
            </Text>
            {sell.isError ? (
              <Text variant="caption" color="danger" className="block">
                {friendlySellError(sell.error)}
              </Text>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                label="Cancel"
                variant="ghost"
                onClick={() => setSellTarget(null)}
                disabled={sell.isPending}
                className="min-h-0 px-4 py-2"
              />
              <Button
                label={sell.isPending ? 'Selling…' : 'Sell'}
                variant="no"
                loading={sell.isPending}
                onClick={() =>
                  sell.mutate(sellTarget.id, {
                    onSuccess: (result) => {
                      setSellNotice(
                        result.cashOut.status === 'sent'
                          ? {
                              tone: 'yes',
                              message: `Position sold — ${formatUsd(result.cashOut.amountUsd)} is on its way to your Privy wallet.`,
                            }
                          : {
                              tone: 'danger',
                              message:
                                'Position sold, but sending the proceeds to your wallet failed — the money is still in your trading balance.',
                            }
                      );
                      setSellTarget(null);
                    },
                  })
                }
                className="min-h-0 px-4 py-2"
              />
            </div>
          </div>
        ) : null}
      </Modal>

      {isGuest ? (
        <Text variant="micro" color="textTertiary" className="block px-4 text-center lg:px-0">
          Guest demo mode — this wallet address, balance, and every trade here are simulated locally
          and are not tied to a real account.
        </Text>
      ) : authenticated ? (
        <Text variant="micro" color="textTertiary" className="block px-4 text-center lg:px-0">
          Logging out ends your app session only — it doesn&apos;t delete your embedded wallet.
        </Text>
      ) : null}
    </main>
  );
}

function StatCard({
  label,
  value,
  valueColor,
  error,
  children,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  valueColor?: 'yes' | 'no' | 'textSecondary';
  error?: string | null;
  children?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`${CARD_SURFACE_CLASS} p-5 ${className ?? ''}`}>
      <div className={children ? 'min-w-0 flex-1' : undefined}>
        <Text variant="caption" color="textSecondary" className="block">
          {label}
        </Text>
        <Text variant="title" color={valueColor} className={`mt-1 block tabular-nums lg:text-4xl lg:leading-none ${valueClassName ?? ''}`}>
          {value}
        </Text>
        {error ? (
          <Text variant="caption" color="danger" className="mt-2 block">
            {error}
          </Text>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * Real-data stand-in for `apps/dekstop`'s "Allocation" panel — that
 * version splits by a fictional asset-class taxonomy (Predictions/
 * Crypto/Perps/Stocks) this app has no data for. This splits by each
 * open position's own share of total position value instead (current
 * price when known, entry price otherwise), capped to the largest few
 * with a "+N more" remainder — same convention `MarketCard`'s
 * `GroupCard` already uses for long outcome lists.
 */
function AllocationPanel({ positions }: { positions: UserPosition[] }) {
  const valued = positions
    .map((position) => ({
      position,
      value: ((position.currentPrice ?? position.entryPrice) / 100) * position.size,
    }))
    .sort((a, b) => b.value - a.value);
  const total = valued.reduce((sum, entry) => sum + entry.value, 0);
  const top = valued.slice(0, ALLOCATION_TOP_N);
  const restValue = valued.slice(ALLOCATION_TOP_N).reduce((sum, entry) => sum + entry.value, 0);
  const restCount = valued.length - top.length;

  return (
    <div className={`${CARD_SURFACE_CLASS} p-5 lg:p-6`}>
      <Text variant="bodyStrong" className="block lg:text-title">
        Allocation
      </Text>
      {total > 0 ? (
        <>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-surface-elevated">
            {top.map((entry, index) => (
              <div
                key={entry.position.id}
                className="h-full bg-accent"
                style={{ width: `${(entry.value / total) * 100}%`, opacity: 1 - index * 0.18 }}
              />
            ))}
            {restCount > 0 ? (
              <div className="h-full bg-accent" style={{ width: `${(restValue / total) * 100}%`, opacity: 0.25 }} />
            ) : null}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {top.map((entry) => (
              <div key={entry.position.id} className="flex items-center justify-between gap-3">
                <Text variant="caption" color="textSecondary" numberOfLines={1} className="min-w-0 flex-1 truncate">
                  {entry.position.marketQuestion}
                </Text>
                <Text variant="caption" className="tabular-nums">
                  {Math.round((entry.value / total) * 100)}%
                </Text>
              </div>
            ))}
            {restCount > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <Text variant="caption" color="textSecondary">
                  +{restCount} more
                </Text>
                <Text variant="caption" className="tabular-nums">
                  {Math.round((restValue / total) * 100)}%
                </Text>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <Text variant="caption" color="textTertiary" className="mt-3 block">
          No priced positions yet.
        </Text>
      )}
    </div>
  );
}

function PositionRow({ position, onSell }: { position: UserPosition; onSell: () => void }) {
  const pnl =
    position.currentPrice != null ? ((position.currentPrice - position.entryPrice) / 100) * position.size : null;

  return (
    <article className="grid grid-cols-3 gap-x-4 gap-y-3 px-4 py-3 lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(72px,.45fr))_72px_76px] lg:items-center lg:gap-4 lg:px-5 lg:py-4">
      <Text variant="bodyStrong" numberOfLines={2} className="col-span-3 block min-w-0 lg:col-span-1">
        {position.marketQuestion}
      </Text>
      <div className="col-span-3 grid grid-cols-3 gap-x-4 gap-y-2 lg:contents">
        <div className="contents">
          <div className="order-1 lg:order-none">
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
          <div className="order-2 lg:order-none">
            <Text variant="caption" color="textTertiary" className="block">
              Entry
            </Text>
            <Text variant="bodyStrong">{formatProbability(position.entryPrice)}</Text>
          </div>
          <div className="order-5 lg:order-none">
            <Text variant="caption" color="textTertiary" className="block">
              Current
            </Text>
            <Text variant="bodyStrong">
              {position.currentPrice != null ? formatProbability(position.currentPrice) : '—'}
            </Text>
          </div>
          <div className="order-4 lg:order-none">
            <Text variant="caption" color="textTertiary" className="block">
              Size
            </Text>
            <Text variant="bodyStrong">{position.size}</Text>
          </div>
        </div>
        <div className="order-3 col-span-1 text-right lg:order-none lg:col-span-1">
          <Text variant="caption" color="textTertiary" className="block">
            P/L
          </Text>
          <Text variant="bodyStrong" color={pnl == null ? 'textSecondary' : pnl >= 0 ? 'yes' : 'no'}>
            {pnl == null ? '—' : `${pnl >= 0 ? '+' : '−'}${formatUsd(Math.abs(pnl))}`}
          </Text>
        </div>
        <div className="order-6 col-span-1 flex items-end justify-end lg:order-none lg:col-span-1 lg:mt-0">
          <Button label="Sell" variant="no" onClick={onSell} className="min-h-0 px-4 py-2 lg:w-full lg:px-2" />
        </div>
      </div>
    </article>
  );
}

/** Never surfaces a raw backend error — the backend's own sell messages
 * are already user-facing, so known codes pass through and anything else
 * becomes one generic message. */
function friendlySellError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (['insufficient_shares', 'trade_failed', 'approvals_failed', 'no_liquidity'].includes(error.body.code)) {
      return error.body.message;
    }
  }
  if (error instanceof Error && /network/i.test(error.message)) {
    return 'Network error - check your connection and try again.';
  }
  return "Couldn't sell this position right now. Please try again.";
}
