import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

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
      <body className={`${inter.variable} ${space.variable} min-h-screen bg-ink text-[#F6F3EC]`}>
        {children}
      </body>
    </html>
  );
}
