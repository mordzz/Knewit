/**
 * The shared card surface — the same values `MarketAttachment` gets from
 * `GlassSurface tone="dark" blur={false} radius={18}` (near-black
 * translucent fill, faint white edge, 18px radius), as a plain Tailwind
 * recipe like `SOLID_PANEL_CLASS` so every card surface stays in sync.
 * Padding is deliberately left to each card.
 */
export const CARD_SURFACE_CLASS = 'overflow-hidden rounded-[18px] border border-white/[0.14] bg-[rgba(14,15,19,0.88)]';
