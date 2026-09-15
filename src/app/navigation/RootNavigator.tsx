import { NavigationContainer } from '@react-navigation/native';
import { MainTabNavigator } from '@/app/navigation/MainTabNavigator';

/**
 * An AuthNavigator will sit alongside MainTabNavigator once Privy-based
 * sign-in gates the app — see docs/WALLET.md. Until then, the app opens
 * straight into the main tabs.
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>
  );
}
