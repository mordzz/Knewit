import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from '@/app/navigation/MainTabNavigator';
import { AuthNavigator } from '@/app/navigation/AuthNavigator';
import { CreateCallScreen } from '@/features/home/screens/CreateCallScreen';
import { useAutoWalletSetup } from '@/features/wallet/hooks/useAutoWalletSetup';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';
import type { AppParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AppParamList>();

/**
 * Hard login gate — by request, this supersedes the earlier "Main is
 * always the initial route, browsing never requires a wallet" decision
 * (see docs/DECISIONS.md, "Hard Login Gate"). Until Privy has resolved
 * (`isReady`, mirrored from `usePrivy()` by `PrivySessionBridge`) this
 * renders a bare loading state, not the login form — deciding from
 * `isAuthenticated` alone before Privy has actually checked would flash
 * the login screen even for an already-logged-in user. Once ready:
 * signed out sees only `AuthNavigator` (no `Main`/`CreateCall` routes
 * registered at all, so there's nothing to fall back to); signed in
 * sees `Main` as the initial route, with `Auth`/`CreateCall` still
 * available as on-demand modal routes (e.g. connecting an embedded
 * wallet specifically, distinct from being logged out entirely) exactly
 * as before.
 *
 * Guest mode (`isGuest`) is the one deliberate exception: it enters the
 * app without a Privy session, so it skips both this gate and the
 * wallet-setup gate — every request it makes is answered by the in-app
 * sandbox (`services/guest/guestBackend.ts`). `hasHydrated` gates the
 * persisted guest flag itself so a returning guest doesn't flash the
 * login screen on cold start.
 */
export function RootNavigator() {
  const { isAuthenticated, isGuest, isReady, hasHydrated } = useAuth();
  // Owns automatic wallet creation and signer consent for the app session.
  // Keep provisioning active in the background; it must not gate navigation.
  useAutoWalletSetup();

  if (!isGuest && (!isReady || !hasHydrated)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const canUseApp = isAuthenticated || isGuest;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {canUseApp ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            {/* `Auth` is registered in both branches, so without a
                changing `navigationKey` React Navigation would keep the
                focused login-gate route after sign-in instead of moving
                to `Main` — the user stayed stuck on SignIn until a cold
                start. */}
            <Stack.Screen
              name="Auth"
              component={AuthNavigator}
              navigationKey="signed-in"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="CreateCall"
              component={CreateCallScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} navigationKey="signed-out" />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
