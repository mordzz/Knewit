export const typography = {
  family: {
    regular: undefined, // system font until a brand typeface is chosen — see docs/DESIGN.md
    medium: undefined,
    bold: undefined,
  },
  scale: {
    display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
    heading: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
    title: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
    body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
    bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
    micro: { fontSize: 11, lineHeight: 15, fontWeight: '500' as const },
  },
} as const;

export type TypographyVariant = keyof typeof typography.scale;
