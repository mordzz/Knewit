import { useWindowDimensions } from 'react-native';
import { TABLET_MIN_WIDTH } from '@/theme';

/**
 * True from `TABLET_MIN_WIDTH` (768) up — the one breakpoint the mobile
 * app switches layouts on: the bottom tab bar becomes a left rail
 * (`MainTabNavigator`), `Screen` constrains content to the mobile-app
 * column, and overlays render as centered dialogs instead of bottom
 * sheets. Uses `useWindowDimensions()` (not a static `Dimensions.get`),
 * so rotating a tablet re-evaluates it. See docs/DECISIONS.md,
 * "Responsive Shell: Rail on Tablet, Sidebar on Desktop".
 */
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_MIN_WIDTH;
}
