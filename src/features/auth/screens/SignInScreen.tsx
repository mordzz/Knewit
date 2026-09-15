import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * Placeholder shell for the Privy embedded-wallet sign-in flow. Not wired
 * to the Privy SDK yet — see docs/WALLET.md. Presented as a modal from
 * wherever a wallet is required (e.g. taking a position), not shown at
 * app launch — see docs/DECISIONS.md for why the root isn't auth-gated.
 */
export function SignInScreen() {
  return (
    <Screen className="items-center justify-center gap-2">
      <Icon name="wallet-outline" size={40} color="accent" />
      <Text variant="heading" className="mt-2 text-center">
        Connect to continue
      </Text>
      <Text variant="body" color="textSecondary" className="text-center">
        Taking a position or creating a verified Call needs a wallet. We&apos;ll set one up for you
        automatically — no seed phrase, nothing to write down.
      </Text>
      <Button
        label="Connect Wallet"
        onPress={() => {
          // Not implemented yet — wires to Privy once the SDK lands, see
          // src/services/wallet/walletService.ts and docs/WALLET.md.
        }}
        className="mt-4 w-full"
      />
    </Screen>
  );
}
