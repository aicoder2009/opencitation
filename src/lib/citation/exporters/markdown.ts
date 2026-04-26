interface CitationLike {
  formattedText: string;
  formattedHtml: string;
}

const RE_EM     = /<em>([\s\S]*?)<\/em>/gi;
const RE_I      = /<i>([\s\S]*?)<\/i>/gi;
const RE_STRONG = /<strong>([\s\S]*?)<\/strong>/gi;
const RE_B      = /<b>([\s\S]*?)<\/b>/gi;
const RE_BR     = /<br\s*\/?>/gi;
const RE_TAGS   = /<[^>]+>/g;
const RE_AMP    = /&amp;/g;
const RE_LT     = /&lt;/g;
const RE_GT     = /&gt;/g;
const RE_QUOT   = /&quot;/g;
const RE_APOS   = /&#39;/g;
const RE_NBSP   = /&nbsp;/g;

function htmlToMarkdown(html: string): string {
  return html
    .replace(RE_EM,     "*$1*")
    .replace(RE_I,      "*$1*")
    .replace(RE_STRONG, "**$1**")
    .replace(RE_B,      "**$1**")
    .replace(RE_BR,     "\n")
    .replace(RE_TAGS,   "")
    .replace(RE_AMP,    "&")
    .replace(RE_LT,     "<")
    .replace(RE_GT,     ">")
    .replace(RE_QUOT,   '"')
    .replace(RE_APOS,   "'")
    .replace(RE_NBSP,   " ")
    .trim();
}

export function toMarkdown(citations: CitationLike[], listName?: string): string {
  const title = listName ? `# ${listName} — References` : "# References";
  const lines = [title, ""];
  citations.forEach((c, i) => {
    lines.push(`${i + 1}. ${htmlToMarkdown(c.formattedHtml || c.formattedText)}`);
  });
  return `${lines.join("\n")}\n`;
}
