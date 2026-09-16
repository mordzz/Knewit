import { colors, glass } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import * as layout from './layout';

export const theme = {
  colors,
  glass,
  typography,
  spacing,
  radius,
  layout,
} as const;

export type Theme = typeof theme;

export { colors, glass, typography, spacing, radius };
export * from './layout';
