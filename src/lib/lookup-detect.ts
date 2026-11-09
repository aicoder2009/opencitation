import type { AccessType, SourceType } from "@/types";

export type LookupKind =
  | "doi"
  | "arxiv"
  | "pubmed"
  | "wikipedia"
  | "isbn"
  | "url";

export interface DetectedLookup {
  kind: LookupKind;
  endpoint:
    | "/api/lookup/doi"
    | "/api/lookup/arxiv"
    | "/api/lookup/pubmed"
    | "/api/lookup/wikipedia"
    | "/api/lookup/isbn"
    | "/api/lookup/url";
  body: Record<string, string>;
  defaultSourceType: SourceType;
  defaultAccessType: AccessType;
}

const DOI_PATTERN = /10\.\d{4,}(?:\.\d+)*\/[^\s]+/i;

/**
 * Detect what kind of identifier or URL a user pasted and return the matching
 * lookup endpoint, normalized request payload, and fallback source/access types.
 */
export function detectLookupInput(raw: string): DetectedLookup | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. DOI URL (doi.org / dx.doi.org), doi: prefix, or bare 10.xxxx/... identifier
  if (/^(?:https?:\/\/)?(?:www\.|dx\.)?doi\.org\//i.test(trimmed)) {
    const match = trimmed.match(DOI_PATTERN);
    if (match) {
      return {
        kind: "doi",
        endpoint: "/api/lookup/doi",
        body: { doi: match[0] },
        defaultSourceType: "journal",
        defaultAccessType: "database",
      };
    }
  }
  if (/^doi:\s*/i.test(trimmed)) {
    const rest = trimmed.replace(/^doi:\s*/i, "").trim();
    const match = rest.match(DOI_PATTERN);
    if (match) {
      return {
        kind: "doi",
        endpoint: "/api/lookup/doi",
        body: { doi: match[0] },
        defaultSourceType: "journal",
        defaultAccessType: "database",
      };
    }
  }
  if (/^10\.\d{4,}(?:\.\d+)*\/\S+$/i.test(trimmed)) {
    return {
      kind: "doi",
      endpoint: "/api/lookup/doi",
      body: { doi: trimmed },
      defaultSourceType: "journal",
      defaultAccessType: "database",
    };
  }

  // 2. arXiv URL, arXiv: prefix, or bare arXiv identifier (new YYMM.NNNNN or old archive/YYMMNNN)
  const arxivUrlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.|export\.)?arxiv\.org\/(?:abs|pdf)\/([^\s/?#]+)/i,
  );
  if (arxivUrlMatch) {
    const arxivId = arxivUrlMatch[1].replace(/\.pdf$/i, "");
    return {
      kind: "arxiv",
      endpoint: "/api/lookup/arxiv",
      body: { arxivId },
      defaultSourceType: "preprint",
      defaultAccessType: "web",
    };
  }
  if (/^arxiv:\s*/i.test(trimmed)) {
    const candidate = trimmed.replace(/^arxiv:\s*/i, "").trim();
    if (/^(?:\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(?:v\d+)?$/i.test(candidate)) {
      return {
        kind: "arxiv",
        endpoint: "/api/lookup/arxiv",
        body: { arxivId: candidate },
        defaultSourceType: "preprint",
        defaultAccessType: "web",
      };
    }
  }
  if (/^(?:\d{4}\.\d{4,5}|[a-z]{2,}(?:-[a-z]{2,})*\/\d{7})(?:v\d+)?$/i.test(trimmed)) {
    return {
      kind: "arxiv",
      endpoint: "/api/lookup/arxiv",
      body: { arxivId: trimmed },
      defaultSourceType: "preprint",
      defaultAccessType: "web",
    };
  }

  // 3. PubMed URL, PMID: prefix, or 7-8 digit numeric PMID
  const pubmedUrlMatch = trimmed.match(
    /^(?:https?:\/\/)?pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\/?/i,
  );
  if (pubmedUrlMatch) {
    return {
      kind: "pubmed",
      endpoint: "/api/lookup/pubmed",
      body: { pmid: pubmedUrlMatch[1] },
      defaultSourceType: "journal",
      defaultAccessType: "database",
    };
  }
  const pmidPrefixMatch = trimmed.match(/^pmid:?\s*(\d+)$/i);
  if (pmidPrefixMatch) {
    return {
      kind: "pubmed",
      endpoint: "/api/lookup/pubmed",
      body: { pmid: pmidPrefixMatch[1] },
      defaultSourceType: "journal",
      defaultAccessType: "database",
    };
  }
  if (/^\d{7,8}$/.test(trimmed)) {
    return {
      kind: "pubmed",
      endpoint: "/api/lookup/pubmed",
      body: { pmid: trimmed },
      defaultSourceType: "journal",
      defaultAccessType: "database",
    };
  }

  // 4. Wikipedia article URL (e.g. https://en.wikipedia.org/wiki/...)
  if (
    /^(?:https?:\/\/)?(?!www\.)[a-z]{2,3}\.(?:m\.)?wikipedia\.org\/wiki\/.+/i.test(
      trimmed,
    )
  ) {
    const normalizedWikiUrl = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return {
      kind: "wikipedia",
      endpoint: "/api/lookup/wikipedia",
      body: { url: normalizedWikiUrl },
      defaultSourceType: "encyclopedia",
      defaultAccessType: "web",
    };
  }

  // 5. ISBN-10 or ISBN-13 (with or without "ISBN" prefix, hyphens, or spaces)
  const isbnCandidate = trimmed.replace(/^isbn(?:-1[03])?:?\s*/i, "");
  if (/^[\d\s-]+[\dXx]$/.test(isbnCandidate)) {
    const cleanedIsbn = isbnCandidate.replace(/[-\s]/g, "").toUpperCase();
    if (/^(?:\d{9}[\dX]|97[89]\d{10})$/.test(cleanedIsbn)) {
      return {
        kind: "isbn",
        endpoint: "/api/lookup/isbn",
        body: { isbn: cleanedIsbn },
        defaultSourceType: "book",
        defaultAccessType: "print",
      };
    }
  }

  // 6. General HTTP(S) or www. URL
  if (/^(?:https?:\/\/|www\.)/i.test(trimmed)) {
    const normalizedUrl = /^www\./i.test(trimmed)
      ? `https://${trimmed}`
      : trimmed;
    try {
      const parsed = new URL(normalizedUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return {
          kind: "url",
          endpoint: "/api/lookup/url",
          body: { url: parsed.toString() },
          defaultSourceType: "website",
          defaultAccessType: "web",
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}
