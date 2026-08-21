import { db } from "@/db";
import { portfolio, posts } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { bad, loginThrottled, ok, requestIp } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SERVICES = [
  { title: "Brand Films & Commercials", href: "/services", keywords: "brand film commercial ad story based" },
  { title: "YouTube Editing & Retention", href: "/services", keywords: "youtube editor retention series thumbnails" },
  { title: "Music Video Post-Production", href: "/services", keywords: "music video 4k color grade vfx" },
  { title: "Wedding Cinema", href: "/services", keywords: "wedding film cinematic highlights" },
  { title: "Podcasts & Clips", href: "/services", keywords: "podcast shorts reels clips repurpose" },
];

/** Public site search across blog posts, portfolio and services. */
export async function GET(req: Request) {
  if (loginThrottled(`search:${requestIp(req)}`)) {
    return bad("Too many searches. Slow down a little.", 429);
  }
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 2) return ok({ query: q, posts: [], work: [], services: [] });
  const like = `%${q.replace(/[%_]/g, "")}%`;

  try {
    const postHits = await db
      .select({ slug: posts.slug, title: posts.title, excerpt: posts.excerpt })
      .from(posts)
      .where(
        and(
          eq(posts.status, "published"),
          or(
            sql`${posts.title} ILIKE ${like}`,
            sql`${posts.excerpt} ILIKE ${like}`,
            sql`${posts.tags} ILIKE ${like}`
          )
        )
      )
      .limit(6);

    const workHits = await db
      .select({
        id: portfolio.id,
        title: portfolio.title,
        category: portfolio.category,
        thumbnailUrl: portfolio.thumbnailUrl,
      })
      .from(portfolio)
      .where(or(sql`${portfolio.title} ILIKE ${like}`, sql`${portfolio.description} ILIKE ${like}`, sql`${portfolio.category} ILIKE ${like}`))
      .limit(6);

    const needle = q.toLowerCase();
    const serviceHits = SERVICES.filter(
      (s) => s.title.toLowerCase().includes(needle) || s.keywords.includes(needle)
    ).map(({ title, href }) => ({ title, href }));

    return ok({ query: q, posts: postHits, work: workHits, services: serviceHits });
  } catch {
    return ok({ query: q, posts: [], work: [], services: [] });
  }
}
