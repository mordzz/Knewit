import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@/theme';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { MarketsScreen } from '@/features/markets/screens/MarketsScreen';
import { CreateCallScreen } from '@/features/social/screens/CreateCallScreen';
import { PortfolioScreen } from '@/features/portfolio/screens/PortfolioScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  MarketsTab: undefined;
  CreateTab: undefined;
  PortfolioTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Each tab owns its own stack so feature screens (Market Detail, other-user
 * Profile, etc.) can be pushed later without restructuring navigation —
 * see docs/PRODUCT-FLOW.md.
 */
function createTabStack(name: string, Screen: () => React.JSX.Element) {
  const Stack = createNativeStackNavigator();
  return function TabStack() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={name} component={Screen} />
      </Stack.Navigator>
    );
  };
}

const HomeStack = createTabStack('Home', HomeScreen);
const MarketsStack = createTabStack('Markets', MarketsScreen);
const CreateStack = createTabStack('Create', CreateCallScreen);
const PortfolioStack = createTabStack('Portfolio', PortfolioScreen);
const ProfileStack = createTabStack('Profile', ProfileScreen);

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="MarketsTab" component={MarketsStack} options={{ title: 'Markets' }} />
      <Tab.Screen name="CreateTab" component={CreateStack} options={{ title: 'Create' }} />
      <Tab.Screen name="PortfolioTab" component={PortfolioStack} options={{ title: 'Portfolio' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
