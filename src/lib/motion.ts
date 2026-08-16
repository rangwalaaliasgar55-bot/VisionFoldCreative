/**
 * VisionFold motion system — ONE CAMERA.
 *
 * Every reveal, lift, hover, drag-release and progress spring in the public site
 * resolves to the tokens in this file. If a duration or curve changes here it
 * changes everywhere; nothing in the UI is allowed to invent its own easing.
 */

import { useEffect, useState } from "react";
import type { Transition, Variants } from "framer-motion";

/** The VisionFold ease — a slow, confident dolly-out. */
export const EASE = [0.16, 1, 0.3, 1] as const;
export const CSS_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Timing scale (seconds). */
export const DUR = {
  reveal: 0.62,
  hoverIn: 0.15,
  hoverOut: 0.25,
  chrome: 0.32,
} as const;

/** Reveal stagger, in seconds, and the max stagger window we allow. */
export const STAGGER = 0.07;
export const STAGGER_WINDOW = 0.42;

/** Physical springs — weight without wobble. */
export const SPRING: Transition = {
  type: "spring",
  mass: 1,
  stiffness: 120,
  damping: 18,
};

export const PROGRESS_SPRING = {
  stiffness: 120,
  damping: 30,
  restDelta: 0.0005,
} as const;

/** The single reveal transition every section shares. */
export function revealTransition(delaySeconds = 0): Transition {
  return {
    duration: DUR.reveal,
    ease: EASE as unknown as [number, number, number, number],
    delay: Math.min(delaySeconds, STAGGER_WINDOW),
  };
}

export type RevealVariant = "up" | "left" | "right" | "scale" | "fade";

const OFFSETS: Record<RevealVariant, { x?: number; y?: number; scale?: number }> = {
  up: { y: 24 },
  left: { x: -28 },
  right: { x: 28 },
  scale: { scale: 0.96 },
  fade: {},
};

export function revealVariants(variant: RevealVariant = "up"): Variants {
  const from = OFFSETS[variant];
  return {
    hidden: { opacity: 0, x: from.x ?? 0, y: from.y ?? 0, scale: from.scale ?? 1 },
    visible: { opacity: 1, x: 0, y: 0, scale: 1 },
  };
}

/** Viewport contract shared by every Reveal on the site. */
export const VIEWPORT = { once: true, amount: 0.15, margin: "0px 0px -6% 0px" } as const;

/** Live prefers-reduced-motion, SSR-safe (starts false, resolves on mount). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

/** Frame-rate independent damping (three's MathUtils.damp, dependency-free). */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** Frame-rate independent exponential decay for fling inertia. */
export function decay(velocity: number, factorPerFrame: number, dt: number): number {
  return velocity * Math.pow(factorPerFrame, dt * 60);
}

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
