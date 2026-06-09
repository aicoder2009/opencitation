/**
 * Converts OpenCitation's CitationFields into CSL-JSON, the input format the
 * citeproc engine consumes. This is the bridge between our data model and the
 * thousands of styles expressed in the Citation Style Language.
 *
 * Reference: https://github.com/citation-style-language/schema (csl-data.json)
 */
import type { Author, CitationDate, CitationFields } from '@/types/citation';
import type { SourceType } from '@/types/source-types';

export interface CslName {
  family?: string;
  given?: string;
  suffix?: string;
  literal?: string;
}

export interface CslDate {
  'date-parts'?: number[][];
  season?: number;
  circa?: boolean;
}

export interface CslJson {
  id: string;
  type: string;
  title?: string;
  author?: CslName[];
  editor?: CslName[];
  translator?: CslName[];
  director?: CslName[];
  composer?: CslName[];
  interviewer?: CslName[];
  recipient?: CslName[];
  'container-title'?: string;
  'collection-title'?: string;
  'collection-number'?: string;
  publisher?: string;
  'publisher-place'?: string;
  issued?: CslDate;
  accessed?: CslDate;
  volume?: string;
  issue?: string;
  page?: string;
  'number-of-pages'?: string;
  number?: string;
  edition?: string;
  DOI?: string;
  URL?: string;
  ISBN?: string;
  ISSN?: string;
  language?: string;
  genre?: string;
  medium?: string;
  dimensions?: string;
  archive?: string;
  archive_location?: string;
  'archive-place'?: string;
  version?: string;
  event?: string;
  'event-place'?: string;
  authority?: string;
  abstract?: string;
}

const SEASONS: Record<string, number> = {
  spring: 1,
  summer: 2,
  fall: 3,
  winter: 4,
};

const TYPE_MAP: Record<SourceType, string> = {
  book: 'book',
  'book-chapter': 'chapter',
  journal: 'article-journal',
  newspaper: 'article-newspaper',
  website: 'webpage',
  blog: 'post-weblog',
  video: 'motion_picture',
  film: 'motion_picture',
  'tv-series': 'broadcast',
  'tv-episode': 'broadcast',
  song: 'song',
  album: 'song',
  'podcast-episode': 'broadcast',
  'video-game': 'software',
  image: 'graphic',
  artwork: 'graphic',
  thesis: 'thesis',
  'conference-paper': 'paper-conference',
  dataset: 'dataset',
  software: 'software',
  preprint: 'article',
  'social-media': 'post',
  'ai-generated': 'webpage',
  interview: 'interview',
  'government-report': 'report',
  'legal-case': 'legal_case',
  encyclopedia: 'entry-encyclopedia',
  miscellaneous: 'document',
};

function toCslName(author: Author): CslName {
  if (author.isOrganization) {
    return { literal: author.lastName };
  }
  const given = [author.firstName, author.middleName].filter(Boolean).join(' ');
  const name: CslName = { family: author.lastName };
  if (given) name.given = given;
  if (author.suffix) name.suffix = author.suffix;
  return name;
}

function toCslNames(authors?: Author[]): CslName[] | undefined {
  if (!authors || authors.length === 0) return undefined;
  return authors.map(toCslName);
}

function toCslDate(date?: CitationDate): CslDate | undefined {
  if (!date) return undefined;
  const result: CslDate = {};
  if (date.year != null) {
    const parts: number[] = [date.year];
    if (date.month != null) {
      parts.push(date.month);
      if (date.day != null) parts.push(date.day);
    }
    result['date-parts'] = [parts];
  }
  if (date.season && SEASONS[date.season]) result.season = SEASONS[date.season];
  if (date.isApproximate) result.circa = true;
  return result['date-parts'] || result.season ? result : undefined;
}

/** Type-safe-ish access to optional fields that only exist on some source types. */
function field<T = string>(fields: CitationFields, key: string): T | undefined {
  const value = (fields as unknown as Record<string, unknown>)[key];
  return value as T | undefined;
}

/** First non-empty author list, mapped to CSL names. */
function firstNames(
  fields: CitationFields,
  keys: string[]
): CslName[] | undefined {
  for (const key of keys) {
    const names = toCslNames(field<Author[]>(fields, key));
    if (names) return names;
  }
  return undefined;
}

/** The container ("in") title varies by source type. */
function containerTitle(fields: CitationFields): string | undefined {
  const t = fields.sourceType;
  const byType: Partial<Record<SourceType, string>> = {
    journal: 'journalTitle',
    'book-chapter': 'bookTitle',
    newspaper: 'newspaperTitle',
    blog: 'blogName',
    encyclopedia: 'encyclopediaTitle',
    'conference-paper': 'proceedingsTitle',
    'tv-episode': 'seriesTitle',
    'podcast-episode': 'showName',
    song: 'album',
    album: 'album',
    website: 'siteName',
    'social-media': 'platform',
    video: 'platform',
    preprint: 'repository',
    dataset: 'repository',
    software: 'repository',
  };
  const key = byType[t];
  return key ? field(fields, key) : undefined;
}

/**
 * Convert a single citation's fields into a CSL-JSON item.
 *
 * @param fields - OpenCitation citation fields
 * @param id - the CSL item id (referenced by citeproc); defaults to "ITEM-1"
 */
export function toCslJson(fields: CitationFields, id = 'ITEM-1'): CslJson {
  const item: CslJson = {
    id,
    type: TYPE_MAP[fields.sourceType] || 'document',
  };

  // Title (+ subtitle)
  let title = fields.title || field<string>(fields, 'chapterTitle') || '';
  if (fields.subtitle) title = title ? `${title}: ${fields.subtitle}` : fields.subtitle;
  if (title) item.title = title;

  // Creators — prefer the generic authors, fall back to type-specific roles
  const author = firstNames(fields, [
    'authors',
    'directors',
    'creators',
    'performers',
    'artists',
    'interviewee',
    'host',
  ]);
  if (author) item.author = author;

  const editor = firstNames(fields, ['editors', 'bookEditors']);
  if (editor) item.editor = editor;

  const translator = toCslNames(fields.translators);
  if (translator) item.translator = translator;

  const director = firstNames(fields, ['directors']);
  if (director && fields.sourceType !== 'film') item.director = director;

  const composer = firstNames(fields, ['composers']);
  if (composer) item.composer = composer;

  const interviewer = firstNames(fields, ['interviewer']);
  if (interviewer) item.interviewer = interviewer;

  // Container
  const container = containerTitle(fields);
  if (container) item['container-title'] = container;

  // Dates
  const issued = toCslDate(fields.publicationDate || field<CitationDate>(fields, 'airDate'));
  if (issued) item.issued = issued;
  const accessed = toCslDate(fields.accessDate);
  if (accessed) item.accessed = accessed;

  // Publication facts
  const publisher =
    fields.publisher ||
    field<string>(fields, 'institution') ||
    field<string>(fields, 'agency') ||
    field<string>(fields, 'productionCompany') ||
    field<string>(fields, 'network') ||
    field<string>(fields, 'studio') ||
    field<string>(fields, 'label') ||
    field<string>(fields, 'company');
  if (publisher) item.publisher = publisher;

  const place =
    fields.publicationPlace ||
    field<string>(fields, 'city') ||
    field<string>(fields, 'conferenceLocation');
  if (place) item['publisher-place'] = place;

  // Locators
  const page = field<string>(fields, 'pageRange');
  if (page) item.page = page;
  const totalPages = field<number>(fields, 'totalPages');
  if (totalPages != null) item['number-of-pages'] = String(totalPages);
  const volume = field<string>(fields, 'volume');
  if (volume) item.volume = volume;
  const issue = field<string>(fields, 'issue');
  if (issue) item.issue = issue;
  const number =
    field<string>(fields, 'articleNumber') ||
    field<string>(fields, 'reportNumber') ||
    field<string>(fields, 'docketNumber');
  if (number) item.number = number;
  const edition = field<string>(fields, 'edition');
  if (edition) item.edition = edition;

  // Series / collection
  const series = field<string>(fields, 'series');
  if (series) item['collection-title'] = series;
  const seriesNumber = field<string>(fields, 'seriesNumber');
  if (seriesNumber) item['collection-number'] = seriesNumber;

  // Identifiers / access
  if (fields.doi) item.DOI = fields.doi;
  if (fields.url) item.URL = fields.url;
  const isbn = field<string>(fields, 'isbn');
  if (isbn) item.ISBN = isbn;
  const issn = field<string>(fields, 'issn');
  if (issn) item.ISSN = issn;
  if (fields.language) item.language = fields.language;

  // Descriptive
  const genre =
    field<string>(fields, 'degree') ||
    field<string>(fields, 'postType') ||
    field<string>(fields, 'interviewType') ||
    (fields.sourceType === 'preprint' ? 'preprint' : undefined);
  if (genre) item.genre = genre;
  const medium = field<string>(fields, 'medium') || field<string>(fields, 'format');
  if (medium && typeof medium === 'string') item.medium = medium;
  const dimensions = field<string>(fields, 'dimensions');
  if (dimensions) item.dimensions = dimensions;
  const version = field<string>(fields, 'version');
  if (version) item.version = version;

  // Event (conference)
  const event = field<string>(fields, 'conferenceName');
  if (event) item.event = event;

  // Archive (museums, collections)
  const archive = field<string>(fields, 'museum') || field<string>(fields, 'collection');
  if (archive) item.archive = archive;
  const archiveLocation =
    field<string>(fields, 'inventoryNumber') ||
    field<string>(fields, 'databaseAccessionNumber');
  if (archiveLocation) item.archive_location = archiveLocation;

  // Legal
  const court = field<string>(fields, 'court');
  if (court) item.authority = court;

  return item;
}
