import type { CitationFields } from "@/types";

/**
 * Format a single person for RIS (Last, First Middle)
 */
function formatPerson(p: { firstName?: string; middleName?: string; lastName: string }): string {
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

/**
 * Convert citation fields to RIS format
 */
export function toRIS(fields: CitationFields): string {
  const lines: string[] = [];

  // Type
  lines.push(`TY  - ${getRISType(fields.sourceType)}`);

  // Authors
  if (fields.authors && fields.authors.length > 0) {
    for (const author of fields.authors) {
      lines.push(`AU  - ${formatPerson(author)}`);
    }
  }

  // Editors
  if (fields.editors && fields.editors.length > 0) {
    for (const editor of fields.editors) {
      lines.push(`ED  - ${formatPerson(editor)}`);
    }
  }

  // Title
  if (fields.title) {
    lines.push(`TI  - ${fields.title}`);
  }

  // Subtitle as secondary title
  if (fields.subtitle) {
    lines.push(`T2  - ${fields.subtitle}`);
  }

  // Publication year
  if (fields.publicationDate?.year) {
    let dateStr = String(fields.publicationDate.year);
    if (fields.publicationDate.month) {
      dateStr += `/${String(fields.publicationDate.month).padStart(2, "0")}`;
      if (fields.publicationDate.day) {
        dateStr += `/${String(fields.publicationDate.day).padStart(2, "0")}`;
      }
    }
    lines.push(`PY  - ${dateStr}`);
    lines.push(`Y1  - ${dateStr}`);
  }

  // Source-type specific fields
  switch (fields.sourceType) {
    case "book":
      if (fields.publisher) {
        lines.push(`PB  - ${fields.publisher}`);
      }
      if (fields.publicationPlace) {
        lines.push(`CY  - ${fields.publicationPlace}`);
      }
      if ("isbn" in fields && fields.isbn) {
        lines.push(`SN  - ${fields.isbn}`);
      }
      if ("edition" in fields && fields.edition) {
        lines.push(`ET  - ${fields.edition}`);
      }
      break;

    case "journal":
      if ("journalTitle" in fields && fields.journalTitle) {
        lines.push(`JO  - ${fields.journalTitle}`);
        lines.push(`T2  - ${fields.journalTitle}`);
      }
      if ("volume" in fields && fields.volume) {
        lines.push(`VL  - ${fields.volume}`);
      }
      if ("issue" in fields && fields.issue) {
        lines.push(`IS  - ${fields.issue}`);
      }
      if ("pageRange" in fields && fields.pageRange) {
        const pages = fields.pageRange.split("-");
        if (pages[0]) lines.push(`SP  - ${pages[0].trim()}`);
        if (pages[1]) lines.push(`EP  - ${pages[1].trim()}`);
      }
      if ("issn" in fields && fields.issn) {
        lines.push(`SN  - ${fields.issn}`);
      }
      break;

    case "website":
    case "blog":
      if ("siteName" in fields && fields.siteName) {
        lines.push(`T2  - ${fields.siteName}`);
      } else if ("blogName" in fields && fields.blogName) {
        lines.push(`T2  - ${fields.blogName}`);
      }
      break;

    case "newspaper":
      if ("newspaperTitle" in fields && fields.newspaperTitle) {
        lines.push(`JO  - ${fields.newspaperTitle}`);
      }
      if ("section" in fields && fields.section) {
        lines.push(`SE  - ${fields.section}`);
      }
      break;

    case "video":
      if ("channelName" in fields && fields.channelName) {
        lines.push(`T2  - ${fields.channelName}`);
      }
      if ("platform" in fields && fields.platform) {
        lines.push(`PB  - ${fields.platform}`);
      }
      break;

    case "film":
      if ("directors" in fields && fields.directors && fields.directors.length > 0) {
        for (const director of fields.directors) {
          lines.push(`A2  - ${formatPerson(director)}`);
        }
      }
      if ("productionCompany" in fields && fields.productionCompany) {
        lines.push(`PB  - ${fields.productionCompany}`);
      }
      break;

    case "thesis":
      if ("institution" in fields && fields.institution) {
        lines.push(`PB  - ${fields.institution}`);
      }
      if ("degree" in fields && fields.degree) {
        lines.push(`M3  - ${fields.degree}`);
      }
      break;

    case "conference-paper":
      if ("conferenceName" in fields && fields.conferenceName) {
        lines.push(`T2  - ${fields.conferenceName}`);
      }
      if ("conferenceLocation" in fields && fields.conferenceLocation) {
        lines.push(`CY  - ${fields.conferenceLocation}`);
      }
      if ("proceedingsTitle" in fields && fields.proceedingsTitle) {
        lines.push(`T3  - ${fields.proceedingsTitle}`);
      }
      if ("pageRange" in fields && fields.pageRange) {
        const pages = fields.pageRange.split("-");
        if (pages[0]) lines.push(`SP  - ${pages[0].trim()}`);
        if (pages[1]) lines.push(`EP  - ${pages[1].trim()}`);
      }
      break;

    case "book-chapter":
      if ("bookTitle" in fields && fields.bookTitle) {
        lines.push(`T2  - ${fields.bookTitle}`);
      }
      if ("bookEditors" in fields && fields.bookEditors && fields.bookEditors.length > 0) {
        for (const ed of fields.bookEditors) {
          lines.push(`ED  - ${formatPerson(ed)}`);
        }
      }
      if ("pageRange" in fields && fields.pageRange) {
        const pages = fields.pageRange.split("-");
        if (pages[0]) lines.push(`SP  - ${pages[0].trim()}`);
        if (pages[1]) lines.push(`EP  - ${pages[1].trim()}`);
      }
      if (fields.publisher) lines.push(`PB  - ${fields.publisher}`);
      break;

    case "encyclopedia":
      if ("encyclopediaTitle" in fields && fields.encyclopediaTitle) {
        lines.push(`T2  - ${fields.encyclopediaTitle}`);
      }
      if ("pageRange" in fields && fields.pageRange) {
        const pages = fields.pageRange.split("-");
        if (pages[0]) lines.push(`SP  - ${pages[0].trim()}`);
        if (pages[1]) lines.push(`EP  - ${pages[1].trim()}`);
      }
      if (fields.publisher) lines.push(`PB  - ${fields.publisher}`);
      break;

    case "government-report":
      if ("agency" in fields && fields.agency) lines.push(`PB  - ${fields.agency}`);
      if ("reportNumber" in fields && fields.reportNumber) lines.push(`M1  - ${fields.reportNumber}`);
      if ("series" in fields && fields.series) lines.push(`T3  - ${fields.series}`);
      break;

    case "preprint":
      if ("repository" in fields && fields.repository) lines.push(`PB  - ${fields.repository}`);
      if ("preprintId" in fields && fields.preprintId) lines.push(`M1  - ${fields.preprintId}`);
      break;

    case "dataset":
    case "software":
      if ("version" in fields && fields.version) lines.push(`ET  - ${fields.version}`);
      if ("repository" in fields && fields.repository) lines.push(`PB  - ${fields.repository}`);
      break;

    case "song":
    case "album":
      if ("label" in fields && fields.label) lines.push(`PB  - ${fields.label}`);
      if ("performers" in fields && fields.performers && fields.performers.length > 0) {
        for (const p of fields.performers) {
          lines.push(`A2  - ${formatPerson(p)}`);
        }
      }
      break;

    case "podcast-episode":
      if ("showName" in fields && fields.showName) lines.push(`T2  - ${fields.showName}`);
      if ("host" in fields && fields.host && fields.host.length > 0) {
        for (const h of fields.host) {
          lines.push(`A2  - ${formatPerson(h)}`);
        }
      }
      break;

    case "social-media":
      if ("platform" in fields && fields.platform) lines.push(`PB  - ${fields.platform}`);
      if ("handle" in fields && fields.handle) lines.push(`M1  - ${fields.handle}`);
      break;

    case "ai-generated":
      if ("company" in fields && fields.company) lines.push(`PB  - ${fields.company}`);
      if ("modelVersion" in fields && fields.modelVersion) lines.push(`ET  - ${fields.modelVersion}`);
      break;

    case "interview":
      if ("interviewer" in fields && fields.interviewer && fields.interviewer.length > 0) {
        for (const i of fields.interviewer) {
          lines.push(`A2  - ${formatPerson(i)}`);
        }
      }
      break;

    case "artwork":
      if ("museum" in fields && fields.museum) lines.push(`PB  - ${fields.museum}`);
      if ("city" in fields && fields.city) lines.push(`CY  - ${fields.city}`);
      if ("medium" in fields && fields.medium) lines.push(`M3  - ${fields.medium}`);
      break;

    case "legal-case":
      if ("court" in fields && fields.court) lines.push(`PB  - ${fields.court}`);
      if ("citationNumber" in fields && fields.citationNumber) lines.push(`M1  - ${fields.citationNumber}`);
      break;

    case "video-game":
      if ("studio" in fields && fields.studio) lines.push(`PB  - ${fields.studio}`);
      if ("platform" in fields && fields.platform) lines.push(`M3  - ${fields.platform}`);
      break;
  }

  // URL
  if (fields.url) {
    lines.push(`UR  - ${fields.url}`);
  }

  // DOI
  if (fields.doi) {
    lines.push(`DO  - ${fields.doi}`);
  }

  // Access date
  if (fields.accessDate) {
    const { year, month, day } = fields.accessDate;
    if (year && month && day) {
      lines.push(`Y2  - ${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`);
    }
  }

  // Language
  if (fields.language) {
    lines.push(`LA  - ${fields.language}`);
  }

  // Abstract/Annotation
  if (fields.annotation) {
    lines.push(`AB  - ${fields.annotation}`);
  }

  // End record
  lines.push("ER  - ");

  return lines.join("\n");
}

/**
 * Convert multiple citations to RIS format
 */
export function toRISMultiple(citationsList: CitationFields[]): string {
  return citationsList.map(toRIS).join("\n\n");
}
