import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePrivy, useEmbeddedEthereumWallet, useSigners } from '@privy-io/expo';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useDeposit } from '@/features/wallet/hooks/useDeposit';
import { isUserCancelledFunding } from '@/features/wallet/utils/privyErrors';
import { usePositions } from '@/features/portfolio/hooks/usePositions';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { isPrivyConfigured, env } from '@/app/config/env';
import { formatProbability, formatUsd } from '@/utils/formatCurrency';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import type { UserPosition } from '@/types/social';

const STATUS_COPY: Record<
  string,
  { label: string; color: 'yes' | 'accent' | 'textTertiary' | 'danger' }
> = {
  connected: { label: 'Connected', color: 'yes' },
  connecting: { label: 'Connecting...', color: 'accent' },
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
 * An authenticated visitor with no embedded wallet yet still creates one
 * directly from here via `useEmbeddedEthereumWallet().create()` — the
 * same call `SignInScreen`'s `ensureWalletThenClose` makes right after a
 * fresh login; this screen is the backstop for sessions that predate it
 * (see `PrivySessionBridge`'s doc comment for why the bridge itself
 * never mutates state).
 */
export function WalletScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { status, address, error } = useWallet();
  const { logout, isReady } = usePrivy();
  const { create: createWallet } = useEmbeddedEthereumWallet();
  const { addSigners } = useSigners();
  const { deposit } = useDeposit();
  const queryClient = useQueryClient();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [createWalletError, setCreateWalletError] = useState<string | null>(null);
  const [isEnablingSigning, setIsEnablingSigning] = useState(false);
  const [enableSigningError, setEnableSigningError] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const signerId = env.privySignerId;

  const statusMeta = STATUS_COPY[status] ?? STATUS_COPY.disconnected;

  const balance = useWalletBalance();
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (logoutError) {
      if (__DEV__) console.warn('[wallet] logout failed', logoutError);
    }
  };

  const handleConnectWallet = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth');
      return;
    }
    setCreateWalletError(null);
    setIsCreatingWallet(true);
    try {
      await createWallet();
    } catch (createError) {
      if (__DEV__) console.warn('[wallet] embedded wallet creation failed', createError);
      setCreateWalletError("Couldn't create your wallet. Try again.");
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleDeposit = async () => {
    setDepositError(null);
    setIsDepositing(true);
    try {
      await deposit();
    } catch (depositFailure) {
      if (isUserCancelledFunding(depositFailure)) return; // closing Privy's modal is not a failure
      if (__DEV__) console.warn('[wallet] deposit flow failed', depositFailure);
      setDepositError("Couldn't open the deposit flow. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  const needsSignerSetup =
    Boolean(address && signerId) && !balance.isPending && balance.data?.usdc == null;

  const handleEnableSigning = async () => {
    if (!address || !signerId) return;
    setEnableSigningError(null);
    setIsEnablingSigning(true);
    try {
      await addSigners({ address, signers: [{ signerId, policyIds: [] }] });
      await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    } catch (signingError) {
      if (__DEV__) console.warn('[wallet] adding signer failed', signingError);
      setEnableSigningError("Couldn't enable trading. Please try again.");
    } finally {
      setIsEnablingSigning(false);
    }
  };

  if (!isPrivyConfigured) {
    return (
      <Screen className="gap-3 pt-4">
        <Text
          variant="heading"
          className="px-4 pb-3 text-4xl"
          style={{ fontFamily: typography.family.extrabold }}
        >
          Wallet
        </Text>
        <Card contentClassName="gap-2">
          <Text variant="bodyStrong">Wallet isn&apos;t configured in this build</Text>
          <Text variant="caption" color="textSecondary">
            This environment is missing its Privy app credentials — see docs/WALLET.md.
          </Text>
        </Card>
      </Screen>
    );
  }

  if (!isReady) {
    return (
      <Screen className="items-center justify-center gap-2">
        <ActivityIndicator accessibilityLabel="Loading wallet" />
        <Text variant="caption" color="textSecondary">
          Loading wallet...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll className="gap-3 px-0 pt-4">
      <Text
        variant="heading"
        className="px-4 pb-3 text-4xl"
        style={{ fontFamily: typography.family.extrabold }}
      >
        Wallet
      </Text>

      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Icon
          name={status === 'connected' ? 'checkmark-circle' : 'alert-circle-outline'}
          size={18}
          color={statusMeta.color}
        />
        <View className="flex-1 gap-0.5">
          <Text variant="bodyStrong" color={statusMeta.color} accessibilityLiveRegion="polite">
            {isAuthenticated && status === 'connected' ? 'Wallet Connected' : statusMeta.label}
          </Text>
          {status === 'connected' && address ? (
            <WalletAddress address={address} compact />
          ) : (
            <Text variant="caption" color="textSecondary">
              Connect to take positions or create verified Calls.
            </Text>
          )}
        </View>
        {status === 'connected' ? (
          <Button
            label="Log Out"
            variant="no"
            onPress={handleLogout}
            accessibilityLabel="Log Out"
            className="min-h-0 px-3 py-2"
          />
        ) : (
          <Button
            label="Connect Wallet"
            variant="secondary"
            loading={isCreatingWallet}
            onPress={handleConnectWallet}
            accessibilityLabel="Connect Wallet"
          />
        )}
      </View>

      {createWalletError ? (
        <Text variant="caption" color="danger" className="px-4">
          {createWalletError}
        </Text>
      ) : null}

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
          <Text variant="title">
            {balance.isPending && status === 'connected'
              ? '···'
              : balance.data?.usdc != null
                ? formatUsd(balance.data.usdc)
                : '—'}
          </Text>
          {status === 'connected' && balance.data?.usdc == null && !balance.isPending ? (
            <Text variant="micro" color="textTertiary">
              Shows once wallet signing is active.
            </Text>
          ) : null}
          {needsSignerSetup ? (
            <Button
              label="Enable trading"
              variant="secondary"
              loading={isEnablingSigning}
              onPress={handleEnableSigning}
              accessibilityLabel="Enable trading"
              className="mt-2 min-h-0 self-start px-4 py-2"
            />
          ) : null}
          {enableSigningError ? (
            <Text variant="caption" color="danger">
              {enableSigningError}
            </Text>
          ) : null}
        </View>
        {status === 'connected' ? (
          <Button
            label="Deposit"
            variant="primary"
            loading={isDepositing}
            onPress={handleDeposit}
            accessibilityLabel="Deposit"
            className="min-h-0 px-4 py-2"
          />
        ) : null}
      </View>

      {depositError ? (
        <Text variant="caption" color="danger" className="px-4">
          {depositError}
        </Text>
      ) : null}

      {status !== 'connected' ? (
        <EmptyState
          icon="wallet-outline"
          title="Connect your wallet"
          message="Your balance and positions appear here once a wallet is connected."
        />
      ) : positionsQuery.isError ? (
        <ErrorState message="Couldn't load your positions." onRetry={() => positionsQuery.refetch()} />
      ) : (
        <>
          <View className="flex-row border-b border-border px-4 py-3">
            <View className="flex-1 gap-0.5">
              <Text variant="caption" color="textSecondary">
                Open Positions
              </Text>
              <Text variant="title">{positions.length}</Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="caption" color="textSecondary">
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
            </View>
          </View>

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
                <PositionRow position={position} />
                {index < positions.length - 1 ? <Divider /> : null}
              </View>
            ))
          )}
        </>
      )}

      {isAuthenticated ? (
        <Text variant="micro" color="textTertiary" className="px-4 text-center">
          Logging out ends your app session only — it doesn&apos;t delete your embedded wallet.
        </Text>
      ) : null}
    </Screen>
  );
}

function PositionRow({ position }: { position: UserPosition }) {
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
        <View className="flex-row gap-5">
          <View className="gap-0.5">
            <Text variant="caption" color="textTertiary">
              Position
            </Text>
            <Text
              variant="bodyStrong"
              color={choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }))}
            >
              {position.outcome}
            </Text>
          </View>
          <View className="gap-0.5">
            <Text variant="caption" color="textTertiary">
              Entry
            </Text>
            <Text variant="bodyStrong">{formatProbability(position.entryPrice)}</Text>
          </View>
          <View className="gap-0.5">
            <Text variant="caption" color="textTertiary">
              Current
            </Text>
            <Text variant="bodyStrong">
              {position.currentPrice != null ? formatProbability(position.currentPrice) : '—'}
            </Text>
          </View>
          <View className="gap-0.5">
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
          <Text variant="bodyStrong" color={pnl == null ? 'textSecondary' : pnl >= 0 ? 'yes' : 'no'}>
            {pnl == null ? '—' : `${pnl >= 0 ? '+' : '−'}${formatUsd(Math.abs(pnl))}`}
          </Text>
        </View>
      </View>
    </View>
  );
}
