import type { CitationFields } from "@/types";

/**
 * Generate a BibTeX key from citation fields
 */
function generateBibKey(fields: CitationFields): string {
  const author = fields.authors?.[0]?.lastName || "unknown";
  const year = fields.publicationDate?.year || new Date().getFullYear();
  const titleWord = fields.title?.split(" ")[0]?.toLowerCase().replace(/[^a-z]/g, "") || "untitled";
  return `${author.toLowerCase()}${year}${titleWord}`;
}

/**
 * Escape special BibTeX characters
 */
function escapeBibTeX(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/~/g, "\\~{}");
}

/**
 * Format authors for BibTeX (Last, First and Last, First and ...)
 */
function formatAuthors(authors: { firstName?: string; lastName: string }[]): string {
  return authors
    .map((a) => {
      if (a.firstName) {
        return `${a.lastName}, ${a.firstName}`;
      }
      return a.lastName;
    })
    .join(" and ");
}

/**
 * Get BibTeX entry type from source type
 */
function getBibType(sourceType: string): string {
  switch (sourceType) {
    case "book":
      return "book";
    case "journal":
      return "article";
    case "newspaper":
      return "article";
    case "website":
    case "blog":
      return "online";
    case "video":
      return "online";
    case "film":
      return "misc";
    case "tv-series":
    case "tv-episode":
      return "misc";
    case "image":
      return "misc";
    default:
      return "misc";
  }
}

/**
 * Convert citation fields to BibTeX format
 */
export function toBibTeX(fields: CitationFields): string {
  const bibKey = generateBibKey(fields);
  const bibType = getBibType(fields.sourceType);
  const lines: string[] = [];

  lines.push(`@${bibType}{${bibKey},`);

  // Author
  if (fields.authors && fields.authors.length > 0) {
    lines.push(`  author = {${formatAuthors(fields.authors)}},`);
  }

  // Title
  if (fields.title) {
    lines.push(`  title = {${escapeBibTeX(fields.title)}},`);
  }

  // Year
  if (fields.publicationDate?.year) {
    lines.push(`  year = {${fields.publicationDate.year}},`);
  }

  // Month
  if (fields.publicationDate?.month) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthStr = months[fields.publicationDate.month - 1];
    if (monthStr) {
      lines.push(`  month = ${monthStr},`);
    }
  }

  // Source-type specific fields
  switch (fields.sourceType) {
    case "book":
      if (fields.publisher) {
        lines.push(`  publisher = {${escapeBibTeX(fields.publisher)}},`);
      }
      if ("isbn" in fields && fields.isbn) {
        lines.push(`  isbn = {${fields.isbn}},`);
      }
      if ("edition" in fields && fields.edition) {
        lines.push(`  edition = {${escapeBibTeX(fields.edition)}},`);
      }
      break;

    case "journal":
      if ("journalTitle" in fields && fields.journalTitle) {
        lines.push(`  journal = {${escapeBibTeX(fields.journalTitle)}},`);
      }
      if ("volume" in fields && fields.volume) {
        lines.push(`  volume = {${fields.volume}},`);
      }
      if ("issue" in fields && fields.issue) {
        lines.push(`  number = {${fields.issue}},`);
      }
      if ("pageRange" in fields && fields.pageRange) {
        lines.push(`  pages = {${fields.pageRange}},`);
      }
      break;

    case "website":
    case "blog":
      if ("siteName" in fields && fields.siteName) {
        lines.push(`  organization = {${escapeBibTeX(fields.siteName)}},`);
      } else if ("blogName" in fields && fields.blogName) {
        lines.push(`  organization = {${escapeBibTeX(fields.blogName)}},`);
      }
      break;

    case "newspaper":
      if ("newspaperTitle" in fields && fields.newspaperTitle) {
        lines.push(`  journal = {${escapeBibTeX(fields.newspaperTitle)}},`);
      }
      break;
  }

  // URL
  if (fields.url) {
    lines.push(`  url = {${fields.url}},`);
  }

  // DOI
  if (fields.doi) {
    lines.push(`  doi = {${fields.doi}},`);
  }

  // Access date for online resources
  if (fields.accessDate && (fields.sourceType === "website" || fields.sourceType === "blog" || fields.url)) {
    const { year, month, day } = fields.accessDate;
    if (year && month && day) {
      lines.push(`  urldate = {${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}},`);
    }
  }

  // Remove trailing comma from last line
  if (lines.length > 1) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, "");
  }

  lines.push("}");

  return lines.join("\n");
}

/**
 * Convert multiple citations to BibTeX format
 */
export function toBibTeXMultiple(citationsList: CitationFields[]): string {
  return citationsList.map(toBibTeX).join("\n\n");
}
