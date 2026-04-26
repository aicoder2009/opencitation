import type { CitationFields } from "@/types";

export interface RISExtras {
  tags?: string[];
  notes?: string;
  quotes?: Array<{ text: string; page?: string }>;
}

export interface RISItem extends RISExtras {
  fields: CitationFields;
}

/**
 * Format a single person for RIS (Last, First Middle).
 * Organization authors are emitted as a single name with no comma split.
 */
function formatPerson(p: {
  firstName?: string;
  middleName?: string;
  lastName: string;
  isOrganization?: boolean;
}): string {
  if (p.isOrganization) return p.lastName;
  const given = [p.firstName, p.middleName].filter(Boolean).join(" ");
  return given ? `${p.lastName}, ${given}` : p.lastName;
}

/**
 * Get RIS type tag from source type
 */
function getRISType(sourceType: string): string {
  switch (sourceType) {
    case "book":
      return "BOOK";
    case "journal":
      return "JOUR";
    case "newspaper":
      return "NEWS";
    case "website":
    case "blog":
      return "ELEC";
    case "video":
      return "VIDEO";
    case "film":
      return "MPCT";
    case "tv-series":
    case "tv-episode":
      return "VIDEO";
    case "image":
      return "ART";
    case "song":
    case "album":
      return "MUSIC";
    case "podcast-episode":
      return "SOUND";
    case "video-game":
      return "COMP";
    case "artwork":
      return "ART";
    case "thesis":
      return "THES";
    case "conference-paper":
      return "CPAPER";
    case "book-chapter":
      return "CHAP";
    case "dataset":
      return "DATA";
    case "software":
      return "COMP";
    case "preprint":
      return "UNPD";
    case "social-media":
      return "ELEC";
    case "ai-generated":
      return "GEN";
    case "interview":
      return "INTV";
    case "government-report":
      return "RPRT";
    case "legal-case":
      return "CASE";
    case "encyclopedia":
      return "ENCYC";
    default:
      return "GEN";
  }
}

function formatDate(d?: { year?: number; month?: number; day?: number }): string | null {
  if (!d?.year) return null;
  let s = String(d.year);
  if (d.month) {
    s += `/${String(d.month).padStart(2, "0")}`;
    if (d.day) s += `/${String(d.day).padStart(2, "0")}`;
    else s += "/";
  } else {
    s += "//";
  }
  return s;
}

function emitPages(lines: string[], pageRange?: string): void {
  if (!pageRange) return;
  const parts = pageRange.split(/[-–—]/);
  if (parts[0]) lines.push(`SP  - ${parts[0].trim()}`);
  if (parts[1]) lines.push(`EP  - ${parts[1].trim()}`);
}

/**
 * Convert citation fields to RIS format. Pass `extras` for the per-citation
 * record-level fields (tags, notes, quotes) that aren't part of CitationFields
 * but Zotero ingests via KW / N1.
 */
export function toRIS(fields: CitationFields, extras?: RISExtras): string {
  const lines: string[] = [];

  lines.push(`TY  - ${getRISType(fields.sourceType)}`);

  // Authors / editors / translators
  if (fields.authors?.length) {
    for (const a of fields.authors) lines.push(`AU  - ${formatPerson(a)}`);
  }
  if (fields.editors?.length) {
    for (const e of fields.editors) lines.push(`ED  - ${formatPerson(e)}`);
  }
  if (fields.translators?.length) {
    for (const t of fields.translators) lines.push(`A4  - ${formatPerson(t)}`);
  }

  if (fields.title) lines.push(`TI  - ${fields.title}`);
  if (fields.subtitle) lines.push(`T2  - ${fields.subtitle}`);

  const pubDate = formatDate(fields.publicationDate);
  if (pubDate) {
    lines.push(`PY  - ${pubDate}`);
    lines.push(`Y1  - ${pubDate}`);
  }

  // Base-level publisher / place — emitted for every source type when present.
  // Per-source blocks may add more PB/CY entries (e.g., production company,
  // record label) when the base field isn't filled in.
  if (fields.publisher) lines.push(`PB  - ${fields.publisher}`);
  if (fields.publicationPlace) lines.push(`CY  - ${fields.publicationPlace}`);

  // Source-type specific fields
  switch (fields.sourceType) {
    case "book":
      if ("isbn" in fields && fields.isbn) lines.push(`SN  - ${fields.isbn}`);
      if ("edition" in fields && fields.edition) lines.push(`ET  - ${fields.edition}`);
      if ("volume" in fields && fields.volume) lines.push(`VL  - ${fields.volume}`);
      if ("series" in fields && fields.series) lines.push(`T3  - ${fields.series}`);
      emitPages(lines, "pageRange" in fields ? fields.pageRange : undefined);
      if ("totalPages" in fields && fields.totalPages) lines.push(`M1  - ${fields.totalPages}`);
      break;

    case "journal":
      if ("journalTitle" in fields && fields.journalTitle) {
        lines.push(`JO  - ${fields.journalTitle}`);
        lines.push(`T2  - ${fields.journalTitle}`);
      }
      if ("volume" in fields && fields.volume) lines.push(`VL  - ${fields.volume}`);
      if ("issue" in fields && fields.issue) lines.push(`IS  - ${fields.issue}`);
      emitPages(lines, "pageRange" in fields ? fields.pageRange : undefined);
      if ("articleNumber" in fields && fields.articleNumber) lines.push(`M1  - ${fields.articleNumber}`);
      if ("issn" in fields && fields.issn) lines.push(`SN  - ${fields.issn}`);
      if ("database" in fields && fields.database) lines.push(`DB  - ${fields.database}`);
      if ("databaseAccessionNumber" in fields && fields.databaseAccessionNumber) {
        lines.push(`AN  - ${fields.databaseAccessionNumber}`);
      }
      break;

    case "website":
      if ("siteName" in fields && fields.siteName) lines.push(`T2  - ${fields.siteName}`);
      if ("sectionTitle" in fields && fields.sectionTitle) lines.push(`T3  - ${fields.sectionTitle}`);
      break;

    case "blog":
      if ("blogName" in fields && fields.blogName) lines.push(`T2  - ${fields.blogName}`);
      if ("postTitle" in fields && fields.postTitle) lines.push(`T3  - ${fields.postTitle}`);
      break;

    case "newspaper":
      if ("newspaperTitle" in fields && fields.newspaperTitle) lines.push(`JO  - ${fields.newspaperTitle}`);
      if ("section" in fields && fields.section) lines.push(`SE  - ${fields.section}`);
      emitPages(lines, "pageRange" in fields ? fields.pageRange : undefined);
      if ("edition" in fields && fields.edition) lines.push(`ET  - ${fields.edition}`);
      if ("city" in fields && fields.city && !fields.publicationPlace) {
        lines.push(`CY  - ${fields.city}`);
      }
      break;

    case "video":
      if ("channelName" in fields && fields.channelName) lines.push(`T2  - ${fields.channelName}`);
      if ("platform" in fields && fields.platform && !fields.publisher) {
        lines.push(`PB  - ${fields.platform}`);
      }
      if ("duration" in fields && fields.duration) lines.push(`RP  - ${fields.duration}`);
      break;

    case "film":
      if ("directors" in fields && fields.directors?.length) {
        for (const d of fields.directors) lines.push(`A2  - ${formatPerson(d)}`);
      }
      if ("producers" in fields && fields.producers?.length) {
        for (const p of fields.producers) lines.push(`A3  - ${formatPerson(p)}`);
      }
      if ("productionCompany" in fields && fields.productionCompany && !fields.publisher) {
        lines.push(`PB  - ${fields.productionCompany}`);
      }
      if ("country" in fields && fields.country && !fields.publicationPlace) {
        lines.push(`CY  - ${fields.country}`);
      }
      if ("runtime" in fields && fields.runtime) lines.push(`RP  - ${fields.runtime}`);
      break;

    case "tv-series":
      if ("creators" in fields && fields.creators?.length) {
        for (const c of fields.creators) lines.push(`A2  - ${formatPerson(c)}`);
      }
      if ("network" in fields && fields.network && !fields.publisher) {
        lines.push(`PB  - ${fields.network}`);
      }
      if ("yearStart" in fields && fields.yearStart) lines.push(`PY  - ${fields.yearStart}`);
      break;

    case "tv-episode":
      if ("seriesTitle" in fields && fields.seriesTitle) lines.push(`T2  - ${fields.seriesTitle}`);
      if ("season" in fields && fields.season !== undefined) lines.push(`VL  - ${fields.season}`);
      if ("episodeNumber" in fields && fields.episodeNumber !== undefined) {
        lines.push(`IS  - ${fields.episodeNumber}`);
      }
      if ("directors" in fields && fields.directors?.length) {
        for (const d of fields.directors) lines.push(`A2  - ${formatPerson(d)}`);
      }
      if ("writers" in fields && fields.writers?.length) {
        for (const w of fields.writers) lines.push(`A3  - ${formatPerson(w)}`);
      }
      if ("network" in fields && fields.network && !fields.publisher) {
        lines.push(`PB  - ${fields.network}`);
      }
      break;

    case "thesis":
      if ("institution" in fields && fields.institution && !fields.publisher) {
        lines.push(`PB  - ${fields.institution}`);
      }
      if ("degree" in fields && fields.degree) lines.push(`M3  - ${fields.degree}`);
      if ("advisor" in fields && fields.advisor) lines.push(`A2  - ${formatPerson(fields.advisor)}`);
      if ("department" in fields && fields.department) lines.push(`T3  - ${fields.department}`);
      if ("databaseAccessionNumber" in fields && fields.databaseAccessionNumber) {
        lines.push(`AN  - ${fields.databaseAccessionNumber}`);
      }
      break;

    case "conference-paper":
      if ("conferenceName" in fields && fields.conferenceName) lines.push(`T2  - ${fields.conferenceName}`);
      if ("conferenceLocation" in fields && fields.conferenceLocation && !fields.publicationPlace) {
        lines.push(`CY  - ${fields.conferenceLocation}`);
      }
      if ("proceedingsTitle" in fields && fields.proceedingsTitle) lines.push(`T3  - ${fields.proceedingsTitle}`);
      emitPages(lines, "pageRange" in fields ? fields.pageRange : undefined);
      break;

    case "book-chapter":
      if ("chapterTitle" in fields && fields.chapterTitle && !fields.title) {
        lines.push(`TI  - ${fields.chapterTitle}`);
      }
      if ("bookTitle" in fields && fields.bookTitle) lines.push(`T2  - ${fields.bookTitle}`);
      if ("bookEditors" in fields && fields.bookEditors?.length) {
        for (const ed of fields.bookEditors) lines.push(`ED  - ${formatPerson(ed)}`);
      }
      emitPages(lines, "pageRange" in fields ? fields.pageRange : undefined);
      if ("edition" in fields && fields.edition) lines.push(`ET  - ${fields.edition}`);
      if ("volume" in fields && fields.volume) lines.push(`VL  - ${fields.volume}`);
      if ("isbn" in fields && fields.isbn) lines.push(`SN  - ${fields.isbn}`);
      break;

    case "encyclopedia":
      if ("encyclopediaTitle" in fields && fields.encyclopediaTitle) {
        lines.push(`T2  - ${fields.encyclopediaTitle}`);
      }
      if ("editors" in fields && fields.editors?.length) {
        for (const ed of fields.editors) lines.push(`ED  - ${formatPerson(ed)}`);
      }
      if ("edition" in fields && fields.edition) lines.push(`ET  - ${fields.edition}`);
      if ("volume" in fields && fields.volume) lines.push(`VL  - ${fields.volume}`);
      emitPages(lines, "pageRange" in fields ? fields.pageRange : undefined);
      break;

    case "government-report":
      if ("agency" in fields && fields.agency && !fields.publisher) lines.push(`PB  - ${fields.agency}`);
      if ("reportNumber" in fields && fields.reportNumber) lines.push(`M1  - ${fields.reportNumber}`);
      if ("series" in fields && fields.series) lines.push(`T3  - ${fields.series}`);
      break;

    case "preprint":
      if ("repository" in fields && fields.repository && !fields.publisher) {
        lines.push(`PB  - ${fields.repository}`);
      }
      if ("preprintId" in fields && fields.preprintId) lines.push(`M1  - ${fields.preprintId}`);
      if ("version" in fields && fields.version) lines.push(`ET  - ${fields.version}`);
      break;

    case "dataset":
    case "software":
      if ("version" in fields && fields.version) lines.push(`ET  - ${fields.version}`);
      if ("repository" in fields && fields.repository && !fields.publisher) {
        lines.push(`PB  - ${fields.repository}`);
      }
      if (fields.sourceType === "software") {
        if ("license" in fields && fields.license) lines.push(`M3  - ${fields.license}`);
        if ("commit" in fields && fields.commit) lines.push(`M1  - ${fields.commit}`);
      }
      break;

    case "song":
      if ("label" in fields && fields.label && !fields.publisher) lines.push(`PB  - ${fields.label}`);
      if ("performers" in fields && fields.performers?.length) {
        for (const p of fields.performers) lines.push(`A2  - ${formatPerson(p)}`);
      }
      if ("composers" in fields && fields.composers?.length) {
        for (const c of fields.composers) lines.push(`A3  - ${formatPerson(c)}`);
      }
      if ("album" in fields && fields.album) lines.push(`T2  - ${fields.album}`);
      if ("trackNumber" in fields && fields.trackNumber) lines.push(`M1  - ${fields.trackNumber}`);
      if ("duration" in fields && fields.duration) lines.push(`RP  - ${fields.duration}`);
      break;

    case "album":
      if ("label" in fields && fields.label && !fields.publisher) lines.push(`PB  - ${fields.label}`);
      if ("performers" in fields && fields.performers?.length) {
        for (const p of fields.performers) lines.push(`A2  - ${formatPerson(p)}`);
      }
      if ("format" in fields && fields.format) lines.push(`M3  - ${fields.format}`);
      break;

    case "podcast-episode":
      if ("showName" in fields && fields.showName) lines.push(`T2  - ${fields.showName}`);
      if ("host" in fields && fields.host?.length) {
        for (const h of fields.host) lines.push(`A2  - ${formatPerson(h)}`);
      }
      if ("guests" in fields && fields.guests?.length) {
        for (const g of fields.guests) lines.push(`A3  - ${formatPerson(g)}`);
      }
      if ("seasonNumber" in fields && fields.seasonNumber) lines.push(`VL  - ${fields.seasonNumber}`);
      if ("episodeNumber" in fields && fields.episodeNumber) lines.push(`IS  - ${fields.episodeNumber}`);
      if ("duration" in fields && fields.duration) lines.push(`RP  - ${fields.duration}`);
      break;

    case "social-media":
      if ("platform" in fields && fields.platform && !fields.publisher) {
        lines.push(`PB  - ${fields.platform}`);
      }
      if ("handle" in fields && fields.handle) lines.push(`M1  - ${fields.handle}`);
      if ("postType" in fields && fields.postType) lines.push(`M3  - ${fields.postType}`);
      break;

    case "ai-generated":
      if ("company" in fields && fields.company && !fields.publisher) {
        lines.push(`PB  - ${fields.company}`);
      }
      if ("modelName" in fields && fields.modelName) lines.push(`M3  - ${fields.modelName}`);
      if ("modelVersion" in fields && fields.modelVersion) lines.push(`ET  - ${fields.modelVersion}`);
      if ("prompt" in fields && fields.prompt) lines.push(`N1  - Prompt: ${fields.prompt}`);
      break;

    case "interview":
      if ("interviewer" in fields && fields.interviewer?.length) {
        for (const i of fields.interviewer) lines.push(`A2  - ${formatPerson(i)}`);
      }
      if ("interviewee" in fields && fields.interviewee?.length) {
        for (const i of fields.interviewee) lines.push(`A3  - ${formatPerson(i)}`);
      }
      if ("interviewType" in fields && fields.interviewType) lines.push(`M3  - ${fields.interviewType}`);
      break;

    case "artwork":
      if ("artists" in fields && fields.artists?.length) {
        for (const a of fields.artists) lines.push(`A2  - ${formatPerson(a)}`);
      }
      if ("museum" in fields && fields.museum && !fields.publisher) lines.push(`PB  - ${fields.museum}`);
      if ("city" in fields && fields.city && !fields.publicationPlace) lines.push(`CY  - ${fields.city}`);
      if ("medium" in fields && fields.medium) lines.push(`M3  - ${fields.medium}`);
      if ("dimensions" in fields && fields.dimensions) lines.push(`M1  - ${fields.dimensions}`);
      if ("inventoryNumber" in fields && fields.inventoryNumber) lines.push(`AN  - ${fields.inventoryNumber}`);
      break;

    case "image":
      if ("imageType" in fields && fields.imageType) lines.push(`M3  - ${fields.imageType}`);
      if ("medium" in fields && fields.medium) lines.push(`M1  - ${fields.medium}`);
      if ("museum" in fields && fields.museum && !fields.publisher) lines.push(`PB  - ${fields.museum}`);
      if ("collection" in fields && fields.collection) lines.push(`T2  - ${fields.collection}`);
      if ("location" in fields && fields.location && !fields.publicationPlace) {
        lines.push(`CY  - ${fields.location}`);
      }
      break;

    case "legal-case":
      if ("court" in fields && fields.court && !fields.publisher) lines.push(`PB  - ${fields.court}`);
      if ("citationNumber" in fields && fields.citationNumber) lines.push(`M1  - ${fields.citationNumber}`);
      if ("docketNumber" in fields && fields.docketNumber) lines.push(`AN  - ${fields.docketNumber}`);
      if ("jurisdiction" in fields && fields.jurisdiction) lines.push(`M3  - ${fields.jurisdiction}`);
      break;

    case "video-game":
      if ("studio" in fields && fields.studio && !fields.publisher) lines.push(`PB  - ${fields.studio}`);
      if ("platform" in fields && fields.platform) lines.push(`M3  - ${fields.platform}`);
      if ("version" in fields && fields.version) lines.push(`ET  - ${fields.version}`);
      break;
  }

  if (fields.url) lines.push(`UR  - ${fields.url}`);
  if (fields.doi) lines.push(`DO  - ${fields.doi}`);

  const accessed = formatDate(fields.accessDate);
  if (accessed) lines.push(`Y2  - ${accessed}`);

  if (fields.language) lines.push(`LA  - ${fields.language}`);

  const orig = formatDate(fields.originalPublicationDate);
  if (orig) lines.push(`OP  - ${orig}`);

  if (fields.annotation) lines.push(`AB  - ${fields.annotation}`);

  // Per-citation extras (Zotero ingests these via KW / N1)
  if (extras?.tags?.length) {
    for (const tag of extras.tags) lines.push(`KW  - ${tag}`);
  }
  if (extras?.notes) {
    // Zotero treats each N1 as one note; keep newlines inside the same N1.
    lines.push(`N1  - ${extras.notes.replace(/\r?\n/g, " \\n ")}`);
  }
  if (extras?.quotes?.length) {
    for (const q of extras.quotes) {
      const text = q.text.replace(/\r?\n/g, " ");
      const suffix = q.page ? ` (${q.page})` : "";
      lines.push(`N1  - "${text}"${suffix}`);
    }
  }

  lines.push("ER  - ");

  return lines.join("\n");
}

/**
 * Convert multiple citations to RIS format.
 * Accepts either a plain list of CitationFields (legacy callers) or a list
 * of RISItem objects carrying per-citation extras (tags, notes, quotes).
 */
export function toRISMultiple(items: CitationFields[] | RISItem[]): string {
  return items
    .map((item) =>
      isRISItem(item) ? toRIS(item.fields, item) : toRIS(item)
    )
    .join("\n\n");
}

function isRISItem(item: CitationFields | RISItem): item is RISItem {
  return typeof item === "object" && item !== null && "fields" in item;
}
