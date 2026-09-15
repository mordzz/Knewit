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
  CreateCall: undefined;
  HomeFeed: undefined;
  Markets: undefined;
  Profile: undefined;
  Portfolio: undefined;
  MarketDetail: { marketId: string };
  UserProfile: { userId: string };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends AppParamList {}
  }
}
