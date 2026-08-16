import { ImageResponse } from "next/og";
import { db } from "@/db";
import { portfolio } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseWorkSlug } from "@/lib/slug";

export const alt = "VisionFold Creative case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card for a case study.
 *
 * Rendered on demand rather than designed by hand, so every project gets a
 * branded card the moment it's published. Uses only the layout subset satori
 * supports (flexbox, no grid) and no remote fonts, so it can't fail on a
 * network hiccup.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = parseWorkSlug(slug);

  let title = "Selected work";
  let category = "VisionFold Creative";
  if (id) {
    try {
      const [row] = await db.select().from(portfolio).where(eq(portfolio.id, id)).limit(1);
      if (row) {
        title = row.title;
        category = row.category;
      }
    } catch {
      /* fall back to the generic card */
    }
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
        {/* violet key light */}
        <div
          style={{
            position: "absolute",
            top: -180,
            left: -120,
            width: 620,
            height: 620,
            borderRadius: 620,
            background: "radial-gradient(circle, rgba(115,87,255,0.55) 0%, rgba(115,87,255,0) 70%)",
            display: "flex",
          }}
        />
        {/* amber bounce */}
        <div
          style={{
            position: "absolute",
            bottom: -220,
            right: -140,
            width: 560,
            height: 560,
            borderRadius: 560,
            background: "radial-gradient(circle, rgba(244,166,42,0.38) 0%, rgba(244,166,42,0) 70%)",
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
          <div
            style={{
              fontSize: 21,
              color: "#F6F3EC",
              letterSpacing: 1,
              fontWeight: 700,
              display: "flex",
            }}
          >
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
              fontSize: title.length > 46 ? 62 : 78,
              lineHeight: 1.06,
              color: "#FFFFFF",
              fontWeight: 800,
              marginTop: 20,
              maxWidth: 940,
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 24, color: "#98A1B3", display: "flex" }}>
            We fold stories into motion
          </div>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.14)", display: "flex" }} />
          <div style={{ fontSize: 22, color: "#A78BFA", display: "flex" }}>Case study</div>
        </div>
      </div>
    ),
    size
  );
}
