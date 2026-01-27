/**
 * Harvard Citation Formatter
 * Harvard Referencing Style
 *
 * Format: Author (Year) Title. Place: Publisher.
 */

import type {
  CitationFields,
  FormattedCitation,
  BookFields,
  JournalFields,
  WebsiteFields,
  BlogFields,
  NewspaperFields,
  VideoFields,
  ImageFields,
  FilmFields,
  TVSeriesFields,
  TVEpisodeFields,
  MiscellaneousFields,
} from '@/types/citation';

import {
  formatAuthorsHarvard,
  formatDateHarvard,
  formatUrl,
  escapeHtml,
  italic,
} from '../utils';

/**
 * Format a citation in Harvard style
 */
export function formatHarvard(fields: CitationFields): FormattedCitation {
  switch (fields.sourceType) {
    case 'book':
      return formatBook(fields);
    case 'journal':
      return formatJournal(fields);
    case 'website':
      return formatWebsite(fields);
    case 'blog':
      return formatBlog(fields);
    case 'newspaper':
      return formatNewspaper(fields);
    case 'video':
      return formatVideo(fields);
    case 'image':
      return formatImage(fields);
    case 'film':
      return formatFilm(fields);
    case 'tv-series':
      return formatTVSeries(fields);
    case 'tv-episode':
      return formatTVEpisode(fields);
    case 'miscellaneous':
      return formatMiscellaneous(fields);
    default:
      return { text: '', html: '' };
  }
}

/**
 * Get year for Harvard format
 */
function getYear(fields: { publicationDate?: { year?: number } }): string {
  return fields.publicationDate?.year ? `(${fields.publicationDate.year})` : '(n.d.)';
}

/**
 * Book format:
 * Author (Year) Title. Edition. Place: Publisher.
 */
function formatBook(fields: BookFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsHarvard(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Year
  const year = getYear(fields);
  parts.push(year);
  htmlParts.push(year);

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Edition
  if (fields.edition) {
    parts.push(`${fields.edition}.`);
    htmlParts.push(`${escapeHtml(fields.edition)}.`);
  }

  // Place: Publisher
  if (fields.publicationPlace || fields.publisher) {
    let pubStr = '';
    if (fields.publicationPlace) {
      pubStr = fields.publicationPlace;
      if (fields.publisher) {
        pubStr += `: ${fields.publisher}`;
      }
    } else if (fields.publisher) {
      pubStr = fields.publisher;
    }
    parts.push(`${pubStr}.`);
    htmlParts.push(`${escapeHtml(pubStr)}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Journal article format:
 * Author (Year) 'Article Title', Journal Title, Volume(Issue), pp. Pages.
 */
function formatJournal(fields: JournalFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsHarvard(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Year
  const year = getYear(fields);
  parts.push(year);
  htmlParts.push(year);

  // Article title (in single quotes)
  let articleTitle = fields.title;
  if (fields.subtitle) {
    articleTitle += `: ${fields.subtitle}`;
  }
  parts.push(`'${articleTitle}',`);
  htmlParts.push(`'${escapeHtml(articleTitle)}',`);

  // Journal title (italicized)
  let journalInfo = fields.journalTitle;

  // Volume and issue
  if (fields.volume) {
    journalInfo += `, ${fields.volume}`;
    if (fields.issue) {
      journalInfo += `(${fields.issue})`;
    }
  }

  // Pages
  if (fields.pageRange) {
    journalInfo += `, pp. ${fields.pageRange}`;
  }

  parts.push(`${journalInfo}.`);

  // HTML with italicized journal title
  let journalHtml = italic(escapeHtml(fields.journalTitle));
  if (fields.volume) {
    journalHtml += `, ${fields.volume}`;
    if (fields.issue) {
      journalHtml += `(${fields.issue})`;
    }
  }
  if (fields.pageRange) {
    journalHtml += `, pp. ${fields.pageRange}`;
  }
  htmlParts.push(`${journalHtml}.`);

  // DOI
  if (fields.doi) {
    const doiUrl = fields.doi.startsWith('http') ? fields.doi : `https://doi.org/${fields.doi}`;
    parts.push(`doi: ${fields.doi}`);
    htmlParts.push(`doi: <a href="${doiUrl}">${escapeHtml(fields.doi)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Website format:
 * Author (Year) Title. Available at: URL (Accessed: Date).
 */
function formatWebsite(fields: WebsiteFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors or site name
  const authors = formatAuthorsHarvard(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  } else if (fields.siteName) {
    parts.push(fields.siteName);
    htmlParts.push(escapeHtml(fields.siteName));
  }

  // Year
  const year = getYear(fields);
  parts.push(year);
  htmlParts.push(year);

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Site name (if not used as author)
  if (fields.siteName && authors) {
    parts.push(`[Online]. ${fields.siteName}.`);
    htmlParts.push(`[Online]. ${escapeHtml(fields.siteName)}.`);
  } else {
    parts.push('[Online].');
    htmlParts.push('[Online].');
  }

  // URL and access date
  if (fields.url) {
    const url = formatUrl(fields.url);
    let availableStr = `Available at: ${url}`;
    let availableHtml = `Available at: <a href="${url}">${escapeHtml(url)}</a>`;

    if (fields.accessDate) {
      const accessDate = formatDateHarvard(fields.accessDate);
      availableStr += ` (Accessed: ${accessDate})`;
      availableHtml += ` (Accessed: ${accessDate})`;
    }

    parts.push(availableStr);
    htmlParts.push(availableHtml);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Blog format:
 * Author (Year) 'Post Title', Blog Name [Blog]. Date. Available at: URL (Accessed: Date).
 */
function formatBlog(fields: BlogFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsHarvard(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Year
  const year = getYear(fields);
  parts.push(year);
  htmlParts.push(year);

  // Post title (in single quotes)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`'${title}',`);
  htmlParts.push(`'${escapeHtml(title)}',`);

  // Blog name
  parts.push(`${fields.blogName} [Blog].`);
  htmlParts.push(`${italic(escapeHtml(fields.blogName))} [Blog].`);

  // Full date
  if (fields.publicationDate) {
    const date = formatDateHarvard(fields.publicationDate);
    parts.push(`${date}.`);
    htmlParts.push(`${date}.`);
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    let availableStr = `Available at: ${url}`;
    let availableHtml = `Available at: <a href="${url}">${escapeHtml(url)}</a>`;

    if (fields.accessDate) {
      const accessDate = formatDateHarvard(fields.accessDate);
      availableStr += ` (Accessed: ${accessDate})`;
      availableHtml += ` (Accessed: ${accessDate})`;
    }

    parts.push(availableStr);
    htmlParts.push(availableHtml);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Newspaper format:
 * Author (Year) 'Article Title', Newspaper Title, Date, pp. Pages.
 */
function formatNewspaper(fields: NewspaperFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsHarvard(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Year
  const year = getYear(fields);
  parts.push(year);
  htmlParts.push(year);

  // Article title (in single quotes)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`'${title}',`);
  htmlParts.push(`'${escapeHtml(title)}',`);

  // Newspaper title (italicized)
  parts.push(`${fields.newspaperTitle},`);
  htmlParts.push(`${italic(escapeHtml(fields.newspaperTitle))},`);

  // Full date
  if (fields.publicationDate) {
    const date = formatDateHarvard(fields.publicationDate);
    if (fields.pageRange) {
      parts.push(`${date}, pp. ${fields.pageRange}.`);
      htmlParts.push(`${date}, pp. ${fields.pageRange}.`);
    } else {
      parts.push(`${date}.`);
      htmlParts.push(`${date}.`);
    }
  } else if (fields.pageRange) {
    parts.push(`pp. ${fields.pageRange}.`);
    htmlParts.push(`pp. ${fields.pageRange}.`);
  }

  // URL for online newspapers
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(`Available at: ${url}`);
    htmlParts.push(`Available at: <a href="${url}">${escapeHtml(url)}</a>`);

    if (fields.accessDate) {
      const accessDate = formatDateHarvard(fields.accessDate);
      parts.push(`(Accessed: ${accessDate})`);
      htmlParts.push(`(Accessed: ${accessDate})`);
    }
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Video format:
 * Author/Channel (Year) Title. [Video]. Platform. Available at: URL (Accessed: Date).
 */
function formatVideo(fields: VideoFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Author or channel
  const authors = formatAuthorsHarvard(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  } else if (fields.channelName) {
    parts.push(fields.channelName);
    htmlParts.push(escapeHtml(fields.channelName));
  }

  // Year
  const date = fields.uploadDate || fields.publicationDate;
  const year = date?.year ? `(${date.year})` : '(n.d.)';
  parts.push(year);
  htmlParts.push(year);

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // [Video] and platform
  if (fields.platform) {
    parts.push(`[Video]. ${fields.platform}.`);
    htmlParts.push(`[Video]. ${escapeHtml(fields.platform)}.`);
  } else {
    parts.push('[Video].');
    htmlParts.push('[Video].');
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    let availableStr = `Available at: ${url}`;
    let availableHtml = `Available at: <a href="${url}">${escapeHtml(url)}</a>`;

    if (fields.accessDate) {
      const accessDate = formatDateHarvard(fields.accessDate);
      availableStr += ` (Accessed: ${accessDate})`;
      availableHtml += ` (Accessed: ${accessDate})`;
    }

    parts.push(availableStr);
    htmlParts.push(availableHtml);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Image format:
 * Artist (Year) Title. [Medium]. Location: Museum/Collection.
 */
function formatImage(fields: ImageFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Artist
  const authors = formatAuthorsHarvard(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Year
  const year = getYear(fields);
  parts.push(year);
  htmlParts.push(year);

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Medium
  if (fields.medium) {
    parts.push(`[${fields.medium}].`);
    htmlParts.push(`[${escapeHtml(fields.medium)}].`);
  }

  // Museum/Collection, Location
  if (fields.museum || fields.collection || fields.location) {
    const locationParts: string[] = [];
    if (fields.location) {
      locationParts.push(fields.location);
    }
    if (fields.museum || fields.collection) {
      locationParts.push(fields.museum || fields.collection || '');
    }
    parts.push(`${locationParts.join(': ')}.`);
    htmlParts.push(`${escapeHtml(locationParts.join(': '))}.`);
  }

  // URL (for online images)
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(`Available at: ${url}`);
    htmlParts.push(`Available at: <a href="${url}">${escapeHtml(url)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Film format:
 * Title (Year) Directed by Director. [Film]. Production Company.
 */
function formatFilm(fields: FilmFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}`);
  htmlParts.push(`${italic(escapeHtml(title))}`);

  // Year
  const year = getYear(fields);
  parts.push(year);
  htmlParts.push(year);

  // Director(s)
  if (fields.directors && fields.directors.length > 0) {
    const directors = formatAuthorsHarvard(fields.directors);
    parts.push(`Directed by ${directors}.`);
    htmlParts.push(`Directed by ${escapeHtml(directors)}.`);
  }

  // [Film]
  parts.push('[Film].');
  htmlParts.push('[Film].');

  // Production company
  if (fields.productionCompany) {
    parts.push(`${fields.productionCompany}.`);
    htmlParts.push(`${escapeHtml(fields.productionCompany)}.`);
  }

  // Streaming service
  if (fields.streamingService) {
    parts.push(`Available on: ${fields.streamingService}.`);
    htmlParts.push(`Available on: ${escapeHtml(fields.streamingService)}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * TV Series format:
 * Title (Year-Year) Created by Creator. [TV Series]. Network/Platform.
 */
function formatTVSeries(fields: TVSeriesFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}`);
  htmlParts.push(`${italic(escapeHtml(title))}`);

  // Years
  if (fields.yearStart) {
    let years = `(${fields.yearStart}`;
    if (fields.yearEnd) {
      years += `-${fields.yearEnd}`;
    } else {
      years += '-present';
    }
    years += ')';
    parts.push(years);
    htmlParts.push(years);
  } else {
    const year = getYear(fields);
    parts.push(year);
    htmlParts.push(year);
  }

  // Creator(s)
  if (fields.creators && fields.creators.length > 0) {
    const creators = formatAuthorsHarvard(fields.creators);
    parts.push(`Created by ${creators}.`);
    htmlParts.push(`Created by ${escapeHtml(creators)}.`);
  }

  // [TV Series]
  parts.push('[TV Series].');
  htmlParts.push('[TV Series].');

  // Network or streaming service
  if (fields.network || fields.streamingService) {
    const platform = fields.streamingService || fields.network || '';
    parts.push(`${platform}.`);
    htmlParts.push(`${escapeHtml(platform)}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * TV Episode format:
 * 'Episode Title' (Year) Series Title, Season X, Episode X. [TV Episode]. Network.
 */
function formatTVEpisode(fields: TVEpisodeFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Episode title (in single quotes)
  let episodeTitle = fields.episodeTitle || fields.title;
  if (fields.subtitle) {
    episodeTitle += `: ${fields.subtitle}`;
  }
  parts.push(`'${episodeTitle}'`);
  htmlParts.push(`'${escapeHtml(episodeTitle)}'`);

  // Year
  const date = fields.airDate || fields.publicationDate;
  const year = date?.year ? `(${date.year})` : '(n.d.)';
  parts.push(year);
  htmlParts.push(year);

  // Series title (italicized)
  let seriesInfo = fields.seriesTitle;

  // Season and episode
  if (fields.season) {
    seriesInfo += `, Season ${fields.season}`;
  }
  if (fields.episodeNumber) {
    seriesInfo += `, Episode ${fields.episodeNumber}`;
  }

  parts.push(`${seriesInfo}.`);
  htmlParts.push(`${italic(escapeHtml(fields.seriesTitle))}${seriesInfo.replace(fields.seriesTitle, '')}.`);

  // [TV Episode]
  parts.push('[TV Episode].');
  htmlParts.push('[TV Episode].');

  // Directors
  if (fields.directors && fields.directors.length > 0) {
    const directors = formatAuthorsHarvard(fields.directors);
    parts.push(`Directed by ${directors}.`);
    htmlParts.push(`Directed by ${escapeHtml(directors)}.`);
  }

  // Network or streaming service
  if (fields.network || fields.streamingService) {
    const platform = fields.streamingService || fields.network || '';
    parts.push(`${platform}.`);
    htmlParts.push(`${escapeHtml(platform)}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Miscellaneous format:
 * Author (Year) Title. [Description]. Publisher. Available at: URL
 */
function formatMiscellaneous(fields: MiscellaneousFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsHarvard(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Year
  const year = getYear(fields);
  parts.push(year);
  htmlParts.push(year);

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Description/Format/Medium
  if (fields.description || fields.format || fields.medium) {
    const descriptor = fields.description || fields.format || fields.medium || '';
    parts.push(`[${descriptor}].`);
    htmlParts.push(`[${escapeHtml(descriptor)}].`);
  }

  // Publisher
  if (fields.publisher) {
    parts.push(`${fields.publisher}.`);
    htmlParts.push(`${escapeHtml(fields.publisher)}.`);
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    let availableStr = `Available at: ${url}`;
    let availableHtml = `Available at: <a href="${url}">${escapeHtml(url)}</a>`;

    if (fields.accessDate) {
      const accessDate = formatDateHarvard(fields.accessDate);
      availableStr += ` (Accessed: ${accessDate})`;
      availableHtml += ` (Accessed: ${accessDate})`;
    }

    parts.push(availableStr);
    htmlParts.push(availableHtml);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

export default formatHarvard;
