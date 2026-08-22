"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Loads only the motion features VisionFold actually uses (animation, exit,
 * inView, hover/press/focus) ΓÇö layout projection and drag stay out of the
 * bundle. Keeps the whole motion layer inside its weight budget.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
