import type { Author, CitationFields, SourceType } from "@/types";

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9, sept: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function bibtexTypeToSourceType(
  bibType: string,
  fields: Record<string, string>
): SourceType {
  switch (bibType.toLowerCase()) {
    case "article":
      return "journal";
    case "book":
      return "book";
    case "inbook":
    case "incollection":
      return "book-chapter";
    case "inproceedings":
    case "conference":
    case "proceedings":
      return "conference-paper";
    case "phdthesis":
    case "mastersthesis":
    case "thesis":
      return "thesis";
    case "techreport":
      return "government-report";
    case "online":
    case "electronic":
    case "webpage":
    case "misc":
      return fields.url ? "website" : "miscellaneous";
    case "unpublished":
      return fields.eprint || fields.archiveprefix ? "preprint" : "miscellaneous";
    case "software":
      return "software";
    case "dataset":
      return "dataset";
    default:
      return "miscellaneous";
  }
}

/**
 * Strip BibTeX brace groups and unescape special characters, preserving inner text.
 * e.g. `{DIF}rau{D}` → `DIFrauD`, `\&` → `&`.
 */
function cleanBibTeXString(value: string): string {
  return value
    .replace(/\\([&%$#_{}~])/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse a BibTeX person name. Supports "Last, First Middle" and "First Middle Last" forms.
 */
function parseBibTeXName(raw: string): Author | null {
  const name = cleanBibTeXString(raw);
  if (!name) return null;

  if (name.includes(",")) {
    const [last, rest = ""] = name.split(",").map((s) => s.trim());
    if (!last) return null;
    const parts = rest.split(/\s+/).filter(Boolean);
    const [firstName, ...middleParts] = parts;
    return {
      lastName: last,
      firstName: firstName || undefined,
      middleName: middleParts.length > 0 ? middleParts.join(" ") : undefined,
    };
  }

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { lastName: parts[0] };
  }
  const lastName = parts[parts.length - 1];
  const firstName = parts[0];
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : undefined;
  return { lastName, firstName, middleName };
}

/**
 * Split a BibTeX author list on " and " (case-insensitive), ignoring "and" inside braces.
 */
function splitAuthors(raw: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let current = "";

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === "{") depth++;
    else if (c === "}") depth = Math.max(0, depth - 1);

    if (depth === 0 && /\s/.test(c)) {
      // Check for whitespace-" and "-whitespace delimiter.
      const rest = raw.slice(i);
      const match = rest.match(/^\s+and\s+/i);
      if (match) {
        results.push(current);
        current = "";
        i += match[0].length - 1; // -1 because for-loop will ++
        continue;
      }
    }
    current += c;
  }
  if (current.trim()) results.push(current);
  return results.map((s) => s.trim()).filter(Boolean);
}

function parseAuthors(raw: string): Author[] {
  return splitAuthors(raw)
    .map((name) => parseBibTeXName(name))
    .filter((a): a is Author => a !== null);
}

/**
 * Parse the fields body of a BibTeX entry into a key→raw-value map.
 * Values can be {...}-wrapped, "..."-wrapped, or bare (e.g. months, numbers).
 */
function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;

  const skipWhitespace = () => {
    while (i < body.length && /\s/.test(body[i])) i++;
  };

  const readKey = (): string => {
    let key = "";
    while (i < body.length && /[A-Za-z_-]/.test(body[i])) {
      key += body[i];
      i++;
    }
    return key.toLowerCase();
  };

  const readBraceValue = (): string => {
    i++; // consume opening {
    let depth = 1;
    let value = "";
    while (i < body.length && depth > 0) {
      const c = body[i];
      if (c === "\\" && i + 1 < body.length) {
        value += c + body[i + 1];
        i += 2;
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          i++;
          return value;
        }
      }
      value += c;
      i++;
    }
    return value;
  };

  const readQuoteValue = (): string => {
    i++; // consume opening "
    let depth = 0;
    let value = "";
    while (i < body.length) {
      const c = body[i];
      if (c === "\\" && i + 1 < body.length) {
        value += c + body[i + 1];
        i += 2;
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") depth = Math.max(0, depth - 1);
      else if (c === '"' && depth === 0) {
        i++;
        return value;
      }
      value += c;
      i++;
    }
    return value;
  };

  const readBareValue = (): string => {
    let value = "";
    while (i < body.length && body[i] !== "," && body[i] !== "\n") {
      value += body[i];
      i++;
    }
    return value.trim();
  };

  while (i < body.length) {
    skipWhitespace();
    const key = readKey();
    if (!key) break;
    skipWhitespace();
    if (body[i] !== "=") break;
    i++; // consume =
    skipWhitespace();

    let value = "";
    if (body[i] === "{") {
      value = readBraceValue();
    } else if (body[i] === '"') {
      value = readQuoteValue();
    } else {
      value = readBareValue();
    }

    fields[key] = value;

    skipWhitespace();
    if (body[i] === ",") i++;
  }

  return fields;
}

function parseYear(raw: string): number | undefined {
  const match = raw.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : undefined;
}

function parseMonth(raw: string): number | undefined {
  const cleaned = cleanBibTeXString(raw).toLowerCase();
  if (!cleaned) return undefined;
  if (/^\d+$/.test(cleaned)) {
    const n = parseInt(cleaned, 10);
    return n >= 1 && n <= 12 ? n : undefined;
  }
  const abbrev = cleaned.slice(0, 3);
  return MONTH_NAMES[abbrev] ?? MONTH_NAMES[cleaned];
}

function normalizePages(raw: string): string | undefined {
  const cleaned = cleanBibTeXString(raw);
  if (!cleaned) return undefined;
  return cleaned.replace(/--+/g, "-").replace(/\s*-\s*/g, "-");
}

export interface BibTeXParseResult {
  fields: CitationFields;
  entryType: string;
  entryKey: string;
}

/**
 * Parse a BibTeX entry string into CitationFields.
 * Returns null if the input is not a valid BibTeX entry.
 */
export function parseBibTeX(input: string): BibTeXParseResult | null {
  const trimmed = input.trim();
  const headerMatch = trimmed.match(/^@(\w+)\s*\{\s*([^,]*),/);
  if (!headerMatch) return null;

  const entryType = headerMatch[1];
  const entryKey = headerMatch[2].trim();
  const headerEnd = headerMatch[0].length;

  // Find the matching closing brace for the entry.
  let depth = 1;
  let bodyEnd = -1;
  for (let i = headerEnd; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (c === "\\" && i + 1 < trimmed.length) {
      i++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        bodyEnd = i;
        break;
      }
    }
  }
  if (bodyEnd === -1) return null;

  const body = trimmed.slice(headerEnd, bodyEnd);
  const raw = parseFields(body);

  const sourceType = bibtexTypeToSourceType(entryType, raw);

  const authors = raw.author ? parseAuthors(raw.author) : undefined;
  const editors = raw.editor ? parseAuthors(raw.editor) : undefined;

  const year = raw.year ? parseYear(raw.year) : undefined;
  const month = raw.month ? parseMonth(raw.month) : undefined;
  const day = raw.day ? parseInt(cleanBibTeXString(raw.day), 10) || undefined : undefined;

  const publicationDate = year || month || day ? { year, month, day } : undefined;

  const title = raw.title ? cleanBibTeXString(raw.title) : "";
  const subtitle = raw.subtitle ? cleanBibTeXString(raw.subtitle) : undefined;
  const publisher = raw.publisher ? cleanBibTeXString(raw.publisher) : undefined;
  const url = raw.url ? cleanBibTeXString(raw.url) : undefined;
  const doi = raw.doi ? cleanBibTeXString(raw.doi) : undefined;
  const address = raw.address ? cleanBibTeXString(raw.address) : undefined;
  const pages = raw.pages ? normalizePages(raw.pages) : undefined;
  const volume = raw.volume ? cleanBibTeXString(raw.volume) : undefined;
  const issue = raw.number ? cleanBibTeXString(raw.number) : undefined;
  const edition = raw.edition ? cleanBibTeXString(raw.edition) : undefined;
  const isbn = raw.isbn ? cleanBibTeXString(raw.isbn) : undefined;
  const issn = raw.issn ? cleanBibTeXString(raw.issn) : undefined;
  const journalTitle = raw.journal ? cleanBibTeXString(raw.journal) : undefined;
  const bookTitle = raw.booktitle ? cleanBibTeXString(raw.booktitle) : undefined;
  const institution = raw.school
    ? cleanBibTeXString(raw.school)
    : raw.institution
      ? cleanBibTeXString(raw.institution)
      : undefined;
  const organization = raw.organization ? cleanBibTeXString(raw.organization) : undefined;
  const annotation = raw.abstract
    ? cleanBibTeXString(raw.abstract)
    : raw.note
      ? cleanBibTeXString(raw.note)
      : undefined;

  const base = {
    title: title || "Untitled",
    subtitle,
    authors: authors && authors.length > 0 ? authors : undefined,
    editors: editors && editors.length > 0 ? editors : undefined,
    publisher,
    publicationPlace: address,
    publicationDate,
    url,
    doi,
    annotation,
    accessType: (url ? "web" : "print") as "web" | "print",
  };

  let fields: CitationFields;

  switch (sourceType) {
    case "journal":
      fields = {
        ...base,
        sourceType: "journal",
        journalTitle: journalTitle || "Unknown Journal",
        volume,
        issue,
        pageRange: pages,
        issn,
      };
      break;
    case "book":
      fields = {
        ...base,
        sourceType: "book",
        isbn,
        edition,
        volume,
        pageRange: pages,
      };
      break;
    case "book-chapter":
      fields = {
        ...base,
        sourceType: "book-chapter",
        bookTitle: bookTitle || "Unknown Book",
        bookEditors: editors && editors.length > 0 ? editors : undefined,
        pageRange: pages,
        edition,
        isbn,
      };
      break;
    case "conference-paper":
      fields = {
        ...base,
        sourceType: "conference-paper",
        conferenceName: bookTitle || organization || "Unknown Conference",
        conferenceLocation: address,
        proceedingsTitle: bookTitle,
        pageRange: pages,
      };
      break;
    case "thesis":
      fields = {
        ...base,
        sourceType: "thesis",
        institution: institution || "Unknown Institution",
        degree: entryType.toLowerCase() === "phdthesis" ? "doctoral" : entryType.toLowerCase() === "mastersthesis" ? "masters" : undefined,
      };
      break;
    case "government-report":
      fields = {
        ...base,
        sourceType: "government-report",
        agency: institution || "Unknown Agency",
        reportNumber: issue,
      };
      break;
    case "preprint":
      fields = {
        ...base,
        sourceType: "preprint",
        repository: raw.archiveprefix ? cleanBibTeXString(raw.archiveprefix) : undefined,
        preprintId: raw.eprint ? cleanBibTeXString(raw.eprint) : undefined,
      };
      break;
    case "website":
      fields = {
        ...base,
        sourceType: "website",
        siteName: organization,
      };
      break;
    case "software":
      fields = {
        ...base,
        sourceType: "software",
        version: raw.version ? cleanBibTeXString(raw.version) : undefined,
      };
      break;
    case "dataset":
      fields = {
        ...base,
        sourceType: "dataset",
        version: raw.version ? cleanBibTeXString(raw.version) : undefined,
      };
      break;
    default:
      fields = {
        ...base,
        sourceType: "miscellaneous",
      };
  }

  return { fields, entryType, entryKey };
}
