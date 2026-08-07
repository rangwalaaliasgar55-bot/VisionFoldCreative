/** Motion helpers — respect prefers-reduced-motion. */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function motionClass(active: string, reduced = ''): string {
  if (typeof window !== 'undefined' && prefersReducedMotion()) return reduced;
  return active;
}

/** CSS-friendly: disable transform animations when reduced motion is on. */
export const reduceMotionStyle: React.CSSProperties | undefined =
  typeof window !== 'undefined' && prefersReducedMotion()
    ? { transition: 'none', animation: 'none', transform: 'none' }
    : undefined;
