import type { MetadataRoute } from "next";

const SITE = "https://visionfoldcreative.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Never index the workspace, the client portal, or the API surface.
        disallow: ["/admin", "/admin/", "/portal", "/portal/", "/api/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
