/**
 * Canonical source of design tokens as of the NativeWind migration.
 * `src/theme/colors.ts`, `typography.ts`, and `radius.ts` stay in sync
 * with the values below by hand — they're still needed at the JS level
 * for RN APIs that take a raw color, not a className (Icon's Ionicons
 * `color` prop, ActivityIndicator, RefreshControl's tintColor). The
 * palette is small and rare to change, so manual sync was chosen over
 * adding a TS-config loader (e.g. ts-node) just for this file — see
 * docs/DECISIONS.md. Spacing intentionally has no custom scale: our
 * 4px-based tokens (4/8/12/16/24/32/48) already match Tailwind's default
 * numeric spacing 1:1 (1/2/3/4/6/8/12), so plain `p-4`, `gap-3`, etc. are
 * used directly instead of inventing named aliases.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#151923',
        'surface-elevated': '#1E2330',
        border: '#2A3040',

        'text-primary': '#FFFFFF',
        'text-secondary': '#9AA3B2',
        'text-tertiary': '#5C6577',
        'text-inverse': '#000000',

        yes: '#22C55E',
        'yes-muted': 'rgba(34, 197, 94, 0.15)',
        no: '#F43F5E',
        'no-muted': 'rgba(244, 63, 94, 0.15)',

        accent: '#FFE506',
        'accent-muted': 'rgba(255, 229, 6, 0.15)',
        warning: '#F59E0B',
        danger: '#EF4444',

        overlay: 'rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        full: '9999px',
      },
      fontSize: {
        // No `fontWeight` here (unlike before the Inter migration) —
        // weight is now which static Inter file is loaded, carried via
        // the `fontFamily` keys below, not a numeric style. Combining a
        // numeric `fontWeight` with a specific static custom font is a
        // known RN/Android gotcha (Android can silently fall back to
        // the system font trying to resolve a "bold variant" of a
        // family that doesn't have one) — see docs/DECISIONS.md.
        jumbo: ['60px', { lineHeight: '54px' }],
        display: ['32px', { lineHeight: '38px' }],
        heading: ['24px', { lineHeight: '30px' }],
        title: ['18px', { lineHeight: '24px' }],
        body: ['15px', { lineHeight: '21px' }],
        'body-strong': ['15px', { lineHeight: '21px' }],
        caption: ['13px', { lineHeight: '18px' }],
        micro: ['11px', { lineHeight: '15px' }],
      },
      fontFamily: {
        // Chirp (X's actual UI font) is a proprietary in-house typeface —
        // not something this project can legitimately obtain or bundle,
        // and doing so would contradict this project's own rule against
        // copying proprietary assets from reference apps (see
        // docs/DESIGN.md). Inter is the standard freely-licensed (SIL
        // OFL) substitute for this exact "clean modern grotesque" look —
        // see docs/DECISIONS.md. Named by weight, not by our semantic
        // scale, since a static Google Font ships one file per weight.
        'inter-regular': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        'inter-extrabold': ['Inter_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
