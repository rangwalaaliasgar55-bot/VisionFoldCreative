"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  ChevronRight,
  CircleHelp,
  Command,
  ExternalLink,
  FileImage,
  FileText,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  Newspaper,
  Plus,
  Receipt,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/Forms";
import { cx } from "@/components/AdminUI";

type StaffRole = "admin" | "editor" | "accountant";
type NavItem = { href: string; label: string; description: string; Icon: LucideIcon; roles?: StaffRole[] };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/admin", label: "Dashboard", description: "Studio overview and activity", Icon: LayoutDashboard },
      { href: "/admin/leads", label: "Leads", description: "Pipeline, proposals and follow-ups", Icon: Target, roles: ["admin", "editor"] },
      { href: "/admin/clients", label: "Clients", description: "People and portal access", Icon: Users },
      { href: "/admin/projects", label: "Projects", description: "Production, reviews and delivery", Icon: FolderKanban },
      { href: "/admin/invoices", label: "Finance", description: "Invoices, payments and expenses", Icon: Receipt, roles: ["admin", "accountant"] },
      { href: "/admin/team", label: "Team & roles", description: "Staff access and permissions", Icon: ShieldCheck, roles: ["admin"] },
    ],
  },
  {
    label: "Publish",
    items: [
      { href: "/admin/pages", label: "Pages", description: "Build, preview and publish custom pages", Icon: FileText, roles: ["admin", "editor"] },
      { href: "/admin/blog", label: "Posts", description: "WordPress-style publishing and SEO", Icon: Newspaper, roles: ["admin", "editor"] },
      { href: "/admin/portfolio", label: "Portfolio", description: "Work, reels and case studies", Icon: ImageIcon, roles: ["admin", "editor"] },
      { href: "/admin/media", label: "Media library", description: "Manage reusable site assets", Icon: FileImage, roles: ["admin", "editor"] },
      { href: "/admin/site", label: "Site editor", description: "Content, appearance and settings", Icon: Globe, roles: ["admin", "editor"] },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/admin/automations", label: "Automations & AI", description: "Workflows and creative copilot", Icon: Zap, roles: ["admin", "editor"] },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((group) => group.items);

const QUICK_ACTIONS: NavItem[] = [
  { href: "/admin/blog", label: "Write a post", description: "Create, optimize and publish", Icon: FileText, roles: ["admin", "editor"] },
  { href: "/admin/portfolio", label: "Add portfolio work", description: "Publish a new case study", Icon: ImageIcon, roles: ["admin", "editor"] },
  { href: "/admin/leads", label: "Capture a lead", description: "Add a prospect to the pipeline", Icon: Target, roles: ["admin", "editor"] },
  { href: "/admin/projects", label: "Start a project", description: "Set up production and client access", Icon: FolderKanban, roles: ["admin", "editor"] },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function canSee(item: NavItem, role: StaffRole) {
  return !item.roles || item.roles.includes(role);
}

function SidebarContent({ pathname, onNavigate, name, email, role }: { pathname: string; onNavigate?: () => void; name: string; email: string; role: StaffRole }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center border-b border-white/[0.07] px-5">
        <Link href="/admin" onClick={onNavigate} className="group flex min-w-0 items-center gap-3">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 via-violet-500 to-amber text-sm font-black text-white shadow-[0_8px_28px_-8px_rgba(115,87,255,.8)]">
            V<span className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-white/20 blur-md" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-bold tracking-tight text-white">VisionFold</p>
            <p className="truncate text-[9px] font-semibold uppercase tracking-[.22em] text-slate-500">Studio OS</p>
          </div>
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">
        {NAV.map((group) => (
          <div key={group.label} className="mb-6 last:mb-2">
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.filter((item) => canSee(item, role)).map(({ href, label, Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cx(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                      active
                        ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]"
                        : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100"
                    )}
                  >
                    {active && <span className="absolute -left-3 h-5 w-0.5 rounded-r-full bg-brand-400 shadow-[0_0_12px_2px_rgba(115,87,255,.7)]" />}
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.7} className={active ? "text-brand-300" : "text-slate-500 group-hover:text-slate-300"} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <Link href="/" target="_blank" className="mb-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white">
          View live website <ExternalLink size={13} />
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.035] p-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500/30 to-amber/20 text-xs font-bold text-brand-200 ring-1 ring-white/10">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{name}</p>
            <p className="truncate text-[10px] capitalize text-slate-600">{role} · {email}</p>
          </div>
          <LogoutButton label="" />
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children, name, email, role }: { children: ReactNode; name: string; email: string; role: string }) {
  const staffRole: StaffRole = role === "editor" || role === "accountant" ? role : "admin";
  const pathname = usePathname() || "/admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const visibleItems = useMemo(() => ALL_ITEMS.filter((item) => canSee(item, staffRole)), [staffRole]);
  const current = visibleItems.find((item) => isActive(pathname, item.href)) || visibleItems[0];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setQuickOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (paletteOpen) requestAnimationFrame(() => searchRef.current?.focus());
  }, [paletteOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleItems;
    return visibleItems.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(q));
  }, [query, visibleItems]);

  return (
    <div className="admin-surface min-h-screen bg-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-white/[0.07] bg-[#0d1324] xl:block">
        <SidebarContent pathname={pathname} name={name} email={email} role={staffRole} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] xl:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[min(86vw,290px)] border-r border-white/10 bg-[#0d1324] shadow-2xl">
            <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 z-10 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} name={name} email={email} role={staffRole} />
          </aside>
        </div>
      )}

      <div className="xl:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-white/[0.07] bg-ink/85 px-4 backdrop-blur-2xl sm:px-6">
          <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white xl:hidden"><Menu size={20} /></button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-base font-bold text-white">{current.label}</h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
              </span>
            </div>
            <p className="hidden truncate text-[11px] text-slate-600 sm:block">{current.description}</p>
          </div>

          <button onClick={() => setPaletteOpen(true)} className="hidden h-9 w-full max-w-[280px] items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-left text-xs text-slate-500 transition hover:border-white/15 hover:bg-white/[0.055] md:flex">
            <Search size={14} /><span className="flex-1">Search admin…</span><kbd className="rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 text-[9px] text-slate-500">⌘ K</kbd>
          </button>

          <div className="relative">
            <button onClick={() => setQuickOpen((value) => !value)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-ink transition hover:bg-warm">
              <Plus size={14} /> <span className="hidden sm:inline">Create</span>
            </button>
            {quickOpen && (
              <div className="absolute right-0 top-12 w-72 rounded-2xl border border-white/10 bg-panel p-2 shadow-2xl shadow-black/50">
                <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Quick create</p>
                {QUICK_ACTIONS.filter((item) => canSee(item, staffRole)).map(({ href, label, description, Icon }) => (
                  <Link key={label} href={href} onClick={() => setQuickOpen(false)} className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/10 text-brand-300"><Icon size={15} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-white">{label}</span><span className="block truncate text-[10px] text-slate-500">{description}</span></span>
                    <ChevronRight size={13} className="text-slate-600" />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/admin/automations" aria-label="AI assistant" className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-brand-300"><Bot size={17} /></Link>
          <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-slate-400 hover:bg-white/5 hover:text-white"><Bell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber ring-2 ring-ink" /></button>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        <footer className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-5 text-[10px] text-slate-600">
          <span>VisionFold Studio OS · Secure admin workspace</span>
          <span className="flex items-center gap-4"><Link href="/admin/site" className="hover:text-slate-300"><Settings2 size={11} className="mr-1 inline" />Settings</Link><a href="mailto:support@visionfold.com" className="hover:text-slate-300"><CircleHelp size={11} className="mr-1 inline" />Help</a></span>
        </footer>
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setPaletteOpen(false)}>
          <div className="h-fit w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-[#12182b] shadow-2xl shadow-black/70" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/8 px-4"><Search size={18} className="text-brand-300" /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pages and tools…" className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /><kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-500">ESC</kbd></div>
            <div className="scrollbar-thin max-h-[430px] overflow-y-auto p-2">
              {results.length ? results.map(({ href, label, description, Icon }) => (
                <Link key={href} href={href} onClick={() => setPaletteOpen(false)} className="group flex items-center gap-3 rounded-xl p-3 hover:bg-white/[0.06]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-slate-400 group-hover:text-brand-300"><Icon size={16} /></span>
                  <span className="flex-1"><span className="block text-sm font-medium text-white">{label}</span><span className="block text-[11px] text-slate-500">{description}</span></span><ChevronRight size={14} className="text-slate-700" />
                </Link>
              )) : <p className="p-8 text-center text-sm text-slate-500">No admin tools match “{query}”</p>}
            </div>
            <div className="flex items-center gap-4 border-t border-white/8 px-4 py-2.5 text-[9px] text-slate-600"><span><Command size={10} className="mr-1 inline" />K to open</span><span>↑↓ browse</span><span>↵ select</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
