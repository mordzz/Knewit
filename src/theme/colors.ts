/**
 * Dark-first palette for the FOMO-inspired trading experience.
 * Light mode is deferred — see docs/DESIGN.md.
 */
export const colors = {
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
} as const;

export type ColorToken = keyof typeof colors;
