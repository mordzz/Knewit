import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePrivy, useEmbeddedEthereumWallet } from '@privy-io/expo';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Divider } from '@/components/ui/Divider';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { isPrivyConfigured } from '@/app/config/env';

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
 * Reached from Profile → Wallet, never a bottom tab — see
 * docs/DECISIONS.md. Shows only real Privy state: no fake balances,
 * positions, or wallet info are ever fabricated (docs/WALLET.md).
 *
 * An authenticated visitor with no embedded wallet yet (`isAuthenticated
 * && status !== 'connected'`) creates one directly from here via
 * `useEmbeddedEthereumWallet().create()` — the same call
 * `SignInScreen`'s `ensureWalletThenClose` makes right after a fresh
 * login. That login-time call only ever fires once, at the moment of
 * signing in; it does nothing for a visitor who's already authenticated
 * from an earlier session and still has no wallet (creation failed
 * that one time, or the session predates it) — this screen is that
 * backstop, since (unlike `PrivySessionBridge`, which deliberately only
 * mirrors state, never mutates it — see its own doc comment) a signed-in
 * person tapping "Connect Wallet" here is a real, deliberate action, not
 * a silent background effect. `PrivySessionBridge`'s own effect flips
 * `status` to `'connected'` reactively once Privy's wallet list updates,
 * so no local status plumbing is needed beyond the create call itself.
 */
export function WalletScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { status, address, error } = useWallet();
  const { logout, isReady } = usePrivy();
  const { create: createWallet } = useEmbeddedEthereumWallet();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [createWalletError, setCreateWalletError] = useState<string | null>(null);

  const statusMeta = STATUS_COPY[status] ?? STATUS_COPY.disconnected;

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

  if (!isPrivyConfigured) {
    return (
      <Screen className="gap-3 pt-4">
        <Text variant="heading">Wallet</Text>
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
    <Screen scroll className="gap-3 pt-4">
      <Text variant="heading">Wallet</Text>

      <Card contentClassName="gap-3">
        <View className="flex-row items-center gap-2">
          <Icon
            name={status === 'connected' ? 'checkmark-circle' : 'alert-circle-outline'}
            size={18}
            color={statusMeta.color}
          />
          <Text variant="bodyStrong" color={statusMeta.color} accessibilityLiveRegion="polite">
            {isAuthenticated && status === 'connected' ? 'Wallet Connected' : statusMeta.label}
          </Text>
        </View>

        {status === 'connected' && address ? (
          <>
            <Divider />
            <View className="gap-1">
              <Text variant="caption" color="textSecondary">
                Wallet Address
              </Text>
              <WalletAddress address={address} />
            </View>
          </>
        ) : (
          <>
            <Text variant="body" color="textSecondary">
              No wallet connected. Connect to take positions or create verified Calls.
            </Text>
            <Button
              label="Connect Wallet"
              loading={isCreatingWallet}
              onPress={handleConnectWallet}
              accessibilityLabel="Connect Wallet"
            />
            {createWalletError ? (
              <Text variant="caption" color="danger">
                {createWalletError}
              </Text>
            ) : null}
          </>
        )}

        {status === 'error' && error ? (
          <>
            <Text variant="caption" color="danger">
              {error}
            </Text>
            <Button
              label="Try again"
              variant="secondary"
              onPress={() => navigation.navigate('Auth')}
            />
          </>
        ) : null}
      </Card>

      {status === 'connected' ? (
        <Card contentClassName="gap-2">
          <Text variant="bodyStrong">Wallet Information</Text>
          <View className="flex-row justify-between">
            <Text variant="caption" color="textSecondary">
              Wallet type
            </Text>
            <Text variant="caption">Privy Embedded Wallet</Text>
          </View>
          <View className="flex-row justify-between">
            <Text variant="caption" color="textSecondary">
              Network
            </Text>
            <Text variant="caption">Ethereum</Text>
          </View>
        </Card>
      ) : null}

      <Card contentClassName="gap-2">
        <View className="flex-row items-center gap-2">
          <Icon name="alert-circle-outline" size={16} color="textTertiary" />
          <Text variant="bodyStrong">Security</Text>
        </View>
        <Text variant="caption" color="textSecondary">
          Your wallet is securely managed through Privy. Knewit never sees, stores, or transmits
          your private keys or recovery phrase.
        </Text>
      </Card>

      {status === 'connected' ? (
        <Card
          onPress={() => navigation.navigate('Portfolio')}
          contentClassName="flex-row items-center gap-3"
        >
          <Icon name="trending-up-outline" color="accent" />
          <View className="flex-1">
            <Text variant="bodyStrong">Portfolio</Text>
            <Text variant="caption" color="textSecondary">
              Positions and activity
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="textTertiary" />
        </Card>
      ) : null}

      {isAuthenticated ? (
        <Button label="Log Out" variant="ghost" onPress={handleLogout} className="mt-2" />
      ) : null}
      {isAuthenticated ? (
        <Text variant="micro" color="textTertiary" className="text-center">
          Logging out ends your app session only — it doesn&apos;t delete your embedded wallet.
        </Text>
      ) : null}
    </Screen>
  );
}
