import DOMPurify from "isomorphic-dompurify";

const ALLOWED_CITATION_TAGS = [
  "em",
  "i",
  "strong",
  "b",
  "u",
  "sup",
  "sub",
  "span",
  "a",
];

const ALLOWED_CITATION_ATTR = ["href", "target", "rel", "class"];

/**
 * Sanitize inline citation HTML so only safe typographic markup and links
 * survive storage, clipboard copy, or standalone HTML export.
 */
export function sanitizeCitationHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_CITATION_TAGS,
    ALLOWED_ATTR: ALLOWED_CITATION_ATTR,
  });
}
