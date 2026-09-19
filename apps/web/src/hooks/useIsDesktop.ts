'use client';

import { useEffect, useState } from 'react';

const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * Same pattern as `apps/dekstop`'s `use-mobile.tsx` (undefined-until-mounted
 * state + `matchMedia` change listener), but at the `lg` (1024px) cutoff
 * instead of that hook's 768px — the desktop mockups being ported
 * (`app-shell.tsx`, `sign-in.tsx`, `landing.css`) are all built against
 * Tailwind's `lg:` breakpoint, not 768px.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return isDesktop;
}
