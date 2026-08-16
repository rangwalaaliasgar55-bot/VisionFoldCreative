"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, m } from "framer-motion";
import { Film, Sliders, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { VideoLightbox, parseVideo, type ParsedVideo } from "@/components/VideoLightbox";
import { workPath } from "@/lib/slug";
import {
  CSS_EASE,
  DUR,
  EASE,
  VIEWPORT,
  damp,
  decay,
  easeOutExpo,
  revealTransition,
  revealVariants,
  usePrefersReducedMotion,
  type RevealVariant,
} from "@/lib/motion";

export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: {
  children: ReactNode;
  /** Delay in ms — clamped to the 420ms stagger window. */
  delay?: number;
  variant?: RevealVariant;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <m.div
      className={`vf-reveal ${className}`}
      variants={revealVariants(variant)}
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={VIEWPORT}
      transition={reduced ? { duration: 0 } : revealTransition(delay / 1000)}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </m.div>
  );
}

export function Tilt({
  children,
  className = "",
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    let frame: { rx: number; ry: number; gx: number; gy: number } | null = null;

    const paint = () => {
      raf = 0;
      if (!frame) return;
      el.style.transition = `transform ${DUR.hoverIn}s ${CSS_EASE}`;
      el.style.transform = `perspective(1000px) rotateX(${frame.rx.toFixed(2)}deg) rotateY(${frame.ry.toFixed(
        2
      )}deg) scale3d(1.02, 1.02, 1.02)`;
      const glare = glareRef.current;
      if (glare) {
        glare.style.background = `radial-gradient(circle at ${frame.gx.toFixed(1)}% ${frame.gy.toFixed(
          1
        )}%, rgba(255,255,255,0.14) 0%, transparent 65%)`;
        glare.style.opacity = "0.18";
      }
    };

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      frame = {
        rx: -py * max,
        ry: px * max,
        gx: (px + 0.5) * 100,
        gy: (py + 0.5) * 100,
      };
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const leave = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      frame = null;
      el.style.transition = `transform ${DUR.hoverOut}s ${CSS_EASE}`;
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      const glare = glareRef.current;
      if (glare) glare.style.opacity = "0";
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointercancel", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointercancel", leave);
      cancelAnimationFrame(raf);
    };
  }, [max, reduced]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        transformOrigin: "50% 50%",
        transform: "perspective(1000px)",
        willChange: "transform",
      }}
    >
      {children}
      <div
        ref={glareRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0, transition: `opacity 200ms ${CSS_EASE}` }}
      />
    </div>
  );
}

export function Counter({
  to,
  prefix = "",
  suffix = "",
  duration = 1600,
  className = "",
  decimals = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const [animated, setAnimated] = useState<number | null>(null);
  const started = useRef(false);
  // Reduced motion lands on the final number immediately — no ramp, no flash of 0.
  const value = animated ?? (reduced ? to : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          setAnimated(p >= 1 ? to : to * easeOutExpo(p));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function Stars({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-125 focus:outline-none"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star size={size} className={n <= value ? "fill-amber-400 text-amber-400" : "text-slate-600"} />
          </button>
        ) : (
          <Star key={n} size={size} className={n <= value ? "fill-amber-400 text-amber-400" : "text-slate-700"} />
        )
      )}
    </div>
  );
}

export function Countdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState(() => {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });
  useEffect(() => {
    const id = setInterval(() => {
      const diff = new Date(endsAt).getTime() - Date.now();
      setLeft(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  if (!endsAt) return null;
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const cells = [
    { v: d, l: "Days" },
    { v: h, l: "Hours" },
    { v: m, l: "Minutes" },
    { v: s, l: "Seconds" },
  ];
  return (
    <div className="flex gap-3">
      {cells.map((c) => (
        <div key={c.l} className="glass w-16 rounded-2xl py-3 text-center sm:w-20 sm:py-4">
          <div className="font-display text-2xl font-bold text-white sm:text-3xl">
            {String(c.v).padStart(2, "0")}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-slate-400">{c.l}</div>
        </div>
      ))}
    </div>
  );
}

export function Reel3D({
  items,
}: {
  items: { title: string; thumbnailUrl: string; category: string; href: string }[];
}) {
  const ringRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(420);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const count = items.length;

  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      setRadius(w < 640 ? 320 : w < 1024 ? 420 : 520);
    };
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, []);

  useEffect(() => {
    const ring = ringRef.current;
    const stage = stageRef.current;
    if (!ring || !stage || !count) return;

    const step = 360 / count;
    const state = {
      angle: 0,
      velocity: 0,
      dragging: false,
      hovering: false,
      focused: false,
      snapTo: null as number | null,
      lastX: 0,
      moved: 0,
    };
    let raf = 0;
    let last = performance.now();
    let lastIndex = -1;

    const BASE = 0.012; // deg per ms — one full pass every ~30s

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const ms = Math.min(now - last, 50);
      last = now;
      const f = ms / 16.6667;

      if (!state.dragging) {
        if (state.snapTo !== null) {
          // keyboard step: glide to the requested card, then release
          state.angle = damp(state.angle, state.snapTo, 7, ms / 1000);
          if (Math.abs(state.angle - state.snapTo) < 0.05) {
            state.angle = state.snapTo;
            state.snapTo = null;
          }
        } else if (Math.abs(state.velocity) > 0.02) {
          state.angle += state.velocity * f;
          state.velocity = decay(state.velocity, 0.965, ms / 1000);
        } else if (state.hovering || state.focused) {
          // Snag: settle onto the nearest card and hold it for inspection
          state.velocity = 0;
          const target = Math.round(state.angle / step) * step;
          state.angle = damp(state.angle, target, 6, ms / 1000);
        } else if (!reduced) {
          state.angle += BASE * ms;
        }
      }

      ring.style.transform = `translate3d(-50%, -50%, 0) rotateY(${state.angle.toFixed(3)}deg)`;

      const idx = ((-Math.round(state.angle / step)) % count + count) % count;
      if (idx !== lastIndex) {
        lastIndex = idx;
        setActiveIndex(idx);
      }
    };
    raf = requestAnimationFrame(loop);

    const step2 = (dir: number) => {
      const from = state.snapTo ?? Math.round(state.angle / step) * step;
      state.snapTo = from + dir * step;
      state.velocity = 0;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step2(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step2(1);
      } else if (e.key === "Home") {
        e.preventDefault();
        state.snapTo = 0;
        state.velocity = 0;
      }
    };
    const onFocus = () => (state.focused = true);
    const onBlur = () => (state.focused = false);

    const onEnter = () => (state.hovering = true);
    const onLeave = () => {
      state.hovering = false;
      state.dragging = false;
    };
    const onDown = (e: PointerEvent) => {
      state.dragging = true;
      state.moved = 0;
      state.lastX = e.clientX;
      state.velocity = 0;
      stage.setPointerCapture(e.pointerId);
      stage.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!state.dragging) return;
      const dx = e.clientX - state.lastX;
      state.lastX = e.clientX;
      state.moved += Math.abs(dx);
      state.angle += dx * 0.25;
      state.velocity = dx * 0.25;
    };
    const onUp = (e: PointerEvent) => {
      if (!state.dragging) return;
      state.dragging = false;
      stage.style.cursor = "grab";
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      // A real drag shouldn't fire the card link underneath
      if (state.moved > 8) {
        const swallow = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        stage.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(() => stage.removeEventListener("click", swallow, { capture: true }), 40);
      }
    };

    stage.addEventListener("keydown", onKeyDown);
    stage.addEventListener("focus", onFocus);
    stage.addEventListener("blur", onBlur);
    stage.addEventListener("pointerenter", onEnter);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("keydown", onKeyDown);
      stage.removeEventListener("focus", onFocus);
      stage.removeEventListener("blur", onBlur);
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
    };
  }, [count, reduced]);

  if (!count) return null;

  // The fade lives on a wrapper, never on the element that owns `perspective` —
  // a mask there can flatten the 3D context in some engines.
  const edgeFade =
    "linear-gradient(to right, transparent 0%, #000 15%, #000 85%, transparent 100%)";

  return (
    <div className="relative">
      <div
        className="mx-auto w-full max-w-5xl"
        style={{ maskImage: edgeFade, WebkitMaskImage: edgeFade }}
      >
      <div
        ref={stageRef}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Featured work — drag to spin, or use the left and right arrow keys"
        className="relative h-[300px] w-full touch-pan-y select-none rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:h-[420px]"
        style={{ perspective: "1800px", cursor: "grab" }}
      >
        <div
          ref={ringRef}
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{
            transformStyle: "preserve-3d",
            transform: "translate3d(-50%, -50%, 0)",
            willChange: "transform",
          }}
        >
          {items.map((it, i) => (
            <Link
              key={i}
              href={it.href}
              draggable={false}
              className="group absolute block h-[150px] w-[230px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 sm:h-[200px] sm:w-[320px]"
              style={{
                transform: `rotateY(${(360 / count) * i}deg) translateZ(${radius}px)`,
                backfaceVisibility: "hidden",
                boxShadow: "0 24px 60px -28px rgba(0,0,0,0.85)",
              }}
            >
              <img
                src={it.thumbnailUrl}
                alt={it.title}
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ transitionTimingFunction: CSS_EASE }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">{it.category}</p>
                <p className="truncate text-sm font-semibold text-white">{it.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {items.map((it, i) => (
          <span
            key={i}
            aria-hidden
            className="h-1.5 rounded-full"
            style={{
              width: i === activeIndex ? 22 : 6,
              background: i === activeIndex ? "#F4A62A" : "rgba(246,243,236,0.25)",
              transition: `width 250ms ${CSS_EASE}, background-color 250ms ${CSS_EASE}`,
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        Drag to spin · hover to snap and inspect · arrow keys step card by card
      </p>
    </div>
  );
}

export function SplitCompare({
  rawImage = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
  gradedImage = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
  title = "RAW Sensor Log vs 35mm Film Color Grade & VFX",
}: {
  rawImage?: string;
  gradedImage?: string;
  title?: string;
}) {
  const [pos, setPos] = useState(50);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Only claim the gesture once it's clearly horizontal — a vertical swipe
    // that starts on the image must still scroll the page.
    let startX = 0;
    let startY = 0;
    let axis: "none" | "x" | "y" = "none";

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      axis = "none";
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (axis === "none") {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis !== "x") return;
      e.preventDefault();
      moveTo(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      axis = "none";
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    const up = () => (dragging.current = false);
    const move = (e: PointerEvent) => {
      if (dragging.current) moveTo(e.clientX);
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-panel/80 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display flex items-center gap-2 text-base font-bold text-white">
          <Sliders size={16} className="text-cyan-300" /> {title}
        </h3>
        <span className="text-xs text-slate-400">Drag the handle · arrow keys work too</span>
      </div>

      <div
        ref={containerRef}
        onPointerDown={(e) => {
          dragging.current = true;
          moveTo(e.clientX);
        }}
        className={`relative aspect-video w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border bg-black shadow-2xl ${
          focused ? "border-brand-400/70 ring-2 ring-brand-500/40" : "border-white/15"
        }`}
        style={{ touchAction: "pan-y", transition: `border-color ${DUR.hoverIn}s ${CSS_EASE}` }}
      >
        {/* Graded master — the base layer */}
        <img
          src={gradedImage}
          alt="Cinema color graded master"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "contrast(1.18) saturate(1.35) brightness(0.98) hue-rotate(-2deg)" }}
        />
        <div className="absolute left-4 top-4 rounded-xl bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-md">
          VisionFold Master Grade
        </div>

        {/* RAW log — clipped from the right, no width math, no seams */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${pos}%)`, willChange: "clip-path" }}
        >
          <img
            src={rawImage}
            alt="Unprocessed RAW log"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "contrast(0.72) brightness(1.08) saturate(0.28) sepia(0.08)" }}
          />
          <div className="absolute right-4 top-4 rounded-xl bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md">
            Unprocessed RAW Log
          </div>
        </div>

        {/* Divider + handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 flex w-px items-center justify-center bg-white/70"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
        >
          <div
            className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-[#0B1020]/80 text-xs font-bold text-white backdrop-blur"
            style={{
              boxShadow: "0 0 0 4px rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.45)",
            }}
          >
            ↔
          </div>
        </div>

        {/* Keyboard-accessible control */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Compare raw footage with the graded master"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-20 h-full w-full opacity-0"
          style={{ pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}

export function RatesCalculator() {
  const [serviceType, setServiceType] = useState<"short" | "brand" | "youtube" | "commercial" | "music" | "podcast">("brand");
  const [videoCount, setVideoCount] = useState(1);
  const [rawFootageHours, setRawFootageHours] = useState(2);
  const [needsMotionGfx, setNeedsMotionGfx] = useState(true);
  const [fastTurnaround, setFastTurnaround] = useState(false);

  return (
    <div className="glass card-glow mx-auto max-w-3xl rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-300 border border-brand-400/20">
          <Sparkles size={13} /> Custom Quote Builder
        </div>
        <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">Tell Us About Your Project</h3>
        <p className="text-xs text-slate-400">Answer a few questions — we&rsquo;ll send a custom quote within 24 hours.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Service Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "short", label: "Shorts" },
              { id: "brand", label: "Brand Film" },
              { id: "youtube", label: "YouTube Cut" },
              { id: "commercial", label: "Ad Suite" },
              { id: "music", label: "Music Video" },
              { id: "podcast", label: "Podcast Suite" },
            ].map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setServiceType(s.id as any)}
                className={`rounded-xl py-2.5 px-3 text-xs font-semibold transition-all ${
                  serviceType === s.id
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/40"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Deliverable Videos:</span>
              <span className="font-bold text-cyan-300">{videoCount} {videoCount === 1 ? "cut" : "cuts"}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={videoCount}
              onChange={(e) => setVideoCount(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Raw Footage Duration:</span>
              <span className="font-bold text-cyan-300">{rawFootageHours} hrs raw</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={rawFootageHours}
              onChange={(e) => setRawFootageHours(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <label className="glass flex items-center gap-3 rounded-2xl p-3.5 cursor-pointer hover:border-brand-500/50">
            <input
              type="checkbox"
              checked={needsMotionGfx}
              onChange={(e) => setNeedsMotionGfx(e.target.checked)}
              className="h-4 w-4 rounded accent-brand-500"
            />
            <div className="text-xs">
              <p className="font-semibold text-white">Custom 2D/3D Motion Graphics</p>
              <p className="text-slate-400">+ Titles, kinetic text, HUD overlays</p>
            </div>
          </label>

          <label className="glass flex items-center gap-3 rounded-2xl p-3.5 cursor-pointer hover:border-brand-500/50">
            <input
              type="checkbox"
              checked={fastTurnaround}
              onChange={(e) => setFastTurnaround(e.target.checked)}
              className="h-4 w-4 rounded accent-brand-500"
            />
            <div className="text-xs">
              <p className="font-semibold text-white">Priority 48-Hour Rush Delivery</p>
              <p className="text-slate-400">+ Dedicated suite sprint</p>
            </div>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">Your custom quote</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-gradient">Priced to your brief</p>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            {videoCount} {videoCount === 1 ? "cut" : "cuts"} · {rawFootageHours} hrs raw
            {needsMotionGfx ? " · motion graphics" : ""}
            {fastTurnaround ? " · 48h rush" : ""} — we carry this spec into the brief so you
            don&rsquo;t retype it.
          </p>
        </div>
        <Link
          href={`/contact?service=${serviceType}&videos=${videoCount}&hours=${rawFootageHours}&gfx=${needsMotionGfx ? 1 : 0}&rush=${fastTurnaround ? 1 : 0}`}
          className="rounded-full bg-brand-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-500 transition-transform hover:scale-105"
        >
          Request custom quote →
        </Link>
      </div>
    </div>
  );
}

export function PortfolioFilterGrid({
  items,
  initialCategory = "All",
}: {
  items: {
    id: number;
    title: string;
    category: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    year: string;
    featured: boolean;
  }[];
  initialCategory?: string;
}) {
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const [activeCat, setActiveCat] = useState(
    categories.includes(initialCategory) ? initialCategory : "All"
  );
  const [playing, setPlaying] = useState<{ video: ParsedVideo; title: string } | null>(null);

  const filtered = activeCat === "All" ? items : items.filter((i) => i.category === activeCat);

  // Filters are shareable: the URL follows the pills without a navigation.
  const pick = (category: string) => {
    setActiveCat(category);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (category === "All") url.searchParams.delete("category");
    else url.searchParams.set("category", category);
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <div className="space-y-8">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => pick(c)}
            aria-pressed={activeCat === c}
            style={{ transition: `all ${DUR.hoverIn}s ${CSS_EASE}` }}
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider ${
              activeCat === c
                ? "bg-brand-600 text-white shadow-[0_0_24px_-6px_rgba(115,87,255,0.9)] scale-105"
                : "glass text-slate-300 hover:text-white hover:border-white/20"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500" aria-live="polite">
        Showing {filtered.length} {filtered.length === 1 ? "project" : "projects"}
        {activeCat !== "All" ? ` in ${activeCat}` : ""}
      </p>

      {/* Grid of 3D Tilt Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
        {filtered.map((item) => (
          <m.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: DUR.reveal, ease: EASE as unknown as [number, number, number, number] }}
            className="h-full"
          >
          <Tilt max={7} className="h-full">
            <Link
              href={workPath(item)}
              className="group block h-full overflow-hidden rounded-3xl border border-white/8 bg-panel transition-all hover:border-brand-400/40"
            >
              <div className="relative h-60 overflow-hidden bg-ink">
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                {parseVideo(item.videoUrl) ? (
                  <button
                    type="button"
                    aria-label={`Play ${item.title}`}
                    aria-haspopup="dialog"
                    onClick={(e) => {
                      // Play in place; the card itself still goes to the case study.
                      e.preventDefault();
                      e.stopPropagation();
                      const video = parseVideo(item.videoUrl);
                      if (video) setPlaying({ video, title: item.title });
                    }}
                    className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <span className="glow-ring grid h-14 w-14 place-items-center rounded-full bg-brand-600/90 text-white shadow-2xl backdrop-blur transition-transform group-hover:scale-110">
                      <Film size={22} className="text-white" />
                    </span>
                  </button>
                ) : null}
                <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md">
                  {item.category}
                </span>
                {item.featured && (
                  <span className="absolute right-4 top-4 rounded-full bg-brand-600/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-display text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
                  {item.title}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
                <div className="flex items-center justify-between border-t border-white/8 pt-3 text-[11px] text-slate-500">
                  <span>Year: {item.year}</span>
                  <span className="text-cyan-300 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Read the case study →
                  </span>
                </div>
              </div>
            </Link>
          </Tilt>
          </m.div>
        ))}
        </AnimatePresence>
      </div>

      {!filtered.length && (
        <p className="py-14 text-center text-sm text-slate-500">
          Nothing in <span className="text-slate-300">{activeCat}</span> yet —{" "}
          <button onClick={() => pick("All")} className="text-cyan-300 underline-offset-4 hover:underline">
            show everything
          </button>
          .
        </p>
      )}

      <VideoLightbox
        open={Boolean(playing)}
        video={playing?.video ?? null}
        title={playing?.title ?? ""}
        onClose={() => setPlaying(null)}
      />
    </div>
  );
}

export function FilterGrid<T extends { id: number }>({
  items,
  getCategory,
  render,
  className = "",
}: {
  items: T[];
  getCategory: (t: T) => string;
  render: (t: T) => ReactNode;
  className?: string;
}) {
  const cats = Array.from(new Set(items.map(getCategory)));
  const [active, setActive] = useState<string>("All");
  const filtered = active === "All" ? items : items.filter((i) => getCategory(i) === active);
  return (
    <div className={className}>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {["All", ...cats].map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              active === c
                ? "bg-brand-600 text-white shadow-[0_0_24px_-6px_rgba(139,92,246,0.8)]"
                : "glass text-slate-300 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(render)}</div>
    </div>
  );
}

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="glass overflow-hidden rounded-2xl">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <span className="font-medium text-white">{item.q}</span>
            <span
              className={`text-brand-400 transition-transform duration-300 ${
                open === i ? "rotate-45" : ""
              }`}
            >
              +
            </span>
          </button>
          <div
            className={`grid transition-all duration-300 ${
              open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{item.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
