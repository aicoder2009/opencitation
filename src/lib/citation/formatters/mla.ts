/**
 * MLA 9th Edition Citation Formatter
 * Modern Language Association style guide
 *
 * MLA 9 uses a "core elements" approach:
 * Author. "Title of Source." Title of Container, Other contributors, Version,
 * Number, Publisher, Publication Date, Location.
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
  formatAuthorsMLA,
  formatDateMLA,
  formatUrl,
  escapeHtml,
  italic,
} from '../utils';

/**
 * Format a citation in MLA 9th style
 */
export function formatMLA(fields: CitationFields): FormattedCitation {
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
 * Author. Title. Publisher, Year.
 */
function formatBook(fields: BookFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsMLA(fields.authors || []);
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

  // Editors (if different from authors)
  if (fields.editors && fields.editors.length > 0) {
    const editors = formatAuthorsMLA(fields.editors);
    parts.push(`Edited by ${editors},`);
    htmlParts.push(`Edited by ${escapeHtml(editors)},`);
  }

  // Edition
  if (fields.edition) {
    parts.push(`${fields.edition},`);
    htmlParts.push(`${escapeHtml(fields.edition)},`);
  }

  // Publisher
  if (fields.publisher) {
    parts.push(`${fields.publisher},`);
    htmlParts.push(`${escapeHtml(fields.publisher)},`);
  }

  // Year
  if (fields.publicationDate?.year) {
    parts.push(`${fields.publicationDate.year}.`);
    htmlParts.push(`${fields.publicationDate.year}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Journal article format:
 * Author. "Article Title." Journal Title, vol. X, no. X, Year, pp. X-X.
 */
function formatJournal(fields: JournalFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsMLA(fields.authors || []);
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

  // Journal title (italicized)
  const journalInfo = fields.journalTitle;
  parts.push(`${journalInfo},`);
  htmlParts.push(`${italic(escapeHtml(journalInfo))},`);

  // Volume and issue
  if (fields.volume) {
    parts.push(`vol. ${fields.volume},`);
    htmlParts.push(`vol. ${fields.volume},`);
  }
  if (fields.issue) {
    parts.push(`no. ${fields.issue},`);
    htmlParts.push(`no. ${fields.issue},`);
  }

  // Year
  if (fields.publicationDate?.year) {
    parts.push(`${fields.publicationDate.year},`);
    htmlParts.push(`${fields.publicationDate.year},`);
  }

  // Pages
  if (fields.pageRange) {
    parts.push(`pp. ${fields.pageRange}.`);
    htmlParts.push(`pp. ${fields.pageRange}.`);
  } else {
    // Remove trailing comma and add period
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

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
 * Author. "Page Title." Website Name, Day Month Year, URL.
 */
function formatWebsite(fields: WebsiteFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsMLA(fields.authors || []);
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

  // Site name (italicized) - if different from author
  if (fields.siteName && fields.siteName !== authors) {
    parts.push(`${fields.siteName},`);
    htmlParts.push(`${italic(escapeHtml(fields.siteName))},`);
  }

  // Date
  if (fields.publicationDate) {
    const date = formatDateMLA(fields.publicationDate);
    if (date) {
      parts.push(`${date},`);
      htmlParts.push(`${date},`);
    }
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(`${url}.`);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>.`);
  } else {
    // Remove trailing comma and add period
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

  // Access date (optional in MLA 9)
  if (fields.accessDate) {
    const accessDate = formatDateMLA(fields.accessDate);
    parts.push(`Accessed ${accessDate}.`);
    htmlParts.push(`Accessed ${accessDate}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Blog format:
 * Author. "Post Title." Blog Name, Day Month Year, URL.
 */
function formatBlog(fields: BlogFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsMLA(fields.authors || []);
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

  // Blog name (italicized)
  parts.push(`${fields.blogName},`);
  htmlParts.push(`${italic(escapeHtml(fields.blogName))},`);

  // Date
  if (fields.publicationDate) {
    const date = formatDateMLA(fields.publicationDate);
    if (date) {
      parts.push(`${date},`);
      htmlParts.push(`${date},`);
    }
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(`${url}.`);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>.`);
  } else {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Newspaper format:
 * Author. "Article Title." Newspaper Title, Day Month Year, pp. X-X.
 */
function formatNewspaper(fields: NewspaperFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsMLA(fields.authors || []);
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

  // Newspaper title (italicized)
  parts.push(`${fields.newspaperTitle},`);
  htmlParts.push(`${italic(escapeHtml(fields.newspaperTitle))},`);

  // Date
  if (fields.publicationDate) {
    const date = formatDateMLA(fields.publicationDate);
    if (date) {
      parts.push(`${date},`);
      htmlParts.push(`${date},`);
    }
  }

  // Pages
  if (fields.pageRange) {
    parts.push(`pp. ${fields.pageRange}.`);
    htmlParts.push(`pp. ${fields.pageRange}.`);
  } else if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(`${url}.`);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>.`);
  } else {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Video format:
 * "Video Title." Platform, uploaded by Channel Name, Day Month Year, URL.
 */
function formatVideo(fields: VideoFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Video title (in quotes)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`"${title}."`);
  htmlParts.push(`"${escapeHtml(title)}."`);

  // Platform (italicized)
  if (fields.platform) {
    parts.push(`${fields.platform},`);
    htmlParts.push(`${italic(escapeHtml(fields.platform))},`);
  }

  // Channel/uploader
  if (fields.channelName) {
    parts.push(`uploaded by ${fields.channelName},`);
    htmlParts.push(`uploaded by ${escapeHtml(fields.channelName)},`);
  } else if (fields.authors && fields.authors.length > 0) {
    const authors = formatAuthorsMLA(fields.authors);
    parts.push(`uploaded by ${authors},`);
    htmlParts.push(`uploaded by ${escapeHtml(authors)},`);
  }

  // Date
  const date = formatDateMLA(fields.uploadDate || fields.publicationDate);
  if (date) {
    parts.push(`${date},`);
    htmlParts.push(`${date},`);
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(`${url}.`);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>.`);
  } else {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Image format:
 * Artist. Title. Year. Medium. Museum, Location.
 */
function formatImage(fields: ImageFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Artist/Author
  const authors = formatAuthorsMLA(fields.authors || []);
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

  // Medium
  if (fields.medium) {
    parts.push(`${fields.medium}.`);
    htmlParts.push(`${escapeHtml(fields.medium)}.`);
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
    parts.push(`${url}.`);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Film format:
 * Title. Directed by Director Name, Production Company, Year.
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
    const directors = formatAuthorsMLA(fields.directors);
    parts.push(`Directed by ${directors},`);
    htmlParts.push(`Directed by ${escapeHtml(directors)},`);
  }

  // Production company
  if (fields.productionCompany) {
    parts.push(`${fields.productionCompany},`);
    htmlParts.push(`${escapeHtml(fields.productionCompany)},`);
  }

  // Year
  if (fields.publicationDate?.year) {
    parts.push(`${fields.publicationDate.year}.`);
    htmlParts.push(`${fields.publicationDate.year}.`);
  } else {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * TV Series format:
 * Title. Created by Creator Name, Network, Years.
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
    const creators = formatAuthorsMLA(fields.creators);
    parts.push(`Created by ${creators},`);
    htmlParts.push(`Created by ${escapeHtml(creators)},`);
  }

  // Network or streaming service
  if (fields.network || fields.streamingService) {
    const platform = fields.streamingService || fields.network || '';
    parts.push(`${platform},`);
    htmlParts.push(`${escapeHtml(platform)},`);
  }

  // Years
  if (fields.yearStart) {
    let years = `${fields.yearStart}`;
    if (fields.yearEnd) {
      years += `–${fields.yearEnd}`;
    } else {
      years += '–';
    }
    parts.push(`${years}.`);
    htmlParts.push(`${years}.`);
  } else {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * TV Episode format:
 * "Episode Title." Series Title, created by Creator, season X, episode X, Network, Day Month Year.
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
  parts.push(`${fields.seriesTitle},`);
  htmlParts.push(`${italic(escapeHtml(fields.seriesTitle))},`);

  // Writers (if relevant)
  if (fields.writers && fields.writers.length > 0) {
    const writers = formatAuthorsMLA(fields.writers);
    parts.push(`written by ${writers},`);
    htmlParts.push(`written by ${escapeHtml(writers)},`);
  }

  // Directors
  if (fields.directors && fields.directors.length > 0) {
    const directors = formatAuthorsMLA(fields.directors);
    parts.push(`directed by ${directors},`);
    htmlParts.push(`directed by ${escapeHtml(directors)},`);
  }

  // Season and episode
  if (fields.season) {
    parts.push(`season ${fields.season},`);
    htmlParts.push(`season ${fields.season},`);
  }
  if (fields.episodeNumber) {
    parts.push(`episode ${fields.episodeNumber},`);
    htmlParts.push(`episode ${fields.episodeNumber},`);
  }

  // Network or streaming service
  if (fields.network || fields.streamingService) {
    const platform = fields.streamingService || fields.network || '';
    parts.push(`${platform},`);
    htmlParts.push(`${escapeHtml(platform)},`);
  }

  // Air date
  if (fields.airDate || fields.publicationDate) {
    const date = formatDateMLA(fields.airDate || fields.publicationDate);
    if (date) {
      parts.push(`${date}.`);
      htmlParts.push(`${date}.`);
    } else {
      parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
      htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
    }
  } else {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * Miscellaneous format:
 * Author. Title. Publisher, Year.
 */
function formatMiscellaneous(fields: MiscellaneousFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsMLA(fields.authors || []);
  if (authors) {
    parts.push(`${authors}.`);
    htmlParts.push(`${escapeHtml(authors)}.`);
  }

  // Title (italicized if standalone work)
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

  // Publisher
  if (fields.publisher) {
    parts.push(`${fields.publisher},`);
    htmlParts.push(`${escapeHtml(fields.publisher)},`);
  }

  // Year
  if (fields.publicationDate?.year) {
    parts.push(`${fields.publicationDate.year}.`);
    htmlParts.push(`${fields.publicationDate.year}.`);
  } else if (parts[parts.length - 1].endsWith(',')) {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/,$/, '.');
    htmlParts[htmlParts.length - 1] = htmlParts[htmlParts.length - 1].replace(/,$/, '.');
  }

  // URL
  if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(`${url}.`);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

export default formatMLA;
