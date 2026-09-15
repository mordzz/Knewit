import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, spacing } from '@/theme';
import { FAB } from '@/components/ui/FAB';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { MarketsScreen } from '@/features/markets/screens/MarketsScreen';
import { MarketDetailScreen } from '@/features/markets/screens/MarketDetailScreen';
import { SearchScreen } from '@/features/search/screens/SearchScreen';
import { LeaderboardScreen } from '@/features/leaderboard/screens/LeaderboardScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { PortfolioScreen } from '@/features/portfolio/screens/PortfolioScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';
import type { AppParamList, MainTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Single-screen tabs that don't push anything else yet. */
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

const HomeStackNav = createNativeStackNavigator<AppParamList>();

/**
 * Home pushes MarketDetail/UserProfile within its own stack (tab bar stays
 * visible), rather than as root-level routes — consistent with the
 * per-tab-stack pattern established in Sprint 1 — see docs/DECISIONS.md.
 */
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeFeed" component={HomeScreen} />
      <HomeStackNav.Screen name="MarketDetail" component={MarketDetailScreen} />
      <HomeStackNav.Screen name="UserProfile" component={UserProfileScreen} />
    </HomeStackNav.Navigator>
  );
}

const MarketsStackNav = createNativeStackNavigator<AppParamList>();

/** Markets also pushes MarketDetail within its own stack — tapping a
 * market card here shouldn't require going through Home first. */
function MarketsStack() {
  return (
    <MarketsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MarketsStackNav.Screen name="Markets" component={MarketsScreen} />
      <MarketsStackNav.Screen name="MarketDetail" component={MarketDetailScreen} />
    </MarketsStackNav.Navigator>
  );
}

const ProfileStackNav = createNativeStackNavigator<AppParamList>();

/**
 * Portfolio is reachable from Profile, not its own bottom tab — see
 * docs/DECISIONS.md. Kept as a pushed screen (not merged into
 * ProfileScreen's own JSX) since it's a distinct, already-built screen
 * with its own concerns (wallet/positions), not something to duplicate.
 */
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="Profile" component={ProfileScreen} />
      <ProfileStackNav.Screen name="Portfolio" component={PortfolioScreen} />
    </ProfileStackNav.Navigator>
  );
}

const SearchStack = createTabStack('Search', SearchScreen);
const LeaderboardStack = createTabStack('Leaderboard', LeaderboardScreen);

/** Filled icon when focused, outline otherwise — standard tab-bar convention. */
function makeTabBarIcon(
  filled: keyof typeof Ionicons.glyphMap,
  outline: keyof typeof Ionicons.glyphMap
) {
  function TabBarIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
    return <Ionicons name={focused ? filled : outline} color={color} size={size} />;
  }
  return TabBarIcon;
}

/**
 * The FAB overlays all five tabs (not just Home) since Create is a
 * primary, always-reachable action rather than a tab — see
 * docs/DECISIONS.md.
 */
export function MainTabNavigator() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.textPrimary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{ title: 'Home', tabBarIcon: makeTabBarIcon('home', 'home-outline') }}
        />
        <Tab.Screen
          name="MarketsTab"
          component={MarketsStack}
          options={{
            title: 'Markets',
            tabBarIcon: makeTabBarIcon('trending-up', 'trending-up-outline'),
          }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchStack}
          options={{ title: 'Search', tabBarIcon: makeTabBarIcon('search', 'search-outline') }}
        />
        <Tab.Screen
          name="LeaderboardTab"
          component={LeaderboardStack}
          options={{ title: 'Leaderboard', tabBarIcon: makeTabBarIcon('trophy', 'trophy-outline') }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
          options={{ title: 'Profile', tabBarIcon: makeTabBarIcon('person', 'person-outline') }}
        />
      </Tab.Navigator>

      <FAB
        accessibilityLabel="Create a post or Call"
        onPress={() => navigation.navigate('CreateCall')}
        className="absolute right-6"
        style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + spacing.sm }}
      />
    </View>
  );
}

// Approximate default React Navigation bottom-tab bar height, before the
// safe-area inset (which is added separately via `insets.bottom` above).
const TAB_BAR_HEIGHT = 49;
