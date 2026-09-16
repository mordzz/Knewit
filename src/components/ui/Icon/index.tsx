import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import type { ColorToken } from '@/theme/colors';

/**
 * Constrained to the glyphs this app actually uses, rather than exposing
 * every Ionicons name — keeps icon usage consistent and typo-safe.
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

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorToken;
}

export function Icon({ name, size = 22, color = 'textPrimary' }: IconProps) {
  return <Ionicons name={name} size={size} color={colors[color]} />;
}
