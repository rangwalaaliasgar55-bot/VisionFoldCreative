import Link from "next/link";
import { db } from "@/db";
import { categories, clients, portfolio, posts, ratings } from "@/db/schema";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import ThreeBackground from "@/components/ThreeBackground";
import { ClientsGlobeSection } from "@/components/ClientsGlobeSection";
import { Counter, Reel3D, Reveal, SplitCompare, Stars, Tilt } from "@/components/Fx";
import {
  ArrowRight,
  Clapperboard,
  Film,
  Heart,
  Megaphone,
  Mic,
  MonitorPlay,
  Music,
  Palette,
  PenTool,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

const SERVICES = [
  { Icon: Clapperboard, title: "Brand Films", desc: "Launch films and brand stories that make people feel something — cut, graded and mixed to cinema standard.", price: "from $2,400" },
  { Icon: MonitorPlay, title: "YouTube Editing", desc: "Retention-first edits with pacing, sound design and hooks engineered to hold watch-time.", price: "from $350 / video" },
  { Icon: Music, title: "Music Videos", desc: "Rhythm cuts, film-grade color and VFX cleanup that make the song hit harder.", price: "from $1,800" },
  { Icon: Megaphone, title: "Commercials & Ads", desc: "Platform-ready ad packs — 16:9, 9:16, 1:1 with subtitles — shipped in days, not weeks.", price: "from $1,500" },
  { Icon: Heart, title: "Wedding Cinema", desc: "Ceremony films and teasers edited into stories you'll rewatch for decades.", price: "from $1,200" },
  { Icon: Mic, title: "Podcast Editing", desc: "Full episode cleanup plus a clip engine that turns every episode into Shorts and Reels.", price: "from $450 / episode" },
];

const PROCESS = [
  { Icon: PenTool, step: "01", title: "Brief & story pass", desc: "We watch your footage, mark the best moments and agree on a beat sheet before a single cut happens." },
  { Icon: Sparkles, step: "02", title: "Assembly cut", desc: "A fast, honest first pass delivered in 3–5 days. You see the direction early, not after weeks." },
  { Icon: Palette, step: "03", title: "Polish stack", desc: "Motion graphics, sound design, color grade and mix — applied in passes you can approve at each stage." },
  { Icon: PlayCircle, step: "04", title: "Delivery & beyond", desc: "Every format you need, plus a review link and revision rounds. 100% of clients get every deliverable." },
];

export default async function HomePage() {
  await ensureSeed();
  const settings = await getSettings();
  const [work, latestPosts, publicRatings] = await Promise.all([
    db.select().from(portfolio).orderBy(desc(portfolio.featured), desc(portfolio.createdAt)).limit(8),
    db
      .select({ ...getTableColumns(posts), categoryName: categories.name })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(3),
    db
      .select({ ...getTableColumns(ratings), clientName: clients.name })
      .from(ratings)
      .innerJoin(clients, eq(clients.id, ratings.clientId))
      .where(eq(ratings.visible, true))
      .orderBy(desc(ratings.createdAt))
      .limit(6),
  ]);

  const featured = work.slice(0, 8);
  const reelItems = featured.map((w) => ({
    title: w.title,
    thumbnailUrl: w.thumbnailUrl,
    category: w.category,
    href: "/work",
  }));

  return (
    <>
      <ThreeBackground />

      <section className="bg-aurora relative overflow-hidden pb-24 pt-20 sm:pt-28">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-8">
          <Reveal>
            <div className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-300">
              <span className="animate-pulseglow h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Premium Video Editing Studio — High-Retention Post-Production
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="font-display mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[1.04] text-white sm:text-7xl">
              {settings.heroTitle}{" "}
              <span className="text-gradient">{settings.heroHighlight}</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              {settings.heroSubtitle}
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="group flex items-center gap-2 rounded-full bg-[#7357FF] px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#7357FF]/35 transition-transform hover:scale-105 hover:bg-[#6346E8]"
              >
                {settings.heroCta}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/work"
                className="glass flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-slate-200 transition-all hover:border-white/30 hover:text-white"
              >
                <Film size={16} className="text-cyan-300" />
                {settings.heroSecondary}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { value: Number(settings.statsYears || 8), suffix: "+", label: "Years editing" },
                { value: Number(settings.statsProjects || 420), suffix: "+", label: "Projects delivered" },
                { value: Number(settings.statsClients || 160), suffix: "+", label: "Happy clients" },
                { value: Number(settings.statsAwards || 14), suffix: "", label: "Awards & nods" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-2xl px-4 py-5">
                  <div className="font-display text-3xl font-bold text-white sm:text-4xl">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <div className="mt-16 flex justify-center">
            <div className="animate-scrollcue h-10 w-6 rounded-full border border-white/20 p-1.5">
              <div className="mx-auto h-2 w-1 rounded-full bg-cyan-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Clients Bar */}
      <section className="border-y border-white/5 bg-panel/50 py-5">
        <div className="overflow-hidden">
          <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
            {[...Array(2)].map((_, dup) => (
              <div key={dup} className="flex gap-12">
                {["NOVA SOUND", "LUMINA ROBOTICS", "APEX CREATORS", "VELA WAVES", "HEXA MEDIA", "ORBIT LABS", "PEAK SUPPLY", "GLOW BEAUTY"].map((name) => (
                  <span key={name + dup} className="font-display text-sm font-bold tracking-[0.25em] text-slate-600">
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">What we cut</p>
            <h2 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">
              Editing services that <span className="text-gradient">ship results</span>
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ Icon, title, desc, price }, i) => (
            <Reveal key={title} delay={i * 80}>
              <Tilt max={6} className="h-full">
                <div className="glass card-glow group flex h-full flex-col rounded-3xl p-6">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600/30 to-cy-500/20 text-brand-300 transition-transform group-hover:scale-110 group-hover:rotate-6">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-cyan-300">{price}</span>
                    <Link href="/contact" className="text-xs font-medium text-slate-500 transition-colors hover:text-white">
                      Get a quote →
                    </Link>
                  </div>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Before / After Color Grade & VFX Interactive Split */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Optical Standards</p>
            <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-5xl">
              Photochemical Color & <span className="text-gradient">Finishing VFX</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Interactive split preview: drag slider to see our 35mm film emulation, highlight rolloff, and sound-synced VFX.
            </p>
          </div>
          <SplitCompare />
        </Reveal>
      </section>

      {/* Process Section */}
      <section id="process" className="border-y border-white/5 bg-panel/40 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">How we work</p>
              <h2 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">Four passes. Zero guesswork.</h2>
            </div>
          </Reveal>
          <div className="process-timeline relative z-10 mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(({ Icon, step, title, desc }, i) => (
              <Reveal key={step} delay={i * 90}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/8 bg-panel p-6 transition-colors hover:border-brand-400/40">
                  <span className="font-display absolute -right-2 -top-6 text-7xl font-bold text-white/4 transition-colors group-hover:text-brand-500/10">
                    {step}
                  </span>
                  <Icon size={22} className="text-cyan-300" />
                  <h3 className="font-display mt-4 text-base font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Film Reel Showcase */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">The 3D Reel</p>
            <h2 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">
              Work you can <span className="text-gradient">feel</span>
            </h2>
            <p className="mt-4 text-slate-400">A 3D interactive carousel of recent studio masters — hover to inspect.</p>
          </div>
        </Reveal>
        <div className="mt-10">
          <Reel3D items={reelItems} />
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition-colors hover:text-white"
          >
            Browse the full portfolio <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* 3D Global Clients Interactive Globe */}
      <Reveal>
        <ClientsGlobeSection />
      </Reveal>

      {/* Client Reviews */}
      {settings.ratingsOn !== false && publicRatings.length > 0 && (
        <section className="border-y border-white/5 bg-panel/40 py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Client reviews</p>
                <h2 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">
                  Rated by the creators <span className="text-gradient">we cut for</span>
                </h2>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {publicRatings.slice(0, 3).map((r, i) => (
                <Reveal key={r.id} delay={i * 90}>
                  <Tilt max={5} className="h-full">
                    <figure className="glass flex h-full flex-col rounded-3xl p-6">
                      <Stars value={r.stars} />
                      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">
                        “{r.comment}”
                      </blockquote>
                      <figcaption className="mt-5 flex items-center gap-3 border-t border-white/8 pt-4">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-cy-500 text-sm font-bold text-white">
                          {r.clientName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{r.clientName}</p>
                          <p className="text-xs text-slate-500">Verified client</p>
                        </div>
                      </figcaption>
                    </figure>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles (WordPress Headless) */}
      {latestPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">From the studio</p>
                <h2 className="font-display mt-3 text-4xl font-bold text-white">
                  Editing tips & <span className="text-gradient">insider notes</span>
                </h2>
              </div>
              <Link href="/blog" className="text-sm font-semibold text-cyan-300 transition-colors hover:text-white">
                All articles →
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {latestPosts.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <Link href={`/blog/${p.slug}`} className="group block h-full">
                  <div className="glass card-glow overflow-hidden rounded-3xl transition-transform">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={p.featuredImage}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold uppercase tracking-widest text-cyan-300">
                          {p.categoryName || "Studio"}
                        </span>
                        <span>·</span>
                        <span>{fmtDate(p.publishedAt)}</span>
                      </div>
                      <h3 className="font-display mt-2 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-brand-300">
                        {p.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.excerpt}</p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* CTA Box */}
      <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <Reveal>
          <div className="bg-aurora relative overflow-hidden rounded-[2.5rem] border border-brand-400/20 p-10 text-center sm:p-16">
            <div className="animate-floaty2 pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-brand-600/25 blur-3xl" />
            <div className="animate-floaty pointer-events-none absolute -right-10 bottom-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <h2 className="font-display relative text-3xl font-bold text-white sm:text-5xl">
              Got footage? <span className="text-gradient">Let&rsquo;s make it move.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-slate-400">
              Send a brief today and get a plan, a timeline and a quote back within 24 hours. No calls required.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="glow-ring rounded-full bg-[#7357FF] px-8 py-4 text-sm font-black uppercase tracking-wider text-white transition-transform hover:scale-105 hover:bg-[#6346E8]"
              >
                Book a Call / Get Quote
              </Link>
              <Link
                href="/portal"
                className="glass rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#F6F3EC] transition-all hover:border-[#7357FF]/50 hover:text-white"
              >
                Open Client Portal
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
