import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { portfolio } from "@/db/schema";
import { desc, eq, ne } from "drizzle-orm";
import { Reveal } from "@/components/Fx";
import { portfolioPath } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function parseId(slug: string): number {
  const match = /-(\d+)$/.exec(slug.trim());
  return match ? Number(match[1]) : 0;
}

async function loadItem(slug: string) {
  const id = parseId(slug);
  if (!id) return null;
  const rows = await db.select().from(portfolio).where(eq(portfolio.id, id)).limit(1);
  const item = rows[0];
  if (!item) return null;
  // Guard against forged ids: the slug suffix must match the title.
  if (portfolioPath(item.id, item.title) !== `/work/${slug}`) return null;
  return item;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadItem(slug);
  if (!item) return { title: "Case study not found" };
  return {
    title: `${item.title} — ${item.category}`,
    description: item.description.slice(0, 160),
    openGraph: {
      title: `${item.title} — VisionFold Creative`,
      description: item.description.slice(0, 160),
      images: item.thumbnailUrl ? [item.thumbnailUrl] : undefined,
    },
  };
}

/** Embeds YouTube links; native player for direct video files; poster otherwise. */
function VideoStage({ item }: { item: typeof portfolio.$inferSelect }) {
  const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/.exec(item.videoUrl || "");
  if (yt) {
    return (
      <iframe
        className="aspect-video w-full rounded-2xl border border-white/10 shadow-2xl"
        src={`https://www.youtube.com/embed/${yt[1]}`}
        title={item.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (item.videoUrl && /\.(mp4|webm|mov)(\?|$)/i.test(item.videoUrl)) {
    return (
      <video
        className="aspect-video w-full rounded-2xl border border-white/10 shadow-2xl"
        src={item.videoUrl}
        poster={item.thumbnailUrl || undefined}
        controls
        preload="metadata"
      />
    );
  }
  if (item.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className="aspect-video w-full rounded-2xl border border-white/10 object-cover shadow-2xl"
      />
    );
  }
  return <div className="grid aspect-video w-full place-items-center rounded-2xl border border-white/10 bg-panel text-sm text-slate-500">Master cut coming soon</div>;
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const item = await loadItem(slug);
  if (!item) notFound();

  const others = await db
    .select()
    .from(portfolio)
    .where(ne(portfolio.id, item.id))
    .orderBy(desc(portfolio.featured), desc(portfolio.createdAt))
    .limit(3);

  return (
    <div className="bg-aurora">
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-20 sm:px-8">
        <Reveal>
          <Link href="/work" className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300 hover:text-white">
            ← All work
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 backdrop-blur">
              {item.category}
            </span>
            {item.year && <span className="text-xs text-slate-500">{item.year}</span>}
            {item.featured && (
              <span className="rounded-full bg-brand-600/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                Featured
              </span>
            )}
          </div>
          <h1 className="font-display mt-4 text-4xl font-bold text-white sm:text-5xl">{item.title}</h1>
          {item.description && (
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">{item.description}</p>
          )}
        </Reveal>

        <Reveal delay={120} className="mt-10">
          <VideoStage item={item} />
        </Reveal>

        <Reveal delay={180}>
          <div className="glass mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-8">
            <div>
              <h2 className="font-display text-xl font-bold text-white">Want a cut like this?</h2>
              <p className="mt-1 text-sm text-slate-400">Send your brief — plan and quote back within 24 hours.</p>
            </div>
            <Link
              href="/contact"
              className="rounded-full bg-[#7357FF] px-7 py-3 text-sm font-semibold text-white shadow-[0_0_36px_-10px_rgba(115,87,255,0.9)] transition-transform hover:scale-105"
            >
              Start a project →
            </Link>
          </div>
        </Reveal>

        {others.length > 0 && (
          <Reveal delay={220}>
            <h2 className="font-display mt-16 mb-5 text-lg font-bold uppercase tracking-widest text-slate-400">
              More master cuts
            </h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {others.map((other) => (
                <Link
                  key={other.id}
                  href={portfolioPath(other.id, other.title)}
                  className="group overflow-hidden rounded-2xl border border-white/8 bg-panel transition hover:border-brand-400/40"
                >
                  <div className="relative h-36 overflow-hidden bg-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={other.thumbnailUrl}
                      alt={other.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                  <div className="p-4">
                    <p className="truncate text-sm font-semibold text-white group-hover:text-brand-300">{other.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{other.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </div>
  );
}
