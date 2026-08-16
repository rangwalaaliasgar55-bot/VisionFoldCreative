"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Check, Film, Sliders, Sparkles, Star } from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Reveal — unified 620ms VisionFold Ease [0.16,1,0.3,1]
// ─────────────────────────────────────────────────────────────
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "left" | "right" | "scale" | "fade";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    // Respect reduced motion — show immediately if user prefers reduced
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      queueMicrotask(() => setOn(true));
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden =
    variant === "left"
      ? "-translate-x-8 opacity-0"
      : variant === "right"
      ? "translate-x-8 opacity-0"
      : variant === "scale"
      ? "scale-[0.96] opacity-0"
      : variant === "fade"
      ? "opacity-0"
      : "translate-y-6 opacity-0";

  // 620ms unified duration — identical across all sections
  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        transitionDuration: "620ms",
      }}
      className={`transition-all will-change-transform ${
        on ? "translate-x-0 translate-y-0 scale-100 opacity-100" : hidden
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tilt — 8deg max, 1.02 scale, 14% glare, identical ease
// ─────────────────────────────────────────────────────────────
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
  const [style, setStyle] = useState<CSSProperties>({});
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const move = (e: MouseEvent) => {
      // Ignore touch-emulated mouse (PointerEvent check)
      if ((e as unknown as PointerEvent).pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setStyle({
          transform: `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
          transition: "transform 150ms cubic-bezier(0.16,1,0.3,1)",
        });
        setGlare({
          x: ((e.clientX - r.left) / r.width) * 100,
          y: ((e.clientY - r.top) / r.height) * 100,
          opacity: 0.14,
        });
      });
    };
    const leave = () => {
      setStyle({
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
        transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)",
      });
      setGlare((g) => ({ ...g, opacity: 0 }));
    };
    el.addEventListener("mousemove", move as unknown as EventListener);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move as unknown as EventListener);
      el.removeEventListener("mouseleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [max]);

  return (
    <div
      ref={ref}
      style={{ ...style, transformOrigin: "50% 50%" } as CSSProperties}
      className={`relative overflow-hidden will-change-transform ${className}`}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 65%)`,
          transition: "opacity 220ms cubic-bezier(0.16,1,0.3,1)",
          opacity: glare.opacity ? 1 : 0,
        }}
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
  const [progress, setProgress] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            // expo-out feel — matches VisionFold spring
            const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            setProgress(eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {(to * progress).toLocaleString("en-US", {
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

// ─────────────────────────────────────────────────────────────
// Reel3D — JS inertia carousel (replaces CSS 40s linear)
// Responsive radius, drag with velocity decay, snap, dots
// ─────────────────────────────────────────────────────────────
export function Reel3D({
  items,
}: {
  items: { title: string; thumbnailUrl: string; category: string; href: string }[];
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const hoverRef = useRef(false);
  const dragRef = useRef({ active: false, lastX: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const rafRef = useRef(0);

  const isMobileRef = useRef(false);
  const [radius, setRadius] = useState(420);

  useEffect(() => {
    const updateRadius = () => {
      const w = window.innerWidth;
      isMobileRef.current = w < 640;
      if (w < 640) setRadius(320);
      else if (w < 1024) setRadius(420);
      else setRadius(520);
    };
    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const el = carouselRef.current;
    if (!el) return;

    let last = performance.now();

    const loop = () => {
      const now = performance.now();
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Base auto-spin: 0.012 rad/frame at 60fps => ~0.72 rad/s ; hover 0.003
      const base = hoverRef.current ? 0.18 : 0.72; // rad/sec
      const auto = base * delta;

      // Apply velocity with decay (identical to globe: 0.965 at 60fps)
      const decay = Math.pow(0.965, delta * 60);
      velRef.current *= decay;

      angleRef.current += auto + velRef.current * delta * 60;

      // Wrap angle 0..360 for index calc
      const n = items.length;
      const degPer = 360 / n;
      // Normalize
      const normalized = ((angleRef.current * (180 / Math.PI)) % 360 + 360) % 360;
      const idx = Math.round(normalized / degPer) % n;
      // Direct DOM update (avoid React re-render per frame)
      el.style.transform = `rotateY(${angleRef.current}rad)`;
      // Update dot sparingly
      if (idx !== activeIndex) {
        // Use queueMicrotask to avoid render during RAF
        queueMicrotask(() => setActiveIndex(idx));
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items.length, activeIndex]);

  if (!items.length) return null;

  const n = items.length;

  return (
    <div
      className="relative mx-auto h-[320px] w-full max-w-5xl select-none sm:h-[420px]"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
      onPointerDown={(e) => {
        dragRef.current.active = true;
        dragRef.current.lastX = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.lastX;
        dragRef.current.lastX = e.clientX;
        // Velocity in rad per frame — 0.005 factor tuned to feel heavy
        velRef.current += dx * 0.008;
        // Clamp velocity
        velRef.current = Math.max(-2.5, Math.min(2.5, velRef.current));
      }}
      onPointerUp={(e) => {
        dragRef.current.active = false;
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerCancel={() => (dragRef.current.active = false)}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-10 bg-gradient-to-r from-ink via-transparent to-ink" />

      {/* 3D stage */}
      <div
        ref={carouselRef}
        className="absolute left-1/2 top-1/2 h-0 w-0"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {items.map((it, i) => (
          <Link
            key={i}
            href={it.href}
            className="group absolute block h-[160px] w-[250px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] transition-[transform,box-shadow,border-color] duration-200 will-change-transform hover:border-brand-400/40 sm:h-[200px] sm:w-[320px]"
            style={{
              transform: `rotateY(${(360 / n) * i}deg) translateZ(${radius}px)`,
              backfaceVisibility: "hidden",
            }}
            draggable={false}
          >
            <img
              src={it.thumbnailUrl}
              alt={it.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              loading="lazy"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">{it.category}</p>
              <p className="truncate text-sm font-semibold text-white">{it.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute inset-x-0 -bottom-6 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-brand-500" : "w-1.5 bg-white/20"}`}
          />
        ))}
      </div>

      <p className="pointer-events-none absolute inset-x-0 -bottom-10 hidden text-center text-xs text-slate-500 sm:block">
        Drag to spin · hover to slow · click any project
      </p>
      <p className="pointer-events-none absolute inset-x-0 -bottom-10 text-center text-xs text-slate-500 sm:hidden">
        Swipe to spin · tap to view
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SplitCompare — clip-path overlay (fixes width bug), diverging filters, a11y range
// ─────────────────────────────────────────────────────────────
export function SplitCompare({
  rawImage = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
  gradedImage = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
  title = "RAW Sensor Log vs 35mm Film Color Grade & VFX",
}: {
  rawImage?: string;
  gradedImage?: string;
  title?: string;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updatePos = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updatePos(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    updatePos(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-panel/80 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display flex items-center gap-2 text-base font-bold text-white">
          <Sliders size={16} className="text-cyan-300" /> {title}
        </h3>
        <span className="text-xs text-slate-400">Drag or use ← → keys to compare</span>
      </div>

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative aspect-video w-full select-none overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl cursor-ew-resize touch-none"
        style={{ touchAction: "none" }}
      >
        {/* Base: RAW (desaturated, flat) */}
        <img
          src={rawImage}
          alt="Raw Sensor Log"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "contrast(0.72) brightness(1.08) saturate(0.28) sepia(0.08)" }}
          draggable={false}
        />
        <div className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md border border-white/10">
          Unprocessed RAW Log
        </div>

        {/* Overlay: GRADED — clipped by sliderPos */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)`, willChange: "clip-path" } as CSSProperties}
        >
          <img
            src={gradedImage}
            alt="Cinema Color Graded"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "contrast(1.18) saturate(1.35) brightness(0.98) hue-rotate(-2deg) drop-shadow(0 0 16px rgba(115,87,255,0.18))" }}
            draggable={false}
          />
          <div className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-brand-600 to-cy-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
            VisionFold Master Grade
          </div>
        </div>

        {/* 1px divider line */}
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
          style={{ left: `${sliderPos}%` }}
        />

        {/* Handle */}
        <div
          className="pointer-events-none absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-brand-600 to-cy-500 text-xs font-bold text-white shadow-[0_0_0_4px_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.45)]"
          style={{ left: `${sliderPos}%`, transform: "translate(-50%, -50%)", willChange: "left" } as CSSProperties}
        >
          ↔
        </div>

        {/* A11y range (invisible but focusable) */}
        <input
          type="range"
          min={0}
          max={100}
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          aria-label="Compare raw vs graded"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <p className="mt-2 text-center text-[11px] uppercase tracking-widest text-slate-500">
        <span className="text-slate-300">RAW</span> ← drag → <span className="text-cyan-300">GRADED</span>
      </p>
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
                onClick={() => setServiceType(s.id as never)}
                className={`rounded-xl py-2.5 px-3 text-xs font-semibold transition-all duration-200 ${
                  serviceType === s.id
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/40"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" } as CSSProperties}
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
          <label className="glass flex items-center gap-3 rounded-2xl p-3.5 cursor-pointer hover:border-brand-500/50 transition-colors duration-200">
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

          <label className="glass flex items-center gap-3 rounded-2xl p-3.5 cursor-pointer hover:border-brand-500/50 transition-colors duration-200">
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
          <p className="mt-1 text-xs text-slate-400">Every rate is confirmed with you before we start — no hidden fees.</p>
        </div>
        <Link
          href={`/contact?service=${serviceType}`}
          className="rounded-full bg-brand-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-500 transition-all hover:scale-[1.02] duration-200"
          style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" } as CSSProperties}
        >
          Request custom quote →
        </Link>
      </div>
    </div>
  );
}

export function PortfolioFilterGrid({
  items,
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
}) {
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const [activeCat, setActiveCat] = useState("All");

  const filtered = activeCat === "All" ? items : items.filter((i) => i.category === activeCat);

  return (
    <div className="space-y-8">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeCat === c
                ? "bg-brand-600 text-white shadow-[0_0_24px_-6px_rgba(115,87,255,0.9)] scale-105"
                : "glass text-slate-300 hover:text-white hover:border-white/20"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" } as CSSProperties}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid of 3D Tilt Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Tilt key={item.id} max={7} className="h-full">
            <Link
              href={item.videoUrl || "/contact"}
              target={item.videoUrl ? "_blank" : undefined}
              rel={item.videoUrl ? "noopener noreferrer" : undefined}
              className="group block h-full overflow-hidden rounded-3xl border border-white/8 bg-panel transition-all duration-200 hover:border-brand-400/40"
              style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" } as CSSProperties}
            >
              <div className="relative h-60 overflow-hidden bg-ink">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                {item.videoUrl ? (
                  <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="glow-ring grid h-14 w-14 place-items-center rounded-full bg-brand-600/90 text-white backdrop-blur shadow-2xl transition-transform duration-200 group-hover:scale-110">
                      <Film size={22} className="text-white" />
                    </div>
                  </div>
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
                <h3 className="font-display text-lg font-bold text-white group-hover:text-brand-300 transition-colors duration-200">
                  {item.title}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
                <div className="flex items-center justify-between border-t border-white/8 pt-3 text-[11px] text-slate-500">
                  <span>Year: {item.year}</span>
                  <span className="text-cyan-300 font-semibold group-hover:translate-x-0.5 transition-transform duration-200">
                    View Master Cut →
                  </span>
                </div>
              </div>
            </Link>
          </Tilt>
        ))}
      </div>
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
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              active === c
                ? "bg-brand-600 text-white shadow-[0_0_24px_-6px_rgba(139,92,246,0.8)]"
                : "glass text-slate-300 hover:text-white"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" } as CSSProperties}
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
              className={`text-brand-400 transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}
              style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" } as CSSProperties}
            >
              +
            </span>
          </button>
          <div
            className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" } as CSSProperties}
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
