import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { Logo } from "@/components/SiteChrome";
import { LogoutButton } from "@/components/Forms";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const client = await requireClient();
  if (!client) redirect("/portal/login");

  return (
    <div className="bg-aurora min-h-screen">
      <header className="glass sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="font-display text-sm font-bold text-white">VisionFold · Client portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-400 sm:block">{client.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
