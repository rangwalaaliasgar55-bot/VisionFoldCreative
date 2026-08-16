/**
 * Cached content queries.
 *
 * Public pages render dynamically because the layout reads a session cookie for
 * maintenance mode — so the win available here isn't static HTML, it's not
 * hitting Postgres for the same rows on every single visit.
 *
 * These wrap the hot read paths in `unstable_cache` with tags, and the admin
 * write paths call `revalidateTag`, so an edit is live immediately rather than
 * after a TTL. (Site settings already have their own in-process TTL cache in
 * lib/settings.ts.)
 */

import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { categories, portfolio, posts } from "@/db/schema";
import { desc, eq, getTableColumns } from "drizzle-orm";

export const CACHE_TAGS = {
  portfolio: "portfolio",
  posts: "posts",
} as const;

/** Long TTL is safe: writes invalidate by tag, the TTL is just a backstop. */
const ONE_HOUR = 3600;

export const getPortfolioItems = unstable_cache(
  async () =>
    db.select().from(portfolio).orderBy(desc(portfolio.featured), desc(portfolio.createdAt)),
  ["portfolio-all"],
  { tags: [CACHE_TAGS.portfolio], revalidate: ONE_HOUR }
);

export const getFeaturedWork = unstable_cache(
  async (limit: number) =>
    db
      .select()
      .from(portfolio)
      .orderBy(desc(portfolio.featured), desc(portfolio.createdAt))
      .limit(limit),
  ["portfolio-featured"],
  { tags: [CACHE_TAGS.portfolio], revalidate: ONE_HOUR }
);

export const getWorkById = unstable_cache(
  async (id: number) => {
    const [row] = await db.select().from(portfolio).where(eq(portfolio.id, id)).limit(1);
    return row ?? null;
  },
  ["portfolio-by-id"],
  { tags: [CACHE_TAGS.portfolio], revalidate: ONE_HOUR }
);

export const getRelatedWork = unstable_cache(
  async (excludeId: number, limit: number) => {
    const rows = await db
      .select()
      .from(portfolio)
      .orderBy(desc(portfolio.featured), desc(portfolio.createdAt))
      .limit(limit + 1);
    return rows.filter((row) => row.id !== excludeId).slice(0, limit);
  },
  ["portfolio-related"],
  { tags: [CACHE_TAGS.portfolio], revalidate: ONE_HOUR }
);

export const getPublishedPosts = unstable_cache(
  async (limit: number) =>
    db
      .select({ ...getTableColumns(posts), categoryName: categories.name })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit),
  ["posts-published"],
  { tags: [CACHE_TAGS.posts], revalidate: ONE_HOUR }
);
