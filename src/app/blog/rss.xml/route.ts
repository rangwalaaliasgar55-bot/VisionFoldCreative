import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SITE = "https://visionfoldcreative.vercel.app";

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** RSS for the studio journal — readers, newsletters and aggregators. */
export async function GET() {
  let rows: { title: string; slug: string; excerpt: string | null; publishedAt: Date | null }[] = [];
  try {
    rows = await db
      .select({
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(50);
  } catch {
    /* database unavailable — still emit a valid, empty feed */
  }

  const items = rows
    .map(
      (row) => `    <item>
      <title>${escape(row.title)}</title>
      <link>${SITE}/blog/${row.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${row.slug}</guid>
      ${row.excerpt ? `<description>${escape(row.excerpt)}</description>` : ""}
      ${row.publishedAt ? `<pubDate>${new Date(row.publishedAt).toUTCString()}</pubDate>` : ""}
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VisionFold Creative — Studio Journal</title>
    <link>${SITE}/blog</link>
    <description>Editing tips, workflow notes and insider posts from the VisionFold cutting room.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
