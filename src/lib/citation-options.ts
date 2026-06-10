import type { CitationStyle, SourceType, AccessType } from "@/types";

/**
 * Shared option lists for the cite page and settings page.
 * CSL styles (IEEE, Vancouver, …) live in `@/lib/citation` as CSL_STYLES.
 */

export const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "book", label: "Book" },
  { value: "book-chapter", label: "Book Chapter" },
  { value: "journal", label: "Journal" },
  { value: "website", label: "Website" },
  { value: "blog", label: "Blog" },
  { value: "newspaper", label: "Newspaper" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "film", label: "Film" },
  { value: "tv-series", label: "TV Series" },
  { value: "tv-episode", label: "TV Episode" },
  { value: "song", label: "Song" },
  { value: "album", label: "Album" },
  { value: "podcast-episode", label: "Podcast Episode" },
  { value: "video-game", label: "Video Game" },
  { value: "artwork", label: "Artwork" },
  { value: "thesis", label: "Thesis / Dissertation" },
  { value: "conference-paper", label: "Conference Paper" },
  { value: "dataset", label: "Dataset" },
  { value: "software", label: "Software / Code" },
  { value: "preprint", label: "Preprint" },
  { value: "social-media", label: "Social Media" },
  { value: "ai-generated", label: "AI-Generated" },
  { value: "interview", label: "Interview" },
  { value: "government-report", label: "Government Report" },
  { value: "legal-case", label: "Legal Case" },
  { value: "encyclopedia", label: "Encyclopedia" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

export const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: "apa", label: "APA 7th" },
  { value: "mla", label: "MLA 9th" },
  { value: "chicago", label: "Chicago 17th" },
  { value: "harvard", label: "Harvard" },
];

export const ACCESS_TYPES: { value: AccessType; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "print", label: "Print" },
  { value: "database", label: "Database" },
  { value: "app", label: "App" },
  { value: "archive", label: "Archive" },
];
