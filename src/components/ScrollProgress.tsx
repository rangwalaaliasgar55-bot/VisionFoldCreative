"use client";

import { m, useScroll, useSpring } from "framer-motion";
import { PROGRESS_SPRING } from "@/lib/motion";

/**
 * Thin gold reading-progress bar — a spring-driven scaleX transform, so it
 * carries the same weight as every other motion on the page (no width thrash).
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, PROGRESS_SPRING);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 bg-transparent" aria-hidden>
      <m.div
        className="h-full origin-left bg-gradient-to-r from-brand-400 to-amber-300 shadow-[0_0_12px_rgba(244,166,42,0.8)]"
        style={{ scaleX, willChange: "transform" }}
      />
    </div>
  );
}
