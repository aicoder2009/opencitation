/**
 * Citation Types for OpenCitation
 * Core type definitions for the citation engine
 */

import type { SourceType } from './source-types';
import type { AccessType } from './access-types';

export const CITATION_STYLES = ['apa', 'mla', 'chicago', 'harvard'] as const;

export type CitationStyle = (typeof CITATION_STYLES)[number];

export const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  apa: 'APA 7th Edition',
  mla: 'MLA 9th Edition',
  chicago: 'Chicago 17th Edition',
  harvard: 'Harvard',
};

/**
 * Author information
 */
export interface Author {
  firstName?: string;
  middleName?: string;
  lastName: string;
  suffix?: string; // Jr., Sr., III, etc.
  isOrganization?: boolean; // For corporate authors
}

/**
 * Date information - flexible to handle partial dates
 */
export interface CitationDate {
  year?: number;
  month?: number; // 1-12
  day?: number; // 1-31
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  isApproximate?: boolean; // circa, approximately
}

/**
 * Base citation fields common to all source types
 */
export interface BaseCitationFields {
  // Core identifiers
  id?: string;

  // Source and access type
  sourceType: SourceType;
  accessType: AccessType;

  // Title
  title: string;
  subtitle?: string;

  // Authors/Creators
  authors?: Author[];
  editors?: Author[];
  translators?: Author[];

  // Publication info
  publisher?: string;
  publicationPlace?: string;
  publicationDate?: CitationDate;

  // Access info
  url?: string;
  accessDate?: CitationDate;
  doi?: string;

  // Additional
  language?: string;
  originalPublicationDate?: CitationDate;
  annotation?: string; // For annotated bibliographies
}

/**
 * Book-specific fields
 */
export interface BookFields extends BaseCitationFields {
  sourceType: 'book';
  isbn?: string;
  edition?: string;
  volume?: string;
  volumeTitle?: string;
  series?: string;
  seriesNumber?: string;
  pageRange?: string;
  totalPages?: number;
  format?: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
}

/**
 * Journal article fields
 */
export interface JournalFields extends BaseCitationFields {
  sourceType: 'journal';
  journalTitle: string;
  volume?: string;
  issue?: string;
  pageRange?: string;
  articleNumber?: string;
  issn?: string;
  database?: string;
  databaseAccessionNumber?: string;
}

/**
 * Website fields
 */
export interface WebsiteFields extends BaseCitationFields {
  sourceType: 'website';
  siteName?: string;
  sectionTitle?: string;
  lastModifiedDate?: CitationDate;
}

/**
 * Blog fields
 */
export interface BlogFields extends BaseCitationFields {
  sourceType: 'blog';
  blogName: string;
  postTitle?: string;
}

/**
 * Newspaper fields
 */
export interface NewspaperFields extends BaseCitationFields {
  sourceType: 'newspaper';
  newspaperTitle: string;
  section?: string;
  pageRange?: string;
  edition?: string; // morning, evening, etc.
  city?: string;
}

/**
 * Video fields (YouTube, Vimeo, etc.)
 */
export interface VideoFields extends BaseCitationFields {
  sourceType: 'video';
  channelName?: string;
  platform?: string; // YouTube, Vimeo, TED, etc.
  duration?: string; // HH:MM:SS
  uploadDate?: CitationDate;
}

/**
 * Image fields
 */
export interface ImageFields extends BaseCitationFields {
  sourceType: 'image';
  imageType?: 'photograph' | 'painting' | 'illustration' | 'graphic' | 'map' | 'other';
  dimensions?: string;
  medium?: string; // Oil on canvas, digital, etc.
  collection?: string;
  museum?: string;
  location?: string;
}

/**
 * Film fields
 */
export interface FilmFields extends BaseCitationFields {
  sourceType: 'film';
  directors?: Author[];
  producers?: Author[];
  productionCompany?: string;
  country?: string;
  runtime?: string;
  format?: 'theatrical' | 'dvd' | 'blu-ray' | 'streaming' | 'vhs';
  streamingService?: string;
}

/**
 * TV Series fields (whole series)
 */
export interface TVSeriesFields extends BaseCitationFields {
  sourceType: 'tv-series';
  creators?: Author[];
  executiveProducers?: Author[];
  network?: string;
  streamingService?: string;
  yearStart?: number;
  yearEnd?: number;
  numberOfSeasons?: number;
}

/**
 * TV Episode fields
 */
export interface TVEpisodeFields extends BaseCitationFields {
  sourceType: 'tv-episode';
  seriesTitle: string;
  episodeTitle: string;
  season?: number;
  episodeNumber?: number;
  directors?: Author[];
  writers?: Author[];
  network?: string;
  streamingService?: string;
  airDate?: CitationDate;
  runtime?: string;
}

/**
 * Miscellaneous fields (catch-all)
 */
export interface MiscellaneousFields extends BaseCitationFields {
  sourceType: 'miscellaneous';
  description?: string;
  medium?: string;
  format?: string;
  additionalInfo?: string;
}

/**
 * Song fields
 */
export interface SongFields extends BaseCitationFields {
  sourceType: 'song';
  performers?: Author[];
  composers?: Author[];
  album?: string;
  label?: string;
  trackNumber?: string;
  duration?: string;
}

/**
 * Album fields (full music album)
 */
export interface AlbumFields extends BaseCitationFields {
  sourceType: 'album';
  performers?: Author[];
  label?: string;
  format?: 'vinyl' | 'cd' | 'digital' | 'cassette';
}

/**
 * Podcast episode fields
 */
export interface PodcastEpisodeFields extends BaseCitationFields {
  sourceType: 'podcast-episode';
  showName: string;
  host?: Author[];
  guests?: Author[];
  episodeNumber?: string;
  seasonNumber?: string;
  duration?: string;
  timestamp?: string;
}

/**
 * Video game fields
 */
export interface VideoGameFields extends BaseCitationFields {
  sourceType: 'video-game';
  studio?: string;
  platform?: string;
  version?: string;
}

/**
 * Artwork fields
 */
export interface ArtworkFields extends BaseCitationFields {
  sourceType: 'artwork';
  artists?: Author[];
  medium?: string;
  dimensions?: string;
  museum?: string;
  city?: string;
  inventoryNumber?: string;
}

/**
 * Thesis / dissertation fields
 */
export interface ThesisFields extends BaseCitationFields {
  sourceType: 'thesis';
  degree?: 'doctoral' | 'masters' | 'bachelors';
  institution: string;
  advisor?: Author;
  department?: string;
  databaseAccessionNumber?: string;
}

/**
 * Conference paper fields
 */
export interface ConferencePaperFields extends BaseCitationFields {
  sourceType: 'conference-paper';
  conferenceName: string;
  conferenceLocation?: string;
  conferenceDate?: CitationDate;
  proceedingsTitle?: string;
  pageRange?: string;
}

/**
 * Book chapter fields
 */
export interface BookChapterFields extends BaseCitationFields {
  sourceType: 'book-chapter';
  chapterTitle?: string;
  bookTitle: string;
  bookEditors?: Author[];
  pageRange?: string;
  edition?: string;
  volume?: string;
  isbn?: string;
}

/**
 * Dataset fields
 */
export interface DatasetFields extends BaseCitationFields {
  sourceType: 'dataset';
  version?: string;
  repository?: string;
}

/**
 * Software / code fields
 */
export interface SoftwareFields extends BaseCitationFields {
  sourceType: 'software';
  version?: string;
  repository?: string;
  license?: string;
  commit?: string;
}

/**
 * Preprint fields (arXiv, bioRxiv, medRxiv, etc.)
 */
export interface PreprintFields extends BaseCitationFields {
  sourceType: 'preprint';
  repository?: string;
  preprintId?: string;
  version?: string;
}

/**
 * Social media post fields
 */
export interface SocialMediaFields extends BaseCitationFields {
  sourceType: 'social-media';
  platform?: string;
  handle?: string;
  postType?: 'post' | 'tweet' | 'reel' | 'story' | 'comment';
}

/**
 * AI-generated content fields
 */
export interface AIGeneratedFields extends BaseCitationFields {
  sourceType: 'ai-generated';
  modelName?: string;
  modelVersion?: string;
  company?: string;
  prompt?: string;
}

/**
 * Interview fields
 */
export interface InterviewFields extends BaseCitationFields {
  sourceType: 'interview';
  interviewer?: Author[];
  interviewee?: Author[];
  interviewType?: 'personal' | 'published' | 'broadcast';
  source?: string;
}

/**
 * Government report fields
 */
export interface GovernmentReportFields extends BaseCitationFields {
  sourceType: 'government-report';
  agency?: string;
  reportNumber?: string;
  series?: string;
}

/**
 * Legal case fields (simple, not Bluebook-compliant)
 */
export interface LegalCaseFields extends BaseCitationFields {
  sourceType: 'legal-case';
  court?: string;
  citationNumber?: string;
  docketNumber?: string;
  jurisdiction?: string;
}

/**
 * Encyclopedia / dictionary entry fields
 */
export interface EncyclopediaFields extends BaseCitationFields {
  sourceType: 'encyclopedia';
  encyclopediaTitle: string;
  editors?: Author[];
  edition?: string;
  volume?: string;
  pageRange?: string;
}

/**
 * Union type of all citation field types
 */
export type CitationFields =
  | BookFields
  | JournalFields
  | WebsiteFields
  | BlogFields
  | NewspaperFields
  | VideoFields
  | ImageFields
  | FilmFields
  | TVSeriesFields
  | TVEpisodeFields
  | MiscellaneousFields
  | SongFields
  | AlbumFields
  | PodcastEpisodeFields
  | VideoGameFields
  | ArtworkFields
  | ThesisFields
  | ConferencePaperFields
  | BookChapterFields
  | DatasetFields
  | SoftwareFields
  | PreprintFields
  | SocialMediaFields
  | AIGeneratedFields
  | InterviewFields
  | GovernmentReportFields
  | LegalCaseFields
  | EncyclopediaFields;

/**
 * A complete citation with metadata
 */
export interface Citation {
  id: string;
  fields: CitationFields;
  style: CitationStyle;
  formattedCitation?: string;
  createdAt: Date;
  updatedAt: Date;
  listId?: string;
}

/**
 * Result from formatting a citation
 */
export interface FormattedCitation {
  text: string; // Plain text version
  html: string; // HTML version with proper formatting (italics, etc.)
}

/**
 * Formatter function signature
 */
export type CitationFormatter = (fields: CitationFields) => FormattedCitation;
