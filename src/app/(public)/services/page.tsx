import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { Accordion, RatesCalculator, Reveal, SplitCompare, Tilt } from "@/components/Fx";
import {
  Clapperboard,
  Heart,
  Megaphone,
  Mic,
  MonitorPlay,
  Music,
  Check,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services & Pricing",
  description: "Video editing services and transparent pricing: brand films, YouTube editing, music videos, ads and more.",
};

const SERVICES = [
  {
    Icon: Clapperboard,
    title: "Brand Films",
    price: "from ₹2,00,000",
    unit: "custom · per film",
    desc: "Launch films, about films and founder stories cut to cinema standard.",
    perks: ["Story-first beat sheet", "Motion graphics included", "Film-grade color", "2 revision rounds", "All aspect ratios"],
  },
  {
    Icon: MonitorPlay,
    title: "YouTube Editing",
    price: "Custom quote",
    unit: "per video · long-form",
    desc: "Long-form edits engineered for retention, plus a monthly retainer option.",
    perks: ["Retention pacing & hooks", "Sound design & music", "Chapter cards & end screens", "48h–72h turnaround", "Monthly retainer discounts"],
  },
  {
    Icon: Music,
    title: "Music Videos",
    price: "from ₹1,50,000",
    unit: "custom · per video",
    desc: "Rhythm cuts and cinematic grade that make the song feel bigger.",
    perks: ["Beat-synced cutting", "VFX cleanup", "Lyric video option", "Premiere teaser cut", "Vertical edits included"],
  },
  {
    Icon: Megaphone,
    title: "Commercials & Ads",
    price: "from ₹1,25,000",
    unit: "custom · per campaign",
    desc: "Platform-ready ad packs delivered in days, optimized to convert.",
    perks: ["16:9 + 9:16 + 1:1", "Subtitle pass", "Hook variations", "3-day delivery", "Platform QC"],
  },
  {
    Icon: Heart,
    title: "Wedding Cinema",
    price: "from ₹1,00,000",
    unit: "custom · per film",
    desc: "Ceremony films and teasers edited into stories worth rewatching.",
    perks: ["Ceremony + highlight film", "Cinematic grade", "Licensed music", "Teaser in 7 days", "USB + cloud delivery"],
  },
  {
    Icon: Mic,
    title: "Podcast Editing",
    price: "from ₹40,000",
    unit: "custom · per episode",
    desc: "Full episode cleanup plus a clip engine for Shorts and Reels.",
    perks: ["Audio repair & mixing", "Multicam switching", "Clip engine (3+ clips)", "Caption files", "Weekly scheduling"],
  },
];

const FAQ = [
  {
    q: "How fast can you deliver?",
    a: "Most single videos ship in 3–5 days. Brand films typically take 7–14 days depending on footage volume and revision rounds. Rush delivery (48h) is available on most services.",
  },
  {
    q: "How do I send my footage?",
    a: "We accept Google Drive, Dropbox, Frame.io or a hard drive. You'll get a simple upload checklist and naming guide so the first pass lands right.",
  },
  {
    q: "How many revisions are included?",
    a: "Every project includes 2 structured revision rounds. Additional rounds are billed at a flat rate, and we always agree on scope before starting.",
  },
  {
    q: "Do you work with remote clients?",
    a: "Everywhere. We serve clients across 12 countries. Timezone is never an excuse — we work async with a 24h response promise.",
  },
  {
    q: "What if I don't like the first cut?",
    a: "Then the process is working. The first cut is a fast, honest draft designed to find the story early. You'll steer it through the revision rounds until it feels right.",
  },
  {
    q: "Do you offer monthly retainers?",
    a: "Yes — creators and agencies lock in a monthly batch of videos at a discounted rate with priority scheduling and same-week turnaround.",
  },
];

export default async function ServicesPage() {
  const settings = await getSettings();
  return (
    <div className="bg-aurora">
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-20 sm:px-8 space-y-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Services & pricing</p>
            <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-6xl">
              Transparent pricing, <span className="text-gradient">cinema-grade output</span>
            </h1>
            <p className="mt-4 text-slate-400">
              Every service includes structured revision rounds, a review link and delivery in every
              format you need. No hidden line items — ever.
            </p>
          </div>
        </Reveal>

        {/* Shorts — flat rate highlight */}
        <Reveal>
          <div className="glass card-glow relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-7 sm:p-9">
            <div className="absolute right-0 top-0 rounded-bl-2xl bg-brand-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-300">
              Most popular
            </div>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#7357FF]/30 to-[#F4A62A]/15 text-brand-300">
                <Clapperboard size={26} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                  Shorts &amp; Reels — <span className="text-gradient">₹700 flat</span>
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Vertical edits for Instagram, YouTube Shorts and TikTok. Delivered in 24 hours — hook, captions,
                  sound design and platform-safe export included.
                </p>
              </div>
              <Link
                href="/contact"
                className="shrink-0 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600"
              >
                Order a Short
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Pricing Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ Icon, title, price, unit, desc, perks }, i) => (
            <Reveal key={title} delay={i * 70}>
              <Tilt max={6} className="h-full">
                <div className="glass card-glow flex h-full flex-col rounded-3xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#7357FF]/30 to-[#F4A62A]/10 text-brand-300">
                      <Icon size={22} />
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-white">{price}</p>
                      <p className="text-[11px] text-slate-500">{unit}</p>
                    </div>
                  </div>
                  <h3 className="font-display mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">{desc}</p>
                  <ul className="mt-4 flex-1 space-y-2 border-t border-white/8 pt-4">
                    {perks.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check size={14} className="shrink-0 text-emerald-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className="mt-5 rounded-xl border border-white/15 py-2.5 text-center text-sm font-semibold text-slate-200 transition-all hover:border-brand-400/60 hover:bg-brand-600/10 hover:text-white"
                  >
                    Get a quote
                  </Link>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>

        {/* Long-form custom-rate note */}
        <Reveal>
          <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-slate-400">
            <span className="font-semibold text-white">Long-form rates are custom.</span> Every film, episode and
            campaign is quoted individually — the final price depends on the footage length, complexity, revision
            rounds and turnaround. Shorts &amp; Reels are a flat <span className="font-semibold text-brand-300">₹700 each</span>.
          </p>
        </Reveal>

        {/* Interactive Rates & Investment Estimator */}
        <Reveal>
          <RatesCalculator />
        </Reveal>

        {/* Before / After Color Grade & VFX Split Comparison */}
        <Reveal>
          <div className="space-y-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Post-Production Polish</p>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              From Raw Sensor Log to <span className="text-gradient">Cinematic Master</span>
            </h2>
            <SplitCompare />
          </div>
        </Reveal>

        {/* FAQ */}
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">FAQ</p>
              <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                Before you <span className="text-gradient">press record</span>
              </h2>
            </div>
          </Reveal>
          <div className="mt-8">
            <Accordion items={FAQ} />
          </div>
        </div>

        <Reveal>
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-sm text-slate-400">
              Not sure which service fits? Send the footage — we&rsquo;ll tell you honestly.
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {settings.email} · {settings.phone}
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
