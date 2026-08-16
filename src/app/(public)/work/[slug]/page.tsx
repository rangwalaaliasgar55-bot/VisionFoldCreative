import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { portfolio } from "@/db/schema";
import { desc, eq, ne } from "drizzle-orm";
import { ArrowLeft, ArrowRight, Calendar, Clapperboard, Film, Palette, Volume2 } from "lucide-react";
import { Reveal, Tilt } from "@/components/Fx";
import { WorkVideo } from "@/components/WorkVideo";
import { JsonLd, breadcrumbSchema } from "@/components/Seo";
import { parseWorkSlug, workPath, workSlug } from "@/lib/slug";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://visionfoldcreative.vercel.app";

type Props = { params: Promise<{ slug: string }> };

async function findWork(slug: string) {
  const id = parseWorkSlug(slug);
  if (!id) return null;
  const [row] = await db.select().from(portfolio).where(eq(portfolio.id, id)).limit(1);
  return row ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await findWork(slug);
  if (!row) return { title: "Work not found", robots: { index: false, follow: true } };

  const description =
    row.description?.slice(0, 155) ||
    `${row.category} edited by VisionFold Creative — colour, sound and finishing.`;

  return {
    title: row.title,
    description,
    alternates: { canonical: `${SITE}${workPath(row)}` },
    openGraph: {
      title: row.title,
      description,
      type: "article",
      images: row.thumbnailUrl ? [{ url: row.thumbnailUrl, alt: row.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: row.title,
      description,
      images: row.thumbnailUrl ? [row.thumbnailUrl] : undefined,
    },
  };
}

/** The four passes every project goes through — true for all of them. */
const PASSES = [
  { Icon: Clapperboard, title: "Story pass", body: "We watch everything, mark the moments that earn their place and agree a beat sheet before a single cut." },
  { Icon: Film, title: "Assembly", body: "An honest first cut — structure and pacing, no polish hiding the shape of it." },
  { Icon: Palette, title: "Colour & graphics", body: "Grade, motion graphics and titles applied as separate passes you can approve one at a time." },
  { Icon: Volume2, title: "Sound & delivery", body: "Mix, master and export in every format the brief needs, with captions where they're wanted." },
];

export default async function WorkCaseStudy({ params }: Props) {
  const { slug } = await params;
  const row = await findWork(slug);
  if (!row) notFound();

  // Titles can change; keep one canonical URL.
  const canonical = workSlug(row);
  if (slug !== canonical) redirect(`/work/${canonical}`);

  const [settings, related] = await Promise.all([
    getSettings(),
    db
      .select()
      .from(portfolio)
      .where(ne(portfolio.id, row.id))
      .orderBy(desc(portfolio.featured), desc(portfolio.createdAt))
      .limit(3),
  ]);

  const paragraphs = (row.description || "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="bg-aurora">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: row.title,
            description: row.description || undefined,
            genre: row.category,
            dateCreated: row.year || undefined,
            image: row.thumbnailUrl || undefined,
            url: `${SITE}${workPath(row)}`,
            creator: { "@id": `${SITE}/#organization` },
          },
          ...(row.videoUrl
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "VideoObject",
                  name: row.title,
                  description: row.description || row.title,
                  thumbnailUrl: row.thumbnailUrl || undefined,
                  contentUrl: row.videoUrl,
                  uploadDate: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
                },
              ]
            : []),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Work", path: "/work" },
            { name: row.title, path: workPath(row) },
          ]),
        ]}
      />

      <article className="mx-auto max-w-5xl px-5 pb-20 pt-20 sm:px-8">
        <Reveal>
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} /> All work
          </Link>
        </Reveal>

        <Reveal delay={70}>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full bg-brand-600/15 px-3 py-1 font-bold uppercase tracking-widest text-brand-300">
              {row.category}
            </span>
            {row.year && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-slate-400">
                <Calendar size={11} /> {row.year}
              </span>
            )}
            {row.featured && (
              <span className="rounded-full bg-amber/15 px-3 py-1 font-bold uppercase tracking-widest text-amber">
                Featured
              </span>
            )}
          </div>
          <h1 className="font-display mt-4 text-4xl font-bold leading-[1.08] text-white sm:text-6xl">
            {row.title}
          </h1>
        </Reveal>

        {/* The film itself, above everything else */}
        <Reveal delay={140}>
          <div className="mt-10">
            <WorkVideo
              title={row.title}
              videoUrl={row.videoUrl}
              thumbnailUrl={row.thumbnailUrl}
            />
          </div>
        </Reveal>

        {paragraphs.length > 0 && (
          <Reveal delay={210}>
            <section className="mt-14 grid gap-8 sm:grid-cols-[160px_1fr]">
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                The brief
              </h2>
              <div className="space-y-4">
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal delay={210}>
          <section className="mt-14 grid gap-8 sm:grid-cols-[160px_1fr]">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              How it was cut
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {PASSES.map(({ Icon, title, body }) => (
                <div key={title} className="fold-card rounded-2xl p-5">
                  <Icon size={18} className="text-brand-300" />
                  <h3 className="font-display mt-3 text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* CTA */}
        <Reveal delay={280}>
          <section className="bg-aurora mt-16 overflow-hidden rounded-[2rem] border border-brand-400/20 p-8 text-center sm:p-12">
            <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">
              Got something like this? <span className="text-gradient">Let&rsquo;s cut it.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
              Send a brief and get a plan, a timeline and a quote back within{" "}
              {String(settings.statsTurnaround || 24)} hours. No calls required.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={`/contact?service=${encodeURIComponent(row.category)}`}
                className="rounded-full bg-[#7357FF] px-7 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#7357FF]/30 transition-transform hover:scale-105"
              >
                Start a project
              </Link>
              <Link
                href="/work"
                className="glass rounded-full px-7 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-white/30 hover:text-white"
              >
                See more work
              </Link>
            </div>
          </section>
        </Reveal>

        {related.length > 0 && (
          <Reveal delay={280}>
            <section className="mt-16">
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                More work
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                {related.map((item) => (
                  <Tilt key={item.id} max={7} className="h-full">
                    <Link
                      href={workPath(item)}
                      className="group block h-full overflow-hidden rounded-3xl border border-white/8 bg-panel transition-colors hover:border-brand-400/40"
                    >
                      <div className="relative h-40 overflow-hidden bg-ink">
                        {item.thumbnailUrl && (
                          <Image
                            src={item.thumbnailUrl}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                          {item.category}
                        </p>
                        <h3 className="font-display mt-1 line-clamp-2 text-sm font-semibold text-white">
                          {item.title}
                        </h3>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition-colors group-hover:text-brand-300">
                          View case study <ArrowRight size={12} />
                        </span>
                      </div>
                    </Link>
                  </Tilt>
                ))}
              </div>
            </section>
          </Reveal>
        )}
      </article>
    </div>
  );
}
