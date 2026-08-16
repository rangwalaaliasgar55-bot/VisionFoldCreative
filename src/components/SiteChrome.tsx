"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { Menu, X } from "lucide-react";
import { CSS_EASE, DUR, SPRING } from "@/lib/motion";
import { NewsletterForm } from "@/components/Forms";

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" fill="currentColor" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z" />
    </svg>
  );
}

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id="vfg" x1="0" y1="0" x2="36" y2="36">
          <stop offset="0" stopColor="#F6F3EC" />
          <stop offset="0.45" stopColor="#F4A62A" />
          <stop offset="1" stopColor="#7357FF" />
        </linearGradient>
      </defs>
      <path d="M6 4 L30 4 L18 16 Z" fill="url(#vfg)" opacity="0.95" />
      <path d="M6 4 L18 16 L18 32 L6 32 Z" fill="url(#vfg)" opacity="0.55" />
      <path d="M30 4 L30 18 L18 16 Z" fill="#e2e8f0" opacity="0.18" />
    </svg>
  );
}

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/#process", label: "Process" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ title }: { title: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // RAF-throttled — the header never fights the scroll thread.
  useEffect(() => {
    let raf = 0;
    let last = false;
    const read = () => {
      raf = 0;
      const next = window.scrollY > 12;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 ${
        scrolled
          ? "border-b border-white/10 bg-[#0B1020]/85 py-2.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.7)]"
          : "border-b border-transparent py-5"
      }`}
      style={{
        transform: "translateZ(0)",
        willChange: scrolled ? "transform" : undefined,
        backdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
        transition: `padding ${DUR.chrome}s ${CSS_EASE}, background-color ${DUR.chrome}s ${CSS_EASE}, border-color ${DUR.chrome}s ${CSS_EASE}, box-shadow ${DUR.chrome}s ${CSS_EASE}, backdrop-filter ${DUR.chrome}s ${CSS_EASE}`,
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo />
          <span className="font-display text-lg font-bold tracking-tight text-white">{title}</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#98A1B3] hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/portal" className="nav-link rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#98A1B3] hover:border-[#7357FF]/50 hover:text-white">
            Client Portal
          </Link>
          <Link href="/contact" className="nav-link btn-lift rounded-full bg-[#7357FF] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#7357FF]/30 hover:bg-[#6346E8]">
            Book a Call
          </Link>
        </div>

        <button className="text-[#F6F3EC] lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            className="overflow-hidden lg:hidden"
            style={{ willChange: "height, opacity" }}
          >
            <div className="glass mx-4 mt-3 rounded-2xl border border-white/10 bg-[#0B1020]/95 p-4">
              <nav className="flex flex-col">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="nav-link rounded-xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/5">
                    {n.label}
                  </Link>
                ))}
                <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                  <Link href="/portal" onClick={() => setOpen(false)} className="nav-link rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-bold uppercase tracking-wider text-[#F6F3EC]">
                    Client Portal
                  </Link>
                  <Link href="/contact" onClick={() => setOpen(false)} className="nav-link rounded-full bg-[#7357FF] py-3 text-center text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#7357FF]/25">
                    Book a Call
                  </Link>
                </div>
              </nav>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function SiteFooter({ settings }: { settings: Record<string, any> }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-panel/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg font-bold text-white">{settings.siteTitle}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            {settings.siteTagline}. We fold stories into motion — and motion into results.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { href: settings.instagram, Icon: InstagramIcon },
              { href: settings.youtube, Icon: YoutubeIcon },
              { href: settings.x, Icon: XIcon },
            ].map(({ href, Icon }, i) => (
              <a key={i} href={href} target="_blank" rel="noreferrer" className="glass hover-lift rounded-xl p-2.5 text-slate-400 hover:text-white">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ["Work", "/work"],
              ["Services", "/services"],
              ["Blog", "/blog"],
              ["Contact", "/contact"],
              ["Client Portal", "/portal"],
              ["Policies", "/policies"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="nav-link text-slate-400 hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Services</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li>Brand films & commercials</li>
            <li>YouTube editing & retention</li>
            <li>Music video post-production</li>
            <li>Wedding cinema</li>
            <li>Podcasts & clips</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Newsletter</h4>
          <p className="mt-4 text-sm text-slate-400">Monthly cut-list — tips, work and pricing. No spam.</p>
          <div className="mt-4"><NewsletterForm /></div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {year} {settings.siteTitle}. All rights reserved.</p>
          <p>
            <Link href="/portal" className="hover:text-white">Client Portal</Link>
            {" · "}
            <Link href="/admin" className="hover:text-slate-300">Admin</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
