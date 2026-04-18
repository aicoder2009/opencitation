interface CitationLike {
  formattedText: string;
  formattedHtml: string;
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<em>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i>([\s\S]*?)<\/i>/gi, "*$1*")
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
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
