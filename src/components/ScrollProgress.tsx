"use client";

import { useEffect, useState } from "react";

/**
 * Thin gold reading-progress bar pinned to the top of the viewport.
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const p = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      setProgress(p);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-0.5 bg-transparent" aria-hidden>
      <div
        className="h-full bg-gradient-to-r from-brand-400 to-amber-300 shadow-[0_0_12px_rgba(244,166,42,0.8)] transition-[width] duration-100 ease-out"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );
}
