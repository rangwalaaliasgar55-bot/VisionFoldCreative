import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ok } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const SITE_URL = "https://visionfoldcreative.vercel.app";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await ctx.params;
  const segments = path ?? [];
  const [resource, slug] = segments;

  if (resource === "posts" && slug) {
    const row = (await db.select().from(posts).where(eq(posts.slug, slug)).limit(1))[0];
    if (!row) return Response.json({ code: "rest_post_invalid_slug", message: "Invalid post slug.", data: { status: 404 } }, { status: 404 });
    const cat = row.categoryId
      ? (await db.select().from(categories).where(eq(categories.id, row.categoryId)).limit(1))[0]
      : null;
    return ok({
      id: row.id,
      date: row.publishedAt?.toISOString() || null,
      slug: row.slug,
      status: row.status === "published" ? "publish" : "draft",
      type: "post",
      title: { rendered: row.title },
      content: { rendered: row.content },
      excerpt: { rendered: row.excerpt },
      tags: row.tags.split(",").map((t) => t.trim()).filter(Boolean),
      categories: cat ? [cat.id] : [],
      jetpack_featured_media_url: row.featuredImage || "",
      link: `${SITE_URL}/blog/${row.slug}`,
    });
  }

  if (resource === "posts") {
    const rows = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(100);
    return ok(
      rows.map((row) => ({
        id: row.id,
        date: row.publishedAt?.toISOString() || null,
        slug: row.slug,
        status: "publish",
        type: "post",
        title: { rendered: row.title },
        content: { rendered: row.content },
        excerpt: { rendered: row.excerpt },
        tags: row.tags.split(",").map((t) => t.trim()).filter(Boolean),
        categories: row.categoryId ? [row.categoryId] : [],
        jetpack_featured_media_url: row.featuredImage || "",
        link: `${SITE_URL}/blog/${row.slug}`,
      }))
    );
  }

  if (resource === "categories") {
    const rows = await db.select().from(categories).orderBy(categories.name);
    return ok(
      rows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: 0,
        link: `${SITE_URL}/blog?category=${c.slug}`,
      }))
    );
  }

  const settings = await getSettings();
  return ok({
    name: settings.siteTitle,
    description: settings.siteTagline,
    url: SITE_URL,
    home: SITE_URL,
    gmt_offset: 0,
    timezone_string: "UTC",
    namespaces: ["wp/v2", "visionfold/v1"],
    routes: {
      "/wp/v2/posts": { methods: ["GET"], endpoints: [{ methods: { GET: {} } }] },
      "/wp/v2/posts/(?P<slug>[a-z0-9-]+)": { methods: ["GET"], endpoints: [{ methods: { GET: {} } }] },
      "/wp/v2/categories": { methods: ["GET"], endpoints: [{ methods: { GET: {} } }] },
    },
    plugins: [
      { name: "VisionFold SEO Pack", active: true, version: "1.4.0" },
      { name: "VisionFold Ratings Widget", active: settings.ratingsOn !== false, version: "1.1.0" },
      { name: "VisionFold Maintenance Mode", active: Boolean(settings.maintenanceOn), version: "1.0.2" },
      { name: "VisionFold Automations", active: settings.automationsOn !== false, version: "2.0.0" },
    ],
  });
}
