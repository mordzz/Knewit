import { ActivityIndicator, Image } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import type { WalletSetupStatus } from '@/features/wallet/hooks/useAutoWalletSetup';

/**
 * The account-setup gate screen `RootNavigator` renders between "signed
 * in" and "wallet + signing ready" — a fresh login never lands inside the
 * app mid-setup, and there are no manual Connect/Enable buttons any more
 * (docs/DECISIONS.md, "Automatic Wallet & Trading Setup — No Manual
 * Buttons"). Shows the real state: an honest spinner while the automatic
 * steps run, or what failed when they couldn't finish.
 */
export function AccountSetupScreen({ status }: { status: WalletSetupStatus }) {
  return (
    <Screen className="items-center justify-center gap-3">
      <Image
        source={require('../../../../assets/icon.png')}
        className="h-20 w-20 rounded-3xl"
        accessibilityLabel="Knewit"
      />

      {status === 'error' ? (
        <>
          <Text variant="bodyStrong" className="mt-2 text-center">
            We couldn&apos;t finish setting up your account
          </Text>
          <Text variant="caption" color="textSecondary" className="text-center">
            We&apos;ll try again next time you open the app — your wallet and funds are safe.
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator accessibilityLabel="Setting up your account" />
          <Text variant="bodyStrong" className="mt-2 text-center">
            Setting up your account…
          </Text>
          <Text variant="caption" color="textSecondary" className="text-center">
            Creating your wallet and enabling trading. This only happens once.
          </Text>
        </>
      )}
    </Screen>
  );
}
