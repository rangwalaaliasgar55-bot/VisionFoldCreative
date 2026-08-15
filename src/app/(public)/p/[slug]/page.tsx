import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { CmsStore } from "@/lib/cmsTypes";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function findPage(slug: string) {
  const store = (await getSetting("cmsStore")) as CmsStore | null;
  if (!store?.pages || !Array.isArray(store.pages)) return null;
  return store.pages.find((page) => page.slug === slug && page.status === "published") || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await findPage((await params).slug);
  if (!page) return {};
  return {
    title: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription || undefined,
    alternates: page.seo?.canonical ? { canonical: page.seo.canonical } : undefined,
    openGraph: {
      title: page.seo?.metaTitle || page.title,
      description: page.seo?.metaDescription || undefined,
      images: page.seo?.ogImage ? [page.seo.ogImage] : undefined,
    },
  };
}

export default async function CmsPublicPage({ params }: Props) {
  const page = await findPage((await params).slug);
  if (!page) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden pb-24 pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_50%_0%,rgba(115,87,255,.16),transparent_65%)]" />
      <article className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <BlockRenderer blocks={page.blocks} />
      </article>
    </main>
  );
}
