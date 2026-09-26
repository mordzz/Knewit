/**
 * Shared cross-cutting layout constants  kept in one place so screens
 * that need to reserve clearance for the tab bar/FAB, or match the
 * keyboard-avoidance offset other screens use, reference the same
 * numbers instead of silently drifting (e.g. one screen hardcoding a
 * `KeyboardAvoidingView` offset of 90 while another defaults to 0)
 * see docs/DECISIONS.md.
 */

/** Approximate default React Navigation bottom-tab bar height, before
 * the safe-area inset (added separately via `useSafeAreaInsets()` at
 * each call site, since that value is only available inside a
 * component). */
export const TAB_BAR_HEIGHT = 49;

/** `FAB`'s own fixed size (`h-14 w-14`, see `components/ui/FAB`). */
export const FAB_SIZE = 56;

/** Extra breathing room below the FAB's own footprint, before it meets
 * scrollable content. */
export const FAB_MARGIN = 16;

/** How much bottom padding a scrollable list must reserve so the FAB
 * (when visible, e.g. Home's feed) never sits on top of  and blocks
 * taps on  the list's last item. Does not include the safe-area inset;
 * add `insets.bottom` at the call site. */
export const FAB_CLEARANCE = TAB_BAR_HEIGHT + FAB_SIZE + FAB_MARGIN;

/** Shared `KeyboardAvoidingView` vertical offset (iOS only  Android
 * uses the `undefined` behavior and needs no offset). Every screen with
 * a keyboard-avoiding composer/input near the bottom of the screen uses
 * this same value rather than each picking its own  see
 * docs/DECISIONS.md. */
export const KEYBOARD_OFFSET_IOS = 90;
