'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useLogout, useCreateWallet } from '@privy-io/react-auth';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Divider } from '@/components/ui/Divider';

/**
 * Direct conversion of `apps/mobile`'s `WalletScreen` — same status
 * card, same "Connect Wallet" action that creates the embedded wallet
 * directly for an already-authenticated visitor (mirrors mobile's
 * `useEmbeddedEthereumWallet().create()` call), same Security card and
 * Log Out footer. Shows only real Privy state: no fake balance,
 * positions, or wallet info is ever fabricated.
 */
export default function WalletPage() {
  const router = useRouter();
  const { ready, user } = usePrivy();
  const { logout } = useLogout();
  const { createWallet } = useCreateWallet();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [createWalletError, setCreateWalletError] = useState<string | null>(null);

  const address = user?.wallet?.address ?? null;
  const isConnected = !!address;

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
    <main className="flex w-full flex-col gap-3 px-4 pt-4">
      <Text variant="heading">Wallet</Text>

      {!ready ? (
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
          <Text variant="caption" color="textSecondary">
            Loading wallet...
          </Text>
        </div>
      ) : (
        <Card contentClassName="gap-3">
          <div className="flex items-center gap-2">
            <Icon
              name={isConnected ? 'checkmark-circle' : 'alert-circle-outline'}
              size={18}
              color={isConnected ? 'yes' : 'textTertiary'}
            />
            <Text variant="bodyStrong" color={isConnected ? 'yes' : 'textTertiary'}>
              {isConnected ? 'Wallet Connected' : 'Not connected'}
            </Text>
          </div>

          {isConnected && address ? (
            <>
              <Divider />
              <div>
                <Text variant="caption" color="textSecondary" className="block">
                  Wallet Address
                </Text>
                <Text variant="body" className="mt-1 block break-all font-mono">
                  {address}
                </Text>
              </div>
              <Divider />
              <Text variant="bodyStrong">Wallet Information</Text>
              <div className="flex justify-between">
                <Text variant="caption" color="textSecondary">
                  Type
                </Text>
                <Text variant="caption">Embedded (Privy)</Text>
              </div>
              <div className="flex justify-between">
                <Text variant="caption" color="textSecondary">
                  Network
                </Text>
                <Text variant="caption">Polygon</Text>
              </div>
            </>
          ) : (
            <>
              <Text variant="body" color="textSecondary">
                No wallet connected. Connect to take positions or create verified Calls.
              </Text>
              <Button label="Connect Wallet" loading={isCreatingWallet} onClick={handleConnectWallet} />
              {createWalletError ? (
                <Text variant="caption" color="danger">
                  {createWalletError}
                </Text>
              ) : null}
            </>
          )}
        </Card>
      )}

      <Card contentClassName="gap-2">
        <div className="flex items-center gap-2">
          <Icon name="alert-circle-outline" size={16} color="textTertiary" />
          <Text variant="bodyStrong">Security</Text>
        </div>
        <Text variant="caption" color="textSecondary">
          Your wallet is securely managed through Privy. Knewit never sees, stores, or transmits
          your private keys or recovery phrase.
        </Text>
      </Card>

      {isConnected ? (
        <Card onPress={() => router.push('/portfolio')} contentClassName="flex-row items-center gap-3">
          <Icon name="trending-up-outline" color="accent" />
          <div className="flex-1">
            <Text variant="bodyStrong" className="block">
              Portfolio
            </Text>
            <Text variant="caption" color="textSecondary">
              Positions and activity
            </Text>
          </div>
          <Icon name="chevron-forward" size={18} color="textTertiary" />
        </Card>
      ) : null}

      <Button label="Log Out" variant="ghost" onClick={() => logout()} className="mt-2" />
      <Text variant="micro" color="textTertiary" className="block text-center">
        Logging out ends your app session only — it doesn&apos;t delete your embedded wallet.
      </Text>
    </main>
  );
}
