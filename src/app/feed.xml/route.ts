import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 feed of the latest published blog posts. */
export async function GET() {
  const base = (process.env.APP_URL || "https://visionfoldcreative.vercel.app").replace(/\/$/, "");
  let items: Array<{ title: string; slug: string; excerpt: string; publishedAt: Date | null }> = [];
  try {
    items = await db
      .select({
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(20);
  } catch {
    /* empty feed on DB hiccup */
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>VisionFold Creative — Blog</title>
<link>${base}</link>
<description>Editing craft, retention strategy and studio notes from VisionFold Creative.</description>
<language>en</language>
${items
  .map(
    (item) => `<item>
<title>${escapeXml(item.title)}</title>
<link>${base}/blog/${escapeXml(item.slug)}</link>
<guid>${base}/blog/${escapeXml(item.slug)}</guid>
<description>${escapeXml(item.excerpt)}</description>
<pubDate>${item.publishedAt ? new Date(item.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
</item>`
  )
  .join("\n")}
</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
