import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { readSession, requireClient } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { Logo } from "@/components/SiteChrome";
import { LogoutButton } from "@/components/Forms";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const client = await requireClient();
  const session = await readSession();
  if (session && session.role !== "client") redirect("/admin");
  // The sign-in/register screen lives below this layout. Render it without the
  // private workspace chrome when no valid client session is present.
  if (!client) return <>{children}</>;

  return (
    <div className="bg-aurora min-h-screen">
      <header className="glass sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-8" />
            <span className="font-display text-sm font-bold text-white">VisionFold · Client portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <nav className="mr-2 hidden items-center gap-1 md:flex">
              <Link href="/portal" className="rounded-lg px-3 py-2 text-xs font-semibold text-white hover:bg-white/5">Workspace</Link>
              <Link href="/work" className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white">Our work</Link>
              <Link href="/services" className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white">Services</Link>
              <Link href="/" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-brand-400/40 hover:text-white">View website ↗</Link>
            </nav>
            <span className="hidden text-sm text-slate-400 sm:block">{client.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
