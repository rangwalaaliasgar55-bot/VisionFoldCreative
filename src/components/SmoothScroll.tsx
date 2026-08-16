"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children?: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1.6,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Expose for ScrollTrigger sync if needed
    (window as unknown as Record<string, unknown>).__lenis = lenis;

    let raf = 0;
    const rafLoop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(rafLoop);
    };
    raf = requestAnimationFrame(rafLoop);

    // Pause when VisionRunner modal is open (check via DOM)
    const onVisibility = () => {
      if (document.hidden) lenis.stop();
      else lenis.start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // We don't wrap children — Lenis works on window. This component just mounts the controller.
  // Use as <SmoothScroll /> alongside content.
  return null;
}

// Optional hook for imperative control
export function useLenis() {
  return (typeof window !== "undefined" ? (window as unknown as Record<string, unknown>).__lenis : null) as Lenis | null;
}
