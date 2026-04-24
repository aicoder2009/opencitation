interface CitationLike {
  formattedText: string;
  formattedHtml: string;
}

function escapeRtf(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/[-￿]/g, (ch) => {
      const code = ch.charCodeAt(0);
      const signed = code > 32767 ? code - 65536 : code;
      return `\\u${signed}?`;
    });
}

function htmlToRtf(html: string): string {
  let out = html
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, "\x01$2\x02")
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "\x03$2\x04")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  out = escapeRtf(out);

  return out
    .replace(/\x01/g, "{\\i ")
    .replace(/\x02/g, "}")
    .replace(/\x03/g, "{\\b ")
    .replace(/\x04/g, "}");
}

// Hanging indent: \li720\fi-720 = 0.5" left indent with first line pulled back
// to the margin (720 twips = 0.5 inch). Matches APA / MLA / Chicago conventions.
export function toRTF(citations: CitationLike[], listName?: string): string {
  const header =
    "{\\rtf1\\ansi\\ansicpg1252\\deff0" +
    "{\\fonttbl{\\f0\\froman Times New Roman;}}" +
    "\\fs24\n";

  const parts: string[] = [header];

  if (listName) {
    parts.push(`{\\pard\\qc\\b\\fs28 ${escapeRtf(listName)}\\par}\n`);
    parts.push("{\\pard\\par}\n");
  }

  for (const c of citations) {
    const body = htmlToRtf(c.formattedHtml || c.formattedText);
    parts.push(`{\\pard\\li720\\fi-720\\sa120 ${body}\\par}\n`);
  }

  parts.push("}");
  return parts.join("");
}
