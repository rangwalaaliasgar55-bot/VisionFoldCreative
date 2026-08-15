import type { ReactNode } from "react";
import { getSettings } from "@/lib/settings";
import { readSession } from "@/lib/auth";
import { Countdown } from "@/components/Fx";
import { Logo, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ScrollProgress from "@/components/ScrollProgress";
import VisionRunner from "@/components/VisionRunner";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const maintenance = Boolean(settings.maintenanceOn);
  const session = await readSession();

  if (maintenance && session?.role !== "admin") {
    return (
      <div className="bg-aurora relative flex min-h-screen items-center justify-center px-6">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="relative w-full max-w-xl text-center">
          <div className="animate-floaty mx-auto mb-8 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[#F4A62A] to-[#C97A12] shadow-[0_0_80px_-20px_rgba(244,166,42,0.9)]">
            <Logo className="h-10 w-10" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            {settings.siteTitle} · Maintenance
          </p>
          <h1 className="font-display mt-4 text-4xl font-bold text-white sm:text-5xl">
            The studio is <span className="text-gradient">re-rendering…</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-slate-400">
            {settings.maintenanceMessage}
          </p>
          {settings.maintenanceEndsAt && (
            <div className="mt-8 flex justify-center">
              <Countdown endsAt={String(settings.maintenanceEndsAt)} />
            </div>
          )}
          <p className="mt-8 text-sm text-slate-500">
            Need something urgent?{" "}
            <a href={`mailto:${settings.email}`} className="text-brand-300 underline-offset-4 hover:underline">
              {settings.email}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollProgress />
      <SiteHeader title={String(settings.siteTitle)} />
      <main className="animate-page-in min-h-screen pt-16">{children}</main>
      <SiteFooter settings={settings} />
      <VisionRunner />
    </>
  );
}
