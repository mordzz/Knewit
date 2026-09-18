import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, spacing, TAB_BAR_HEIGHT, typography } from '@/theme';
import { FAB } from '@/components/ui/FAB';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { PostDetailScreen } from '@/features/home/screens/PostDetailScreen';
import { MarketsScreen } from '@/features/markets/screens/MarketsScreen';
import { MarketDetailScreen } from '@/features/markets/screens/MarketDetailScreen';

import { SearchScreen } from '@/features/search/screens/SearchScreen';
import { LeaderboardScreen } from '@/features/leaderboard/screens/LeaderboardScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { FollowersScreen } from '@/features/profile/screens/FollowersScreen';
import { FollowingScreen } from '@/features/profile/screens/FollowingScreen';
import { WalletScreen } from '@/features/wallet/screens/WalletScreen';
import type { AppParamList, MainTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

const HomeStackNav = createNativeStackNavigator<AppParamList>();

/**
 * Home pushes MarketDetail/Profile within its own stack (tab bar stays
 * visible), rather than as root-level routes — consistent with the
 * per-tab-stack pattern established in Sprint 1 — see docs/DECISIONS.md.
 * `Profile`/`Followers`/`Following`/`EditProfile` are duplicated across
 * every stack below (Sprint 11) since any of them can push a profile —
 * same pattern already used for `MarketDetail`/`PostDetail`.
 */
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeFeed" component={HomeScreen} />
      <HomeStackNav.Screen name="MarketDetail" component={MarketDetailScreen} />
      <HomeStackNav.Screen name="PostDetail" component={PostDetailScreen} />
      <HomeStackNav.Screen name="Profile" component={ProfileScreen} />
      <HomeStackNav.Screen name="Followers" component={FollowersScreen} />
      <HomeStackNav.Screen name="Following" component={FollowingScreen} />
      <HomeStackNav.Screen name="EditProfile" component={EditProfileScreen} />
    </HomeStackNav.Navigator>
  );
}

const MarketsStackNav = createNativeStackNavigator<AppParamList>();

/**
 * Markets also pushes MarketDetail within its own stack — tapping a
 * market card here shouldn't require going through Home first. Gained
 * `Profile` (and its sub-routes) in Sprint 11 — Market Detail's
 * activity tab can open an author's profile, which this stack
 * previously had no registered route for.
 */
function MarketsStack() {
  return (
    <MarketsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MarketsStackNav.Screen name="Markets" component={MarketsScreen} />
      <MarketsStackNav.Screen name="MarketDetail" component={MarketDetailScreen} />
      <MarketsStackNav.Screen name="PostDetail" component={PostDetailScreen} />
      <MarketsStackNav.Screen name="Profile" component={ProfileScreen} />
      <MarketsStackNav.Screen name="Followers" component={FollowersScreen} />
      <MarketsStackNav.Screen name="Following" component={FollowingScreen} />
      <MarketsStackNav.Screen name="EditProfile" component={EditProfileScreen} />
    </MarketsStackNav.Navigator>
  );
}

const ProfileStackNav = createNativeStackNavigator<AppParamList>();

/**
 * Wallet is reachable from Profile, not its own bottom tab — see
 * docs/DECISIONS.md. It's the one account/funds screen (the old separate
 * Portfolio screen is gone; docs/DECISIONS.md, "Wallet Replaces
 * Portfolio"). The tab's own root `Profile` screen renders with no
 * `userId` param (the viewer's own profile) — see docs/DECISIONS.md
 * ("One Profile Route/Screen for Self and Other Users").
 */
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="Profile" component={ProfileScreen} />
      <ProfileStackNav.Screen name="Followers" component={FollowersScreen} />
      <ProfileStackNav.Screen name="Following" component={FollowingScreen} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStackNav.Screen name="Wallet" component={WalletScreen} />
    </ProfileStackNav.Navigator>
  );
}

const SearchStackNav = createNativeStackNavigator<AppParamList>();

/**
 * Search also pushes MarketDetail/Profile within its own stack (tab
 * bar stays visible) — Sprint 4 needed both once search results became
 * tappable, same per-tab-stack pattern Home/Markets already use — see
 * docs/DECISIONS.md.
 */
function SearchStack() {
  return (
    <SearchStackNav.Navigator screenOptions={{ headerShown: false }}>
      <SearchStackNav.Screen name="Search" component={SearchScreen} />
      <SearchStackNav.Screen name="MarketDetail" component={MarketDetailScreen} />
      <SearchStackNav.Screen name="PostDetail" component={PostDetailScreen} />
      <SearchStackNav.Screen name="Profile" component={ProfileScreen} />
      <SearchStackNav.Screen name="Followers" component={FollowersScreen} />
      <SearchStackNav.Screen name="Following" component={FollowingScreen} />
      <SearchStackNav.Screen name="EditProfile" component={EditProfileScreen} />
    </SearchStackNav.Navigator>
  );
}

const LeaderboardStackNav = createNativeStackNavigator<AppParamList>();

/**
 * Leaderboard now pushes Profile within its own stack (Sprint 10 —
 * tapping a ranked user opens their profile) — same per-tab-stack
 * pattern as Home/Markets/Search, see docs/DECISIONS.md.
 */
function LeaderboardStack() {
  return (
    <LeaderboardStackNav.Navigator screenOptions={{ headerShown: false }}>
      <LeaderboardStackNav.Screen name="Leaderboard" component={LeaderboardScreen} />
      <LeaderboardStackNav.Screen name="Profile" component={ProfileScreen} />
      <LeaderboardStackNav.Screen name="Followers" component={FollowersScreen} />
      <LeaderboardStackNav.Screen name="Following" component={FollowingScreen} />
      <LeaderboardStackNav.Screen name="EditProfile" component={EditProfileScreen} />
    </LeaderboardStackNav.Navigator>
  );
}

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
 * The FAB only shows on Home, by request — see docs/DECISIONS.md
 * (supersedes the earlier "overlays all five tabs" decision). Tracked
 * via each `Tab.Screen`'s own `focus` listener rather than reading the
 * tab navigator's state from a sibling component — `useNavigationState`
 * called here would resolve to the *parent* (root) navigator's state,
 * not this nested tab navigator's, since this component is what renders
 * the `Tab.Navigator`, not a screen inside it.
 */
export function MainTabNavigator() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<keyof MainTabParamList>('HomeTab');

  return (
    <View className="relative flex-1">
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarPosition: 'bottom',
          tabBarShowLabel: false,
          tabBarLabelPosition: 'beside-icon',
          tabBarLabelStyle: {
            fontFamily: typography.family.semibold,
            fontSize: 15,
          },
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
          listeners={{ focus: () => setActiveTab('HomeTab') }}
        />
        <Tab.Screen
          name="MarketsTab"
          component={MarketsStack}
          options={{
            title: 'Markets',
            tabBarIcon: makeTabBarIcon('stats-chart', 'stats-chart-outline'),
          }}
          listeners={{ focus: () => setActiveTab('MarketsTab') }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchStack}
          options={{ title: 'Search', tabBarIcon: makeTabBarIcon('search', 'search-outline') }}
          listeners={{ focus: () => setActiveTab('SearchTab') }}
        />
        <Tab.Screen
          name="LeaderboardTab"
          component={LeaderboardStack}
          options={{
            title: 'Leaderboard',
            tabBarIcon: makeTabBarIcon('podium', 'podium-outline'),
          }}
          listeners={{ focus: () => setActiveTab('LeaderboardTab') }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
          options={{
            title: 'Profile',
            tabBarIcon: makeTabBarIcon('person-circle', 'person-circle-outline'),
          }}
          listeners={{ focus: () => setActiveTab('ProfileTab') }}
        />
      </Tab.Navigator>

      {activeTab === 'HomeTab' ? (
        <FAB
          accessibilityLabel="Create a Callout"
          onPress={() => navigation.navigate('CreateCall')}
          className="absolute right-6"
          style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + spacing.sm }}
        />
      ) : null}
    </View>
  );
}
