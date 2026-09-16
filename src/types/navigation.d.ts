import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Bottom-tab route list — lives here (not in MainTabNavigator.tsx) so
 * `AppParamList` below can reference it for deep-linking into a specific
 * tab (`Main` → `{ screen: 'MarketsTab', params: {...} }`) without a
 * circular import between the two files.
 */
export type MainTabParamList = {
  HomeTab: undefined;
  MarketsTab: { category?: string } | undefined;
  SearchTab: undefined;
  LeaderboardTab: undefined;
  ProfileTab: undefined;
};

/**
 * Flat, app-wide route list — React Navigation's documented pattern for
 * global `useNavigation()` typing without per-screen composite navigation
 * props. Screens are physically owned by different navigators (Main/Auth/
 * CreateCall by the root stack; MarketDetail lives in both Home's and
 * Markets' own stacks; Portfolio lives in Profile's stack — see
 * MainTabNavigator.tsx), but `navigate()` bubbles up through parent
 * navigators at runtime regardless of where a screen is typed, so one
 * flat list keeps every call site simple.
 */
export type AppParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Auth: undefined;
  /** The Callout composer — no params: every callout requires an
   * attached market position (only buyers can post one), enforced by
   * the screen itself — see docs/DECISIONS.md ("Black Glass for Callout
   * Surfaces", superseding the earlier Post/Call `intent` choice). */
  CreateCall: undefined;
  HomeFeed: undefined;
  Markets: undefined;
  Search: undefined;
  Leaderboard: undefined;
  /**
   * One route/screen for both the viewer's own profile and anyone
   * else's (Sprint 11) — `userId` omitted means "my own profile,"
   * resolved server-side from the session (see docs/DECISIONS.md, "One
   * Profile Route/Screen for Self and Other Users"). Replaces the
   * earlier separate `Profile`/`UserProfile` routes.
   */
  Profile: { userId?: string } | undefined;
  EditProfile: undefined;
  Followers: { userId: string };
  Following: { userId: string };
  Wallet: undefined;
  Portfolio: undefined;
  MarketDetail: { marketId: string };
  /** Serves both a normal Post and a position-backed Call — same
   * screen either way (docs/SOCIAL-FEATURE.md). */
  PostDetail: { postId: string };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends AppParamList {}
  }
}
