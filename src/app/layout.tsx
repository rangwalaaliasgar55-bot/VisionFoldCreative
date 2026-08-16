import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import MotionProvider from "@/components/MotionProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://visionfoldcreative.vercel.app"),
  title: {
    default: "VisionFold Creative — Premium Video Editing Studio",
    template: "%s · VisionFold Creative",
  },
  description:
    "Premium video editing studio crafting brand films, YouTube series, commercials and cinematic stories. Client portal, transparent pricing, fast turnarounds.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "VisionFold Creative — Premium Video Editing Studio",
    description:
      "We fold stories into motion. Brand films, YouTube series and commercials edited to keep people watching.",
    type: "website",
    siteName: "VisionFold Creative",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VisionFold Creative — Premium Video Editing Studio",
    description: "We fold stories into motion.",
  },
  robots: { index: true, follow: true },
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
        {/* No JS? Reveals must never hide content. */}
        <noscript>
          <style>{`.vf-reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen bg-ink text-[#F6F3EC] antialiased selection:bg-[#7357FF]/40 selection:text-white">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
