import type { ReactNode } from "react";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { readSession } from "@/lib/auth";
import { Countdown } from "@/components/Fx";
import { Logo, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ScrollProgress from "@/components/ScrollProgress";
import SmoothScroll from "@/components/SmoothScroll";
import ThreeBackground from "@/components/ThreeBackground";
import VisionRunner from "@/components/VisionRunner";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import SiteGuide from "@/components/SiteGuide";
import LiveTracker from "@/components/LiveTracker";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/Seo";

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
          <div className="animate-floaty mx-auto mb-8 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[#7357FF] to-[#5B3FD4] shadow-[0_0_80px_-20px_rgba(115,87,255,0.9)]">
            <Logo className="h-10 w-10" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            {settings.siteTitle} ┬╖ Maintenance
          </p>
          <h1 className="font-display mt-4 text-4xl font-bold text-white sm:text-5xl">
            The studio is <span className="text-gradient">re-renderingΓÇª</span>
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
      {maintenance && (
        <div className="fixed inset-x-0 top-0 z-[120] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-ink">
          <span>Maintenance mode is ON — visitors see the countdown screen.</span>
          <span className="font-medium normal-case tracking-normal opacity-80">
            You see the site because you&apos;re staff.
          </span>
          <Link href="/admin/site" className="rounded-full bg-ink/80 px-3 py-0.5 normal-case hover:bg-ink">
            Open settings
          </Link>
        </div>
      )}
      <JsonLd data={[organizationSchema(settings), websiteSchema(settings)]} />
      <a
        href="#main"
        className="sr-only z-[200] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-full focus:bg-[#7357FF] focus:px-5 focus:py-2.5 focus:text-xs focus:font-bold focus:uppercase focus:tracking-wider focus:text-white"
      >
        Skip to content
      </a>
      <ThreeBackground />
      <SmoothScroll />
      <ScrollProgress />
      <SiteHeader title={String(settings.siteTitle)} />
      <main id="main" className="animate-page-in min-h-screen pt-16">{children}</main>
      <SiteFooter settings={settings} />
      <VisionRunner />
      <FloatingWhatsApp number={String(settings.whatsapp || "")} />
      <SiteGuide />
      <LiveTracker />
    </>
  );
}
