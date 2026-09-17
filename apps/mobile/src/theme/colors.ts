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

/**
 * Black-glass card surface raw values (`GlassSurface` `tone="dark"`,
 * e.g. `MarketAttachment`) — genuinely translucent, not solid: this
 * component briefly went fully solid ("Solid Surfaces, No 3D Bevel")
 * before that was scoped back down to `BottomSheet` only — every other
 * glass surface (this one included) stays real glassmorphism — see
 * docs/DECISIONS.md ("Glassmorphism Restored Outside BottomSheet").
 * `fill` at 0.88 alpha is "near-opaque, not see-through" (the earlier
 * "too transparent" complaint) while still being a translucent tint,
 * not a flat color; `border`/`highlight` sell the glass edge — a faint
 * uniform border plus a brighter top-edge sheen (glossy shine, not a
 * full directional bevel). Kept out of `colors` itself (not a
 * `ColorToken`): every `ColorToken` is expected to work as a matching
 * `bg-`/`text-`/`border-` Tailwind class too (see `theme/tw.ts` and
 * `tailwind.config.js`), which these translucent rgba values don't —
 * they're only ever consumed as raw values in `style`, never `className`.
 */
export const glass = {
  fill: 'rgba(14, 15, 19, 0.88)',
  border: 'rgba(255, 255, 255, 0.14)',
  highlight: 'rgba(255, 255, 255, 0.3)',
} as const;

/**
 * The shared "solid panel" recipe: absolute black fill with only the
 * *glass edge* — the treatment every overlay surface uses (`BottomSheet`,
 * `Modal`, sign-in's panel) and now the Callout composer's cards too.
 * Spread into a `style` next to the per-site radius/padding, e.g.
 * `style={[solidPanel, { borderRadius: 16 }]}` — see docs/DECISIONS.md
 * ("BottomSheet & Modal Solid Black + Glass Border" and "Create Callout
 * Composer Polish") so the edge values never drift between surfaces.
 */
export const solidPanel = {
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: glass.border,
  borderTopColor: glass.highlight,
} as const;
