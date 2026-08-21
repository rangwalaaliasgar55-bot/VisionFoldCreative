import type { MetadataRoute } from "next";
import { db } from "@/db";
import { portfolio, posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { CmsStore } from "@/lib/cmsTypes";
import { portfolioPath } from "@/lib/portfolio";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

function baseUrl(): string {
  return (process.env.APP_URL || "https://visionfoldcreative.vercel.app").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/work",
    "/services",
    "/blog",
    "/contact",
    "/policies",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const published = await db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt })
      .from(posts)
      .where(eq(posts.status, "published"));
    const blogRoutes: MetadataRoute.Sitemap = published.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    const store = (await getSetting("cmsStore")) as CmsStore | null;
    const cmsRoutes: MetadataRoute.Sitemap = (store?.pages ?? [])
      .filter((page) => page.status === "published")
      .map((page) => ({
        url: `${base}/p/${page.slug}`,
        lastModified: new Date(page.updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      }));

    const work = await db
      .select({ id: portfolio.id, title: portfolio.title, createdAt: portfolio.createdAt })
      .from(portfolio);
    const workRoutes: MetadataRoute.Sitemap = work.map((item) => ({
      url: `${base}${portfolioPath(item.id, item.title)}`,
      lastModified: item.createdAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...blogRoutes, ...cmsRoutes, ...workRoutes];
  } catch {
    return staticRoutes;
  }
}
