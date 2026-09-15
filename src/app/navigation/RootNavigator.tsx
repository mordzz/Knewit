import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from '@/app/navigation/MainTabNavigator';
import { AuthNavigator } from '@/app/navigation/AuthNavigator';
import { CreateCallScreen } from '@/features/home/screens/CreateCallScreen';
import type { AppParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AppParamList>();

/**
 * Main is always the initial route — browsing markets and Calls never
 * requires a wallet (docs/PRODUCT-FLOW.md), so the root does not gate on
 * auth state. Auth and CreateCall are wired here as modal routes any
 * screen can present on demand (Auth: taking a position; CreateCall: the
 * FAB in MainTabNavigator) — see docs/DECISIONS.md.
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="CreateCall"
          component={CreateCallScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
