import { readFileSync } from "fs";
import { join } from "path";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export async function getDocContent(slug: string): Promise<string> {
  const filePath = join(process.cwd(), "docs/content", `${slug}.md`);
  const markdown = readFileSync(filePath, "utf-8");
  // Sanitize the HTML output from marked to prevent XSS vulnerabilities
  return DOMPurify.sanitize(await marked(markdown));
}
