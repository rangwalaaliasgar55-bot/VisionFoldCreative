/**
 * Slugs for portfolio work.
 *
 * The portfolio table has no slug column, and the schema is created with
 * `CREATE TABLE IF NOT EXISTS` — adding one would mean a migration path this
 * project doesn't have yet. So slugs are derived: a readable title plus the id
 * as a stable suffix. That gives clean, shareable URLs with an unambiguous
 * lookup key, and titles can be edited later without breaking old links
 * (the canonical URL just redirects).
 */

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function workSlug(item: { id: number; title: string }): string {
  const base = slugify(item.title);
  return base ? `${base}-${item.id}` : String(item.id);
}

/** Pull the id back out of a slug. Returns null when there isn't one. */
export function parseWorkSlug(slug: string): number | null {
  const match = /(?:^|-)(\d+)$/.exec(slug.trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function workPath(item: { id: number; title: string }): string {
  return `/work/${workSlug(item)}`;
}
