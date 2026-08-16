import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Thumbnails come from the CMS and can point at any https host, so the
    // allowlist is broad on purpose; the optimizer still re-encodes everything.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  poweredByHeader: false,
};

export default nextConfig;
