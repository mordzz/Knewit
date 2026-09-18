'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribes to a CSS media query in JS — needed only where the *markup*
 * (not just styling) changes with viewport size, i.e. the overlay
 * surfaces: `BottomSheet` renders as a bottom sheet on small screens and
 * as a centered dialog from `lg` up (docs/DECISIONS.md, "Overlays Become
 * Centered Dialogs on Tablet/Desktop"). Inline Tailwind breakpoints are
 * still the right tool for pure styling; this exists for the cases where
 * both layouts can't coexist in the DOM.
 *
 * SSR-safe default: `false` (the small-screen/sheet branch) until
 * hydration runs the effect, which is the same layout the server
 * rendered.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}
