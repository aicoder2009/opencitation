import type { CitationFields } from "@/types";

interface CSLName {
  given?: string;
  family: string;
}

interface CSLDate {
  "date-parts": Array<Array<number>>;
}

interface CSLItem {
  id: string;
  type: string;
  title?: string;
  author?: CSLName[];
  editor?: CSLName[];
  issued?: CSLDate;
  publisher?: string;
  "publisher-place"?: string;
  "container-title"?: string;
  volume?: string;
  issue?: string;
  page?: string;
  URL?: string;
  DOI?: string;
  ISBN?: string;
  ISSN?: string;
  edition?: string;
  accessed?: CSLDate;
  language?: string;
}

const TYPE_MAP: Record<string, string> = {
  book: "book",
  journal: "article-journal",
  newspaper: "article-newspaper",
  website: "webpage",
  blog: "post-weblog",
  video: "motion_picture",
  film: "motion_picture",
  "tv-series": "broadcast",
  "tv-episode": "broadcast",
  image: "graphic",
  miscellaneous: "document",
  song: "song",
  album: "song",
  "podcast-episode": "broadcast",
  "video-game": "software",
  artwork: "graphic",
  thesis: "thesis",
  "conference-paper": "paper-conference",
  "book-chapter": "chapter",
  dataset: "dataset",
  software: "software",
  preprint: "article",
  "social-media": "post",
  "ai-generated": "personal_communication",
  interview: "interview",
  "government-report": "report",
  "legal-case": "legal_case",
  encyclopedia: "entry-encyclopedia",
};

function toNames(authors?: Array<{ firstName?: string; lastName: string }>): CSLName[] | undefined {
  if (!authors || authors.length === 0) return undefined;
  return authors.map((a) => ({
    family: a.lastName,
    ...(a.firstName ? { given: a.firstName } : {}),
  }));
}

function toDate(date?: { year?: number; month?: number; day?: number }): CSLDate | undefined {
  if (!date?.year) return undefined;
  const parts: number[] = [date.year];
  if (date.month) {
    parts.push(date.month);
    if (date.day) parts.push(date.day);
  }
  return { "date-parts": [parts] };
}

function toCSLItem(fields: CitationFields, index: number): CSLItem {
  const item: CSLItem = {
    id: `item-${index + 1}`,
    type: TYPE_MAP[fields.sourceType] || "document",
  };

  if (fields.title) item.title = fields.title;

  const authors = toNames(fields.authors);
  if (authors) item.author = authors;

  const editors = toNames(fields.editors);
  if (editors) item.editor = editors;

  const issued = toDate(fields.publicationDate);
  if (issued) item.issued = issued;

  const accessed = toDate(fields.accessDate);
  if (accessed) item.accessed = accessed;

  if (fields.publisher) item.publisher = fields.publisher;
  if (fields.publicationPlace) item["publisher-place"] = fields.publicationPlace;
  if (fields.url) item.URL = fields.url;
  if (fields.doi) item.DOI = fields.doi;
  if (fields.language) item.language = fields.language;

  // container title — journal / newspaper / site / blog / book / show / proceedings
  if ("journalTitle" in fields && fields.journalTitle) {
    item["container-title"] = fields.journalTitle;
  } else if ("newspaperTitle" in fields && fields.newspaperTitle) {
    item["container-title"] = fields.newspaperTitle;
  } else if ("siteName" in fields && fields.siteName) {
    item["container-title"] = fields.siteName;
  } else if ("blogName" in fields && fields.blogName) {
    item["container-title"] = fields.blogName;
  } else if ("seriesTitle" in fields && fields.seriesTitle) {
    item["container-title"] = fields.seriesTitle as string;
  } else if ("bookTitle" in fields && fields.bookTitle) {
    item["container-title"] = fields.bookTitle;
  } else if ("encyclopediaTitle" in fields && fields.encyclopediaTitle) {
    item["container-title"] = fields.encyclopediaTitle;
  } else if ("proceedingsTitle" in fields && fields.proceedingsTitle) {
    item["container-title"] = fields.proceedingsTitle;
  } else if ("showName" in fields && fields.showName) {
    item["container-title"] = fields.showName;
  } else if ("album" in fields && fields.album) {
    item["container-title"] = fields.album as string;
  }

  if ("volume" in fields && fields.volume) item.volume = String(fields.volume);
  if ("issue" in fields && fields.issue) item.issue = String(fields.issue);
  if ("pageRange" in fields && fields.pageRange) item.page = String(fields.pageRange);
  if ("isbn" in fields && fields.isbn) item.ISBN = String(fields.isbn);
  if ("issn" in fields && fields.issn) item.ISSN = String(fields.issn);
  if ("edition" in fields && fields.edition) item.edition = String(fields.edition);

  return item;
}

export function toCSLJSON(citationsList: CitationFields[]): string {
  const items = citationsList.map((f, i) => toCSLItem(f, i));
  return JSON.stringify(items, null, 2);
}
