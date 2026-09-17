import {
  IoHome,
  IoHomeOutline,
  IoTrendingUp,
  IoTrendingUpOutline,
  IoAdd,
  IoAddCircle,
  IoAddCircleOutline,
  IoWallet,
  IoWalletOutline,
  IoPerson,
  IoPersonOutline,
  IoClose,
  IoCheckmark,
  IoCheckmarkCircle,
  IoChevronForward,
  IoChevronBack,
  IoSearch,
  IoHeart,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoAlertCircleOutline,
  IoRefresh,
  IoNotificationsOutline,
  IoLogoBitcoin,
  IoLogoGoogle,
  IoFlagOutline,
  IoTrophyOutline,
  IoFilmOutline,
  IoBriefcaseOutline,
  IoStatsChartOutline,
  IoHardwareChipOutline,
  IoEarthOutline,
  IoAppsOutline,
  IoLayersOutline,
  IoTimeOutline,
  IoEllipsisHorizontal,
  IoShareOutline,
  IoOptionsOutline,
  IoSettingsOutline,
} from 'react-icons/io5';
import type { IconType } from 'react-icons';

/**
 * Web equivalent of `apps/mobile/src/components/ui/Icon` — same
 * constrained glyph set (Ionicons via `@expo/vector-icons` there,
 * `react-icons/io5` here — the same underlying Ionicons 5 glyph set,
 * just packaged for React DOM instead of React Native), same
 * `ColorToken` color prop. `IconName` is copied verbatim; only the
 * rendering implementation swaps libraries.
 */
export type IconName =
  | 'home'
  | 'home-outline'
  | 'trending-up'
  | 'trending-up-outline'
  | 'add'
  | 'add-circle'
  | 'add-circle-outline'
  | 'wallet'
  | 'wallet-outline'
  | 'person'
  | 'person-outline'
  | 'close'
  | 'checkmark'
  | 'checkmark-circle'
  | 'chevron-forward'
  | 'chevron-back'
  | 'search'
  | 'heart'
  | 'heart-outline'
  | 'chatbubble-outline'
  | 'alert-circle-outline'
  | 'refresh'
  | 'notifications-outline'
  | 'logo-bitcoin'
  | 'logo-google'
  | 'flag-outline'
  | 'trophy-outline'
  | 'film-outline'
  | 'briefcase-outline'
  | 'stats-chart-outline'
  | 'hardware-chip-outline'
  | 'earth-outline'
  | 'apps-outline'
  | 'layers-outline'
  | 'time-outline'
  | 'ellipsis-horizontal'
  | 'share-outline'
  | 'options-outline'
  | 'settings-outline';

export type ColorToken =
  | 'background'
  | 'surface'
  | 'surfaceElevated'
  | 'border'
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'textInverse'
  | 'yes'
  | 'yesMuted'
  | 'no'
  | 'noMuted'
  | 'accent'
  | 'accentMuted'
  | 'warning'
  | 'danger'
  | 'overlay';

const colors: Record<ColorToken, string> = {
  background: '#000000',
  surface: '#151923',
  surfaceElevated: '#1E2330',
  border: '#2A3040',
  textPrimary: '#FFFFFF',
  textSecondary: '#9AA3B2',
  textTertiary: '#5C6577',
  textInverse: '#000000',
  yes: '#22C55E',
  yesMuted: 'rgba(34, 197, 94, 0.15)',
  no: '#F43F5E',
  noMuted: 'rgba(244, 63, 94, 0.15)',
  accent: '#FDCC03',
  accentMuted: 'rgba(253, 204, 3, 0.15)',
  warning: '#F59E0B',
  danger: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

const ICONS: Record<IconName, IconType> = {
  home: IoHome,
  'home-outline': IoHomeOutline,
  'trending-up': IoTrendingUp,
  'trending-up-outline': IoTrendingUpOutline,
  add: IoAdd,
  'add-circle': IoAddCircle,
  'add-circle-outline': IoAddCircleOutline,
  wallet: IoWallet,
  'wallet-outline': IoWalletOutline,
  person: IoPerson,
  'person-outline': IoPersonOutline,
  close: IoClose,
  checkmark: IoCheckmark,
  'checkmark-circle': IoCheckmarkCircle,
  'chevron-forward': IoChevronForward,
  'chevron-back': IoChevronBack,
  search: IoSearch,
  heart: IoHeart,
  'heart-outline': IoHeartOutline,
  'chatbubble-outline': IoChatbubbleOutline,
  'alert-circle-outline': IoAlertCircleOutline,
  refresh: IoRefresh,
  'notifications-outline': IoNotificationsOutline,
  'logo-bitcoin': IoLogoBitcoin,
  'logo-google': IoLogoGoogle,
  'flag-outline': IoFlagOutline,
  'trophy-outline': IoTrophyOutline,
  'film-outline': IoFilmOutline,
  'briefcase-outline': IoBriefcaseOutline,
  'stats-chart-outline': IoStatsChartOutline,
  'hardware-chip-outline': IoHardwareChipOutline,
  'earth-outline': IoEarthOutline,
  'apps-outline': IoAppsOutline,
  'layers-outline': IoLayersOutline,
  'time-outline': IoTimeOutline,
  'ellipsis-horizontal': IoEllipsisHorizontal,
  'share-outline': IoShareOutline,
  'options-outline': IoOptionsOutline,
  'settings-outline': IoSettingsOutline,
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorToken;
  className?: string;
}

export function Icon({ name, size = 22, color = 'textPrimary', className }: IconProps) {
  const Glyph = ICONS[name];
  return <Glyph size={size} color={colors[color]} className={className} />;
}
