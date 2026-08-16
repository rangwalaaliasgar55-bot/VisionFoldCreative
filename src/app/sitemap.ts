import type { MetadataRoute } from "next";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSetting } from "@/lib/settings";
import type { CmsStore } from "@/lib/cmsTypes";

export const dynamic = "force-dynamic";

const SITE = "https://visionfoldcreative.vercel.app";

/**
 * Sitemap covering the static routes plus everything publishable from the CMS:
 * published posts and published custom pages. Admin and portal are excluded —
 * they are noindex by definition.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/work`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/policies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt, publishedAt: posts.publishedAt })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(500);
    postRoutes = rows.map((row) => ({
      url: `${SITE}/blog/${row.slug}`,
      lastModified: row.updatedAt ?? row.publishedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    /* database unavailable — still serve the static map */
  }

  let pageRoutes: MetadataRoute.Sitemap = [];
  try {
    const store = (await getSetting("cmsStore")) as CmsStore | null;
    pageRoutes = (store?.pages ?? [])
      .filter((page) => page.status === "published" && page.slug)
      .map((page) => ({
        url: `${SITE}/p/${page.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
  } catch {
    /* ignore */
  }

  return [...staticRoutes, ...postRoutes, ...pageRoutes];
}
