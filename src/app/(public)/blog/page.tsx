import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { Reveal } from "@/components/Fx";
import { NewsletterForm } from "@/components/Forms";
import { getSettings } from "@/lib/settings";
import { fmtDate } from "@/lib/utils";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog & Editing Insights",
  description: "Editing tips, pricing guides and studio notes from VisionFold Creative.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await ensureSeed();
  const params = await searchParams;
  const settings = await getSettings();
  const [allPosts, cats] = await Promise.all([
    db
      .select({ ...getTableColumns(posts), categoryName: categories.name, categorySlug: categories.slug })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt)),
    db.select().from(categories).orderBy(categories.name),
  ]);

  const activeCat = params.category;
  const filtered = activeCat ? allPosts.filter((p) => p.categorySlug === activeCat) : allPosts;

  return (
    <div className="bg-aurora">
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-20 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">The studio journal</p>
            <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-6xl">
              Editing intelligence, <span className="text-gradient">no fluff</span>
            </h1>
            <p className="mt-4 text-slate-400">
              Real pricing, real workflows and the techniques we use on paid projects.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            {filtered.length === 0 && (
              <div className="glass rounded-3xl p-10 text-center text-slate-400">
                No posts in this category yet — check back soon.
              </div>
            )}
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="glass card-glow group grid overflow-hidden rounded-3xl sm:grid-cols-[280px_1fr]"
                >
                  <div className="relative h-48 overflow-hidden sm:h-full">
                    <Image
                      src={p.featuredImage}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full bg-brand-600/15 px-2.5 py-0.5 font-semibold uppercase tracking-widest text-brand-300">
                        {p.categoryName || "Studio"}
                      </span>
                      <span className="text-slate-500">{fmtDate(p.publishedAt)}</span>
                      <span className="text-slate-600">· {p.views.toLocaleString()} reads</span>
                    </div>
                    <h2 className="font-display mt-3 text-xl font-semibold leading-snug text-white transition-colors group-hover:text-brand-300 sm:text-2xl">
                      {p.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.excerpt}</p>
                    <p className="mt-4 text-sm font-semibold text-cyan-300 transition-transform group-hover:translate-x-1">
                      Read article →
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="glass rounded-3xl p-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-400">
                Categories
              </h3>
              <ul className="mt-4 space-y-1.5 text-sm">
                <li>
                  <Link
                    href="/blog"
                    className={`block rounded-xl px-3 py-2 transition-colors ${
                      !activeCat ? "bg-brand-600/20 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    All posts
                  </Link>
                </li>
                {cats.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/blog?category=${c.slug}`}
                      className={`block rounded-xl px-3 py-2 transition-colors ${
                        activeCat === c.slug ? "bg-brand-600/20 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {settings.newsletterOn !== false && (
              <div className="glass-bright rounded-3xl p-5">
                <h3 className="font-display text-sm font-semibold text-white">Monthly cut-list</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Editing tips, new work and pricing insights. One email a month, unsubscribe anytime.
                </p>
                <NewsletterForm />
              </div>
            )}

            <div className="glass rounded-3xl p-5 text-sm text-slate-400">
              <h3 className="font-display text-sm font-semibold text-white">Work with us</h3>
              <p className="mt-2 text-xs leading-relaxed">
                We turn these techniques into films for real brands. Send your footage and get a plan
                in 24 hours.
              </p>
              <Link
                href="/contact"
                className="mt-4 block rounded-xl bg-[#7357FF] hover:bg-[#6346E8] py-2.5 text-center text-sm font-semibold text-white"
              >
                Start a project
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
