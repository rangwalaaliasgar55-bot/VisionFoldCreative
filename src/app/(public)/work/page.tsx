import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { portfolio } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Counter, PortfolioFilterGrid, Reveal, SplitCompare } from "@/components/Fx";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Work",
  description: "Brand films, YouTube series, music videos and commercials edited by VisionFold Creative.",
};

export default async function WorkPage() {
  const settings = await getSettings();
  const items = await db
    .select()
    .from(portfolio)
    .orderBy(desc(portfolio.featured), desc(portfolio.createdAt));

  return (
    <div className="bg-aurora">
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 space-y-16">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Portfolio</p>
            <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-6xl">
              Cuts that <span className="text-gradient">kept people watching</span>
            </h1>
            <p className="mt-4 text-slate-400">
              A selection of recent work — every project delivered on time, in every format you need.
            </p>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4">
            {[
              { v: Number(settings.statsProjects || 420), s: "+", l: "Delivered" },
              { v: 9, s: "", l: "Countries" },
              { v: 5, s: "/5", l: "Avg. rating" },
            ].map((x) => (
              <div key={x.l} className="glass rounded-2xl py-5 text-center">
                <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                  <Counter to={x.v} suffix={x.s} />
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">{x.l}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Portfolio Filter Grid */}
        <PortfolioFilterGrid items={items} />

        {/* Before / After Color Comparison */}
        <Reveal>
          <div className="text-center space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Master Finishing</p>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Interactive 35mm <span className="text-gradient">Color Grading Breakdown</span>
            </h2>
            <SplitCompare />
          </div>
        </Reveal>

        <Reveal>
          <div className="glass mt-20 rounded-3xl p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-white">
              Want work like this for <span className="text-gradient">your brand?</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Drop your brief or footage link and get a fast 24-hour turnaround plan.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-full bg-[#F4A62A] hover:bg-[#D98E0C] px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_36px_-10px_rgba(244,166,42,0.9)] transition-transform hover:scale-105"
            >
              Start a project →
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
