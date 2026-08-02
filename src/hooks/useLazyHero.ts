import { useEffect, useState } from 'react';

/**
 * Decides whether the heavy 3D hero (react-three-fiber + drei + three)
 * should render at all, and defers mounting it until the browser is idle
 * so it never competes with the initial page paint/interactivity.
 *
 * - Skips entirely below the `md` breakpoint: the hero was already
 *   CSS-hidden on mobile (`hidden md:block`), but was still being mounted
 *   and running its render loop there — wasted download + GPU + battery.
 * - Skips entirely when the user has requested reduced motion.
 * - On qualifying devices, mounts after `requestIdleCallback` (falling back
 *   to a short timeout) so the WebGL chunk loads without delaying anything
 *   the visitor is actually looking at yet.
 */
export function useLazyHero(): boolean {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isDesktop || prefersReducedMotion) {
      return;
    }

    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => setShouldRender(true));
      return () => win.cancelIdleCallback?.(id);
    }

    const timeoutId = window.setTimeout(() => setShouldRender(true), 200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return shouldRender;
}
