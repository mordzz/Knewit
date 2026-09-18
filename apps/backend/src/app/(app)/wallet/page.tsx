'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Modal } from '@/components/ui/Modal';
import { WalletAddress } from '@/components/WalletAddress';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatProbability, formatUsd } from '@/lib/formatters';
import { isUserCancelledFunding } from '@/lib/privyErrors';
import { ApiRequestError } from '@/lib/apiClient';
import { usePositions } from '@/hooks/usePositions';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useDeposit } from '@/hooks/useDeposit';
import { useSellPosition } from '@/hooks/useSellPosition';
import type { UserPosition } from '@/types/social';

/**
 * Wallet — the one account/funds screen (the old separate Portfolio page
 * and its Profile row are gone; docs/DECISIONS.md, "Wallet Replaces
 * Portfolio"). Connection state, the real USDC collateral balance read
 * from Polymarket's CLOB, and the viewer's open positions with unrealized
 * PnL computed from live current prices. No fabricated figures anywhere:
 * balance "—" until the CLOB read works, PnL "—" when no current price is
 * available.
 *
 * **No manual setup buttons any more**: wallet creation and the signing
 * grant both run automatically through `useAutoWalletSetup` (the app
 * shell's setup gate renders until they finish) — see docs/DECISIONS.md,
 * "Automatic Wallet & Trading Setup — No Manual Buttons". This screen
 * only states what it's waiting for.
 *
 * **Deposit** (yellow, right of the Balance row) opens Privy's funding
 * flow into this wallet on Polygon USDC.e; **Log Out** (red) stays in the
 * status row. The former in-app Approve USDC button was removed by
 * request — see docs/WALLET.md, "Approve USDC for Trading".
 */
export default function WalletPage() {
  const { user, authenticated } = usePrivy();
  const { logout } = useLogout();
  const { deposit } = useDeposit();
  const router = useRouter();
  const sell = useSellPosition();
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [sellTarget, setSellTarget] = useState<UserPosition | null>(null);
  const [sellNotice, setSellNotice] = useState<{ tone: 'yes' | 'danger'; message: string } | null>(
    null
  );

  const address = user?.wallet?.address ?? null;

  const balance = useWalletBalance();
  const positionsQuery = usePositions();
  const positions = positionsQuery.data ?? [];

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

  const handleDeposit = async () => {
    setDepositError(null);
    setIsDepositing(true);
    try {
      await deposit();
    } catch (error) {
      if (isUserCancelledFunding(error)) return; // closing Privy's modal is not a failure
      console.error('Deposit flow failed:', error);
      setDepositError("Couldn't open the deposit flow. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <main className="flex w-full flex-col gap-3 px-0 pt-4">
      <div className="flex items-center gap-2 px-4 pb-3">
        <button type="button" onClick={() => router.back()} aria-label="Go back">
          <Icon name="chevron-back" size={24} />
        </button>
        <Text variant="heading" className="block text-4xl font-inter-extrabold">
          Wallet
        </Text>
      </div>

      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Icon name="wallet-outline" color={address ? 'yes' : 'textTertiary'} />
        <div className="flex-1">
          {address ? (
            <WalletAddress address={address} compact />
          ) : (
            <Text variant="bodyStrong" className="block">
              Setting up your wallet…
            </Text>
          )}
          <Text variant="caption" color="textSecondary">
            {address ? 'Connected' : 'This happens automatically — no action needed.'}
          </Text>
        </div>
        {address ? (
          <Button label="Log Out" variant="no" onClick={() => logout()} className="min-h-0 px-3 py-2" />
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex-1">
          <Text variant="caption" color="textSecondary" className="block">
            Balance
          </Text>
          <Text variant="title">
            {balance.isPending && address ? '···' : balance.data?.usdc != null ? formatUsd(balance.data.usdc) : '—'}
          </Text>
          {address && balance.data?.usdc == null && !balance.isPending ? (
            <Text variant="micro" color="textTertiary">
              Trading setup is still finishing — it completes automatically.
            </Text>
          ) : null}
        </div>
        {address ? (
          <Button
            label="Deposit"
            variant="primary"
            loading={isDepositing}
            onClick={handleDeposit}
            className="min-h-0 px-4 py-2"
          />
        ) : null}
      </div>

      {depositError ? (
        <Text variant="caption" color="danger" className="block px-4">
          {depositError}
        </Text>
      ) : null}

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
          <Text
            variant="title"
            color={totalPnl == null || totalPnl === 0 ? 'textSecondary' : totalPnl > 0 ? 'yes' : 'no'}
          >
            {totalPnl == null
              ? '—'
              : totalPnl === 0
                ? formatUsd(0)
                : `${totalPnl > 0 ? '+' : '−'}${formatUsd(Math.abs(totalPnl))}`}
          </Text>
        </div>
      </div>

      {sellNotice ? (
        <Text variant="caption" color={sellNotice.tone} className="block px-4">
          {sellNotice.message}
        </Text>
      ) : null}

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
                  color={choiceTextColor(
                    choiceTone({ index: sellTarget.choiceIndex, label: sellTarget.outcome })
                  )}
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
                  {sellTarget.currentPrice != null
                    ? formatProbability(sellTarget.currentPrice)
                    : '—'}
                </Text>
              </div>
            </div>
            <Text variant="caption" color="textSecondary" className="block">
              Sells the whole position at market — the final price is set when it fills. Proceeds
              are sent to your Privy wallet, so they won&apos;t appear in this screen&apos;s trading
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
                label={sell.isPending ? 'Selling...' : 'Sell'}
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

      {authenticated ? (
        <Text variant="micro" color="textTertiary" className="block px-4 text-center">
          Logging out ends your app session only — it doesn&apos;t delete your embedded wallet.
        </Text>
      ) : null}
    </main>
  );
}

function PositionRow({ position, onSell }: { position: UserPosition; onSell: () => void }) {
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
      <div className="mt-3 flex justify-end">
        <Button
          label="Sell"
          variant="secondary"
          onClick={onSell}
          className="min-h-0 px-4 py-2"
        />
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
