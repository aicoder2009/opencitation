// Separator between the friendly slug and the unique code in a share URL.
// Two dashes avoid colliding with hyphens that naturally appear in slugs.
const SLUG_SEP = "--";

const MAX_SLUG_LENGTH = 60;

// Produce a URL-safe slug from arbitrary text. Lowercase, ASCII, hyphenated.
// Strips diacritics, collapses runs of non-alphanumerics, trims edge dashes.
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

// Split a share URL path segment into (slug, code). If no slug separator is
// found, the whole segment is the code (backwards-compatible).
export function parseShareSegment(segment: string): {
  slug: string | null;
  code: string;
} {
  const idx = segment.lastIndexOf(SLUG_SEP);
  if (idx === -1) return { slug: null, code: segment };
  return {
    slug: segment.slice(0, idx),
    code: segment.slice(idx + SLUG_SEP.length),
  };
}

// Build a share URL path segment from a code and optional slug.
export function buildShareSegment(
  code: string,
  slug?: string | null,
): string {
  return slug ? `${slug}${SLUG_SEP}${code}` : code;
}
