import { readFileSync } from "fs";
import { join } from "path";
import { marked } from "marked";

export async function getDocContent(slug: string): Promise<string> {
  const filePath = join(process.cwd(), "docs/content", `${slug}.md`);
  const markdown = readFileSync(filePath, "utf-8");
  return await marked(markdown);
}
