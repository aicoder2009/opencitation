import type { CitationFields } from "@/types";

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
      if (author.firstName) {
        lines.push(`AU  - ${author.lastName}, ${author.firstName}`);
      } else {
        lines.push(`AU  - ${author.lastName}`);
      }
    }
  }

  // Editors
  if (fields.editors && fields.editors.length > 0) {
    for (const editor of fields.editors) {
      if (editor.firstName) {
        lines.push(`ED  - ${editor.lastName}, ${editor.firstName}`);
      } else {
        lines.push(`ED  - ${editor.lastName}`);
      }
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
          if (director.firstName) {
            lines.push(`A2  - ${director.lastName}, ${director.firstName}`);
          } else {
            lines.push(`A2  - ${director.lastName}`);
          }
        }
      }
      if ("productionCompany" in fields && fields.productionCompany) {
        lines.push(`PB  - ${fields.productionCompany}`);
      }
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
