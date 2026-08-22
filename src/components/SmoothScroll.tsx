"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scroll ΓÇö the dolly track the whole site rides on.
 *
 * - Wheel is smoothed, touch stays native (thumb-accurate on mobile).
 * - `html.lenis` classes let CSS opt out of native smooth scrolling.
 * - Fully disabled under prefers-reduced-motion.
 * - Native `scroll` events still fire, so ScrollProgress / ThreeBackground
 *   parallax stay in sync without extra plumbing.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let raf = 0;

    const start = () => {
      if (lenis || mq.matches) return;
      lenis = new Lenis({
        lerp: 0.09,
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,
        anchors: { offset: -84 },
        prevent: (node) =>
          node.hasAttribute?.("data-lenis-prevent") ||
          node.tagName === "CANVAS" ||
          node.closest?.("[data-lenis-prevent]") != null,
      });
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      lenis?.destroy();
      lenis = null;
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    };

    const onPrefChange = () => (mq.matches ? stop() : start());
    start();
    mq.addEventListener("change", onPrefChange);

    return () => {
      mq.removeEventListener("change", onPrefChange);
      stop();
    };
  }, []);

  return null;
}
