/**
 * Chicago 17th Edition Citation Formatter (Bibliography Style)
 * Chicago Manual of Style - Notes-Bibliography format
 *
 * Bibliography format: Last, First. Title. Place: Publisher, Year.
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
  formatAuthorsChicago,
  formatDateChicago,
  formatUrl,
  escapeHtml,
  italic,
} from '../utils';

/**
 * Format a citation in Chicago 17th style (Bibliography)
 */
export function formatChicago(fields: CitationFields): FormattedCitation {
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
 * Book format:
 * Last, First. Title: Subtitle. Place: Publisher, Year.
 */
function formatBook(fields: BookFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsChicago(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  }

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Editors (if anthology or edited volume)
  if (fields.editors && fields.editors.length > 0 && (!fields.authors || fields.authors.length === 0)) {
    const editors = formatAuthorsChicago(fields.editors);
    parts.push(`Edited by ${editors}.`);
    htmlParts.push(`Edited by ${escapeHtml(editors)}.`);
  }

  // Edition
  if (fields.edition) {
    parts.push(`${fields.edition}.`);
    htmlParts.push(`${escapeHtml(fields.edition)}.`);
  }

  // Place: Publisher, Year
  const pubParts: string[] = [];
  if (fields.publicationPlace) {
    pubParts.push(fields.publicationPlace);
  }
  if (fields.publisher) {
    if (pubParts.length > 0) {
      pubParts.push(`: ${fields.publisher}`);
    } else {
      pubParts.push(fields.publisher);
    }
  }
  if (fields.publicationDate?.year) {
    if (pubParts.length > 0) {
      pubParts.push(`, ${fields.publicationDate.year}`);
    } else {
      pubParts.push(`${fields.publicationDate.year}`);
    }
  }

  if (pubParts.length > 0) {
    const pubStr = `${pubParts.join('')  }.`;
    parts.push(pubStr);
    htmlParts.push(escapeHtml(pubStr));
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Journal article format:
 * Last, First. "Article Title." Journal Title Volume, no. Issue (Year): Pages.
 */
function formatJournal(fields: JournalFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsChicago(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  }

  // Article title (in quotes)
  let articleTitle = fields.title;
  if (fields.subtitle) {
    articleTitle += `: ${fields.subtitle}`;
  }
  parts.push(`"${articleTitle}."`);
  htmlParts.push(`"${escapeHtml(articleTitle)}."`);

  // Journal title and volume/issue
  let journalInfo = fields.journalTitle;
  if (fields.volume) {
    journalInfo += ` ${fields.volume}`;
  }
  if (fields.issue) {
    journalInfo += `, no. ${fields.issue}`;
  }

  // Year
  if (fields.publicationDate?.year) {
    journalInfo += ` (${fields.publicationDate.year})`;
  }

  // Pages
  if (fields.pageRange) {
    journalInfo += `: ${fields.pageRange}`;
  }

  parts.push(`${journalInfo}.`);
  htmlParts.push(`${italic(escapeHtml(fields.journalTitle))}${journalInfo.replace(fields.journalTitle, '')}.`);

  // DOI
  if (fields.doi) {
    const doiUrl = fields.doi.startsWith('http') ? fields.doi : `https://doi.org/${fields.doi}`;
    parts.push(doiUrl);
    htmlParts.push(`<a href="${doiUrl}">${escapeHtml(doiUrl)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Website format:
 * Last, First. "Page Title." Site Name. Month Day, Year. URL.
 */
function formatWebsite(fields: WebsiteFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsChicago(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  }

  // Page title (in quotes)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`"${title}."`);
  htmlParts.push(`"${escapeHtml(title)}."`);

  // Site name (italicized if different from author)
  if (fields.siteName) {
    parts.push(`${fields.siteName}.`);
    htmlParts.push(`${italic(escapeHtml(fields.siteName))}.`);
  }

  // Date
  if (fields.publicationDate) {
    const date = formatDateChicago(fields.publicationDate);
    if (date) {
      parts.push(`${date}.`);
      htmlParts.push(`${date}.`);
    }
  }

  // Access date (Chicago recommends including)
  if (fields.accessDate) {
    const accessDate = formatDateChicago(fields.accessDate);
    parts.push(`Accessed ${accessDate}.`);
    htmlParts.push(`Accessed ${accessDate}.`);
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(url);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Blog format:
 * Last, First. "Post Title." Blog Name (blog). Month Day, Year. URL.
 */
function formatBlog(fields: BlogFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsChicago(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  }

  // Post title (in quotes)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`"${title}."`);
  htmlParts.push(`"${escapeHtml(title)}."`);

  // Blog name with (blog) indicator
  parts.push(`${fields.blogName} (blog).`);
  htmlParts.push(`${italic(escapeHtml(fields.blogName))} (blog).`);

  // Date
  if (fields.publicationDate) {
    const date = formatDateChicago(fields.publicationDate);
    if (date) {
      parts.push(`${date}.`);
      htmlParts.push(`${date}.`);
    }
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(url);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Newspaper format:
 * Last, First. "Article Title." Newspaper Title, Month Day, Year.
 */
function formatNewspaper(fields: NewspaperFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsChicago(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  }

  // Article title (in quotes)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`"${title}."`);
  htmlParts.push(`"${escapeHtml(title)}."`);

  // Newspaper title (italicized) and date
  const newspaper = fields.newspaperTitle;
  parts.push(`${newspaper},`);
  htmlParts.push(`${italic(escapeHtml(newspaper))},`);

  // Date
  if (fields.publicationDate) {
    const date = formatDateChicago(fields.publicationDate);
    if (date) {
      parts.push(`${date}.`);
      htmlParts.push(`${date}.`);
    }
  }

  // Section and pages (optional)
  if (fields.section) {
    parts.push(`${fields.section} section.`);
    htmlParts.push(`${escapeHtml(fields.section)} section.`);
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(url);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Video format:
 * Last, First or Channel. "Video Title." Platform video, Duration. Month Day, Year. URL.
 */
function formatVideo(fields: VideoFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Author or channel
  const authors = formatAuthorsChicago(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  } else if (fields.channelName) {
    parts.push(`${fields.channelName}.`);
    htmlParts.push(`${escapeHtml(fields.channelName)}.`);
  }

  // Video title (in quotes)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`"${title}."`);
  htmlParts.push(`"${escapeHtml(title)}."`);

  // Platform and duration
  if (fields.platform) {
    let platformStr = `${fields.platform} video`;
    if (fields.duration) {
      platformStr += `, ${fields.duration}`;
    }
    parts.push(`${platformStr}.`);
    htmlParts.push(`${escapeHtml(platformStr)}.`);
  }

  // Date
  const date = formatDateChicago(fields.uploadDate || fields.publicationDate);
  if (date) {
    parts.push(`${date}.`);
    htmlParts.push(`${date}.`);
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(url);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Image format:
 * Last, First. Title. Year. Medium. Dimensions. Museum, Location.
 */
function formatImage(fields: ImageFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Artist
  const authors = formatAuthorsChicago(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  }

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Year
  if (fields.publicationDate?.year) {
    parts.push(`${fields.publicationDate.year}.`);
    htmlParts.push(`${fields.publicationDate.year}.`);
  }

  // Medium and dimensions
  if (fields.medium) {
    let mediumStr = fields.medium;
    if (fields.dimensions) {
      mediumStr += `, ${fields.dimensions}`;
    }
    parts.push(`${mediumStr}.`);
    htmlParts.push(`${escapeHtml(mediumStr)}.`);
  }

  // Museum/Collection, Location
  if (fields.museum || fields.collection) {
    let location = fields.museum || fields.collection || '';
    if (fields.location) {
      location += `, ${fields.location}`;
    }
    parts.push(`${location}.`);
    htmlParts.push(`${escapeHtml(location)}.`);
  }

  // URL (for online images)
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(url);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Film format:
 * Title. Directed by Director. Production Company, Year.
 */
function formatFilm(fields: FilmFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Director(s)
  if (fields.directors && fields.directors.length > 0) {
    const directors = formatAuthorsChicago(fields.directors);
    parts.push(`Directed by ${directors}.`);
    htmlParts.push(`Directed by ${escapeHtml(directors)}.`);
  }

  // Production company and year
  const pubParts: string[] = [];
  if (fields.productionCompany) {
    pubParts.push(fields.productionCompany);
  }
  if (fields.publicationDate?.year) {
    pubParts.push(`${fields.publicationDate.year}`);
  }

  if (pubParts.length > 0) {
    parts.push(`${pubParts.join(', ')}.`);
    htmlParts.push(`${escapeHtml(pubParts.join(', '))}.`);
  }

  // Format/streaming service
  if (fields.streamingService) {
    parts.push(`${fields.streamingService}.`);
    htmlParts.push(`${escapeHtml(fields.streamingService)}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * TV Series format:
 * Title. Created by Creator. Network, Years.
 */
function formatTVSeries(fields: TVSeriesFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Creator(s)
  if (fields.creators && fields.creators.length > 0) {
    const creators = formatAuthorsChicago(fields.creators);
    parts.push(`Created by ${creators}.`);
    htmlParts.push(`Created by ${escapeHtml(creators)}.`);
  }

  // Network and years
  const pubParts: string[] = [];
  if (fields.network || fields.streamingService) {
    pubParts.push(fields.streamingService || fields.network || '');
  }

  if (fields.yearStart) {
    let years = `${fields.yearStart}`;
    if (fields.yearEnd) {
      years += `–${fields.yearEnd}`;
    } else {
      years += '–';
    }
    pubParts.push(years);
  }

  if (pubParts.length > 0) {
    parts.push(`${pubParts.join(', ')}.`);
    htmlParts.push(`${escapeHtml(pubParts.join(', '))}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * TV Episode format:
 * "Episode Title." Series Title. Season X, episode X. Directed by Director. Network. Original air date.
 */
function formatTVEpisode(fields: TVEpisodeFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Episode title (in quotes)
  let episodeTitle = fields.episodeTitle || fields.title;
  if (fields.subtitle) {
    episodeTitle += `: ${fields.subtitle}`;
  }
  parts.push(`"${episodeTitle}."`);
  htmlParts.push(`"${escapeHtml(episodeTitle)}."`);

  // Series title (italicized)
  parts.push(`${fields.seriesTitle}.`);
  htmlParts.push(`${italic(escapeHtml(fields.seriesTitle))}.`);

  // Season and episode
  const seInfo: string[] = [];
  if (fields.season) {
    seInfo.push(`Season ${fields.season}`);
  }
  if (fields.episodeNumber) {
    seInfo.push(`episode ${fields.episodeNumber}`);
  }
  if (seInfo.length > 0) {
    parts.push(`${seInfo.join(', ')}.`);
    htmlParts.push(`${seInfo.join(', ')}.`);
  }

  // Director(s)
  if (fields.directors && fields.directors.length > 0) {
    const directors = formatAuthorsChicago(fields.directors);
    parts.push(`Directed by ${directors}.`);
    htmlParts.push(`Directed by ${escapeHtml(directors)}.`);
  }

  // Writers
  if (fields.writers && fields.writers.length > 0) {
    const writers = formatAuthorsChicago(fields.writers);
    parts.push(`Written by ${writers}.`);
    htmlParts.push(`Written by ${escapeHtml(writers)}.`);
  }

  // Network
  if (fields.network || fields.streamingService) {
    const platform = fields.streamingService || fields.network || '';
    parts.push(`${platform}.`);
    htmlParts.push(`${escapeHtml(platform)}.`);
  }

  // Air date
  if (fields.airDate || fields.publicationDate) {
    const date = formatDateChicago(fields.airDate || fields.publicationDate);
    if (date) {
      parts.push(`Aired ${date}.`);
      htmlParts.push(`Aired ${date}.`);
    }
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Miscellaneous format:
 * Author. Title. Description. Publisher, Year. URL.
 */
function formatMiscellaneous(fields: MiscellaneousFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsChicago(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  }

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Description/Format
  if (fields.description || fields.format || fields.medium) {
    const descriptor = fields.description || fields.format || fields.medium || '';
    parts.push(`${descriptor}.`);
    htmlParts.push(`${escapeHtml(descriptor)}.`);
  }

  // Publisher and year
  const pubParts: string[] = [];
  if (fields.publisher) {
    pubParts.push(fields.publisher);
  }
  if (fields.publicationDate?.year) {
    pubParts.push(`${fields.publicationDate.year}`);
  }

  if (pubParts.length > 0) {
    parts.push(`${pubParts.join(', ')}.`);
    htmlParts.push(`${escapeHtml(pubParts.join(', '))}.`);
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(url);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

export default formatChicago;
