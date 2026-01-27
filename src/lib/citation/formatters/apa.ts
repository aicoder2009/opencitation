/**
 * APA 7th Edition Citation Formatter
 * American Psychological Association style guide
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
  formatAuthorsAPA,
  formatDateAPA,
  formatDOI,
  formatUrl,
  escapeHtml,
  italic,
  toSentenceCase,
} from '../utils';

/**
 * Format a citation in APA 7th style
 */
export function formatAPA(fields: CitationFields): FormattedCitation {
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
 * Author, A. A. (Year). Title of work: Capital letter also for subtitle (edition). Publisher. DOI or URL
 */
function formatBook(fields: BookFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsAPA(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Date
  const date = formatDateAPA(fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Title (italicized, sentence case)
  let title = toSentenceCase(fields.title);
  if (fields.subtitle) {
    title += `: ${toSentenceCase(fields.subtitle)}`;
  }

  // Edition
  if (fields.edition) {
    title += ` (${fields.edition})`;
  }

  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Publisher
  if (fields.publisher) {
    parts.push(`${fields.publisher}.`);
    htmlParts.push(`${escapeHtml(fields.publisher)}.`);
  }

  // DOI or URL
  if (fields.doi) {
    const doiUrl = formatDOI(fields.doi);
    parts.push(doiUrl);
    htmlParts.push(`<a href="${doiUrl}">${escapeHtml(doiUrl)}</a>`);
  } else if (fields.url) {
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
 * Journal article format:
 * Author, A. A. (Year). Title of article. Title of Periodical, volume(issue), pages. DOI
 */
function formatJournal(fields: JournalFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsAPA(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Date
  const date = formatDateAPA(fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Article title (sentence case, not italicized)
  let articleTitle = toSentenceCase(fields.title);
  if (fields.subtitle) {
    articleTitle += `: ${toSentenceCase(fields.subtitle)}`;
  }
  parts.push(`${articleTitle}.`);
  htmlParts.push(`${escapeHtml(articleTitle)}.`);

  // Journal title (italicized, title case)
  let journalInfo = fields.journalTitle;

  // Volume (italicized) and issue
  if (fields.volume) {
    journalInfo += `, ${fields.volume}`;
    if (fields.issue) {
      journalInfo += `(${fields.issue})`;
    }
  }

  // Pages
  if (fields.pageRange) {
    journalInfo += `, ${fields.pageRange}`;
  } else if (fields.articleNumber) {
    journalInfo += `, Article ${fields.articleNumber}`;
  }

  parts.push(`${journalInfo}.`);

  // HTML with proper formatting
  let journalHtml = italic(escapeHtml(fields.journalTitle));
  if (fields.volume) {
    journalHtml += `, ${italic(fields.volume)}`;
    if (fields.issue) {
      journalHtml += `(${fields.issue})`;
    }
  }
  if (fields.pageRange) {
    journalHtml += `, ${fields.pageRange}`;
  } else if (fields.articleNumber) {
    journalHtml += `, Article ${fields.articleNumber}`;
  }
  htmlParts.push(`${journalHtml}.`);

  // DOI
  if (fields.doi) {
    const doiUrl = formatDOI(fields.doi);
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
 * Author, A. A. (Year, Month Day). Title of page. Site Name. URL
 */
function formatWebsite(fields: WebsiteFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsAPA(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  } else if (fields.siteName) {
    // Use site name as author if no authors
    parts.push(fields.siteName);
    htmlParts.push(escapeHtml(fields.siteName));
  }

  // Date
  const date = formatDateAPA(fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Site name (only if different from author)
  if (fields.siteName && !authors) {
    // Already used as author, skip
  } else if (fields.siteName && authors) {
    parts.push(`${fields.siteName}.`);
    htmlParts.push(`${escapeHtml(fields.siteName)}.`);
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
 * Blog post format:
 * Author, A. A. (Year, Month Day). Title of post. Blog Name. URL
 */
function formatBlog(fields: BlogFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsAPA(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Date
  const date = formatDateAPA(fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Title (italicized)
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title))}.`);

  // Blog name
  parts.push(`${fields.blogName}.`);
  htmlParts.push(`${escapeHtml(fields.blogName)}.`);

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
 * Author, A. A. (Year, Month Day). Title of article. Newspaper Title, pages.
 */
function formatNewspaper(fields: NewspaperFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsAPA(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Date
  const date = formatDateAPA(fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Article title
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  parts.push(`${title}.`);
  htmlParts.push(`${escapeHtml(title)}.`);

  // Newspaper title (italicized)
  let newspaper = fields.newspaperTitle;
  if (fields.pageRange) {
    newspaper += `, ${fields.pageRange}`;
  }
  parts.push(`${newspaper}.`);
  htmlParts.push(`${italic(escapeHtml(fields.newspaperTitle))}${fields.pageRange ? `, ${fields.pageRange}` : ''}.`);

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
 * Author, A. A. [Screen name]. (Year, Month Day). Title of video [Video]. Site Name. URL
 */
function formatVideo(fields: VideoFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors or channel name
  const authors = formatAuthorsAPA(fields.authors || []);
  if (authors) {
    let authorStr = authors;
    if (fields.channelName && authors !== fields.channelName) {
      authorStr += ` [${fields.channelName}]`;
    }
    parts.push(authorStr);
    htmlParts.push(escapeHtml(authorStr));
  } else if (fields.channelName) {
    parts.push(fields.channelName);
    htmlParts.push(escapeHtml(fields.channelName));
  }

  // Date
  const date = formatDateAPA(fields.uploadDate || fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Title [Video]
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  title += ' [Video]';
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title.replace(' [Video]', '')))} [Video].`);

  // Platform
  if (fields.platform) {
    parts.push(`${fields.platform}.`);
    htmlParts.push(`${escapeHtml(fields.platform)}.`);
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
 * Artist, A. A. (Year). Title of work [Medium]. Museum, Location. URL
 */
function formatImage(fields: ImageFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors/artists
  const authors = formatAuthorsAPA(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Date
  const date = formatDateAPA(fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Title [Medium]
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }

  const medium = fields.medium || fields.imageType || 'Image';
  title += ` [${medium}]`;
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title.replace(` [${medium}]`, '')))} [${escapeHtml(medium)}].`);

  // Museum/Collection, Location
  if (fields.museum || fields.collection) {
    let location = fields.museum || fields.collection || '';
    if (fields.location) {
      location += `, ${fields.location}`;
    }
    parts.push(`${location}.`);
    htmlParts.push(`${escapeHtml(location)}.`);
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
 * Film format:
 * Director, D. D. (Director). (Year). Title of film [Film]. Production Company.
 */
function formatFilm(fields: FilmFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Director(s)
  const directors = formatAuthorsAPA(fields.directors || []);
  if (directors) {
    const directorStr = `${directors} (Director${(fields.directors?.length || 0) > 1 ? 's' : ''})`;
    parts.push(directorStr);
    htmlParts.push(escapeHtml(directorStr));
  }

  // Date
  const date = formatDateAPA(fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Title [Film]
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  title += ' [Film]';
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title.replace(' [Film]', '')))} [Film].`);

  // Production company
  if (fields.productionCompany) {
    parts.push(`${fields.productionCompany}.`);
    htmlParts.push(`${escapeHtml(fields.productionCompany)}.`);
  }

  return {
    text: parts.join(' '),
    html: htmlParts.join(' '),
  };
}

/**
 * TV Series format:
 * Creator, C. C. (Executive Producer). (Years). Title of series [TV series]. Production Company.
 */
function formatTVSeries(fields: TVSeriesFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Creator(s) or Executive Producer(s)
  const creators = formatAuthorsAPA(fields.creators || fields.executiveProducers || []);
  if (creators) {
    const role = fields.creators?.length ? 'Creator' : 'Executive Producer';
    const isPlural = (fields.creators?.length || fields.executiveProducers?.length || 0) > 1;
    const creatorStr = `${creators} (${role}${isPlural ? 's' : ''})`;
    parts.push(creatorStr);
    htmlParts.push(escapeHtml(creatorStr));
  }

  // Years
  let years = '';
  if (fields.yearStart) {
    years = `(${fields.yearStart}`;
    if (fields.yearEnd) {
      years += `–${fields.yearEnd}`;
    } else {
      years += '–present';
    }
    years += ')';
  } else {
    years = formatDateAPA(fields.publicationDate);
  }
  parts.push(years);
  htmlParts.push(years);

  // Title [TV series]
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }
  title += ' [TV series]';
  parts.push(`${title}.`);
  htmlParts.push(`${italic(escapeHtml(title.replace(' [TV series]', '')))} [TV series].`);

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
 * Writer, W. W. (Writer), & Director, D. D. (Director). (Year). Title of episode (Season X, Episode X) [TV series episode]. In Producer, P. P. (Executive Producer), Series title. Network.
 */
function formatTVEpisode(fields: TVEpisodeFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Writer(s) and Director(s)
  const writers = formatAuthorsAPA(fields.writers || []);
  const directors = formatAuthorsAPA(fields.directors || []);

  if (writers && directors) {
    parts.push(`${writers} (Writer), & ${directors} (Director)`);
    htmlParts.push(`${escapeHtml(writers)} (Writer), &amp; ${escapeHtml(directors)} (Director)`);
  } else if (writers) {
    parts.push(`${writers} (Writer)`);
    htmlParts.push(`${escapeHtml(writers)} (Writer)`);
  } else if (directors) {
    parts.push(`${directors} (Director)`);
    htmlParts.push(`${escapeHtml(directors)} (Director)`);
  }

  // Date
  const date = formatDateAPA(fields.airDate || fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Episode title (Season X, Episode X) [TV series episode]
  let episodeInfo = fields.episodeTitle || fields.title;
  if (fields.season && fields.episodeNumber) {
    episodeInfo += ` (Season ${fields.season}, Episode ${fields.episodeNumber})`;
  } else if (fields.season) {
    episodeInfo += ` (Season ${fields.season})`;
  } else if (fields.episodeNumber) {
    episodeInfo += ` (Episode ${fields.episodeNumber})`;
  }
  episodeInfo += ' [TV series episode]';
  parts.push(`${episodeInfo}.`);
  htmlParts.push(`${escapeHtml(episodeInfo.replace(' [TV series episode]', ''))} [TV series episode].`);

  // In Series title
  if (fields.seriesTitle) {
    parts.push(`In ${fields.seriesTitle}.`);
    htmlParts.push(`In ${italic(escapeHtml(fields.seriesTitle))}.`);
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
 * Author, A. A. (Year). Title [Description]. Source. URL
 */
function formatMiscellaneous(fields: MiscellaneousFields): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  // Authors
  const authors = formatAuthorsAPA(fields.authors || []);
  if (authors) {
    parts.push(authors);
    htmlParts.push(escapeHtml(authors));
  }

  // Date
  const date = formatDateAPA(fields.publicationDate);
  parts.push(date);
  htmlParts.push(date);

  // Title [Medium/Format]
  let {title} = fields;
  if (fields.subtitle) {
    title += `: ${fields.subtitle}`;
  }

  const descriptor = fields.medium || fields.format || fields.description;
  if (descriptor) {
    title += ` [${descriptor}]`;
  }

  parts.push(`${title}.`);

  // HTML version
  let titleHtml = italic(escapeHtml(fields.title + (fields.subtitle ? `: ${fields.subtitle}` : '')));
  if (descriptor) {
    titleHtml += ` [${escapeHtml(descriptor)}]`;
  }
  htmlParts.push(`${titleHtml}.`);

  // Publisher
  if (fields.publisher) {
    parts.push(`${fields.publisher}.`);
    htmlParts.push(`${escapeHtml(fields.publisher)}.`);
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

export default formatAPA;
