import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '@/features/auth/screens/SignInScreen';

export type AuthStackParamList = {
  SignIn: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Presented modally on demand (from a Buy/Create-Call action), not shown
 * at launch — browsing never requires a wallet, see docs/PRODUCT-FLOW.md.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
    </Stack.Navigator>
  );
}
