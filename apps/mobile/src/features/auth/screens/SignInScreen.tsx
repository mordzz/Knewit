import { useEffect, useState } from 'react';
import { View, Image, KeyboardAvoidingView, Platform, Pressable, Linking } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useLoginWithEmail, useLoginWithOAuth } from '@privy-io/expo';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { CodeInput } from '@/components/ui/CodeInput';
import { XLogo } from '@/components/ui/XLogo';
import { env, isPrivyConfigured } from '@/app/config/env';
import { solidPanel } from '@/theme';

/**
 * Privy's embedded-wallet sign-in flow  email-OTP plus Google/X OAuth.
 * Layout: ambient corner glow → plain logo → one panel, styled and
 * anchored like a bottom sheet (edge-to-edge, rounded top corners only,
 * flush with the screen's bottom edge), holding *everything* else on
 * this screen  title, email/code step, "Or sign in with" divider,
 * Google/X, the error line, and the security footnote. The panel uses
 * the same solid-black + glass-edge treatment as `BottomSheet`/`Modal`
 * (`colors.background` + `glass.border`/`glass.highlight`) rather than a
 * `GlassSurface` fill  see docs/DECISIONS.md ("BottomSheet & Modal
 * Solid Black + Glass Border"); this composition is deliberately scoped
 * to `SignInScreen`, not a change to the component itself. `Screen`'s
 * scroll content container
 * hardcodes `px-4` (see `components/layout/Screen`)  countered here
 * with an explicit `px-0` (via `cn`'s `tailwind-merge`, the last
 * conflicting utility wins) so this panel is genuinely edge-to-edge;
 * the logo section re-adds its own `px-4` since it isn't meant to be
 * full-bleed. The email input and Google/X buttons also use a
 * translucent (`bg-white/10`) fill instead of their normal solid one
 *  an approximation, not a second `BlurView` per element, but
 * sitting on top of the panel's own blur reads as "also glass" at
 * rest  so every surface on this screen matches, not just the panel
 * itself. The X brand mark is a real SVG path
 * (`components/ui/XLogo`), not a font glyph  see that component's own
 * comment for why. A brief fade/rise-in on mount uses
 * `react-native-reanimated` rather than React Native's own `Animated`
 *  this project's ESLint `react-hooks/refs` rule flags reading an
 * `Animated.Value` during render (the classic API's normal, required
 * usage) as an illegal ref read; Reanimated's `useSharedValue`/
 * `useAnimatedStyle` are the compiler/lint-safe replacement.
 *
 * Two contexts, per docs/DECISIONS.md ("Hard Login Gate"): the app's
 * own launch gate when signed out (`RootNavigator` renders this with
 * nothing to go back to), and a modal presented on demand when already
 * signed in but not yet wallet-connected (e.g. taking a position).
 * Either way this screen no longer navigates itself: `isAuthenticated`
 * flipping true is what swaps `RootNavigator`  to the setup screen
 * first, then the app once wallet creation and signing consent finish
 * (docs/DECISIONS.md, "Automatic Wallet & Trading Setup  No Manual
 * Buttons"). No seed phrase is ever shown or collected; Privy manages
 * the embedded wallet's key material entirely  see docs/WALLET.md.
 *
 * **Google/X sign-in requires those providers to be enabled as login
 * methods in the Privy Dashboard** (Login Methods settings)  this is
 * dashboard configuration, not something this code can do. Without it,
 * `login({ provider })` below fails with a real Privy error, surfaced
 * the same way any other auth failure is, never silently.
 */
export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const logoProgress = useSharedValue(0);
  const bottomProgress = useSharedValue(0);

  useEffect(() => {
    logoProgress.value = withTiming(1, { duration: 480 });
    bottomProgress.value = withDelay(120, withTiming(1, { duration: 480 }));
  }, [logoProgress, bottomProgress]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoProgress.value,
    transform: [{ translateY: (1 - logoProgress.value) * 16 }],
  }));
  const bottomAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bottomProgress.value,
    transform: [{ translateY: (1 - bottomProgress.value) * 24 }],
  }));

  // Wallet creation and signing consent are no longer part of this screen:
  // `RootNavigator`'s setup gate (`useAutoWalletSetup`) runs them right
  // after `isAuthenticated` flips, and renders the setup screen until both
  // are done  so no login path here navigates anywhere itself
  // (docs/DECISIONS.md, "Automatic Wallet & Trading Setup  No Manual
  // Buttons"). This screen simply ends when the navigator swaps away.
  const { state, sendCode, loginWithCode } = useLoginWithEmail();

  const { state: oAuthState, login: loginWithOAuth } = useLoginWithOAuth();

  if (!isPrivyConfigured) {
    return (
      <Screen className="items-center justify-center gap-2">
        <Image
          source={require('../../../../assets/logo-mark.png')}
          className="h-16 w-16"
          accessibilityLabel="Knewit"
        />
        <Text variant="heading" className="mt-4 text-center">
          Wallet sign-in isn&apos;t configured yet
        </Text>
        <Text variant="body" color="textSecondary" className="text-center">
          This build is missing its wallet credentials  see docs/WALLET.md.
        </Text>
      </Screen>
    );
  }

  const isSendingCode = state.status === 'sending-code';
  const isAwaitingCode =
    state.status === 'awaiting-code-input' || state.status === 'submitting-code';
  const isSubmittingCode = state.status === 'submitting-code';
  const isOAuthLoading = oAuthState.status === 'loading';
  const errorMessage =
    state.status === 'error'
      ? (state.error?.message ?? 'Something went wrong. Try again.')
      : oAuthState.status === 'error'
        ? (oAuthState.error?.message ?? 'Something went wrong. Try again.')
        : null;

  const handleSendCode = async () => {
    await sendCode({ email });
    setResendSeconds(60);
  };

  const handleResendCode = async () => {
    setResendSeconds(60);
    await sendCode({ email });
  };

  const handleChangeEmail = () => {
    setCode('');
    setEmail('');
  };

  const handleVerifyCode = async () => {
    await loginWithCode({ code, email });
  };

  const handleOAuthLogin = async (provider: 'google' | 'twitter') => {
    await loginWithOAuth({ provider });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll contentContainerClassName="flex-grow justify-between overflow-hidden px-0">
        {/* Ambient corner glows  this app's stand-in for a mesh
            gradient/hero illustration: no gradient library is
            installed and no illustration asset exists, so depth comes
            from large, very-low-opacity accent blobs anchored off two
            corners rather than a flat black void. */}
        <View
          pointerEvents="none"
          className="absolute -left-24 -top-16 h-72 w-72 rounded-full bg-accent"
          style={{ opacity: 0.08 }}
        />
        <View
          pointerEvents="none"
          className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-accent"
          style={{ opacity: 0.06 }}
        />

        <Animated.View
          style={logoAnimatedStyle}
          className="flex-1 items-center justify-center px-4 pt-10"
        >
          <Image
            source={require('../../../../assets/logo-mark.png')}
            className="h-36 w-36"
            accessibilityLabel="Knewit"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 18 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
            }}
          />
        </Animated.View>

        <Animated.View style={bottomAnimatedStyle} className="w-full">
          <View
            style={[
              solidPanel,
              { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomWidth: 0 },
            ]}
          >
            <View className="gap-4 px-4 pb-8 pt-3">
              {/* Drag-handle bar  same visual cue `BottomSheet` uses, so
                this panel reads as a bottom sheet even though it
                doesn't reuse that component directly (this sheet never
                closes/dismisses, so `BottomSheet`'s modal+backdrop
                machinery isn't a fit here). */}
              <View className="mb-1 h-1 w-9 self-center rounded-full bg-white/20" />

              {!isAwaitingCode ? (
                <>
                  <View className="items-center gap-1">
                    <Text className="text-3xl font-bold text-center">Welcome back</Text>
                    <Text variant="caption" color="textSecondary" className="text-center">
                      Sign in to continue to Knew it
                    </Text>
                  </View>

                  <Input
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSendingCode}
                    accessibilityLabel="Email address"
                    className="border-white/15 bg-white/10"
                  />
                  <Button
                    label="Continue"
                    onPress={handleSendCode}
                    loading={isSendingCode}
                    disabled={email.trim().length === 0}
                    className="w-full"
                  />
                </>
              ) : (
                <View className="gap-4">
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={handleChangeEmail}
                      accessibilityRole="button"
                      accessibilityLabel="Change email"
                      hitSlop={8}
                    >
                      <Icon name="chevron-back" size={22} color="textSecondary" />
                    </Pressable>
                    <View className="flex-1">
                      <Text className="text-2xl font-bold">Check your email</Text>
                      <Text variant="caption" color="textSecondary">
                        We sent a 6-digit code to {email}
                      </Text>
                    </View>
                  </View>

                  <CodeInput value={code} onChange={setCode} disabled={isSubmittingCode} />

                  <Button
                    label="Verify"
                    onPress={handleVerifyCode}
                    loading={isSubmittingCode}
                    disabled={code.length !== 6}
                    className="w-full"
                  />

                  <View className="flex-row items-center justify-center gap-4">
                    {resendSeconds > 0 ? (
                      <Text variant="caption" color="textTertiary">
                        Resend in {resendSeconds}s
                      </Text>
                    ) : (
                      <Pressable
                        onPress={handleResendCode}
                        disabled={isSendingCode}
                        accessibilityRole="button"
                        accessibilityLabel="Resend code"
                        hitSlop={8}
                      >
                        <Text
                          variant="caption"
                          color={isSendingCode ? 'textTertiary' : 'textSecondary'}
                          className="font-semibold"
                        >
                          Resend code
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={handleChangeEmail}
                      accessibilityRole="button"
                      accessibilityLabel="Change email"
                      hitSlop={8}
                    >
                      <Text variant="caption" color="textSecondary" className="font-semibold">
                        Change email
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View className="w-full flex-row items-center gap-3">
                <View className="h-px flex-1 bg-border" />
                <Text variant="caption" color="textTertiary">
                  Or sign in with
                </Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <View className="w-full gap-3">
                <Button
                  label="Continue with Google"
                  icon="logo-google"
                  variant="secondary"
                  onPress={() => handleOAuthLogin('google')}
                  disabled={isOAuthLoading || isAwaitingCode}
                  accessibilityLabel="Continue with Google"
                  className="w-full bg-white/10"
                />
                <Button
                  label="Continue with X"
                  iconElement={<XLogo size={16} color="textPrimary" />}
                  variant="secondary"
                  onPress={() => handleOAuthLogin('twitter')}
                  disabled={isOAuthLoading || isAwaitingCode}
                  accessibilityLabel="Continue with X"
                  className="w-full bg-white/10"
                />
              </View>

              {errorMessage ? (
                <Text variant="caption" color="danger" className="text-center">
                  {errorMessage}
                </Text>
              ) : null}

              <Text variant="micro" color="textTertiary" className="text-center">
                Your wallet is securely managed for you. We never see or store your private keys.
              </Text>
              <View className="flex-row justify-center gap-4">
                <Pressable onPress={() => Linking.openURL(`${env.webBaseUrl}/terms`)} accessibilityRole="link">
                  <Text variant="micro" color="textTertiary" className="underline">Terms</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL(`${env.webBaseUrl}/privacy`)} accessibilityRole="link">
                  <Text variant="micro" color="textTertiary" className="underline">Privacy</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
