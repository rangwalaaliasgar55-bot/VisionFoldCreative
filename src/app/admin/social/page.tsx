import { db } from "@/db";
import { portfolio } from "@/db/schema";
import { desc } from "drizzle-orm";
import SocialStudio from "@/components/Admin/SocialStudio";

export const dynamic = "force-dynamic";

const SITE = "https://visionfoldcreative.vercel.app";

export default async function SocialPage() {
  let items: { id: number; title: string; category: string; description: string }[] = [];
  try {
    items = await db
      .select({
        id: portfolio.id,
        title: portfolio.title,
        category: portfolio.category,
        description: portfolio.description,
      })
      .from(portfolio)
      .orderBy(desc(portfolio.createdAt))
      .limit(30);
  } catch {
    /* studio still works with no published work */
  }

  // Booleans only — credentials themselves never reach the client.
  const publishing = {
    youtube: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
    instagram: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-bold text-white">Social studio</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
          Describe the video once. Everything below — titles, description, chapters, tags, caption
          and hashtags — is generated in your browser against each platform&rsquo;s real limits. No
          API key, no request, works offline.
        </p>
      </header>

      <SocialStudio
        portfolio={items}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL || SITE}
        publishing={publishing}
      />
    </div>
  );
}
