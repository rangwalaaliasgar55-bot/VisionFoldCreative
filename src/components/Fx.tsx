"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Star } from "lucide-react";
import Link from "next/link";

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
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
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        on ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Tilt({
  children,
  className = "",
  max = 8,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
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
          transform: `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale3d(1.02,1.02,1.02)`,
          transition: "transform 90ms linear",
        });
      });
    };
    const leave = () => {
      setStyle({
        transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
        transition: "transform 500ms cubic-bezier(.2,.8,.3,1)",
      });
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
    <div ref={ref} style={style} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

export function Counter({
  to,
  prefix = "",
  suffix = "",
  duration = 1600,
  className = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
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
            setValue(Math.round(to * eased));
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
      {value.toLocaleString()}
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
          <button key={n} type="button" onClick={() => onChange(n)} className="transition-transform hover:scale-125 focus:outline-none" aria-label={`${n} star${n > 1 ? "s" : ""}`}>
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
          <div className="font-display text-2xl font-bold text-white sm:text-3xl">{String(c.v).padStart(2, "0")}</div>
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
  const radius = 470;
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-5xl sm:h-[400px]" style={{ perspective: "1700px" }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-10 bg-gradient-to-r from-ink via-transparent to-ink" />
      <div className="animate-reel-spin absolute left-1/2 top-1/2 h-0 w-0" style={{ animationPlayState: paused ? "paused" : "running" }}>
        {items.map((it, i) => (
          <Link key={i} href={it.href} className="group absolute block h-[150px] w-[240px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.8)] sm:h-[190px] sm:w-[300px]" style={{ transform: `rotateY(${(360 / items.length) * i}deg) translateZ(${radius}px)`, backfaceVisibility: "visible" }}>
            <img src={it.thumbnailUrl} alt={it.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">{it.category}</p>
              <p className="truncate text-sm font-medium text-white">{it.title}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="absolute inset-x-0 -bottom-2 text-center text-xs text-slate-500">Hover to pause · your next project could be on this reel</p>
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
          <button key={c} onClick={() => setActive(c)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${active === c ? "bg-brand-600 text-white shadow-[0_0_24px_-6px_rgba(139,92,246,0.8)]" : "glass text-slate-300 hover:text-white"}`}>{c}</button>
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
          <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
            <span className="font-medium text-white">{item.q}</span>
            <span className={`text-brand-400 transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>+</span>
          </button>
          <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{item.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
