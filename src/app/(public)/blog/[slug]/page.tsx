import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import { Reveal } from "@/components/Fx";
import { fmtDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { ensureSeed } from "@/lib/seed";
import { JsonLd } from "@/components/Seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await ensureSeed();
  const { slug } = await params;
  const row = (await db.select().from(posts).where(eq(posts.slug, slug)).limit(1))[0];
  if (!row) return { title: "Post not found" };
  return {
    title: row.seoTitle || row.title,
    description: row.seoDescription || row.excerpt,
    openGraph: { title: row.seoTitle || row.title, description: row.seoDescription || row.excerpt },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeed();
  const { slug } = await params;
  const row = (await db.select().from(posts).where(eq(posts.slug, slug)).limit(1))[0];
  if (!row || row.status !== "published") notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: row.title,
    description: row.seoDescription || row.excerpt,
    datePublished: row.publishedAt ? new Date(row.publishedAt).toISOString() : undefined,
    author: { "@type": "Organization", name: "VisionFold Creative" },
  };

  await db.update(posts).set({ views: sql`${posts.views} + 1` }).where(eq(posts.id, row.id));

  const [cat, related] = await Promise.all([
    row.categoryId
      ? (await db.select().from(categories).where(eq(categories.id, row.categoryId)).limit(1))[0]
      : null,
    db
      .select({ ...getTableColumns(posts), categoryName: categories.name })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(sql`${posts.status} = 'published' and ${posts.id} <> ${row.id}`)
      .orderBy(desc(posts.publishedAt))
      .limit(3),
  ]);

  const paragraphs = row.content.split(/\n\n+/).filter(Boolean);
  const tags = row.tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="bg-aurora">
      <JsonLd data={jsonLd} />
      <article className="mx-auto max-w-3xl px-5 pb-20 pt-20 sm:px-8">
        <Reveal>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} /> All articles
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px]">
            {cat && (
              <Link
                href={`/blog?category=${cat.slug}`}
                className="rounded-full bg-brand-600/15 px-3 py-1 font-semibold uppercase tracking-widest text-brand-300"
              >
                {cat.name}
              </Link>
            )}
            <span className="text-slate-500">{fmtDate(row.publishedAt)}</span>
            <span className="text-slate-600">· {row.views.toLocaleString()} reads</span>
          </div>

          <h1 className="font-display mt-4 text-3xl font-bold leading-tight text-white sm:text-5xl">
            {row.title}
          </h1>

          {row.featuredImage && (
            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
              <img src={row.featuredImage} alt={row.title} className="w-full object-cover" />
            </div>
          )}

          <div className="prose-vf mt-8 text-[15px]">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-white/8 pt-6">
              {tags.map((t) => (
                <span key={t} className="glass rounded-full px-3 py-1 text-xs text-slate-400">
                  #{t.replace(/\s+/g, "")}
                </span>
              ))}
            </div>
          )}

          <div className="glass mt-12 rounded-3xl p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-white">
              Need this done <span className="text-gradient">for real?</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              We apply these techniques on paid projects every week.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-block rounded-full bg-[#7357FF] hover:bg-[#6346E8] px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              Start a project
            </Link>
          </div>
        </Reveal>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          <h2 className="font-display text-2xl font-bold text-white">Keep reading</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {related.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="glass card-glow group rounded-3xl p-5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
                  {p.categoryName || "Studio"}
                </span>
                <h3 className="font-display mt-2 font-semibold leading-snug text-white transition-colors group-hover:text-brand-300">
                  {p.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
