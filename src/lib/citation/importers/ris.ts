import type { Author, CitationDate, CitationFields, SourceType } from "@/types";

/**
 * RIS importer — counterpart to `exporters/ris.ts`.
 * Zotero, EndNote, and Mendeley all export this format.
 */

export interface RISParseResult {
  fields: CitationFields;
  /** The raw RIS reference type, e.g. "JOUR". */
  entryType: string;
  /** Derived key (first author + year) for display, like a BibTeX citekey. */
  entryKey: string;
}

function risTypeToSourceType(risType: string): SourceType {
  switch (risType.toUpperCase()) {
    case "JOUR":
    case "JFULL":
    case "MGZN":
    case "ABST":
      return "journal";
    case "BOOK":
    case "EDBOOK":
      return "book";
    case "CHAP":
      return "book-chapter";
    case "CPAPER":
    case "CONF":
      return "conference-paper";
    case "THES":
      return "thesis";
    case "RPRT":
      return "government-report";
    case "NEWS":
      return "newspaper";
    case "BLOG":
      return "blog";
    case "ELEC":
    case "WEB":
      return "website";
    case "VIDEO":
    case "ADVS":
      return "video";
    case "MPCT":
      return "film";
    case "MUSIC":
      return "song";
    case "SOUND":
      return "podcast-episode";
    case "ART":
      return "artwork";
    case "DATA":
    case "DBASE":
      return "dataset";
    case "COMP":
      return "software";
    case "UNPD":
      return "preprint";
    case "ENCYC":
      return "encyclopedia";
    case "CASE":
      return "legal-case";
    case "INTV":
      return "interview";
    default:
      return "miscellaneous";
  }
}

/**
 * Parse an RIS person name: "Last, First Middle" or "Last, F.M." or a
 * single token. Names without a comma and with multiple words are treated
 * as corporate authors (the RIS convention is comma-separated for people).
 */
function parseRISName(raw: string): Author | null {
  const name = raw.trim();
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
  if (parts.length === 1) return { lastName: parts[0] };
  return { lastName: name, isOrganization: true };
}

/** Parse an RIS date: "YYYY/MM/DD/other info" — any segment may be empty. */
function parseRISDate(raw: string): CitationDate | undefined {
  const [yearStr, monthStr, dayStr] = raw.trim().split("/");
  const year = /^\d{4}$/.test(yearStr ?? "") ? parseInt(yearStr, 10) : undefined;
  if (!year) return undefined;
  const month = /^\d{1,2}$/.test(monthStr ?? "") ? parseInt(monthStr, 10) : undefined;
  const day = /^\d{1,2}$/.test(dayStr ?? "") ? parseInt(dayStr, 10) : undefined;
  return {
    year,
    month: month && month >= 1 && month <= 12 ? month : undefined,
    day: day && day >= 1 && day <= 31 ? day : undefined,
  };
}

const TAG_LINE = /^([A-Z][A-Z0-9])\s{1,2}-\s?(.*)$/;

interface RawRecord {
  type: string;
  /** Tag → all values seen for that tag, in order. */
  tags: Map<string, string[]>;
}

/** Split RIS text into raw records (TY ... ER blocks). */
function splitRecords(input: string): RawRecord[] {
  const records: RawRecord[] = [];
  let current: RawRecord | null = null;
  let lastValues: string[] | null = null;

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.replace(/^\uFEFF/, ""); // strip BOM
    const match = line.match(TAG_LINE);

    if (!match) {
      // Continuation of the previous value (long abstracts wrap lines).
      const text = line.trim();
      if (current && lastValues && lastValues.length > 0 && text) {
        lastValues[lastValues.length - 1] += ` ${text}`;
      }
      continue;
    }

    const [, tag, value] = match;
    if (tag === "TY") {
      current = { type: value.trim(), tags: new Map() };
      lastValues = null;
      continue;
    }
    if (tag === "ER") {
      if (current) records.push(current);
      current = null;
      lastValues = null;
      continue;
    }
    if (!current) continue;
    const values = current.tags.get(tag) ?? [];
    values.push(value.trim());
    current.tags.set(tag, values);
    lastValues = values;
  }

  if (current && current.tags.size > 0) records.push(current);
  return records;
}

function first(record: RawRecord, ...tags: string[]): string | undefined {
  for (const tag of tags) {
    const values = record.tags.get(tag);
    if (values && values[0]) return values[0];
  }
  return undefined;
}

function all(record: RawRecord, ...tags: string[]): string[] {
  const result: string[] = [];
  for (const tag of tags) {
    for (const value of record.tags.get(tag) ?? []) {
      if (value) result.push(value);
    }
  }
  return result;
}

function parsePersons(record: RawRecord, ...tags: string[]): Author[] | undefined {
  const authors = all(record, ...tags)
    .map(parseRISName)
    .filter((a): a is Author => a !== null);
  return authors.length > 0 ? authors : undefined;
}

function deriveEntryKey(authors: Author[] | undefined, date: CitationDate | undefined, index: number): string {
  const name = authors?.[0]?.lastName.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name) return date?.year ? `${name}${date.year}` : name;
  return `entry-${index + 1}`;
}

function buildFields(record: RawRecord): CitationFields {
  const sourceType = risTypeToSourceType(record.type);

  const authors = parsePersons(record, "AU", "A1");
  const editors = parsePersons(record, "ED");
  const translators = parsePersons(record, "A4");

  const dateRaw = first(record, "PY", "Y1", "DA");
  const publicationDate = dateRaw ? parseRISDate(dateRaw) : undefined;
  const accessRaw = first(record, "Y2");
  const accessDate = accessRaw ? parseRISDate(accessRaw) : undefined;

  const startPage = first(record, "SP");
  const endPage = first(record, "EP");
  const pageRange = startPage ? (endPage ? `${startPage}-${endPage}` : startPage) : undefined;

  const title = first(record, "TI", "T1") ?? "";
  const secondary = first(record, "T2", "JO", "JF", "JA");
  const tertiary = first(record, "T3");
  const volume = first(record, "VL");
  const issue = first(record, "IS");
  const edition = first(record, "ET");
  const publisher = first(record, "PB");
  const place = first(record, "CY");
  const serialNumber = first(record, "SN");
  const url = first(record, "UR");
  const doi = first(record, "DO", "DI");
  const annotation = first(record, "AB", "N2");
  const language = first(record, "LA");
  const misc1 = first(record, "M1");
  const misc3 = first(record, "M3");

  const base = {
    title: title || "Untitled",
    authors,
    editors,
    translators,
    publisher,
    publicationPlace: place,
    publicationDate,
    accessDate,
    url,
    doi,
    annotation,
    language,
    accessType: (url ? "web" : "print") as "web" | "print",
  };

  switch (sourceType) {
    case "journal":
      return {
        ...base,
        sourceType: "journal",
        journalTitle: secondary || "Unknown Journal",
        volume,
        issue,
        pageRange,
        issn: serialNumber,
      };
    case "book":
      return {
        ...base,
        sourceType: "book",
        isbn: serialNumber,
        edition,
        volume,
        series: tertiary,
        pageRange,
      };
    case "book-chapter":
      return {
        ...base,
        sourceType: "book-chapter",
        bookTitle: secondary || "Unknown Book",
        bookEditors: editors,
        pageRange,
        edition,
        volume,
        isbn: serialNumber,
      };
    case "conference-paper":
      return {
        ...base,
        sourceType: "conference-paper",
        conferenceName: secondary || "Unknown Conference",
        conferenceLocation: place,
        proceedingsTitle: tertiary,
        pageRange,
      };
    case "thesis":
      return {
        ...base,
        sourceType: "thesis",
        institution: publisher,
        department: tertiary,
        degree:
          misc3 && /phd|doctor/i.test(misc3)
            ? "doctoral"
            : misc3 && /master/i.test(misc3)
              ? "masters"
              : undefined,
      };
    case "government-report":
      return {
        ...base,
        sourceType: "government-report",
        agency: publisher,
        reportNumber: misc1,
        series: tertiary,
      };
    case "newspaper":
      return {
        ...base,
        sourceType: "newspaper",
        newspaperTitle: secondary || "Unknown Newspaper",
        pageRange,
        edition,
      };
    case "blog":
      return {
        ...base,
        sourceType: "blog",
        blogName: secondary || "Unknown Blog",
      };
    case "website":
      return {
        ...base,
        sourceType: "website",
        siteName: secondary,
        // ELEC records usually describe an online resource even without UR.
        accessType: "web",
      };
    case "video":
      return {
        ...base,
        sourceType: "video",
        channelName: secondary,
      };
    case "film":
      return {
        ...base,
        sourceType: "film",
      };
    case "song":
      return {
        ...base,
        sourceType: "song",
        album: secondary,
        trackNumber: misc1,
      };
    case "podcast-episode":
      return {
        ...base,
        sourceType: "podcast-episode",
        showName: secondary || "Unknown Show",
        episodeNumber: issue,
        seasonNumber: volume,
      };
    case "artwork":
      return {
        ...base,
        sourceType: "artwork",
        medium: misc3,
        museum: publisher,
        city: place,
      };
    case "dataset":
      return {
        ...base,
        sourceType: "dataset",
        version: edition,
        repository: publisher,
      };
    case "software":
      return {
        ...base,
        sourceType: "software",
        version: edition,
        repository: publisher,
        license: misc3,
      };
    case "preprint":
      return {
        ...base,
        sourceType: "preprint",
        repository: publisher,
        preprintId: misc1,
        version: edition,
      };
    case "encyclopedia":
      return {
        ...base,
        sourceType: "encyclopedia",
        encyclopediaTitle: secondary || "Unknown Encyclopedia",
        edition,
        volume,
        pageRange,
      };
    case "legal-case":
      return {
        ...base,
        sourceType: "legal-case",
        court: publisher,
        citationNumber: misc1,
        jurisdiction: misc3,
      };
    case "interview":
      return {
        ...base,
        sourceType: "interview",
        interviewee: authors,
      };
    default:
      return {
        ...base,
        sourceType: "miscellaneous",
      };
  }
}

/**
 * Parse all RIS records from a string (e.g. the contents of a .ris file).
 * Malformed lines are ignored; records without a TY tag are skipped.
 */
export function parseAllRIS(input: string): RISParseResult[] {
  return splitRecords(input).map((record, index) => {
    const fields = buildFields(record);
    return {
      fields,
      entryType: record.type,
      entryKey: deriveEntryKey(fields.authors, fields.publicationDate, index),
    };
  });
}

/** Heuristic: does this text look like RIS (vs. BibTeX)? */
export function looksLikeRIS(input: string): boolean {
  return /^TY\s{1,2}-/m.test(input.trim());
}
