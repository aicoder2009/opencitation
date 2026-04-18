interface CitationLike {
  formattedHtml: string;
  formattedText: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toHTML(citations: CitationLike[], listName?: string): string {
  const title = listName || "References";
  const items = citations
    .map((c) => `    <li>${c.formattedHtml || escapeHtml(c.formattedText)}</li>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; max-width: 800px; margin: 2em auto; padding: 0 1em; line-height: 1.6; color: #202122; }
  h1 { border-bottom: 1px solid #ccc; padding-bottom: 0.3em; font-family: Arial, Helvetica, sans-serif; }
  ol { padding-left: 1.5em; }
  li { margin-bottom: 0.8em; }
  em, i { font-style: italic; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<ol>
${items}
</ol>
</body>
</html>
`;
}
