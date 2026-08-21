import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VisionFold Creative",
    short_name: "VisionFold",
    description: "Premium video editing studio — client portal and studio OS.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1020",
    theme_color: "#0B1020",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
