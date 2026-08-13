import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { portfolio } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Counter, FilterGrid, Reveal, Tilt } from "@/components/Fx";
import { Play } from "lucide-react";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Work",
  description: "Brand films, YouTube series, music videos and commercials edited by VisionFold Creative.",
};

export default async function WorkPage() {
  const settings = await getSettings();
  const items = await db.select().from(portfolio).orderBy(desc(portfolio.featured), desc(portfolio.createdAt));

  return (
    <div className="bg-aurora">
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Portfolio</p>
            <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-6xl">
              Cuts that <span className="text-gradient">kept people watching</span>
            </h1>
            <p className="mt-4 text-slate-400">
              A selection of recent work — every project delivered on time, in every format you need.
            </p>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4">
            {[
              { v: Number(settings.statsProjects), s: "+", l: "Delivered" },
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

        <div className="mt-16">
          <FilterGrid
            items={items}
            getCategory={(i) => i.category}
            render={(item) => (
              <Tilt max={7} className="h-full">
                <Link
                  href={item.videoUrl || "/contact"}
                  className="group block h-full overflow-hidden rounded-3xl border border-white/8 bg-panel transition-all hover:border-brand-400/40"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    {item.videoUrl ? (
                      <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="glow-ring grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur">
                          <Play size={20} className="ml-0.5 text-white" />
                        </div>
                      </div>
                    ) : null}
                    <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-300 backdrop-blur">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{item.description}</p>
                    <p className="mt-3 text-xs text-slate-600">{item.year}</p>
                  </div>
                </Link>
              </Tilt>
            )}
          />
        </div>

        <Reveal>
          <div className="glass mt-20 rounded-3xl p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-white">
              Want work like this for <span className="text-gradient">your brand?</span>
            </h2>
            <Link
              href="/contact"
              className="mt-5 inline-block rounded-full bg-[#7357FF] hover:bg-[#6346E8] px-7 py-3 text-sm font-semibold text-white shadow-[0_0_36px_-10px_rgba(115,87,255,0.9)] transition-transform hover:scale-105"
            >
              Start a project
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
