/**
 * Font family is Inter (loaded via `@expo-google-fonts/inter` in
 * App.tsx) — the freely-licensed substitute for X's proprietary Chirp
 * typeface, which this project can't legitimately obtain or bundle —
 * see docs/DECISIONS.md. One static file per weight, so weight is
 * carried by *which family name* is used, not a separate `fontWeight`
 * style (mixing the two is a known RN/Android gotcha with custom static
 * fonts).
 */
export const typography = {
  family: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
  },
  scale: {
    // Balance-style hero numbers — deliberately above `display`, not a
    // page heading. Used sparingly (Home header balance) — see
    // docs/DESIGN.md.
    jumbo: { fontSize: 48, lineHeight: 54 },
    display: { fontSize: 32, lineHeight: 38 },
    heading: { fontSize: 24, lineHeight: 30 },
    title: { fontSize: 18, lineHeight: 24 },
    body: { fontSize: 15, lineHeight: 21 },
    bodyStrong: { fontSize: 15, lineHeight: 21 },
    caption: { fontSize: 13, lineHeight: 18 },
    micro: { fontSize: 11, lineHeight: 15 },
  },
} as const;

export type TypographyVariant = keyof typeof typography.scale;
