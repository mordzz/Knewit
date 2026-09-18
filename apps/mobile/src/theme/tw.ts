import type { ColorToken } from '@/theme/colors';

/**
 * Tailwind/NativeWind's content scanner needs complete class-name
 * strings to appear literally in source — `text-${color}` template
 * interpolation doesn't work, since nothing evaluates the JS to know
 * which strings to generate CSS for. These lookup tables let a
 * component pick a class from a runtime `ColorToken` prop while keeping
 * every possible resulting string literal and scannable.
 */
export const textColorClass: Record<ColorToken, string> = {
  background: 'text-background',
  surface: 'text-surface',
  surfaceElevated: 'text-surface-elevated',
  border: 'text-border',
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textTertiary: 'text-text-tertiary',
  textInverse: 'text-text-inverse',
  yes: 'text-yes',
  yesMuted: 'text-yes-muted',
  no: 'text-no',
  noMuted: 'text-no-muted',
  accent: 'text-accent',
  accentMuted: 'text-accent-muted',
  warning: 'text-warning',
  danger: 'text-danger',
  overlay: 'text-overlay',
};

/**
 * Each entry pairs the size/line-height class with the matching Inter
 * weight class — one string, not two separately-mergeable classes, so
 * there's never a case where a caller's className could combine with a
 * *different* font-family class and leave `tailwind-merge` unable to
 * tell they conflict (it doesn't recognize either of these custom
 * families as belonging to the same group) — see docs/DECISIONS.md.
 */
export const typographyClass = {
  jumbo: 'text-jumbo font-inter-extrabold',
  display: 'text-display font-inter-bold',
  heading: 'text-heading font-inter-bold',
  title: 'text-title font-inter-semibold',
  body: 'text-body font-inter-regular',
  bodyStrong: 'text-body-strong font-inter-semibold',
  caption: 'text-caption font-inter-regular',
  micro: 'text-micro font-inter-medium',
} as const;
