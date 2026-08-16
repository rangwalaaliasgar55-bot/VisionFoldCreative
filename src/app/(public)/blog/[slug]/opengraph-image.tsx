import { ImageResponse } from "next/og";
import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const alt = "VisionFold Creative — studio journal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card for a post. Same rules as the case-study card: no remote fonts,
 *  flexbox only, and a graceful fallback if the database is unreachable. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let title = "Studio journal";
  let category = "VisionFold Creative";
  try {
    const [row] = await db
      .select({ title: posts.title, categoryName: categories.name })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.slug, slug))
      .limit(1);
    if (row) {
      title = row.title;
      category = row.categoryName || "Studio journal";
    }
  } catch {
    /* generic card */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B1020",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -140,
            width: 620,
            height: 620,
            borderRadius: 620,
            background: "radial-gradient(circle, rgba(115,87,255,0.5) 0%, rgba(115,87,255,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -240,
            left: -160,
            width: 560,
            height: 560,
            borderRadius: 560,
            background: "radial-gradient(circle, rgba(244,166,42,0.3) 0%, rgba(244,166,42,0) 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #F6F3EC 0%, #F4A62A 45%, #7357FF 100%)",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 21, color: "#F6F3EC", fontWeight: 700, display: "flex" }}>
            VisionFold Creative
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              color: "#F4A62A",
              letterSpacing: 6,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontSize: title.length > 52 ? 58 : 72,
              lineHeight: 1.08,
              color: "#FFFFFF",
              fontWeight: 800,
              marginTop: 20,
              maxWidth: 960,
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 24, color: "#98A1B3", display: "flex" }}>
            Notes from the cutting room
          </div>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.14)", display: "flex" }} />
          <div style={{ fontSize: 22, color: "#A78BFA", display: "flex" }}>Article</div>
        </div>
      </div>
    ),
    size
  );
}
