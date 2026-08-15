"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  Newspaper,
  Receipt,
  Target,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { LogoutButton } from "@/components/Forms";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; json?: unknown } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: opts.json !== undefined ? opts.method || "POST" : opts.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
    credentials: "same-origin",
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/admin/login";
    throw new ApiError("Session expired", 401);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error || "Request failed", res.status);
  return data as T;
}

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    const task = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(task);
  }, [reload]);
  return { data, loading, error, reload };
}

type ToastItem = { id: number; msg: string; tone: "ok" | "err" };
type ToastListener = (t: ToastItem) => void;
let toastListener: ToastListener | null = null;
let toastCounter = 0;

export function toast(msg: string, tone: "ok" | "err" = "ok") {
  toastListener?.({ id: ++toastCounter, msg, tone });
}

export function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    toastListener = (t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3800);
    };
    return () => {
      toastListener = null;
    };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cx(
            "pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl",
            t.tone === "ok"
              ? "border border-emerald-400/30 bg-emerald-950/80 text-emerald-200"
              : "border border-red-400/30 bg-red-950/80 text-red-200"
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-brand-600 to-cy-500 text-white shadow-[0_0_24px_-8px_rgba(139,92,246,0.8)] hover:scale-[1.02]",
    ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
    danger: "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20",
    outline: "border border-white/15 text-slate-200 hover:border-brand-400/60 hover:text-white",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

export function IconBtn({
  onClick,
  title,
  children,
  danger,
}: {
  onClick?: () => void;
  title: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cx(
        "rounded-lg p-1.5 transition-colors",
        danger ? "text-slate-500 hover:bg-red-500/10 hover:text-red-400" : "text-slate-500 hover:bg-white/5 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

const TONES: Record<string, string> = {
  new: "bg-cyan-500/15 text-cyan-300 border-cyan-400/25",
  contacted: "bg-amber-500/15 text-amber-300 border-amber-400/25",
  won: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  lost: "bg-slate-500/15 text-slate-400 border-slate-400/25",
  sent: "bg-amber-500/15 text-amber-300 border-amber-400/25",
  paid: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  overdue: "bg-red-500/15 text-red-300 border-red-400/25",
  draft: "bg-slate-500/15 text-slate-400 border-slate-400/25",
  published: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  intake: "bg-slate-500/15 text-slate-400 border-slate-400/25",
  in_progress: "bg-brand-500/15 text-brand-300 border-brand-400/25",
  review: "bg-cyan-500/15 text-cyan-300 border-cyan-400/25",
  revision: "bg-amber-500/15 text-amber-300 border-amber-400/25",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  paused: "bg-slate-500/15 text-slate-400 border-slate-400/25",
};

export function Badge({ tone = "new", children }: { tone?: string; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize", TONES[tone] || TONES.new)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={status}>{status.replace(/_/g, " ")}</Badge>;
}

export function Card({
  title,
  desc,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  desc?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-2xl border border-white/8 bg-panel p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="font-display text-sm font-semibold text-white">{title}</h3>}
            {desc && <p className="mt-0.5 text-xs text-slate-500">{desc}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={cx("glass-bright scrollbar-thin max-h-[88vh] w-full overflow-y-auto rounded-2xl p-6 shadow-2xl", wide ? "max-w-2xl" : "max-w-lg")}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("field", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx("field resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx("field", props.className)} />;
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10" role="status" aria-label="Loading">
      <Loader2 className="animate-spin text-brand-400" size={22} />
    </div>
  );
}

export function PageSkeleton({ cards = 6, rows = 4 }: { cards?: number; rows?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <span className="sr-only">Loading…</span>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2"><div className="skeleton h-7 w-48 rounded-lg" /><div className="skeleton h-3 w-72 max-w-[70vw] rounded" /></div>
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: cards }, (_, i) => <div key={i} className="rounded-2xl border border-white/[0.06] bg-panel p-4"><div className="skeleton h-9 w-9 rounded-xl" /><div className="skeleton mt-4 h-6 w-20 rounded" /><div className="skeleton mt-2 h-3 w-24 rounded" /></div>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-panel p-5 lg:col-span-2"><div className="skeleton h-4 w-40 rounded" /><div className="mt-8 flex h-44 items-end gap-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton flex-1 rounded-t-lg" style={{ height: `${35 + ((i * 17) % 60)}%` }} />)}</div></div>
        <div className="rounded-2xl border border-white/[0.06] bg-panel p-5"><div className="skeleton h-4 w-32 rounded" /><div className="mt-5 space-y-3">{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div></div>
      </div>
    </div>
  );
}

export function PortalSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-8" role="status" aria-label="Loading client workspace">
      <span className="sr-only">Loading your workspace…</span>
      <div className="rounded-3xl border border-white/[0.07] bg-panel p-6"><div className="flex items-center gap-4"><div className="skeleton h-14 w-14 rounded-2xl" /><div className="flex-1"><div className="skeleton h-6 w-56 max-w-full rounded" /><div className="skeleton mt-2 h-3 w-72 max-w-full rounded" /></div></div></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="rounded-2xl border border-white/[0.06] bg-panel p-4"><div className="skeleton h-3 w-20 rounded" /><div className="skeleton mt-3 h-7 w-16 rounded" /></div>)}</div>
      <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="rounded-2xl border border-white/[0.06] bg-panel p-5"><div className="skeleton h-4 w-28 rounded" /><div className="skeleton mt-3 h-6 w-44 rounded" /><div className="skeleton mt-5 h-2 w-full rounded-full" /><div className="skeleton mt-4 h-3 w-32 rounded" /></div>)}</div>
    </div>
  );
}

export function Empty({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
      <p className="font-display text-base font-semibold text-white">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-white/8", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cy-400 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  title = "Delete",
  confirm = "Sure?",
}: {
  onConfirm: () => void;
  title?: string;
  confirm?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!armed) return;
    timer.current = setTimeout(() => setArmed(false), 2500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [armed]);
  return (
    <IconBtn
      title={title}
      danger
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? <span className="px-1 text-[10px] font-bold uppercase">{confirm}</span> : <Trash2 size={15} />}
    </IconBtn>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cx(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            active === t
              ? "bg-brand-600 text-white shadow-[0_0_20px_-6px_rgba(139,92,246,0.9)]"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", Icon: Target },
  { href: "/admin/clients", label: "Clients", Icon: Users },
  { href: "/admin/projects", label: "Projects", Icon: FolderKanban },
  { href: "/admin/portfolio", label: "Portfolio", Icon: ImageIcon },
  { href: "/admin/invoices", label: "Invoices & Expenses", Icon: Receipt },
  { href: "/admin/blog", label: "Blog · WordPress", Icon: Newspaper },
  { href: "/admin/automations", label: "Automations · AI", Icon: Zap },
  { href: "/admin/site", label: "Site · Live Editor", Icon: Globe },
];

export function AdminSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname() || "";
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/6 bg-panel lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-6 py-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-cy-500 font-display text-lg font-bold text-white">V</div>
          <div>
            <p className="font-display text-sm font-bold text-white">VisionFold</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Admin CMS</p>
          </div>
        </Link>
        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all", active ? "bg-gradient-to-r from-brand-600/25 to-cy-500/10 text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.3)]" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
                <Icon size={16} className={active ? "text-brand-300" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/6 p-4">
          <Link href="/" target="_blank" className="mb-3 block rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-medium text-slate-300 transition-colors hover:border-brand-400/50 hover:text-white">View public site ↗</Link>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="truncate text-[11px] text-slate-500">{email}</p>
            </div>
            <LogoutButton label="Exit" />
          </div>
        </div>
      </aside>
      <div className="sticky top-0 z-40 border-b border-white/6 bg-panel/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-cy-500 font-display text-sm font-bold text-white">V</div>
            <span className="font-display text-sm font-bold text-white">VisionFold Admin</span>
          </Link>
          <LogoutButton label="" />
        </div>
        <nav className="scrollbar-thin flex gap-1 overflow-x-auto px-3 pb-3">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={cx("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium", active ? "bg-brand-600 text-white" : "bg-white/5 text-slate-400")}>
                <Icon size={13} />
                {label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
