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
import { portfolioPath } from "@/lib/portfolio";

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
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden =
    variant === "left"
      ? "-translate-x-10 opacity-0"
      : variant === "right"
      ? "translate-x-10 opacity-0"
      : variant === "scale"
      ? "scale-95 opacity-0"
      : variant === "fade"
      ? "opacity-0"
      : "translate-y-8 opacity-0";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        on ? "translate-x-0 translate-y-0 scale-100 opacity-100" : hidden
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Tilt({
  children,
  className = "",
  max = 10,
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
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setStyle({
          transform: `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`,
          transition: "transform 80ms linear",
        });
        setGlare({
          x: ((e.clientX - r.left) / r.width) * 100,
          y: ((e.clientY - r.top) / r.height) * 100,
          opacity: 0.22,
        });
      });
    };
    const leave = () => {
      setStyle({
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
        transition: "transform 500ms cubic-bezier(.2,.8,.3,1)",
      });
      setGlare((g) => ({ ...g, opacity: 0 }));
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [max]);

  return (
    <div ref={ref} style={style} className={`relative overflow-hidden will-change-transform ${className}`}>
      {children}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 60%)`,
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
            const eased = 1 - Math.pow(1 - p, 3);
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

export function Reel3D({
  items,
}: {
  items: { title: string; thumbnailUrl: string; category: string; href: string }[];
}) {
  const [paused, setPaused] = useState(false);
  if (!items.length) return null;
  const radius = 480;

  return (
    <div
      className="relative mx-auto h-[320px] w-full max-w-5xl sm:h-[420px]"
      style={{ perspective: "1800px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-10 bg-gradient-to-r from-ink via-transparent to-ink" />
      <div
        className="animate-reel-spin absolute left-1/2 top-1/2 h-0 w-0"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        {items.map((it, i) => (
          <Link
            key={i}
            href={it.href}
            className="group absolute block h-[160px] w-[250px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.9)] sm:h-[200px] sm:w-[320px]"
            style={{
              transform: `rotateY(${(360 / items.length) * i}deg) translateZ(${radius}px)`,
              backfaceVisibility: "visible",
            }}
          >
            <img
              src={it.thumbnailUrl}
              alt={it.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
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
      <p className="absolute inset-x-0 -bottom-2 text-center text-xs text-slate-500">
        Hover to pause 3D reel · click any project to view details
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
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-panel/80 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
          <Sliders size={16} className="text-cyan-300" /> {title}
        </h3>
        <span className="text-xs text-slate-400">Drag center handle to compare</span>
      </div>

      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        className="relative aspect-video w-full select-none overflow-hidden rounded-2xl border border-white/15 bg-black cursor-ew-resize shadow-2xl"
      >
        {/* Graded Layer */}
        <img
          src={gradedImage}
          alt="Cinema Color Graded"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "contrast(1.2) saturate(1.3) drop-shadow(0 0 12px rgba(115,87,255,0.3))" }}
        />
        <div className="absolute left-4 top-4 rounded-xl bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-md">
          VisionFold Master Grade
        </div>

        {/* Raw Layer with Clip Path */}
        <div
          className="absolute inset-y-0 right-0 overflow-hidden border-l-2 border-amber-400"
          style={{ width: `${100 - sliderPos}%` }}
        >
          <img
            src={rawImage}
            alt="Raw Sensor Log"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: "contrast(0.65) brightness(1.1) saturate(0.35) sepia(0.12)",
              width: `${100 / ((100 - sliderPos) / 100)}%`,
              maxWidth: "none",
              right: 0,
            }}
          />
          <div className="absolute right-4 top-4 rounded-xl bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md">
            Unprocessed RAW Log
          </div>
        </div>

        {/* Divider Slider Thumb */}
        <div
          className="pointer-events-none absolute inset-y-0 flex items-center justify-center"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="h-9 w-9 -translate-x-1/2 rounded-full border-2 border-white bg-gradient-to-r from-brand-600 to-cy-500 shadow-2xl flex items-center justify-center text-white text-xs font-bold">
            ↔
          </div>
        </div>
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
          <p className="mt-1 text-xs text-slate-400">Every rate is confirmed with you before we start — no hidden fees.</p>
        </div>
        <Link
          href={`/contact?service=${serviceType}`}
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
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeCat === c
                ? "bg-brand-600 text-white shadow-[0_0_24px_-6px_rgba(115,87,255,0.9)] scale-105"
                : "glass text-slate-300 hover:text-white hover:border-white/20"
            }`}
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
              href={portfolioPath(item.id, item.title)}
              className="group block h-full overflow-hidden rounded-3xl border border-white/8 bg-panel transition-all hover:border-brand-400/40"
            >
              <div className="relative h-60 overflow-hidden bg-ink">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                {item.videoUrl ? (
                  <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="glow-ring grid h-14 w-14 place-items-center rounded-full bg-brand-600/90 text-white backdrop-blur shadow-2xl transition-transform group-hover:scale-110">
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
                <h3 className="font-display text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
                  {item.title}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
                <div className="flex items-center justify-between border-t border-white/8 pt-3 text-[11px] text-slate-500">
                  <span>Year: {item.year}</span>
                  <span className="text-cyan-300 font-semibold group-hover:translate-x-0.5 transition-transform">
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
