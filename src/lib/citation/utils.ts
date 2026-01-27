/**
 * Citation Formatting Utilities
 * Helper functions used across all citation formatters
 */

import type { Author, CitationDate } from '@/types/citation';

/**
 * Format author name for APA style: Last, F. M.
 */
export function formatAuthorAPA(author: Author): string {
  if (author.isOrganization) {
    return author.lastName;
  }

  let name = author.lastName;

  if (author.firstName) {
    name += `, ${author.firstName.charAt(0)}.`;
  }

  if (author.middleName) {
    name += ` ${author.middleName.charAt(0)}.`;
  }

  if (author.suffix) {
    name += `, ${author.suffix}`;
  }

  return name;
}

/**
 * Format author name for MLA style: Last, First Middle
 */
export function formatAuthorMLA(author: Author, isFirst: boolean = true): string {
  if (author.isOrganization) {
    return author.lastName;
  }

  if (isFirst) {
    let name = author.lastName;
    if (author.firstName) {
      name += `, ${author.firstName}`;
      if (author.middleName) {
        name += ` ${author.middleName}`;
      }
    }
    if (author.suffix) {
      name += `, ${author.suffix}`;
    }
    return name;
  } 
    // Subsequent authors: First Middle Last
    let name = author.firstName || '';
    if (author.middleName) {
      name += ` ${author.middleName}`;
    }
    name += ` ${author.lastName}`;
    if (author.suffix) {
      name += ` ${author.suffix}`;
    }
    return name.trim();
  
}

/**
 * Format author name for Chicago style: First Middle Last
 */
export function formatAuthorChicago(author: Author, isFirst: boolean = true): string {
  if (author.isOrganization) {
    return author.lastName;
  }

  if (isFirst) {
    // First author: Last, First Middle
    let name = author.lastName;
    if (author.firstName) {
      name += `, ${author.firstName}`;
      if (author.middleName) {
        name += ` ${author.middleName}`;
      }
    }
    if (author.suffix) {
      name += `, ${author.suffix}`;
    }
    return name;
  } 
    // Subsequent authors: First Middle Last
    let name = author.firstName || '';
    if (author.middleName) {
      name += ` ${author.middleName}`;
    }
    name += ` ${author.lastName}`;
    if (author.suffix) {
      name += ` ${author.suffix}`;
    }
    return name.trim();
  
}

/**
 * Format author name for Harvard style: Last, F.M.
 */
export function formatAuthorHarvard(author: Author): string {
  if (author.isOrganization) {
    return author.lastName;
  }

  let name = author.lastName;

  if (author.firstName) {
    name += `, ${author.firstName.charAt(0)}.`;
  }

  if (author.middleName) {
    name += `${author.middleName.charAt(0)}.`;
  }

  if (author.suffix) {
    name += ` ${author.suffix}`;
  }

  return name;
}

/**
 * Format multiple authors with proper separators (APA style)
 * 1 author: Smith, J.
 * 2 authors: Smith, J., & Jones, M.
 * 3-20 authors: Smith, J., Jones, M., & Williams, K.
 * 21+ authors: First 19, ..., & last
 */
export function formatAuthorsAPA(authors: Author[]): string {
  if (!authors || authors.length === 0) return '';

  if (authors.length === 1) {
    return formatAuthorAPA(authors[0]);
  }

  if (authors.length === 2) {
    return `${formatAuthorAPA(authors[0])} & ${formatAuthorAPA(authors[1])}`;
  }

  if (authors.length <= 20) {
    const allButLast = authors.slice(0, -1).map(formatAuthorAPA).join(', ');
    const last = formatAuthorAPA(authors[authors.length - 1]);
    return `${allButLast}, & ${last}`;
  }

  // 21+ authors
  const first19 = authors.slice(0, 19).map(formatAuthorAPA).join(', ');
  const last = formatAuthorAPA(authors[authors.length - 1]);
  return `${first19}, ... ${last}`;
}

/**
 * Format multiple authors for MLA style
 * 1 author: Last, First Middle
 * 2 authors: Last, First, and First Last
 * 3+ authors: Last, First, et al.
 */
export function formatAuthorsMLA(authors: Author[]): string {
  if (!authors || authors.length === 0) return '';

  if (authors.length === 1) {
    return formatAuthorMLA(authors[0], true);
  }

  if (authors.length === 2) {
    return `${formatAuthorMLA(authors[0], true)}, and ${formatAuthorMLA(authors[1], false)}`;
  }

  // 3+ authors: use et al.
  return `${formatAuthorMLA(authors[0], true)}, et al.`;
}

/**
 * Format multiple authors for Chicago style
 */
export function formatAuthorsChicago(authors: Author[]): string {
  if (!authors || authors.length === 0) return '';

  if (authors.length === 1) {
    return formatAuthorChicago(authors[0], true);
  }

  if (authors.length === 2) {
    return `${formatAuthorChicago(authors[0], true)} and ${formatAuthorChicago(authors[1], false)}`;
  }

  if (authors.length === 3) {
    const first = formatAuthorChicago(authors[0], true);
    const second = formatAuthorChicago(authors[1], false);
    const third = formatAuthorChicago(authors[2], false);
    return `${first}, ${second}, and ${third}`;
  }

  // 4+ authors: first author, et al.
  return `${formatAuthorChicago(authors[0], true)}, et al.`;
}

/**
 * Format multiple authors for Harvard style
 */
export function formatAuthorsHarvard(authors: Author[]): string {
  if (!authors || authors.length === 0) return '';

  if (authors.length === 1) {
    return formatAuthorHarvard(authors[0]);
  }

  if (authors.length === 2) {
    return `${formatAuthorHarvard(authors[0])} and ${formatAuthorHarvard(authors[1])}`;
  }

  if (authors.length === 3) {
    const first = formatAuthorHarvard(authors[0]);
    const second = formatAuthorHarvard(authors[1]);
    const third = formatAuthorHarvard(authors[2]);
    return `${first}, ${second} and ${third}`;
  }

  // 4+ authors
  return `${formatAuthorHarvard(authors[0])} et al.`;
}

/**
 * Format date for APA: (2024, January 15) or (2024) or (n.d.)
 */
export function formatDateAPA(date?: CitationDate): string {
  if (!date || !date.year) return '(n.d.)';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let dateStr = `${date.year}`;

  if (date.month) {
    dateStr += `, ${months[date.month - 1]}`;
    if (date.day) {
      dateStr += ` ${date.day}`;
    }
  } else if (date.season) {
    const seasons: Record<string, string> = {
      spring: 'Spring',
      summer: 'Summer',
      fall: 'Fall',
      winter: 'Winter'
    };
    dateStr += `, ${seasons[date.season]}`;
  }

  return `(${dateStr})`;
}

/**
 * Format date for MLA: Day Mon. Year or Year
 */
export function formatDateMLA(date?: CitationDate): string {
  if (!date || !date.year) return '';

  const months = [
    'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June',
    'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'
  ];

  if (date.day && date.month) {
    return `${date.day} ${months[date.month - 1]} ${date.year}`;
  }

  if (date.month) {
    return `${months[date.month - 1]} ${date.year}`;
  }

  return `${date.year}`;
}

/**
 * Format date for Chicago: Month Day, Year
 */
export function formatDateChicago(date?: CitationDate): string {
  if (!date || !date.year) return '';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (date.month && date.day) {
    return `${months[date.month - 1]} ${date.day}, ${date.year}`;
  }

  if (date.month) {
    return `${months[date.month - 1]} ${date.year}`;
  }

  return `${date.year}`;
}

/**
 * Format date for Harvard: Year or Day Month Year
 */
export function formatDateHarvard(date?: CitationDate): string {
  if (!date || !date.year) return 'n.d.';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (date.day && date.month) {
    return `${date.day} ${months[date.month - 1]} ${date.year}`;
  }

  if (date.month) {
    return `${months[date.month - 1]} ${date.year}`;
  }

  return `${date.year}`;
}

/**
 * Format access date for web sources
 */
export function formatAccessDate(date?: CitationDate, style: 'apa' | 'mla' | 'chicago' | 'harvard' = 'apa'): string {
  if (!date || !date.year) return '';

  switch (style) {
    case 'apa':
      return `Retrieved ${formatDateAPA(date).replace(/[()]/g, '')} from`;
    case 'mla':
      return `Accessed ${formatDateMLA(date)}.`;
    case 'chicago':
      return `Accessed ${formatDateChicago(date)}.`;
    case 'harvard':
      return `(Accessed: ${formatDateHarvard(date)})`;
    default:
      return '';
  }
}

/**
 * Escape HTML characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Wrap text in italic tags for HTML output
 */
export function italic(text: string): string {
  return `<em>${text}</em>`;
}

/**
 * Clean and normalize URL for display
 */
export function formatUrl(url?: string): string {
  if (!url) return '';
  // Remove trailing slash
  return url.replace(/\/$/, '');
}

/**
 * Format page range
 */
export function formatPages(pages?: string, style: 'apa' | 'mla' | 'chicago' | 'harvard' = 'apa'): string {
  if (!pages) return '';

  switch (style) {
    case 'apa':
      return pages;
    case 'mla':
      return `pp. ${pages}`;
    case 'chicago':
      return pages;
    case 'harvard':
      return `pp. ${pages}`;
    default:
      return pages;
  }
}

/**
 * Capitalize first letter of a string
 */
export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert title to sentence case (APA style)
 * Only first word and proper nouns capitalized
 */
export function toSentenceCase(title: string): string {
  if (!title) return '';

  // Split by colon for subtitle handling
  const parts = title.split(':');

  return parts.map((part, index) => {
    const trimmed = part.trim();
    if (!trimmed) return '';

    // Capitalize first letter
    const result = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();

    return index === 0 ? result : ` ${result}`;
  }).join(':');
}

/**
 * Format DOI as URL
 */
export function formatDOI(doi?: string): string {
  if (!doi) return '';

  // If already a URL, return as-is
  if (doi.startsWith('http')) {
    return doi;
  }

  // Remove "doi:" prefix if present
  const cleanDoi = doi.replace(/^doi:\s*/i, '');

  return `https://doi.org/${cleanDoi}`;
}
