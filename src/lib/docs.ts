import { readFileSync } from "fs";
import { join } from "path";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export async function getDocContent(slug: string): Promise<string> {
  const filePath = join(process.cwd(), "docs/content", `${slug}.md`);
  const markdown = readFileSync(filePath, "utf-8");
  const html = await marked(markdown);
  // XSS Prevention: ensure all markdown parsing is uniformly sanitized
  return DOMPurify.sanitize(html);
}
