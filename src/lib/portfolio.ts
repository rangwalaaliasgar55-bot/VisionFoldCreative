import { slugify } from "@/lib/utils";

/**
 * Portfolio case-study URLs: /work/<id>-<title-slug>
 * The id prefix is the lookup key; the slug suffix is human/SEO-friendly.
 * No DB column needed — deterministic from existing data.
 */
export function portfolioPath(id: number, title: string): string {
  return `/work/${id}-${slugify(title || "film")}`;
}
