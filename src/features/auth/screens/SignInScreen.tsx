import { useState } from 'react';
import { useLoginWithEmail, useEmbeddedEthereumWallet } from '@privy-io/expo';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { isPrivyConfigured } from '@/app/config/env';

/**
 * Privy's embedded-wallet email sign-in flow. Two contexts now, per
 * docs/DECISIONS.md ("Hard Login Gate"): the app's own launch gate when
 * signed out (`RootNavigator` renders this with nothing to go back to),
 * and a modal presented on demand when already signed in but not yet
 * wallet-connected (e.g. taking a position). `navigation.goBack()`
 * below only does anything in the second case — react-navigation's
 * `goBack()` is a documented no-op with nothing to go back to, and
 * either way `isAuthenticated` flipping true is what actually swaps
 * `RootNavigator` off this screen in the launch-gate case, not this
 * call. No seed phrase is ever shown or collected; Privy manages the
 * embedded wallet's key material entirely — see docs/WALLET.md.
 */
export function SignInScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [walletError, setWalletError] = useState<string | null>(null);
  const { create: createWallet } = useEmbeddedEthereumWallet();

  const { state, sendCode, loginWithCode } = useLoginWithEmail({
    onLoginSuccess: async (user) => {
      // A brand-new user has no embedded wallet yet — creation is a
      // real, deliberate action tied to this specific login, not a
      // silent background effect — see docs/DECISIONS.md.
      const hasEthereumWallet = user.linked_accounts.some(
        (account) => account.type === 'wallet' && account.chain_type === 'ethereum'
      );
      if (!hasEthereumWallet) {
        try {
          await createWallet();
        } catch (error) {
          if (__DEV__) console.warn('[wallet] embedded wallet creation failed', error);
          setWalletError("Signed in, but couldn't set up your wallet. Try again from Wallet.");
          return;
        }
      }
      navigation.goBack();
    },
  });

  if (!isPrivyConfigured) {
    return (
      <Screen className="items-center justify-center gap-2">
        <Icon name="wallet-outline" size={40} color="textTertiary" />
        <Text variant="heading" className="mt-2 text-center">
          Wallet sign-in isn&apos;t configured yet
        </Text>
        <Text variant="body" color="textSecondary" className="text-center">
          This build is missing its Privy app credentials — see docs/WALLET.md.
        </Text>
      </Screen>
    );
  }

  const isSendingCode = state.status === 'sending-code';
  const isAwaitingCode =
    state.status === 'awaiting-code-input' || state.status === 'submitting-code';
  const isSubmittingCode = state.status === 'submitting-code';
  const errorMessage =
    state.status === 'error'
      ? (state.error?.message ?? 'Something went wrong. Try again.')
      : walletError;

  const handleSendCode = async () => {
    setWalletError(null);
    await sendCode({ email });
  };

  const handleVerifyCode = async () => {
    setWalletError(null);
    await loginWithCode({ code, email });
  };

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

      {!isAwaitingCode ? (
        <>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSendingCode}
            accessibilityLabel="Email address"
            className="mt-4 w-full"
          />
          <Button
            label="Send code"
            onPress={handleSendCode}
            loading={isSendingCode}
            disabled={email.trim().length === 0}
            className="mt-2 w-full"
          />
        </>
      ) : (
        <>
          <Text variant="caption" color="textSecondary" className="mt-4 text-center">
            Enter the code sent to {email}
          </Text>
          <Input
            label="Verification code"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            editable={!isSubmittingCode}
            accessibilityLabel="Verification code"
            className="mt-1 w-full"
          />
          <Button
            label="Verify"
            onPress={handleVerifyCode}
            loading={isSubmittingCode}
            disabled={code.trim().length === 0}
            className="mt-2 w-full"
          />
          <Button
            label="Use a different email"
            variant="ghost"
            onPress={() => {
              setCode('');
              setWalletError(null);
              setEmail('');
            }}
            className="mt-1 w-full"
          />
        </>
      )}

      {errorMessage ? (
        <Text variant="caption" color="danger" className="mt-2 text-center">
          {errorMessage}
        </Text>
      ) : null}

      <Text variant="micro" color="textTertiary" className="mt-6 text-center">
        Your wallet is securely managed through Privy. We never see or store your private keys.
      </Text>
    </Screen>
  );
}
