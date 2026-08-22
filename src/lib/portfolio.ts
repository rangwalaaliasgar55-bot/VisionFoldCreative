import { slugify, workSlug } from "@/lib/slug";

/**
 * Portfolio case-study URLs: /work/<title-slug>-<id>
 * (title-first for readable, SEO-friendly URLs; trailing id = stable lookup key).
 * Single source of truth — used by the grid, case-study page, OG images and sitemap.
 */
export function portfolioPath(id: number, title: string): string {
  void slugify;
  return `/work/${workSlug({ id, title })}`;
}
