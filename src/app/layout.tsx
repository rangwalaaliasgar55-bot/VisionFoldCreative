import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://visionfoldcreative.vercel.app"),
  title: {
    default: "VisionFold Creative — Premium Video Editing Studio",
    template: "%s · VisionFold Creative",
  },
  description:
    "Premium video editing studio crafting brand films, YouTube series, commercials and cinematic stories. Client portal, transparent pricing, fast turnarounds.",
  openGraph: {
    title: "VisionFold Creative — Premium Video Editing Studio",
    description:
      "We fold stories into motion. Brand films, YouTube series and commercials edited to keep people watching.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ink text-[#F6F3EC] antialiased selection:bg-[#F4A62A]/40 selection:text-black">
        {children}
      </body>
    </html>
  );
}
