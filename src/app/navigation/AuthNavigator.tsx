import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '@/features/auth/screens/SignInScreen';

export type AuthStackParamList = {
  SignIn: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Two contexts now, not one — see docs/DECISIONS.md ("Hard Login
 * Gate"). Signed out, `RootNavigator` renders this as the app's only
 * route at launch (no modal, nothing to dismiss to). Signed in but
 * without an embedded wallet connected yet, it's still presented
 * modally on demand (a Buy/Create-Call action), same as before.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
    </Stack.Navigator>
  );
}
