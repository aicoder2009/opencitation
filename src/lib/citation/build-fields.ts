import type { SourceType, AccessType, CitationFields } from "@/types";

export function buildCitationFields(
  data: Record<string, unknown>,
  sourceType: SourceType,
  accessType: AccessType,
): CitationFields {
  const baseFields = {
    sourceType,
    accessType,
    title: (data.title as string) || "Untitled",
    subtitle: data.subtitle as string | undefined,
    url: data.url as string | undefined,
    doi: data.doi as string | undefined,
    publisher: data.publisher as string | undefined,
  };

  const authors = [];
  if (data.authors && Array.isArray(data.authors)) {
    for (const author of data.authors) {
      if (typeof author === "object" && author !== null) {
        authors.push({
          firstName: (author as { firstName?: string }).firstName,
          lastName: (author as { lastName?: string }).lastName || "Unknown",
        });
      }
    }
  } else if (data.author && typeof data.author === "string") {
    const parts = (data.author as string).split(" ");
    authors.push({
      firstName: parts.slice(0, -1).join(" "),
      lastName: parts[parts.length - 1] || (data.author as string),
    });
  }

  if (authors.length > 0) {
    (baseFields as Record<string, unknown>).authors = authors;
  }

  if (data.publicationDate && typeof data.publicationDate === "object") {
    (baseFields as Record<string, unknown>).publicationDate = data.publicationDate;
  } else if (data.publishedDate && typeof data.publishedDate === "string") {
    const match = (data.publishedDate as string).match(/(\d{4})/);
    if (match) {
      (baseFields as Record<string, unknown>).publicationDate = { year: parseInt(match[1]) };
    }
  }

  switch (sourceType) {
    case "journal":
      return {
        ...baseFields,
        sourceType: "journal" as const,
        journalTitle: (data.journalTitle as string) || "Unknown Journal",
        volume: data.volume as string | undefined,
        issue: data.issue as string | undefined,
        pageRange: data.pageRange as string | undefined,
      };
    case "website":
      return {
        ...baseFields,
        sourceType: "website" as const,
        siteName: (data.siteName as string) || undefined,
      };
    case "blog":
      return {
        ...baseFields,
        sourceType: "blog" as const,
        blogName: (data.siteName as string) || "Unknown Blog",
      };
    case "newspaper":
      return {
        ...baseFields,
        sourceType: "newspaper" as const,
        newspaperTitle: (data.siteName as string) || "Unknown Newspaper",
      };
    case "book":
      return {
        ...baseFields,
        sourceType: "book" as const,
        isbn: data.isbn as string | undefined,
        edition: data.edition as string | undefined,
      };
    case "preprint":
      return {
        ...baseFields,
        sourceType: "preprint" as const,
        repository: (data.repository as string) || "arXiv",
        preprintId: data.preprintId as string | undefined,
      };
    case "video":
      return {
        ...baseFields,
        sourceType: "video" as const,
        channelName: (data.channelName as string) || (data.siteName as string) || undefined,
        platform: data.platform as string | undefined,
      };
    case "social-media": {
      const post = data.postType as string | undefined;
      const isKnownPost =
        post === "post" ||
        post === "tweet" ||
        post === "reel" ||
        post === "story" ||
        post === "comment";
      return {
        ...baseFields,
        sourceType: "social-media" as const,
        platform: data.platform as string | undefined,
        handle: data.handle as string | undefined,
        postType: isKnownPost
          ? (post as "post" | "tweet" | "reel" | "story" | "comment")
          : undefined,
      };
    }
    case "ai-generated":
      return {
        ...baseFields,
        sourceType: "ai-generated" as const,
        company: data.company as string | undefined,
        modelName: data.modelName as string | undefined,
      };
    case "song":
      return {
        ...baseFields,
        sourceType: "song" as const,
        album: data.album as string | undefined,
        label: data.label as string | undefined,
      };
    case "album":
      return {
        ...baseFields,
        sourceType: "album" as const,
        label: data.label as string | undefined,
      };
    case "podcast-episode":
      return {
        ...baseFields,
        sourceType: "podcast-episode" as const,
        showName:
          (data.showName as string) || (data.siteName as string) || "Unknown Show",
      };
    case "dataset":
      return {
        ...baseFields,
        sourceType: "dataset" as const,
        repository: data.repository as string | undefined,
      };
    case "software":
      return {
        ...baseFields,
        sourceType: "software" as const,
        repository: data.repository as string | undefined,
      };
    case "video-game":
      return {
        ...baseFields,
        sourceType: "video-game" as const,
        platform: data.platform as string | undefined,
      };
    case "encyclopedia":
      return {
        ...baseFields,
        sourceType: "encyclopedia" as const,
        encyclopediaTitle:
          (data.encyclopediaTitle as string) ||
          (data.siteName as string) ||
          "Encyclopedia",
      };
    default:
      return {
        ...baseFields,
        sourceType: "miscellaneous" as const,
      };
  }
}
