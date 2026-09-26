/**
 * The shared "solid panel" class recipe: absolute black fill with only
 * the *glass edge*  the treatment every overlay surface uses (`Modal`,
 * `BottomSheet`, sign-in's panel) and the Callout composer's cards too.
 * Compose it with `cn(SOLID_PANEL_CLASS, 'rounded-2xl p-6')` etc. so the
 * edge values never drift between surfaces  see docs/DECISIONS.md
 * ("BottomSheet & Modal Solid Black + Glass Border" and "Create Callout
 * Composer Polish").
 */
export const SOLID_PANEL_CLASS = 'border border-white/[0.14] border-t-white/30 bg-background';
