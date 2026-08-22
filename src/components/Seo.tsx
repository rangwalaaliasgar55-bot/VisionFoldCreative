import type { ReactNode } from "react";

/**
 * Renders a JSON-LD block. Kept as a server component so structured data ships
 * in the initial HTML where crawlers actually read it.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const SITE = "https://visionfoldcreative.vercel.app";

export function organizationSchema(settings: Record<string, unknown>) {
  const socials = [settings.instagram, settings.youtube, settings.x].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE}/#organization`,
    name: String(settings.siteTitle || "VisionFold Creative"),
    description: String(
      settings.siteTagline ||
        "Premium video editing studio crafting brand films, YouTube series and commercials."
    ),
    url: SITE,
    email: settings.email ? String(settings.email) : undefined,
    telephone: settings.whatsapp ? String(settings.whatsapp) : undefined,
    areaServed: "Worldwide",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Indore",
      addressRegion: "Madhya Pradesh",
      addressCountry: "IN",
    },
    serviceType: [
      "Video editing",
      "Brand films",
      "YouTube editing",
      "Colour grading",
      "Motion graphics",
    ],
    sameAs: socials.length ? socials : undefined,
  };
}

export function websiteSchema(settings: Record<string, unknown>) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    url: SITE,
    name: String(settings.siteTitle || "VisionFold Creative"),
    publisher: { "@id": `${SITE}/#organization` },
    inLanguage: "en",
  };
}

export function articleSchema(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  author?: string | null;
}) {
  const iso = (value: Date | string | null | undefined) =>
    value ? new Date(value).toISOString() : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.featuredImage || undefined,
    datePublished: iso(post.publishedAt),
    dateModified: iso(post.updatedAt) || iso(post.publishedAt),
    author: { "@type": "Organization", name: post.author || "VisionFold Creative" },
    publisher: { "@id": `${SITE}/#organization` },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE}${crumb.path}`,
    })),
  };
}

export function SeoBlocks({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
