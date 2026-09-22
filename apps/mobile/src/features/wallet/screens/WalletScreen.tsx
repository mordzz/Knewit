import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePrivy } from '@privy-io/expo';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useDeposit } from '@/features/wallet/hooks/useDeposit';
import { useWithdraw } from '@/features/wallet/hooks/useWithdraw';
import { isUserCancelledFunding } from '@/features/wallet/utils/privyErrors';
import { getDepositErrorMessage, logDepositFailure } from '@/features/wallet/utils/depositErrors';
import { usePositions } from '@/features/portfolio/hooks/usePositions';
import { useSellPosition } from '@/features/portfolio/hooks/useSellPosition';
import { useWallet } from '@/hooks/useWallet';
import type { WithdrawResult } from '@/features/wallet/services/walletService';
import { useAuth } from '@/hooks/useAuth';
import { isPrivyConfigured } from '@/app/config/env';
import { formatProbability, formatUsd } from '@/utils/formatCurrency';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import { ApiRequestError } from '@/services/api/client';
import type { UserPosition } from '@/types/social';

const STATUS_COPY: Record<
  string,
  { label: string; color: 'yes' | 'accent' | 'textTertiary' | 'danger' }
> = {
  connected: { label: 'Connected', color: 'yes' },
  connecting: { label: 'Connecting…', color: 'accent' },
  disconnected: { label: 'Not connected', color: 'textTertiary' },
  error: { label: 'Wallet connection failed', color: 'danger' },
};

/**
 * Wallet — the one account/funds screen (the old separate Portfolio
 * screen is gone; docs/DECISIONS.md, "Wallet Replaces Portfolio").
 * Connection state, the real USDC collateral balance read from
 * Polymarket's CLOB, and the viewer's open positions with unrealized PnL
 * computed from live current prices. No fabricated figures anywhere:
 * balance "—" until the CLOB read works (delegated signing), PnL "—"
 * when no current price is available.
 *
 * **No manual setup buttons any more**: wallet creation and the signing
 * grant both run automatically through `useAutoWalletSetup`, and
 * `RootNavigator`'s setup gate holds the app until they finish — see
 * docs/DECISIONS.md, "Automatic Wallet & Trading Setup — No Manual
 * Buttons". This screen only states what it's waiting for.
 */
export function WalletScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, isGuest } = useAuth();
  const { status, address, error } = useWallet();
  const { isReady } = usePrivy();
  const { deposit, stage: depositStage } = useDeposit();
  const { withdraw } = useWithdraw();
  const sell = useSellPosition();
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawResult, setWithdrawResult] = useState<WithdrawResult | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const [sellTarget, setSellTarget] = useState<UserPosition | null>(null);
  const [sellNotice, setSellNotice] = useState<{ tone: 'yes' | 'danger'; message: string } | null>(
    null
  );

  const statusMeta = STATUS_COPY[status] ?? STATUS_COPY.disconnected;

  const balance = useWalletBalance();
  const tradingAddress = isGuest ? address : balance.data?.address ?? null;
  const positionsQuery = usePositions();
  const positions = positionsQuery.data ?? [];

  // Unrealized PnL per position: (current − entry) cents × shares. No
  // positions is a real $0.00; positions whose live price is missing make
  // the total unavailable ("—") rather than inventing a number.
  const pricedPositions = positions.filter((position) => position.currentPrice != null);
  const totalPnl =
    positions.length === 0
      ? 0
      : pricedPositions.length
        ? pricedPositions.reduce(
            (sum, position) =>
              sum + ((position.currentPrice! - position.entryPrice) / 100) * position.size,
            0
          )
        : null;

  const handleDeposit = async () => {
    setDepositError(null);
    setIsDepositing(true);
    try {
      await deposit();
    } catch (depositFailure) {
      if (isUserCancelledFunding(depositFailure)) return; // closing Privy's modal is not a failure
      logDepositFailure(depositFailure);
      setDepositError(getDepositErrorMessage(depositFailure));
    } finally {
      setIsDepositing(false);
    }
  };

  if (!isPrivyConfigured && !isGuest) {
    return (
      <Screen className="gap-3 pt-4">
        <Text
          variant="heading"
          className="px-4 pb-3 text-4xl"
          style={{ fontFamily: typography.family.extrabold }}
        >
          Wallet &amp; Portfolio
        </Text>
        <Card contentClassName="gap-2">
          <Text variant="bodyStrong">Wallet isn&apos;t configured in this build</Text>
          <Text variant="caption" color="textSecondary">
            This environment is missing its wallet credentials — see docs/WALLET.md.
          </Text>
        </Card>
      </Screen>
    );
  }

  if (!isReady && !isGuest) {
    return (
      <Screen className="items-center justify-center gap-2">
        <ActivityIndicator accessibilityLabel="Loading wallet" />
        <Text variant="caption" color="textSecondary">
          Loading wallet…
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll className="gap-3 px-0 pt-4">
      <View className="flex-row items-center gap-2 px-4 pb-3">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Icon name="chevron-back" size={24} />
        </Pressable>
        <Text
          variant="heading"
          className="text-4xl"
          style={{ fontFamily: typography.family.extrabold }}
        >
          Wallet &amp; Portfolio
        </Text>
      </View>

      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Icon
          name={status === 'connected' ? 'checkmark-circle' : 'alert-circle-outline'}
          size={18}
          color={statusMeta.color}
        />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="bodyStrong" color={statusMeta.color} accessibilityLiveRegion="polite">
            {(isAuthenticated || isGuest) && status === 'connected'
              ? 'Wallet Connected'
              : statusMeta.label}
          </Text>
          {status === 'connected' && tradingAddress ? (
            <WalletAddress address={tradingAddress} compact />
          ) : (
            <Text variant="caption" color="textSecondary">
              Setting up automatically — no action needed.
            </Text>
          )}
        </View>
        {status === 'connected' ? (
          <View className="flex-shrink-0 flex-row gap-2">
            <Button
              label={isGuest ? 'Add demo funds' :
                depositStage === 'converting'
                  ? 'Converting…'
                  : depositStage === 'waiting'
                    ? 'Waiting…'
                    : depositStage === 'buying'
                      ? 'Depositing…'
                      : 'Deposit'
              }
              variant="primary"
              loading={isDepositing}
              onPress={handleDeposit}
              accessibilityLabel={isGuest ? 'Add demo funds' : 'Deposit'}
              className="min-h-0 px-3 py-2"
            />
            <Button
              label="Withdraw"
              variant="secondary"
              onPress={() => {
                setWithdrawError(null);
                setWithdrawResult(null);
                setConfirmingWithdraw(false);
                setWithdrawOpen(true);
              }}
              accessibilityLabel="Withdraw"
              className="min-h-0 px-3 py-2"
            />
          </View>
        ) : null}
      </View>

      {status === 'error' && error ? (
        <Text variant="caption" color="danger" className="px-4">
          {error}
        </Text>
      ) : null}

      <View className="flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
        <View className="flex-1 gap-0.5">
          <Text variant="caption" color="textSecondary">
            Balance
          </Text>
          <Text variant="title" className="text-3xl font-bold">
            {balance.isPending && status === 'connected'
              ? '···'
              : balance.data?.usdc != null
                ? formatUsd(balance.data.usdc)
                : '—'}
          </Text>
          {status === 'connected' && balance.data?.usdc == null && !balance.isPending ? (
            <Text variant="micro" color="textTertiary">
              Trading setup is still finishing — it completes automatically.
            </Text>
          ) : null}
        </View>
      </View>

      {depositError ? (
        <Text variant="caption" color="danger" className="px-4">
          {depositError}
        </Text>
      ) : null}

      <Modal visible={withdrawOpen} onClose={() => { setWithdrawOpen(false); setConfirmingWithdraw(false); }}>
        <Text variant="heading">Withdraw USDC</Text>
        <Text variant="body" color="textSecondary" className="mt-2">
          Send funds from your trading balance to a Polygon wallet.
        </Text>
        {!confirmingWithdraw && !withdrawResult ? <TextInput
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Polygon wallet address"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          className="mt-5 rounded-lg border border-border bg-surface px-3 py-3 text-white"
        /> : null}
        {confirmingWithdraw && !withdrawResult ? (
          <View className="mt-5 gap-2 rounded-lg border border-border bg-surface p-3">
            <Text variant="bodyStrong">Review withdrawal</Text>
            <Text variant="caption" color="textSecondary">Network: Polygon</Text>
            <Text variant="caption" color="textSecondary">Asset: USDC.e</Text>
            <Text variant="caption" className="font-mono">{recipient.trim()}</Text>
            <Text variant="caption" color="textSecondary">Amount: {amount.trim()} USDC.e</Text>
            <Text variant="caption" color="danger">Check the address and network. Transfers can't be reversed.</Text>
          </View>
        ) : null}
        {!confirmingWithdraw && !withdrawResult ? <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount (USDC.e)"
          placeholderTextColor="#6B7280"
          keyboardType="decimal-pad"
          className="mt-3 rounded-lg border border-border bg-surface px-3 py-3 text-white"
        /> : null}
        {withdrawError ? (
          <Text variant="caption" color="danger" className="mt-3">
            {withdrawError}
          </Text>
        ) : null}
        {withdrawResult ? (
          <Text variant="caption" color={withdrawResult.status === 'confirmed' ? 'yes' : 'accent'} className="mt-3">
            {withdrawResult.status === 'confirmed' ? 'Withdrawal confirmed.' : 'Withdrawal pending. Wait for confirmation before trying again.'}
            {withdrawResult.transactionHash ? ` Transaction: ${withdrawResult.transactionHash}` : ''}
            {withdrawResult.transactionId ? ` Relayer ID: ${withdrawResult.transactionId}` : ''}
          </Text>
        ) : null}
        <View className="mt-5 flex-row justify-end gap-3">
          <Pressable
            onPress={() => {
              if (confirmingWithdraw && !withdrawResult) {
                // "Back" returns to the edit step, keeping the entered
                // recipient/amount instead of discarding them.
                setConfirmingWithdraw(false);
                return;
              }
              setWithdrawOpen(false);
            }}
            className="px-4 py-2"
          >
            <Text variant="body" color="textSecondary">{withdrawResult ? 'Close' : confirmingWithdraw ? 'Back' : 'Cancel'}</Text>
          </Pressable>
          <Pressable
            disabled={isWithdrawing || Boolean(withdrawResult)}
            onPress={async () => {
              if (isWithdrawing) return;
              if (!confirmingWithdraw) {
                if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.trim())) {
                  setWithdrawError('Enter a valid Polygon wallet address. Check the address and its checksum.');
                  return;
                }
                setWithdrawError(null);
                setConfirmingWithdraw(true);
                return;
              }
              setIsWithdrawing(true);
              try {
                setWithdrawError(null);
                const result = await withdraw(recipient.trim(), amount.trim());
                setWithdrawResult(result);
              } catch (error) {
                setWithdrawError(error instanceof Error ? error.message : 'Withdrawal failed.');
              } finally {
                setIsWithdrawing(false);
              }
            }}
            className={`rounded-lg bg-accent px-4 py-2 ${isWithdrawing ? 'opacity-50' : ''}`}
          >
            <Text variant="bodyStrong" className="text-black">
              {isWithdrawing ? 'Submitting…' : withdrawResult ? 'Submitted' : confirmingWithdraw ? 'Confirm withdrawal' : 'Review withdrawal'}
            </Text>
          </Pressable>
        </View>
      </Modal>

      {sellNotice ? (
        <Text variant="caption" color={sellNotice.tone} className="px-4">
          {sellNotice.message}
        </Text>
      ) : null}

      {status !== 'connected' ? (
        <EmptyState
          icon="wallet-outline"
          title="Connect your wallet"
          message="Your balance and positions appear here once a wallet is connected."
        />
      ) : positionsQuery.isError ? (
        <ErrorState
          message="Couldn't load your positions."
          onRetry={() => positionsQuery.refetch()}
        />
      ) : (
        <>
          <View className="flex-row border-b border-border px-4 py-3">
            <View className="flex-1 gap-0.5">
              <Text variant="caption" color="textSecondary">
                Open Positions
              </Text>
              <Text variant="title" className="text-3xl font-bold">{positions.length}</Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="caption" color="textSecondary">
                Unrealized PnL
              </Text>
              <Text
                variant="title"
                className="text-3xl font-bold"
                color={
                  totalPnl == null || totalPnl === 0 ? 'textSecondary' : totalPnl > 0 ? 'yes' : 'no'
                }
              >
                {totalPnl == null
                  ? '—'
                  : totalPnl === 0
                    ? formatUsd(0)
                    : `${totalPnl > 0 ? '+' : '−'}${formatUsd(Math.abs(totalPnl))}`}
              </Text>
            </View>
          </View>

          {positions.length > 0 ? <AllocationPanel positions={positions} /> : null}

          {positionsQuery.isPending ? (
            <View className="items-center py-12">
              <ActivityIndicator accessibilityLabel="Loading positions" />
            </View>
          ) : positions.length === 0 ? (
            <EmptyState
              icon="trending-up-outline"
              title="No positions yet"
              message="Positions you take on markets will show up here."
            />
          ) : (
            positions.map((position, index) => (
              <View key={position.id}>
                <PositionRow
                  position={position}
                  onSell={() => {
                    setSellNotice(null);
                    sell.reset();
                    setSellTarget(position);
                  }}
                />
                {index < positions.length - 1 ? <Divider /> : null}
              </View>
            ))
          )}
        </>
      )}

      {isGuest ? (
        <Text variant="micro" color="textTertiary" className="px-4 text-center">
          Guest demo mode — this wallet address, balance, and every trade here are simulated locally
          and are not tied to a real account.
        </Text>
      ) : isAuthenticated ? (
        <Text variant="micro" color="textTertiary" className="px-4 text-center">
          Logging out ends your app session only — it doesn&apos;t delete your embedded wallet.
        </Text>
      ) : null}

      <BottomSheet
        visible={sellTarget != null}
        onClose={() => {
          if (sell.isPending) return;
          setSellTarget(null);
        }}
      >
        {sellTarget ? (
          <View className="gap-3">
            <Text variant="heading">Sell position</Text>
            <Text variant="body" numberOfLines={3}>
              {sellTarget.marketQuestion}
            </Text>
            <View className="flex-row gap-6">
              <View className="gap-0.5">
                <Text variant="caption" color="textTertiary">
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
              </View>
              <View className="gap-0.5">
                <Text variant="caption" color="textTertiary">
                  Shares
                </Text>
                <Text variant="bodyStrong">{sellTarget.size}</Text>
              </View>
              <View className="gap-0.5">
                <Text variant="caption" color="textTertiary">
                  Current
                </Text>
                <Text variant="bodyStrong">
                  {sellTarget.currentPrice != null
                    ? formatProbability(sellTarget.currentPrice)
                    : '—'}
                </Text>
              </View>
            </View>
            <Text variant="caption" color="textSecondary">
              Sells the whole position at market. Final price is set when it fills; proceeds stay
              in your trading balance for another trade or withdrawal.
            </Text>
            {sell.isError ? (
              <Text variant="caption" color="danger">
                {friendlySellError(sell.error)}
              </Text>
            ) : null}
            <View className="flex-row justify-end gap-2">
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setSellTarget(null)}
                disabled={sell.isPending}
                className="min-h-0 px-4 py-2"
              />
              <Button
                label={sell.isPending ? 'Selling…' : 'Sell'}
                variant="no"
                loading={sell.isPending}
                onPress={() =>
                  sell.mutate(sellTarget.id, {
                    onSuccess: (result) => {
                      setSellNotice({
                        tone: 'yes',
                        message: `Position sold — ${formatUsd(result.proceedsUsd)} is now in your trading balance.`,
                      });
                      setSellTarget(null);
                    },
                  })
                }
                className="min-h-0 px-4 py-2"
              />
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

function AllocationPanel({ positions }: { positions: UserPosition[] }) {
  const values = positions
    .map((position) => ({
      position,
      value: ((position.currentPrice ?? position.entryPrice) / 100) * position.size,
    }))
    .sort((a, b) => b.value - a.value);
  const total = values.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return null;
  const top = values.slice(0, 3);
  return (
    <Card contentClassName="gap-3">
      <View className="flex-row items-center gap-3">
        <Icon name="stats-chart-outline" color="textSecondary" />
        <Text variant="bodyStrong">Allocation</Text>
      </View>
      <View className="h-3 flex-row overflow-hidden rounded-full bg-surface-elevated">
        {top.map((item, index) => (
          <View
            key={item.position.id}
            className="h-full bg-accent"
            style={{ flex: item.value / total, opacity: 1 - index * 0.18 }}
          />
        ))}
      </View>
      {top.map((item) => (
        <View key={item.position.id} className="flex-row items-center justify-between gap-2">
          <Text variant="caption" color="textSecondary" numberOfLines={1} className="flex-1">
            {item.position.marketQuestion}
          </Text>
          <Text variant="caption">{Math.round((item.value / total) * 100)}%</Text>
        </View>
      ))}
    </Card>
  );
}

function PositionRow({ position, onSell }: { position: UserPosition; onSell: () => void }) {
  const pnl =
    position.currentPrice != null
      ? ((position.currentPrice - position.entryPrice) / 100) * position.size
      : null;

  return (
    <View className="gap-2 px-4 py-3">
      <Text variant="bodyStrong" numberOfLines={2}>
        {position.marketQuestion}
      </Text>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 flex-row flex-wrap gap-3">
          <View className="w-[28%] gap-0.5">
            <Text variant="caption" color="textTertiary">
              Position
            </Text>
            <Text
              variant="bodyStrong"
              color={choiceTextColor(
                choiceTone({ index: position.choiceIndex, label: position.outcome })
              )}
            >
              {position.outcome}
            </Text>
          </View>
          <View className="w-[28%] gap-0.5">
            <Text variant="caption" color="textTertiary">
              Entry
            </Text>
            <Text variant="bodyStrong">{formatProbability(position.entryPrice)}</Text>
          </View>
          <View className="w-[28%] gap-0.5">
            <Text variant="caption" color="textTertiary">
              Current
            </Text>
            <Text variant="bodyStrong">
              {position.currentPrice != null ? formatProbability(position.currentPrice) : '—'}
            </Text>
          </View>
          <View className="w-[28%] gap-0.5">
            <Text variant="caption" color="textTertiary">
              Size
            </Text>
            <Text variant="bodyStrong">{position.size}</Text>
          </View>
        </View>
        <View className="items-end gap-0.5">
          <Text variant="caption" color="textTertiary">
            P/L
          </Text>
          <Text
            variant="bodyStrong"
            color={pnl == null ? 'textSecondary' : pnl >= 0 ? 'yes' : 'no'}
          >
            {pnl == null ? '—' : `${pnl >= 0 ? '+' : '−'}${formatUsd(Math.abs(pnl))}`}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-end">
        <Button
          label="Sell"
          variant="no"
          onPress={onSell}
          className="min-h-0 px-4 py-2"
          accessibilityLabel={`Sell ${position.outcome} position`}
        />
      </View>
    </View>
  );
}

/** Never surfaces a raw backend error — the backend's own sell messages
 * are already user-facing, so known codes pass through and anything else
 * becomes one generic message. */
function friendlySellError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (
      ['insufficient_shares', 'trade_failed', 'approvals_failed', 'no_liquidity'].includes(
        error.body.code
      )
    ) {
      return error.body.message;
    }
  }
  if (error instanceof Error && /network/i.test(error.message)) {
    return 'Network error — check your connection and try again.';
  }
  return "Couldn't sell this position right now. Please try again.";
}
