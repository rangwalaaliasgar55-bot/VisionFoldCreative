"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Premium progress — GPU transform scaleX + spring feel via lerp
 * Uses scaleX (not width) so it stays on GPU compositor.
 * Spring-like damping: current += (target - current) * 0.18 each RAF
 */
export default function ScrollProgress() {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(0);
  const curRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const onScrollOrResize = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      targetRef.current = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      // Lerp toward target with spring-ish feel (identical ease family: 0.16,1,0.3,1 via damping)
      curRef.current += (targetRef.current - curRef.current) * 0.18;
      // Snap if close
      if (Math.abs(targetRef.current - curRef.current) < 0.001) curRef.current = targetRef.current;
      setDisplay(curRef.current);
      if (Math.abs(targetRef.current - curRef.current) > 0.0005) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-0.5 bg-transparent" aria-hidden>
      <div
        className="h-full origin-left bg-gradient-to-r from-brand-400 to-amber-300 shadow-[0_0_12px_rgba(244,166,42,0.8)] will-change-transform"
        style={{ transform: `scaleX(${display})` }}
      />
    </div>
  );
}
