import { colors, glass, solidPanel } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import * as layout from './layout';

export const theme = {
  colors,
  glass,
  solidPanel,
  typography,
  spacing,
  radius,
  layout,
} as const;

export type Theme = typeof theme;

export { colors, glass, solidPanel, typography, spacing, radius };
export * from './layout';
